import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  TrendingUp, 
  Users, 
  Building2,
  FileText,
  Eye,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalMentors: number;
  totalCompanies: number;
  totalEvaluations: number;
  totalConflicts: number;
  criticalConflicts: number;
  warningConflicts: number;
  resolvedConflicts: number;
  activePartnerships: number;
  recentIncidents: number;
  auditLogsCount: number;
}

interface RecentIncident {
  id: string;
  mentor_name: string;
  company_name: string;
  action_type: string;
  severity: string;
  created_at: string;
  conflict_reasons?: any[];
}

export default function AdminDashboard() {
  const { profile, hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMentors: 0,
    totalCompanies: 0,
    totalEvaluations: 0,
    totalConflicts: 0,
    criticalConflicts: 0,
    warningConflicts: 0,
    resolvedConflicts: 0,
    activePartnerships: 0,
    recentIncidents: 0,
    auditLogsCount: 0
  });
  const [recentIncidents, setRecentIncidents] = useState<RecentIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    // Apenas Admin tem permissão para gerenciar usuários
    if (profile && hasPermission('user', 'create')) {
      loadDashboardData();
    }
  }, [profile, timeRange, hasPermission]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Calcular datas baseado no filtro de tempo
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeRange) {
        case '1d':
          filterDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          filterDate.setDate(now.getDate() - 90);
          break;
      }

      // Buscar estatísticas básicas
      const [mentorsResult, companiesResult, evaluationsResult, partnershipsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'mentor'),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('evaluations').select('id', { count: 'exact', head: true }),
        supabase.from('mentor_company_partnerships').select('id', { count: 'exact', head: true })
      ]);

      // Buscar logs de auditoria com filtros
      const { data: auditLogs } = await supabase
        .from('conflict_audit_logs')
        .select('*')
        .gte('created_at', filterDate.toISOString())
        .order('created_at', { ascending: false });

      // Calcular estatísticas de conflitos
      const totalConflicts = auditLogs?.length || 0;
      const criticalConflicts = auditLogs?.filter(log => log.severity === 'critical').length || 0;
      const warningConflicts = auditLogs?.filter(log => log.severity === 'warning').length || 0;
      
      // Buscar incidentes recentes (últimos 10)
      const { data: recentLogs } = await supabase
        .from('conflict_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Enriquecer dados dos incidentes recentes
      const enrichedIncidents = await Promise.all(
        recentLogs?.map(async (log) => {
          const [mentorData, companyData] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', log.mentor_id).single(),
            supabase.from('companies').select('name').eq('id', log.company_id).single()
          ]);

          return {
            id: log.id,
            mentor_name: mentorData.data?.full_name || 'Mentor não encontrado',
            company_name: companyData.data?.name || 'Empresa não encontrada',
            action_type: log.action_type,
            severity: log.severity,
            created_at: log.created_at,
            conflict_reasons: log.details?.conflict_reasons
          };
        }) || []
      );

      // Buscar total de logs de auditoria
      const { count: auditLogsCount } = await supabase
        .from('conflict_audit_logs')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalMentors: mentorsResult.count || 0,
        totalCompanies: companiesResult.count || 0,
        totalEvaluations: evaluationsResult.count || 0,
        totalConflicts,
        criticalConflicts,
        warningConflicts,
        resolvedConflicts: 0, // Implementar lógica de resolução
        activePartnerships: partnershipsResult.count || 0,
        recentIncidents: recentLogs?.length || 0,
        auditLogsCount: auditLogsCount || 0
      });

      setRecentIncidents(enrichedIncidents);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
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
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getRiskLevel = () => {
    const riskScore = (stats.criticalConflicts * 100 + stats.warningConflicts * 50) / Math.max(stats.totalConflicts, 1);
    
    if (riskScore >= 70) return { level: 'Alto', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (riskScore >= 40) return { level: 'Médio', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Baixo', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const riskLevel = getRiskLevel();

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
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
            <p className="text-purple-100">Monitoramento e controle de conflitos de interesse</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-purple-700 text-white border border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="1d">Últimas 24h</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alertas Críticos */}
      {stats.criticalConflicts > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Atenção:</strong> {stats.criticalConflicts} conflito(s) crítico(s) detectado(s) requerem ação imediata.
                <Link to="/admin/conflicts" className="font-medium underline ml-1">
                  Ver detalhes
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Mentores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMentors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Empresas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avaliações</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvaluations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Parcerias Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activePartnerships}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de Conflitos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Conflitos Críticos</p>
              <p className="text-2xl font-bold text-red-600">{stats.criticalConflicts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Conflitos Aviso</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warningConflicts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Incidentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalConflicts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${riskLevel.bgColor}`}>
              <TrendingUp className={`w-6 h-6 ${riskLevel.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Nível de Risco</p>
              <p className={`text-2xl font-bold ${riskLevel.color}`}>{riskLevel.level}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Incidentes Recentes e Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidentes Recentes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Incidentes Recentes</h2>
              <Link
                to="/admin/conflicts"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver todos
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {recentIncidents.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum incidente recente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentIncidents.slice(0, 5).map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                        {getSeverityIcon(incident.severity)}
                        <span className="ml-1">{incident.severity}</span>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {incident.mentor_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {incident.company_name} • {incident.action_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(incident.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Ações Rápidas</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link
                to="/admin/conflicts"
                className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Shield className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <h3 className="font-medium text-red-900">Gerenciar Conflitos</h3>
                  <p className="text-sm text-red-700">Revisar e resolver conflitos ativos</p>
                </div>
              </Link>

              <Link
                to="/admin/audit-logs"
                className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FileText className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-blue-900">Logs de Auditoria</h3>
                  <p className="text-sm text-blue-700">Examinar histórico completo ({stats.auditLogsCount} registros)</p>
                </div>
              </Link>

              <Link
                to="/admin/mentors"
                className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-green-900">Gerenciar Mentores</h3>
                  <p className="text-sm text-green-700">Administrar mentores e suas parcerias</p>
                </div>
              </Link>

              <button
                onClick={loadDashboardData}
                className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Clock className="w-8 h-8 text-gray-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Atualizar Dados</h3>
                  <p className="text-sm text-gray-700">Recarregar estatísticas do dashboard</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo de Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Resumo de Performance</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalMentors > 0 ? Math.round((stats.totalEvaluations / stats.totalMentors) * 100) / 100 : 0}
              </div>
              <p className="text-sm text-gray-600">Avaliações por Mentor</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.totalEvaluations > 0 ? Math.round((stats.totalEvaluations / stats.totalCompanies) * 100) / 100 : 0}
              </div>
              <p className="text-sm text-gray-600">Avaliações por Empresa</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.activePartnerships > 0 ? Math.round((stats.totalConflicts / stats.activePartnerships) * 100) / 100 : 0}
              </div>
              <p className="text-sm text-gray-600">Incidentes por Parceria</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}