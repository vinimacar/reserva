import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logErrorToFirestore } from '../services/errorLogger';
import { AlertOctagon, RotateCcw, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  reportedToCloud: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      reportedToCloud: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Automatically send React render crash to Firestore
    logErrorToFirestore({
      message: `React Crash: ${error.message || 'Erro inesperado de renderização'}`,
      error,
      category: error.name === 'TypeError' ? 'TYPE_ERROR' : 'REACT_ERROR',
      severity: 'CRITICAL',
      componentStack: errorInfo.componentStack || undefined,
      metadata: {
        boundary: 'AppRootErrorBoundary',
      },
    })
      .then(() => {
        this.setState({ reportedToCloud: true });
      })
      .catch((err) => {
        console.warn('ErrorBoundary remote report notice:', err);
      });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      localStorage.removeItem('reserve_current_user');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-black uppercase tracking-wider inline-block mb-1">
                  Falha Crítica Capturada
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Ocorreu um erro inesperado na interface
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  A falha foi interceptada pelo sistema de monitoramento remoto e enviada automaticamente para a equipe técnica.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs font-mono space-y-2 overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Diagnóstico Automático</span>
                </div>
                {this.state.reportedToCloud ? (
                  <span className="flex items-center space-x-1 text-emerald-400 font-sans font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Salvo no Firestore</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-sans text-[11px]">Registrando no Firestore...</span>
                )}
              </div>
              <p className="text-red-400 font-bold break-words">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <div className="text-[10px] text-slate-500 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-blue-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Página</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetState}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all cursor-pointer border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resetar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
