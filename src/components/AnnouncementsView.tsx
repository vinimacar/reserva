import React from 'react';
import { Bell, AlertTriangle, Info, Calendar, User, Shield, CheckCircle } from 'lucide-react';
import { useReservations } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';

export const AnnouncementsView: React.FC<{ onOpenNewReservation: () => void }> = ({ onOpenNewReservation }) => {
  const { announcements, rooms } = useReservations();
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Mural de Avisos & Comunicados</h2>
            <p className="text-xs text-blue-200/80">
              Informações importantes sobre manutenção de laboratórios, novos equipamentos e diretrizes
            </p>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.map((ann) => {
          const targetRoom = rooms.find((r) => r.id === ann.targetRoomId);

          return (
            <div
              key={ann.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-xs ${
                ann.important
                  ? 'border-amber-300 dark:border-amber-800 ring-1 ring-amber-300 dark:ring-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2">
                  {ann.important ? (
                    <span className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <Info className="w-4 h-4" />
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{ann.title}</h3>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {ann.important && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase">
                      Importante
                    </span>
                  )}
                  {targetRoom && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {targetRoom.name}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {ann.content}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Publicado por: <strong className="text-slate-600 dark:text-slate-300">{ann.author}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{ann.date}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
