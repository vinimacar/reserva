import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 text-slate-950 font-bold px-3 py-2 text-xs shadow-xl backdrop-blur-md border border-amber-400/50 animate-in fade-in duration-200"
    >
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>Modo Offline — Navegando em dados locais armazenados em cache.</span>
    </div>
  );
};
