import React, { useState } from 'react';
import { X, Shield, Check, School, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_USERS } from '../data/initialData';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchUser, loginWithGoogleEmail } = useAuth();
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    loginWithGoogleEmail(customEmail, customName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col transition-colors">
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-center relative transition-colors">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Google Workspace Badge */}
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>

          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Autenticação Google</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Faça login com a conta institucional para acessar o sistema de reservas
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Quick Account Selector */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Selecione uma Conta Escolar:
            </span>

            <div className="space-y-2">
              {DEFAULT_USERS.map((user) => {
                const isCurrent = currentUser?.id === user.id;

                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-xs ring-1 ring-blue-500'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{user.name}</p>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              user.role === 'ADMIN'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {user.role === 'ADMIN' ? 'Admin' : 'Docente'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{user.subject}</p>
                      </div>
                    </div>

                    {isCurrent && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">Ou</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Custom Google Email Form */}
          {!showCustomForm ? (
            <button
              onClick={() => setShowCustomForm(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Entrar com Outro E-mail Google (@educacao.mg.gov.br ou Gmail)</span>
            </button>
          ) : (
            <form onSubmit={handleCustomLogin} className="space-y-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Informar Outra Conta Google:</p>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  placeholder="Ex: Profa. Juliana Mendes"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">E-mail Google:</label>
                <input
                  type="email"
                  placeholder="nome.sobrenome@educacao.mg.gov.br"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-[11px]"
                  required
                />
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  Entrar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-500 transition-colors">
          🔒 Conexão segura protegida pelo Google Identity Services da Secretaria de Educação.
        </div>
      </div>
    </div>
  );
};
