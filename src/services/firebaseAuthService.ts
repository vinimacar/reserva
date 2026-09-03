import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { User } from '../types';

export interface AuthSyncResult {
  total: number;
  created: number;
  alreadyExisted: number;
  failed: number;
  errors: string[];
  providerNotEnabled?: boolean;
}

/**
 * Register a specific user into Firebase Authentication without logging out the current active session.
 * Uses an isolated secondary Firebase app instance.
 */
export async function registerInFirebaseAuth(
  email: string,
  password?: string,
  displayName?: string
): Promise<{ success: boolean; alreadyExists?: boolean; error?: string; code?: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'E-mail inválido para o Firebase Authentication.' };
  }

  const cleanPassword = (password || '').trim() || 'educacao123';
  const finalPassword = cleanPassword.length >= 6 ? cleanPassword : `${cleanPassword}123456`;

  const secondaryAppName = `temp-auth-sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let secondaryApp = null;

  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    const userCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, finalPassword);

    if (displayName && userCred.user) {
      try {
        await updateProfile(userCred.user, { displayName });
      } catch (profileErr) {
        console.warn('Profile name update warning in Firebase Auth:', profileErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') {
      return { success: true, alreadyExists: true };
    }

    if (code === 'auth/operation-not-allowed') {
      return {
        success: false,
        code,
        error: 'O provedor Email/Senha não está ativado no Firebase Console (Authentication > Sign-in method).',
      };
    }

    console.warn(`Error registering ${cleanEmail} in Firebase Auth:`, err);
    return {
      success: false,
      code,
      error: err?.message || 'Erro ao registrar usuário no Firebase Authentication.',
    };
  } finally {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch {
        // ignore cleanup error
      }
    }
  }
}

/**
 * Authenticate directly via Firebase Authentication (Email / Password).
 * If the user is not found, automatically registers them so they appear in Firebase Authentication console.
 */
export async function authenticateWithFirebaseAuth(
  email: string,
  password?: string,
  displayName?: string
): Promise<{ success: boolean; user?: FirebaseUser; error?: string; newlyRegistered?: boolean }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim() || 'educacao123';
  const finalPassword = cleanPassword.length >= 6 ? cleanPassword : `${cleanPassword}123456`;

  try {
    // 1. Try to sign in with existing credentials
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, finalPassword);
    return { success: true, user: cred.user };
  } catch (err: any) {
    const code = err?.code || '';

    // If user does not exist in Firebase Auth yet, automatically register them!
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, finalPassword);
        if (displayName && newCred.user) {
          try {
            await updateProfile(newCred.user, { displayName });
          } catch {
            // ignore
          }
        }
        return { success: true, user: newCred.user, newlyRegistered: true };
      } catch (createErr: any) {
        if (createErr?.code === 'auth/email-already-in-use') {
          // The password might differ from initialData
          return { success: false, error: 'Credenciais inválidas no Firebase Authentication.' };
        }
        console.warn('Auto create in Firebase Auth on login error:', createErr);
        return { success: false, error: createErr?.message };
      }
    }

    if (code === 'auth/operation-not-allowed') {
      return {
        success: false,
        error: 'Provedor de Email/Senha desativado no Firebase Console.',
      };
    }

    return { success: false, error: err?.message || 'Erro de autenticação Firebase.' };
  }
}

/**
 * Sign in using Google Workspace Popup via Firebase Authentication.
 */
export async function signInWithGooglePopup(): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (err: any) {
    console.warn('Firebase Google Sign-In Popup warning:', err);
    return { success: false, error: err?.message || 'Falha ao autenticar com Google.' };
  }
}

/**
 * Sign out from Firebase Authentication.
 */
export async function signOutFromFirebaseAuth(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signout warning:', err);
  }
}

/**
 * Batch synchronize all system users/teachers into Firebase Authentication.
 * This populates the "Authentication > Users" list in Firebase Console.
 */
export async function syncAllUsersToFirebaseAuth(
  usersList: User[],
  onProgress?: (current: number, total: number, currentEmail: string) => void
): Promise<AuthSyncResult> {
  const result: AuthSyncResult = {
    total: usersList.length,
    created: 0,
    alreadyExisted: 0,
    failed: 0,
    errors: [],
    providerNotEnabled: false,
  };

  let index = 0;
  for (const u of usersList) {
    index++;
    if (!u.email || !u.email.includes('@')) {
      result.failed++;
      result.errors.push(`E-mail inválido ou ausente para: ${u.name || u.id}`);
      continue;
    }

    if (onProgress) {
      onProgress(index, usersList.length, u.email);
    }

    const regRes = await registerInFirebaseAuth(u.email, u.password || 'educacao123', u.name);

    if (regRes.success) {
      if (regRes.alreadyExists) {
        result.alreadyExisted++;
      } else {
        result.created++;
      }
    } else {
      result.failed++;
      if (regRes.code === 'auth/operation-not-allowed') {
        result.providerNotEnabled = true;
        result.errors.push(
          'Atenção: O provedor Email/Senha precisa ser ativado no Firebase Console (Authentication > Sign-in method).'
        );
        // Break early if the provider is disabled so we don't spam errors
        break;
      } else if (regRes.error) {
        result.errors.push(`${u.email}: ${regRes.error}`);
      }
    }

    // Small delay to prevent rate limits
    await new Promise((r) => setTimeout(r, 80));
  }

  return result;
}
