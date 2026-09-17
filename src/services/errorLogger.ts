import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from './firebase';
import { FrontendErrorLog, ErrorCategory, ErrorSeverity } from '../types';

const STORAGE_KEY_LOCAL_ERROR_LOGS = 'reserve_frontend_error_logs';
const MAX_LOCAL_LOGS = 50;

// In-memory throttling map to prevent spamming Firestore in case of render loops
const recentErrorSignatures = new Map<string, number>();
const THROTTLE_WINDOW_MS = 8000; // 8 seconds window

let isGlobalListenersAttached = false;
let currentActiveUser: { email?: string | null; id?: string | null; schoolId?: string | null } = {};

/**
 * Register active user context for error telemetry
 */
export function setErrorLoggerUserContext(context: {
  email?: string | null;
  id?: string | null;
  schoolId?: string | null;
}) {
  currentActiveUser = { ...currentActiveUser, ...context };
}

/**
 * Classify error message and object into category and severity
 */
export function classifyError(
  message: string,
  errorObj?: unknown
): { category: ErrorCategory; severity: ErrorSeverity } {
  const text = `${message} ${errorObj instanceof Error ? `${errorObj.name} ${errorObj.message}` : String(errorObj || '')}`.toLowerCase();

  // 1. Cross-Origin / Iframe security errors
  if (
    text.includes('cross-origin') ||
    text.includes('script error') ||
    text.includes('blocked a frame') ||
    text.includes('securityerror') ||
    text.includes('contentdocument') ||
    text.includes('cross origin') ||
    text.includes('protocols, domains, and ports must match') ||
    text.includes('cors')
  ) {
    return { category: 'CROSS_ORIGIN', severity: 'CRITICAL' };
  }

  // 2. Type errors / undefined property access
  if (
    text.includes('typeerror') ||
    text.includes('is not a function') ||
    text.includes('cannot read property') ||
    text.includes('cannot read properties') ||
    text.includes('undefined is not') ||
    text.includes('null is not') ||
    text.includes('is not defined') ||
    text.includes('is not iterable')
  ) {
    return { category: 'TYPE_ERROR', severity: 'CRITICAL' };
  }

  // 3. Network or Firebase unavailable
  if (
    text.includes('network') ||
    text.includes('failed to fetch') ||
    text.includes('code=unavailable') ||
    text.includes('the client is offline')
  ) {
    return { category: 'NETWORK_ERROR', severity: 'ERROR' };
  }

  // 4. Default runtime error
  return { category: 'RUNTIME_ERROR', severity: 'ERROR' };
}

/**
 * Read error logs stored in local storage
 */
export function getLocalErrorLogs(): FrontendErrorLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_ERROR_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save log to local storage as fallback
 */
function saveLocalErrorLog(log: FrontendErrorLog) {
  try {
    const current = getLocalErrorLogs();
    const updated = [log, ...current.filter((l) => l.id !== log.id)].slice(0, MAX_LOCAL_LOGS);
    localStorage.setItem(STORAGE_KEY_LOCAL_ERROR_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save error to localStorage:', e);
  }
}

/**
 * Log an error to Firestore and LocalStorage
 */
export async function logErrorToFirestore(params: {
  message: string;
  error?: unknown;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  source?: string;
  lineno?: number;
  colno?: number;
  componentStack?: string;
  metadata?: Record<string, unknown>;
}): Promise<FrontendErrorLog | null> {
  const { message, error, source, lineno, colno, componentStack, metadata } = params;

  // Derive classification if not provided
  const classified = classifyError(message, error);
  const category = params.category || classified.category;
  const severity = params.severity || classified.severity;

  // Extract stack trace safely
  let stack = '';
  if (error instanceof Error && error.stack) {
    stack = error.stack;
  } else if (typeof error === 'object' && error !== null && 'stack' in error) {
    stack = String((error as { stack?: unknown }).stack);
  }

  // Generate error fingerprint for throttling
  const signature = `${category}:${message.slice(0, 100)}:${source || ''}:${lineno || 0}`;
  const now = Date.now();
  const lastLoggedAt = recentErrorSignatures.get(signature);

  if (lastLoggedAt && now - lastLoggedAt < THROTTLE_WINDOW_MS) {
    // Throttled duplicate error to protect Firestore quotas
    return null;
  }
  recentErrorSignatures.set(signature, now);

  const isIframe = typeof window !== 'undefined' ? window.self !== window.top : false;
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

  const logId = `err_${now}_${Math.random().toString(36).substring(2, 7)}`;

  const errorLog: FrontendErrorLog = {
    id: logId,
    message: message || 'Erro desconhecido capturado no cliente',
    category,
    severity,
    stack: stack ? stack.slice(0, 3000) : undefined,
    source: source ? source.slice(0, 500) : undefined,
    lineno,
    colno,
    componentStack: componentStack ? componentStack.slice(0, 3000) : undefined,
    url,
    path,
    origin,
    isIframe,
    userAgent,
    timestamp: new Date().toISOString(),
    userEmail: currentActiveUser.email || null,
    userId: currentActiveUser.id || null,
    schoolId: currentActiveUser.schoolId || null,
    metadata: metadata || {},
  };

  // 1. Always preserve locally first
  saveLocalErrorLog(errorLog);

  // 2. Broadcast event for active UI components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reserve:new-error-log', { detail: errorLog }));
  }

  // 3. Persist to Firestore remote database
  try {
    const docRef = doc(db, 'error_logs', logId);
    await setDoc(docRef, errorLog);
    console.info(`[ErrorLogger] Critical error remote logged to Firestore: [${category}] ${message}`);
  } catch (firestoreErr) {
    // Never crash when logging fails
    console.warn('[ErrorLogger] Note: Failed to send error to Firestore (stored locally):', firestoreErr);
  }

  return errorLog;
}

