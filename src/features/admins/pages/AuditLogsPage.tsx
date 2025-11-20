import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Filter, 
  Download, 
  Search, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface AuditLog {
  id: string;
  mentor_id: string;
  company_id: string;
  action_type: string;
  details: any;
  severity: 'info' | 'warning' | 'critical';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  mentor_name?: string;
  company_name?: string;
}

export default function AuditLogsPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadAuditLogs();
    }
  }, [profile]);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, severityFilter, actionFilter, dateRange]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('conflict_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Enriquecer dados com nomes do mentor e empresa
      const enrichedLogs = await Promise.all(
        data?.map(async (log) => {
          const [mentorData, companyData] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', log.mentor_id).single(),
            supabase.from('companies').select('name').eq('id', log.company_id).single()
          ]);

          return {
            ...log,
            mentor_name: mentorData.data?.full_name || 'Mentor não encontrado',
            company_name: companyData.data?.name || 'Empresa não encontrada'
          };
        }) || []
      );

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.mentor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de severidade
    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    // Filtro de ação
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionFilter);
    }

    // Filtro de data
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(log => new Date(log.created_at) >= filterDate);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <X className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getAuditStats = () => {
    const totalLogs = filteredLogs.length;
    const criticalLogs = filteredLogs.filter(l => l.severity === 'critical').length;
    const warningLogs = filteredLogs.filter(l => l.severity === 'warning').length;
    const infoLogs = filteredLogs.filter(l => l.severity === 'info').length;
    
    const uniqueMentors = new Set(filteredLogs.map(l => l.mentor_id)).size;
    const uniqueCompanies = new Set(filteredLogs.map(l => l.company_id)).size;

    return {
      totalLogs,
      criticalLogs,
      warningLogs,
      infoLogs,
      uniqueMentors,
      uniqueCompanies
    };
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Data/Hora', 'Mentor', 'Empresa', 'Ação', 'Severidade', 'IP', 'Detalhes'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        `"${log.mentor_name || ''}"`,
        `"${log.company_name || ''}"`,
        log.action_type,
        log.severity,
        log.ip_address || '',
        `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Paginação
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

  // Ações únicas para o filtro
  const uniqueActions = Array.from(new Set(logs.map(log => log.action_type)));

  const stats = getAuditStats();

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
        <p className="text-gray-600">Esta página é exclusiva para administradores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Logs de Auditoria</h1>
            <p className="text-indigo-100">Histórico completo de auditoria de conflitos</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <div className="text-sm text-indigo-100">Registros Totais</div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Críticos</p>
              <p className="text-2xl font-bold text-red-600">{stats.criticalLogs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avisos</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warningLogs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Informação</p>
              <p className="text-2xl font-bold text-blue-600">{stats.infoLogs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Mentores Únicos</p>
              <p className="text-2xl font-bold text-green-600">{stats.uniqueMentors}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles e Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas Severidades</option>
              <option value="critical">Crítico</option>
              <option value="warning">Aviso</option>
              <option value="info">Informação</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas Ações</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
              <option value="quarter">Último Trimestre</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAuditLogs}
              className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </button>
            
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Registros de Auditoria ({filteredLogs.length})
            </h2>
            <span className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </span>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {paginatedLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum log encontrado.</p>
            </div>
          ) : (
            paginatedLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(log.severity)}`}>
                      {getSeverityIcon(log.severity)}
                      <span className="ml-1">{log.severity}</span>
                    </span>
                    
                    <div className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{log.action_type}</div>
                      <div className="text-xs text-gray-500">
                        {log.mentor_name} → {log.company_name}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowLogModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {log.details?.conflict_reasons && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-medium text-red-800">Conflitos Detectados:</p>
                    <ul className="mt-1 text-sm text-red-700">
                      {log.details.conflict_reasons.map((reason: any, index: number) => (
                        <li key={index}>• {reason.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(startIndex + logsPerPage, filteredLogs.length)} de {filteredLogs.length} registros
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm border rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Log */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 my-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Detalhes do Log de Auditoria</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Informações do Evento</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Data/Hora:</label>
                    <p className="text-sm text-gray-900">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ação:</label>
                    <p className="text-sm text-gray-900">{selectedLog.action_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Severidade:</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedLog.severity)}`}>
                      {getSeverityIcon(selectedLog.severity)}
                      <span className="ml-1">{selectedLog.severity}</span>
                    </span>
                  </div>
                  {selectedLog.ip_address && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Endereço IP:</label>
                      <p className="text-sm text-gray-900">{selectedLog.ip_address}</p>
                    </div>
                  )}
                  {selectedLog.user_agent && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">User Agent:</label>
                      <p className="text-sm text-gray-900 text-xs break-all">{selectedLog.user_agent}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Entidades</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <h5 className="font-medium text-blue-900">Mentor</h5>
                    <p className="text-sm text-blue-800">{selectedLog.mentor_name}</p>
                    <p className="text-xs text-blue-600">ID: {selectedLog.mentor_id}</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <h5 className="font-medium text-green-900">Empresa</h5>
                    <p className="text-sm text-green-800">{selectedLog.company_name}</p>
                    <p className="text-xs text-green-600">ID: {selectedLog.company_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedLog.details && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Detalhes Completos</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}