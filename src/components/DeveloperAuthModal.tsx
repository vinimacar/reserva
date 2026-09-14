import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Terminal,
  AlertCircle,
  X,
  Check,
  ExternalLink,
  Loader2,
  ArrowRight,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  OWNER_EMAIL,
  OWNER_NAME,
  isOwnerEmail,
  verifyTotpCode,
} from '../services/totp';
import { signInWithGooglePopup } from '../services/firebaseAuthService';

interface DeveloperAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const DeveloperAuthModal: React.FC<DeveloperAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, developerLoginWithGoogle, developerLogin } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [showTotpFallback, setShowTotpFallback] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [isTotpLoading, setIsTotpLoading] = useState(false);

  const isCurrentLoggedInOwner = isOwnerEmail(currentUser?.email);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoadingGoogle(false);
      setTotpCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Primary Method: Conectar com o Google
  const handleConnectWithGoogle = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoadingGoogle(true);

    try {
      const googleRes = await signInWithGooglePopup();

      if (googleRes.success && googleRes.user && googleRes.user.email) {
        const authenticatedEmail = googleRes.user.email.trim().toLowerCase();

        // STRICT: Only vinicius.machado.carvalho@educacao.mg.gov.br
        if (!isOwnerEmail(authenticatedEmail)) {
          setIsLoadingGoogle(false);
          setErrorMessage(
            `Acesso negado: A conta Google conectada (${authenticatedEmail}) não possui autorização. O Console do Desenvolvedor é estritamente exclusivo para o usuário ${OWNER_EMAIL}.`
          );
          return;
        }

        // Authorize session
        const loginRes = developerLoginWithGoogle(authenticatedEmail, googleRes.user.displayName || undefined);
        if (loginRes.success) {
          setSuccessMessage(`Identidade verificada via Google! Bem-vindo, ${googleRes.user.displayName || OWNER_NAME}.`);
          setTimeout(() => {
            setIsLoadingGoogle(false);
            onSuccess();
          }, 600);
          return;
        } else {
          setIsLoadingGoogle(false);
          setErrorMessage(loginRes.error || 'Falha ao autorizar sessão do desenvolvedor.');
          return;
        }
      }

      // Handle popup error
      const rawError = (googleRes.error || '').toLowerCase();
      setIsLoadingGoogle(false);

      if (rawError.includes('popup-closed-by-user') || rawError.includes('cancelled')) {
        setErrorMessage('Autenticação Google cancelada na janela pop-up.');
      } else if (rawError.includes('popup-blocked')) {
        setErrorMessage(
          'A janela pop-up do Google foi bloqueada pelo navegador. Permita pop-ups para este site ou clique no botão abaixo para abrir a aplicação em uma nova aba.'
        );
      } else {
        setErrorMessage(
          googleRes.error ||
            'Não foi possível conectar com o Google. Certifique-se de selecionar sua conta institucional autorizada.'
        );
      }
    } catch (err: any) {
      console.warn('Google connect error:', err);
      setIsLoadingGoogle(false);
      setErrorMessage('Erro ao comunicar com o serviço do Google. Tente novamente.');
    }
  };

  // If already logged in as Vinicius, quick access confirmation
  const handleProceedWithCurrentOwnerSession = () => {
    if (!isCurrentLoggedInOwner) return;
    const loginRes = developerLoginWithGoogle(OWNER_EMAIL, currentUser?.name);
    if (loginRes.success) {
      setSuccessMessage('Sessão verificada com sucesso!');
      setTimeout(() => {
        onSuccess();
      }, 300);
    }
  };

  // Secondary 2FA code verification (TOTP), without showing any password
  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = totpCode.replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6) {
      setErrorMessage('Informe o código de 6 dígitos gerado no Google Authenticator.');
      return;
    }

    setIsTotpLoading(true);
    setTimeout(() => {
      const totpValidation = verifyTotpCode(clean);
      if (!totpValidation.success) {
        setIsTotpLoading(false);
        setErrorMessage(totpValidation.error || 'Código do Google Authenticator inválido ou expirado.');
        return;
      }

      const loginRes = developerLoginWithGoogle(OWNER_EMAIL, OWNER_NAME);
      setIsTotpLoading(false);
      if (loginRes.success) {
        setSuccessMessage('Código 2FA validado com sucesso!');
        setTimeout(() => {
          onSuccess();
        }, 400);
      } else {
        setErrorMessage(loginRes.error || 'Falha ao autorizar acesso.');
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-900/70 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 relative flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shrink-0">
              <Terminal className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-white tracking-tight font-mono">
                  CONSOLE DEV
                </h2>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                  Exclusivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acesso Restrito do Arquiteto
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Owner Designation Badge */}
          <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-indigo-950 flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-0.5">
                Usuário Autorizado:
              </span>
              <p className="text-sm font-bold text-white truncate">{OWNER_NAME}</p>
              <p className="text-xs text-indigo-300 font-mono truncate font-medium">{OWNER_EMAIL}</p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{errorMessage}</p>
                {errorMessage.includes('bloqueada') && (
                  <button
                    type="button"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-red-200 underline font-bold hover:text-white"
                  >
                    <span>Abrir aplicação em nova aba</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          {/* If the current session is already Vinicius */}
          {isCurrentLoggedInOwner && (
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl space-y-2 text-center">
              <p className="text-xs text-emerald-300">
                Sua sessão atual já está autenticada como <strong>{OWNER_EMAIL}</strong>.
              </p>
              <button
                type="button"
                onClick={handleProceedWithCurrentOwnerSession}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Acessar Diretamente o Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Primary Action: Conectar com o Google */}
          <div className="space-y-3">
            <button
              id="dev-auth-google-connect-btn"
              type="button"
              disabled={isLoadingGoogle}
              onClick={handleConnectWithGoogle}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group border border-slate-200 active:scale-[0.99]"
            >
              {isLoadingGoogle ? (
                <>
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span className="text-slate-800">Conectando com o Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5 shrink-0" />
                  <span className="text-slate-900 font-extrabold">Conectar com o Google</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Autentique-se com sua conta Google oficial. Somente o e-mail{' '}
              <strong className="text-slate-300 font-mono">{OWNER_EMAIL}</strong> tem permissão de acesso.
            </p>
          </div>

          {/* Collapsible: Alternativa 2FA via Google Authenticator (sem exibir senhas) */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowTotpFallback(!showTotpFallback)}
              className="w-full py-1 text-left text-xs font-semibold text-slate-400 hover:text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-[11px]">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Validar via código do Google Authenticator</span>
              </span>
              {showTotpFallback ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {showTotpFallback && (
              <form onSubmit={handleTotpSubmit} className="mt-3 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] text-slate-300 font-bold mb-1.5">
                    Digite o código de 6 dígitos do Google Authenticator:
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTotpCode(clean);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.6em] text-xl font-black font-mono py-2 bg-slate-950 border border-indigo-500/40 rounded-xl text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isTotpLoading || totpCode.length !== 6}
                  className="w-full py-2 bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 font-bold text-xs rounded-xl border border-indigo-700/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isTotpLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Confirmar Código 2FA</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-indigo-400" />
            GOOGLE OAUTH 2.0 • ACESSO SEGURO
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
