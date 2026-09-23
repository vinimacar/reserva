import React from 'react';
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Apple,
  Share2,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800/80 mb-5 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-600/30 flex items-center justify-center">
              <img
                src="/icon.svg"
                alt="ReserveLabs App Icon"
                className="w-11 h-11 rounded-[14px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aplicativo Oficial</span>
              </div>
              <h3 className="text-lg font-black text-white">Baixar o ReserveLabs</h3>
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

        {/* Body content */}
        <div className="space-y-4 relative z-10 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Instale o <strong>ReserveLabs</strong> no seu smartphone, tablet ou computador. Você terá
            uma experiência nativa de aplicativo, sem barra de navegação, com abertura rápida e
            acesso direto à sua rotina escolar.
          </p>

          {/* Vantagens */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/70">
              <div className="flex items-center gap-2 text-white font-bold text-xs mb-1">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Na Tela Inicial</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ícone próprio para abrir direto no celular ou desktop.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/70">
              <div className="flex items-center gap-2 text-white font-bold text-xs mb-1">
                <Monitor className="w-4 h-4 text-indigo-400" />
                <span>Tela Cheia</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Visual limpo e fluido sem barras do navegador.
              </p>
            </div>
          </div>

          {/* Estado de instalação e ações */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-xs">Aplicativo já instalado!</p>
                <p className="text-[11px] text-emerald-300/80">
                  Você já está executando o ReserveLabs como aplicativo independente.
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-[0.99]"
              >
                <Download className="w-5 h-5" />
                <span>Instalar Aplicativo Agora</span>
              </button>
              <p className="text-center text-[10px] text-slate-500">
                Compatível com Chrome, Edge, Brave, Android e Opera.
              </p>
            </div>
          ) : isIOS ? (
            /* Guia específico para iOS Safari */
            <div className="p-4 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-3">
              <div className="flex items-center gap-2 text-blue-300 font-bold">
                <Apple className="w-4 h-4 text-blue-400" />
                <span>Como instalar no iPhone ou iPad:</span>
              </div>
              <ol className="space-y-2 text-slate-300 pl-1">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Toque no botão <strong>Compartilhar</strong> (ícone{' '}
                    <Share2 className="w-3.5 h-3.5 inline text-blue-400 mx-0.5" />) na barra inferior
                    do Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Role a lista para baixo e toque em{' '}
                    <strong>
                      "Adicionar à Tela de Início"
                      <PlusSquare className="w-3.5 h-3.5 inline text-blue-400 mx-0.5" />
                    </strong>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Confirme tocando em <strong>Adicionar</strong> no canto superior direito.
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            /* Guia desktop / navegador padrão */
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span>Como baixar pelo navegador:</span>
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[11px] list-disc list-inside">
                <li>
                  No <strong>Google Chrome / Edge</strong>: Clique no ícone de instalação (
                  <Download className="w-3 h-3 inline text-blue-400 mx-0.5" />) no lado direito da
                  barra de endereço.
                </li>
                <li>
                  Ou clique no menu de 3 pontos do navegador &gt; <strong>"Instalar ReserveLabs"</strong>.
                </li>
                <li>
                  No celular Android: Toque nos 3 pontos &gt; <strong>"Instalar aplicativo"</strong> ou{' '}
                  <strong>"Adicionar à tela inicial"</strong>.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>PWA v3.0 · Multiplataforma</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
