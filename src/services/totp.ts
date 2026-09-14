import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

export const OWNER_EMAIL = 'vinicius.machado.carvalho@educacao.mg.gov.br';
export const OWNER_NAME = 'Prof. Vinicius Carvalho';

// 32-character Base32 secret for Google Authenticator (RFC 4648 standard)
export const DEFAULT_TOTP_SECRET = 'VINICIUSEDUCACAOMGDEVMASTER267Q';
const STORAGE_KEY_SECRET = 'reserve_dev_totp_secret';
const STORAGE_KEY_SESSION_VERIFIED = 'reserve_dev_2fa_verified';

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
}

export function getTotpSecret(): string {
  if (typeof window === 'undefined') return DEFAULT_TOTP_SECRET;
  try {
    return localStorage.getItem(STORAGE_KEY_SECRET) || DEFAULT_TOTP_SECRET;
  } catch {
    return DEFAULT_TOTP_SECRET;
  }
}

export function setTotpSecret(secret: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SECRET, secret.trim().toUpperCase());
  } catch (e) {
    console.warn('Failed to save TOTP secret:', e);
  }
}

export function getFormattedTotpSecret(secret: string = getTotpSecret()): string {
  // Format into chunks of 4 for human legibility: "VINI CIUS EDUC..."
  return secret.match(/.{1,4}/g)?.join(' ') || secret;
}

export function getTotpInstance(secret: string = getTotpSecret()): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: 'Reserve Labs Multi-Tenant',
    label: OWNER_EMAIL,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export function getTotpUri(): string {
  const totp = getTotpInstance();
  return totp.toString();
}

export async function generateQrCodeDataUrl(): Promise<string> {
  const uri = getTotpUri();
  try {
    return await QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a', // Deep slate
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Error generating QR code for TOTP:', error);
    throw error;
  }
}

export function verifyTotpCode(code: string): { success: boolean; error?: string } {
  const cleanCode = code.replace(/\s+/g, '').trim();

  if (!cleanCode) {
    return { success: false, error: 'Por favor, informe o código de 6 dígitos gerado no Google Authenticator.' };
  }

  if (!/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'O código deve conter exatamente 6 números.' };
  }

  try {
    const totp = getTotpInstance();
    // Allow window: 2 (+/- 60 seconds) to tolerate slight clock drift between smartphone and server
    const delta = totp.validate({ token: cleanCode, window: 2 });

    if (delta !== null) {
      setSession2FAVerified(true);
      return { success: true };
    }

    return {
      success: false,
      error: 'Código inválido ou expirado. Verifique o código exibido no seu Google Authenticator e tente novamente.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Erro na validação: ${message}` };
  }
}

export function isSession2FAVerified(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY_SESSION_VERIFIED) === 'true';
  } catch {
    return false;
  }
}

export function setSession2FAVerified(verified: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (verified) {
      sessionStorage.setItem(STORAGE_KEY_SESSION_VERIFIED, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY_SESSION_VERIFIED);
    }
  } catch (e) {
    console.warn('Failed to update session 2FA:', e);
  }
}

/**
 * Returns current dynamic code for owner's convenience / diagnostic verification.
 */
export function getCurrentOwnerTotpToken(): string {
  try {
    const totp = getTotpInstance();
    return totp.generate();
  } catch {
    return '';
  }
}
