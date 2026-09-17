import React, { useState, useEffect } from 'react';
import {
  FrontendErrorLog,
  ErrorCategory,
  ErrorSeverity,
} from '../types';
import {
  subscribeToErrorLogs,
  clearAllErrorLogs,
  simulateTestError,
} from '../services/errorLogger';
import {
  Bug,
  AlertOctagon,
  ShieldAlert,
  Code2,
  Trash2,
  Copy,
  Check,
  Search,
  RefreshCw,
  ExternalLink,
  Layers,
  Terminal,
  Activity,
  Globe,
  User as UserIcon,
  Cpu,
} from 'lucide-react';

export const AdminErrorLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<FrontendErrorLog[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<FrontendErrorLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToErrorLogs((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSimulate = async (type: 'cross-origin' | 'type-error' | 'promise-rejection') => {
    setIsSimulating(type);
    try {
      await simulateTestError(type);
      setStatusMessage(`Falha simulada (${type}) capturada e enviada ao Firestore com sucesso!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      console.warn('Simulation error:', e);
    } finally {
      setIsSimulating(null);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Tem certeza de que deseja limpar todos os registros de erros do Firestore?')) {
      return;
    }
    setIsClearing(true);
    try {
      await clearAllErrorLogs();
      setLogs([]);
      setSelectedLog(null);
      setStatusMessage('Todos os logs de erros foram removidos do Firestore e do armazenamento local.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      console.warn('Error clearing logs:', e);
    } finally {
      setIsClearing(false);
    }
  };

  // Metric computations
  const totalLogs = logs.length;
  const criticalCount = logs.filter((l) => l.severity === 'CRITICAL').length;
  const crossOriginCount = logs.filter((l) => l.category === 'CROSS_ORIGIN').length;
  const typeErrorCount = logs.filter((l) => l.category === 'TYPE_ERROR').length;

  // Filtering
  const filteredLogs = logs.filter((log) => {
    if (filterCategory !== 'ALL' && log.category !== filterCategory) return false;
    if (filterSeverity !== 'ALL' && log.severity !== filterSeverity) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(term);
      const matchSource = (log.source || '').toLowerCase().includes(term);
      const matchEmail = (log.userEmail || '').toLowerCase().includes(term);
      const matchStack = (log.stack || '').toLowerCase().includes(term);
      if (!matchMsg && !matchSource && !matchEmail && !matchStack) return false;
    }
    return true;
  });

  const getCategoryBadge = (cat: ErrorCategory) => {
    switch (cat) {
      case 'CROSS_ORIGIN':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            <Globe className="w-3 h-3" />
            <span>Cross-Origin / Iframe</span>
          </span>
        );
      case 'TYPE_ERROR':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <Code2 className="w-3 h-3" />
            <span>TypeError (Tipagem)</span>
          </span>
        );
      case 'PROMISE_REJECTION':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Activity className="w-3 h-3" />
            <span>Promise Rejection</span>
          </span>
        );
      case 'REACT_ERROR':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
            <Layers className="w-3 h-3" />
            <span>React Render Error</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
            <Bug className="w-3 h-3" />
            <span>{cat}</span>
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: ErrorSeverity) => {
    if (sev === 'CRITICAL') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white uppercase tracking-wider">
          CRÍTICO
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
        {sev}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Info & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-black">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Central de Logs de Erro & Depuração Remota</span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  Firestore Conectado
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Captura e envio automático de falhas críticas (Cross-Origin, TypeErrors, rejections e render crashes) dos navegadores dos professores.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Simulation & Management Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSimulate('cross-origin')}
            disabled={isSimulating !== null}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 text-xs font-bold transition-all cursor-pointer"
            title="Testar envio de erro de restrição de Iframe / Cross-Origin"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Testar Cross-Origin</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulate('type-error')}
            disabled={isSimulating !== null}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
            title="Testar captura de TypeError"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Testar TypeError</span>
          </button>

          <button
            type="button"
            onClick={handleClearLogs}
            disabled={isClearing || logs.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Limpar todos os registros de erros"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Logs</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {statusMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total de Falhas
            </span>
            <Bug className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalLogs}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Capturadas no cliente</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Falhas Críticas
            </span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">{criticalCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Interrompem execução</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Cross-Origin
            </span>
            <Globe className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{crossOriginCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Iframe / CORS sandbox</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              TypeErrors
            </span>
            <Code2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{typeErrorCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Propriedade indefinida / null</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por mensagem, arquivo, e-mail..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="CROSS_ORIGIN">Cross-Origin / Iframe</option>
            <option value="TYPE_ERROR">TypeError (Tipagem)</option>
            <option value="PROMISE_REJECTION">Promise Rejections</option>
            <option value="REACT_ERROR">React Crash</option>
            <option value="RUNTIME_ERROR">Runtime Geral</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Todas as Severidades</option>
            <option value="CRITICAL">Apenas Críticos</option>
            <option value="ERROR">Erros</option>
            <option value="WARNING">Avisos</option>
          </select>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-slate-900 dark:text-white">
              Nenhuma falha crítica registrada
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              O sistema de monitoramento está ativo e em tempo real. Qualquer erro de script, cross-origin ou exceção não tratada aparecerá automaticamente aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.map((log) => {
              const dateStr = new Date(log.timestamp).toLocaleString('pt-BR');
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      {getSeverityBadge(log.severity)}
                      {getCategoryBadge(log.category)}
                      {log.isIframe && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          iFrame Sandbox
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                      {dateStr}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white break-words">
                    {log.message}
                  </div>

                  {/* Context chips */}
                  <div className="flex items-center flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {log.source && (
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-xs">
                        {log.source.split('/').slice(-2).join('/')}:{log.lineno || 0}
                      </span>
                    )}
                    {log.userEmail && (
                      <span className="flex items-center space-x-1 font-semibold text-blue-600 dark:text-blue-400">
                        <UserIcon className="w-3 h-3" />
                        <span>{log.userEmail}</span>
                      </span>
                    )}
                    <span className="text-slate-400 dark:text-slate-600 truncate max-w-xs">
                      {log.url}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {getSeverityBadge(selectedLog.severity)}
                  {getCategoryBadge(selectedLog.category)}
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedLog.id}
                  </span>
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-white font-mono break-words mt-2">
                  {selectedLog.message}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Context Properties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Data & Hora
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">
                    {new Date(selectedLog.timestamp).toLocaleString('pt-BR')} ({selectedLog.timestamp})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ambiente de Execução
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedLog.isIframe ? 'Dentro de Iframe (Sandbox)' : 'Janela Principal'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    URL da Aplicação
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white truncate block">
                    {selectedLog.url}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Usuário Autenticado
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedLog.userEmail || 'Não autenticado no momento'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    User Agent (Navegador)
                  </span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 break-words block">
                    {selectedLog.userAgent}
                  </span>
                </div>
              </div>

              {/* Stack Trace */}
              {selectedLog.stack && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Stack Trace (Rastreamento de Pilha)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedLog.stack || '', 'stack')}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {copiedId === 'stack' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Stack</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-60 border border-slate-800">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}

              {/* Component Stack */}
              {selectedLog.componentStack && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Component Tree Stack (React)</span>
                  </span>
                  <pre className="p-3.5 rounded-2xl bg-slate-950 text-slate-300 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-48 border border-slate-800">
                    {selectedLog.componentStack}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), 'all')}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                {copiedId === 'all' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>JSON Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Diagnóstico Completo (JSON)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
