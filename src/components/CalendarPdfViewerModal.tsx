import React, { useState } from 'react';
import {
  FileText,
  X,
  Download,
  ExternalLink,
  Printer,
  Calendar,
  AlertCircle,
  Clock,
  HardDrive,
} from 'lucide-react';
import {
  downloadCalendarPdf,
  openCalendarPdfInNewTab,
  formatPdfFileSize,
} from '../lib/pdfStorage';
import { formatDateBR } from '../lib/dateUtils';

interface CalendarPdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDataUrl: string;
  fileName: string;
  fileSize?: number;
  uploadedAt?: string;
  schoolName?: string;
  year?: number;
}

export const CalendarPdfViewerModal: React.FC<CalendarPdfViewerModalProps> = ({
  isOpen,
  onClose,
  pdfDataUrl,
  fileName,
  fileSize,
  uploadedAt,
  schoolName,
  year = 2026,
}) => {
  const [iframeError, setIframeError] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {fileName || `Calendario_Escolar_${year}.pdf`}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider shrink-0 border border-blue-200 dark:border-blue-800">
                  Ano {year}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {schoolName && <span className="truncate max-w-[200px]">{schoolName}</span>}
                {fileSize && (
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {formatPdfFileSize(fileSize)}
                  </span>
                )}
                {uploadedAt && (
                  <span className="hidden sm:flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Enviado em {formatDateBR(uploadedAt.split('T')[0], false)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => openCalendarPdfInNewTab(pdfDataUrl)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Abrir em Nova Aba para Visualizador Nativo"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Nova Aba</span>
            </button>

            <button
              type="button"
              onClick={() => downloadCalendarPdf(pdfDataUrl, fileName)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Baixar Arquivo PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden relative flex flex-col items-center justify-center">
          {pdfDataUrl ? (
            <iframe
              src={pdfDataUrl}
              title="Visualizador do Calendário Escolar"
              className="w-full h-full rounded-2xl bg-white shadow-inner border border-slate-200 dark:border-slate-800"
              onError={() => setIframeError(true)}
            />
          ) : (
            <div className="text-center p-6 space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Não foi possível renderizar o arquivo no visualizador integrado.
              </p>
              <button
                type="button"
                onClick={() => openCalendarPdfInNewTab(pdfDataUrl)}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs"
              >
                Abrir em Nova Aba do Navegador
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>
            Documento Oficial do Calendário Escolar • Dica: Você também pode usar Ctrl+P / ⌘+P para imprimir ao abrir em nova aba.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