/**
 * Initialize global uncaught error listeners
 */
export function initFrontendErrorLogger() {
  if (isGlobalListenersAttached || typeof window === 'undefined') {
    return;
  }
  isGlobalListenersAttached = true;

  // 1. Window Error (Uncaught exceptions, Syntax, Reference, Type, Cross-Origin Script Errors)
  window.addEventListener('error', (event: ErrorEvent) => {
    try {
      const msg = event.message || (event.error && event.error.message) || 'Uncaught window error';
      logErrorToFirestore({
        message: msg,
        error: event.error,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    } catch (handlerErr) {
      console.error('[ErrorLogger] Handler failure:', handlerErr);
    }
  });

  // 2. Unhandled Promise Rejections (e.g. async fetch failures, Firestore permission denials)
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    try {
      const reason = event.reason;
      const msg =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
          ? reason
          : 'Unhandled Promise Rejection';

      logErrorToFirestore({
        message: `Unhandled Rejection: ${msg}`,
        error: reason,
        category: 'PROMISE_REJECTION',
        severity: 'CRITICAL',
      });
    } catch (handlerErr) {
      console.error('[ErrorLogger] Rejection handler failure:', handlerErr);
    }
  });

  console.info('[ErrorLogger] Frontend automatic critical error logging active.');
}

/**
 * Real-time subscription to error logs for remote debugging panel
 */
export function subscribeToErrorLogs(
  callback: (logs: FrontendErrorLog[]) => void
): () => void {
  try {
    const logsCol = collection(db, 'error_logs');
    const logsQuery = query(logsCol, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        const remoteLogs: FrontendErrorLog[] = [];
        snapshot.forEach((docSnap) => {
          remoteLogs.push(docSnap.data() as FrontendErrorLog);
        });

        // Merge with any offline local logs
        const localLogs = getLocalErrorLogs();
        const mergedMap = new Map<string, FrontendErrorLog>();
        remoteLogs.forEach((l) => mergedMap.set(l.id, l));
        localLogs.forEach((l) => {
          if (!mergedMap.has(l.id)) {
            mergedMap.set(l.id, l);
          }
        });

        const sorted = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        callback(sorted);
      },
      (error) => {
        console.warn('[ErrorLogger] Firestore subscription fallback to local logs:', error);
        callback(getLocalErrorLogs());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[ErrorLogger] Could not attach Firestore listener, using local logs:', err);
    callback(getLocalErrorLogs());
    return () => {};
  }
}

/**
 * Clear all error logs from Firestore and LocalStorage
 */
export async function clearAllErrorLogs(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY_LOCAL_ERROR_LOGS);
    const logsCol = collection(db, 'error_logs');
    const snapshot = await getDocs(logsCol);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('[ErrorLogger] Clear logs note:', err);
  }
}

/**
 * Simulation helper for testing remote error capture in development / demonstration
 */
export async function simulateTestError(type: 'cross-origin' | 'type-error' | 'promise-rejection'): Promise<FrontendErrorLog | null> {
  if (type === 'cross-origin') {
    return logErrorToFirestore({
      message: 'Blocked a frame with origin "https://ais-dev-preview.run.app" from accessing a cross-origin frame.',
      category: 'CROSS_ORIGIN',
      severity: 'CRITICAL',
      source: 'https://ais-dev-preview.run.app/src/main.tsx',
      lineno: 42,
      colno: 15,
      metadata: { simulated: true, scenario: 'Iframe cross-origin restriction test' },
    });
  }

  if (type === 'type-error') {
    try {
      // Intentionally trigger a genuine TypeError
      const obj: any = null;
      obj.executeUndefinedProperty();
    } catch (e: any) {
      return logErrorToFirestore({
        message: e.message || 'TypeError: Cannot read properties of null (reading "executeUndefinedProperty")',
        error: e,
        category: 'TYPE_ERROR',
        severity: 'CRITICAL',
        source: 'src/components/WeeklyScheduleGrid.tsx',
        lineno: 128,
        colno: 8,
        metadata: { simulated: true, scenario: 'Uncaught null pointer TypeError test' },
      });
    }
  }

  if (type === 'promise-rejection') {
    return logErrorToFirestore({
      message: 'Unhandled Rejection: FirebaseError: [code=permission-denied]: Missing or insufficient permissions.',
      category: 'PROMISE_REJECTION',
      severity: 'CRITICAL',
      source: 'src/services/firestoreSync.ts',
      lineno: 204,
      colno: 12,
      metadata: { simulated: true, scenario: 'Simulated async network or authorization failure' },
    });
  }

  return null;
}
