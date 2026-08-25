import React, { useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Terminal,
  CheckCircle2,
  AlertCircle,
  X,
  Code2,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DeveloperAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeveloperAuthModal: React.FC<DeveloperAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { developerLogin, isDeveloperMode } = useAuth();
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = passphrase.trim();
    if (!trimmed) {
      setErrorMessage('Por favor, informe a Chave Mestra do Desenvolvedor.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = developerLogin(trimmed);
      setIsLoading(false);

      if (result.success) {
        setPassphrase('');
        onSuccess();
      } else {
        setErrorMessage(result.error || 'Chave Mestra inválida. Acesso restrito ao desenvolvedor.');
      }
    }, 300);
  };

  const handleQuickKey = (key: string) => {
    setPassphrase(key);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 relative">
        {/* Header with Dev Terminal look */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-white tracking-tight font-mono">
                  PORTAL DEV
                </h2>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ROOT / MULTI-TENANT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acesso Restrito ao Desenvolvedor do Sistema
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chave Mestra do Desenvolvedor (Master Key / PIN):</span>
                </span>
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="dev-auth-key-input"
                  type={showPassphrase ? 'text' : 'password'}
                  required
                  autoFocus
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Digite a chave mestra (ex: devmaster)"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Chaves autorizadas de fábrica: <code className="text-indigo-300 font-mono bg-indigo-950/60 px-1 py-0.5 rounded">devmaster</code> ou <code className="text-indigo-300 font-mono bg-indigo-950/60 px-1 py-0.5 rounded">developer2026</code>
              </p>
            </div>

            {/* Quick Master Key Buttons for instant developer convenience */}
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Atalhos de Chave para Homologação:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['devmaster', 'developer2026', 'master2026#', '2026DEV'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleQuickKey(k)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg font-mono text-[11px] transition-colors border border-slate-700 cursor-pointer"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="dev-auth-submit-btn"
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Code2 className="w-4 h-4" />
                <span>{isLoading ? 'Verificando...' : 'Acessar Console Dev'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-400" />
            MULTI-TENANT ONBOARDING ENGINE
          </span>
          <span>v3.0.0-PROD</span>
        </div>
      </div>
    </div>
  );
};
