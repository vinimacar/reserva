import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'login' | 'banner' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  // Variant for Login Screen
  if (variant === 'login') {
    return (
      <>
        <button
          id="pwa-install-login-btn"
          type="button"
          onClick={handleClick}
          className={`px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${className}`}
          title="Baixar aplicativo no celular ou computador"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Baixar App</span>
        </button>

        <InstallAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Variant for Top Floating/Corner Banner (optional)
  if (variant === 'banner') {
    return (
      <>
        <div
          className={`flex items-center justify-between gap-3 p-2.5 px-4 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white rounded-2xl shadow-lg border border-blue-400/30 text-xs backdrop-blur-md ${className}`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-200 shrink-0" />
            <span className="font-semibold">
              Instale o ReserveLabs no seu dispositivo para acesso rápido sem abrir o navegador.
            </span>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="px-3 py-1 bg-white text-blue-900 hover:bg-blue-50 font-black rounded-xl text-[11px] shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            Baixar App
          </button>
        </div>

        <InstallAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Variant for compact icon-only
  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer ${className}`}
          title="Baixar aplicativo no celular ou computador"
        >
          <Download className="w-4 h-4 text-emerald-400" />
        </button>

        <InstallAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Default 'header' variant
  return (
    <>
      <button
        id="pwa-install-header-btn"
        type="button"
        onClick={handleClick}
        className={`px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 text-emerald-300 dark:text-emerald-300 border border-emerald-500/40 hover:border-emerald-500 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${className}`}
        title="Baixar aplicativo para celular ou computador"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
        <span className="hidden sm:inline">Baixar App</span>
        <span className="sm:hidden">App</span>
      </button>

      <InstallAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
