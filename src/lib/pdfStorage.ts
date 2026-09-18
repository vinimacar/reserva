/**
 * Utilitário de Armazenamento e Gerenciamento do PDF do Calendário Escolar Oficial
 * Suporta IndexedDB para PDFs pesados (> 500KB) e LocalStorage/DataURL para persistência rápida.
 */

const DB_NAME = 'reserve_documents_db';
const STORE_NAME = 'calendar_pdfs';
const DB_VERSION = 1;

function openPdfDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não disponível'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export interface StoredCalendarPdf {
  id: string; // ex: `calendar_pdf_${schoolId}`
  schoolId: string;
  dataUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * Salva o PDF do calendário no IndexedDB e em cache local
 */
export async function saveCalendarPdf(
  schoolId: string,
  file: File
): Promise<{ dataUrl: string; fileName: string; fileSize: number; uploadedAt: string }> {
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('O arquivo selecionado não é um documento PDF válido.');
  }

  // Limite razoável de 15MB
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('O arquivo PDF excede o tamanho máximo permitido de 15 MB.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo PDF.'));
    reader.readAsDataURL(file);
  });

  const record: StoredCalendarPdf = {
    id: `calendar_pdf_${schoolId}`,
    schoolId,
    dataUrl,
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
  };

  try {
    const db = await openPdfDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falha ao gravar no IndexedDB, tentando localStorage:', err);
    // Se for pequeno (< 2MB), salva em localStorage como fallback
    if (file.size < 2 * 1024 * 1024) {
      try {
        localStorage.setItem(`reserve_cal_pdf_${schoolId}`, JSON.stringify(record));
      } catch (e) {
        console.warn('LocalStorage quota exceeded:', e);
      }
    }
  }

  return {
    dataUrl,
    fileName: record.fileName,
    fileSize: record.fileSize,
    uploadedAt: record.uploadedAt,
  };
}

/**
 * Recupera o PDF armazenado para uma escola específica
 */
export async function loadCalendarPdf(
  schoolId: string,
  fallbackUrl?: string
): Promise<string | null> {
  if (fallbackUrl && fallbackUrl.startsWith('data:application/pdf')) {
    return fallbackUrl;
  }

  try {
    const db = await openPdfDb();
    const result = await new Promise<StoredCalendarPdf | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(`calendar_pdf_${schoolId}`);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (result && result.dataUrl) {
      return result.dataUrl;
    }
  } catch (err) {
    console.warn('Falha ao buscar no IndexedDB:', err);
  }

  try {
    const local = localStorage.getItem(`reserve_cal_pdf_${schoolId}`);
    if (local) {
      const parsed: StoredCalendarPdf = JSON.parse(local);
      if (parsed.dataUrl) return parsed.dataUrl;
    }
  } catch {
    // ignore
  }

  return fallbackUrl || null;
}

/**
 * Remove o PDF do calendário da escola
 */
export async function deleteCalendarPdf(schoolId: string): Promise<void> {
  try {
    const db = await openPdfDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(`calendar_pdf_${schoolId}`);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falha ao deletar do IndexedDB:', err);
  }

  try {
    localStorage.removeItem(`reserve_cal_pdf_${schoolId}`);
  } catch {
    // ignore
  }
}

/**
 * Faz download do arquivo PDF no navegador
 */
export function downloadCalendarPdf(dataUrl: string, fileName: string = 'Calendario_Escolar.pdf') {
  try {
    // Se for dataUrl base64, converte para Blob para download mais limpo e confiável
    let downloadUrl = dataUrl;
    let blobUrlToRevoke: string | null = null;

    if (dataUrl.startsWith('data:')) {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      downloadUrl = URL.createObjectURL(blob);
      blobUrlToRevoke = downloadUrl;
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (blobUrlToRevoke) {
      setTimeout(() => URL.revokeObjectURL(blobUrlToRevoke!), 5000);
    }
  } catch (err) {
    console.error('Erro ao baixar PDF:', err);
    window.open(dataUrl, '_blank');
  }
}

/**
 * Abre o PDF em uma nova aba do navegador para visualização nativa ou impressão
 */
export function openCalendarPdfInNewTab(dataUrl: string) {
  try {
    if (dataUrl.startsWith('data:')) {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, '_blank');
      if (!newWin) {
        // Pop-up bloqueado
        window.location.href = blobUrl;
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      return;
    }
    window.open(dataUrl, '_blank');
  } catch (err) {
    console.error('Erro ao abrir PDF em nova aba:', err);
    window.open(dataUrl, '_blank');
  }
}

/**
 * Formata o tamanho de bytes para exibição amigável (ex: "1.4 MB", "340 KB")
 */
export function formatPdfFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'PDF';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
