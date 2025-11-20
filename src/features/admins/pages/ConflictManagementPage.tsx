import { useEffect, useState } from 'react';
import { supabase, type Company, type Profile } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  User, 
  Building2, 
  Eye, 
  Flag,
  TrendingUp,
  Shield,
  Clock,
  Search,
  Filter,
  Download
} from 'lucide-react';

interface ConflictIncident {
  id: string;
  mentor_id: string;
  company_id: string;
  action_type: string;
  details: any;
  severity: 'info' | 'warning' | 'critical';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  mentor?: Profile;
  company?: Company;
}

interface Partnership {
  id: string;
  mentor_id: string;
  company_id: string;
  partnership_type: 'founder' | 'partner' | 'advisor';
  created_at: string;
  mentor?: Profile;
  company?: Company;
}

export default function ConflictManagementPage() {
  const { profile } = useAuth();
  const [incidents, setIncidents] = useState<ConflictIncident[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<ConflictIncident | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar logs de auditoria de conflitos
      const { data: auditData } = await supabase
        .from('conflict_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Carregar parcerias declaradas
      const { data: partnershipData } = await supabase
        .from('mentor_company_partnerships')
        .select('*')
        .order('created_at', { ascending: false });

      // Carregar informações dos mentores e empresas
      const mentorIds = Array.from(new Set([
        ...(auditData?.map(i => i.mentor_id) || []),
        ...(partnershipData?.map(p => p.mentor_id) || [])
      ]));

      const companyIds = Array.from(new Set([
        ...(auditData?.map(i => i.company_id) || []),
        ...(partnershipData?.map(p => p.company_id) || [])
      ]));

      const [mentorsResponse, companiesResponse] = await Promise.all([
        supabase.from('profiles').select('*').in('id', mentorIds),
        supabase.from('companies').select('*').in('id', companyIds)
      ]);

      const mentors = mentorsResponse.data || [];
      const companies = companiesResponse.data || [];

      // Enriquecer dados com informações relacionadas
      const enrichedIncidents = auditData?.map(incident => ({
        ...incident,
        mentor: mentors.find(m => m.id === incident.mentor_id),
        company: companies.find(c => c.id === incident.company_id)
      })) || [];

      const enrichedPartnerships = partnershipData?.map(partnership => ({
        ...partnership,
        mentor: mentors.find(m => m.id === partnership.mentor_id),
        company: companies.find(c => c.id === partnership.company_id)
      })) || [];

      setIncidents(enrichedIncidents);
      setPartnerships(enrichedPartnerships);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
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
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const getConflictStats = () => {
    const totalIncidents = incidents.length;
    const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;
    const warningIncidents = incidents.filter(i => i.severity === 'warning').length;
    const totalPartnerships = partnerships.length;

    return {
      totalIncidents,
      criticalIncidents,
      warningIncidents,
      totalPartnerships,
      riskScore: Math.round((criticalIncidents * 100 + warningIncidents * 50) / Math.max(totalIncidents, 1))
    };
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = !searchTerm || 
      incident.mentor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.action_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const incidentDate = new Date(incident.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case 'today': matchesDate = daysDiff === 0; break;
        case 'week': matchesDate = daysDiff <= 7; break;
        case 'month': matchesDate = daysDiff <= 30; break;
      }
    }

    return matchesSearch && matchesSeverity && matchesDate;
  });

  const stats = getConflictStats();

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão de Conflitos</h1>
            <p className="text-red-100">Monitoramento e controle de conflitos de interesse</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.totalIncidents}</div>
            <div className="text-sm text-red-100">Incidentes Totais</div>
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
              <p className="text-2xl font-bold text-red-600">{stats.criticalIncidents}</p>
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
              <p className="text-2xl font-bold text-yellow-600">{stats.warningIncidents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Parcerias</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalPartnerships}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Risco Médio</p>
              <p className="text-2xl font-bold text-purple-600">{stats.riskScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por mentor, empresa ou ação..."
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
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
            </select>
          </div>

          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," + 
                "Data,Mentor,Empresa,Ação,Severidade,Detalhes\n" +
                filteredIncidents.map(incident => 
                  `${new Date(incident.created_at).toLocaleDateString('pt-BR')},` +
                  `${incident.mentor?.full_name || 'N/A'},` +
                  `${incident.company?.name || 'N/A'},` +
                  `${incident.action_type},` +
                  `${incident.severity},` +
                  `"${JSON.stringify(incident.details).replace(/"/g, '""')}"`
                ).join("\n");
              
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `conflitos_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Lista de Incidentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Histórico de Incidentes ({filteredIncidents.length})
          </h2>
        </div>
        
        <div className="p-6">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum incidente encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map((incident) => (
                <div key={incident.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                          {getSeverityIcon(incident.severity)}
                          <span className="ml-1">{incident.severity}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(incident.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedIncident(incident);
                          setShowIncidentModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{incident.mentor?.full_name}</p>
                        <p className="text-xs text-gray-500">{incident.mentor?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{incident.company?.name}</p>
                        <p className="text-xs text-gray-500">{incident.company?.current_program_key}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{incident.action_type}</p>
                        <p className="text-xs text-gray-500">
                          {incident.details?.evaluationAttempted ? 'Tentativa de Avaliação' : 'Ação do Sistema'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {incident.details?.conflict_reasons && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm font-medium text-red-800">Motivos do Conflito:</p>
                      <ul className="mt-1 text-sm text-red-700">
                        {incident.details.conflict_reasons.map((reason: any, index: number) => (
                          <li key={index}>• {reason.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Incidente */}
      {showIncidentModal && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 my-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Detalhes do Incidente</h3>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Informações Gerais</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Data/Hora:</label>
                    <p className="text-sm text-gray-900">{new Date(selectedIncident.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ação:</label>
                    <p className="text-sm text-gray-900">{selectedIncident.action_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Severidade:</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedIncident.severity)}`}>
                      {getSeverityIcon(selectedIncident.severity)}
                      <span className="ml-1">{selectedIncident.severity}</span>
                    </span>
                  </div>
                  {selectedIncident.ip_address && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">IP:</label>
                      <p className="text-sm text-gray-900">{selectedIncident.ip_address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Partes Envolvidas</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <h5 className="font-medium text-blue-900">Mentor</h5>
                    <p className="text-sm text-blue-800">{selectedIncident.mentor?.full_name}</p>
                    <p className="text-xs text-blue-600">{selectedIncident.mentor?.email}</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <h5 className="font-medium text-green-900">Empresa</h5>
                    <p className="text-sm text-green-800">{selectedIncident.company?.name}</p>
                    <p className="text-xs text-green-600">{selectedIncident.company?.current_program_key}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedIncident.details && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Detalhes Técnicos</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedIncident.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowIncidentModal(false)}
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