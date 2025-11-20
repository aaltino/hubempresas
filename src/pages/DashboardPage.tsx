import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase, type Company, type Evaluation } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

// Widgets
import FunnelChart from '@/components/charts/FunnelChart';
import HeatmapChart from '@/components/charts/HeatmapChart';
import { OverdueAlertsWidget, AvgTimeWidget, AdvanceRateWidget } from '@/features/companies';
import QuickActions from '@/components/shared/QuickActions';
import WhatsMissingWidget from '@/components/company/WhatsMissingWidget';
import StageProgressBar from '@/components/shared/StageProgressBar';
import InviteCompanyModal from '@/components/shared/InviteCompanyModal';
import { ExportActionsMenu, ExportDataButton } from '@/features/exports';

import { Building2, TrendingUp, CheckCircle, AlertCircle, Search, Filter, X } from 'lucide-react';

export default function DashboardPage() {
  const { profile, hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  
  // Redirecionar mentores para seu dashboard específico
  useEffect(() => {
    // Mentores têm permissão de log_notes em mentorship
    const isMentor = profile && hasPermission('mentorship', 'log_notes');
    if (isMentor) {
      navigate('/mentor/dashboard');
      return;
    }
  }, [profile, navigate, hasPermission]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de filtros avançados
  const [filters, setFilters] = useState({
    searchTerm: '',
    programKey: '',
    cohortId: '',
    eligibilityStatus: ''
  });
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado para o modal de convite de empresa
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadCohorts();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [profile, filters]);

  const loadCohorts = async () => {
    try {
      const { data } = await supabase
        .from('cohorts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setCohorts(data);
    } catch (error) {
      console.error('Erro ao carregar coortes:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      programKey: '',
      cohortId: '',
      eligibilityStatus: ''
    });
  };

  const hasActiveFilters = filters.searchTerm || filters.programKey || filters.cohortId || filters.eligibilityStatus;

  // Função para recarregar dados quando uma empresa for adicionada
  const handleCompanyAdded = () => {
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Admin ou Gestor podem ver todas as startups, Mentor também pode ler
      const canViewAllStartups = hasAnyPermission('startup', ['update', 'assign', 'read']);
      
      if (canViewAllStartups) {
        // Dashboard para Admin/Gestor/Mentor - Aplicar Filtros
        let companiesQuery = supabase.from('companies').select('*');
        
        // Aplicar filtro de programa
        if (filters.programKey) {
          companiesQuery = companiesQuery.eq('current_program_key', filters.programKey);
        }
        
        // Aplicar filtro de coorte
        if (filters.cohortId) {
          companiesQuery = companiesQuery.eq('cohort_id', filters.cohortId);
        }
        
        // Aplicar filtro de busca
        if (filters.searchTerm) {
          companiesQuery = companiesQuery.ilike('name', `%${filters.searchTerm}%`);
        }
        
        const { data: companies } = await companiesQuery;

        const { data: evaluations } = await supabase
          .from('evaluations')
          .select('*')
          .eq('is_valid', true);
        
        const { data: allEvaluations } = await supabase
          .from('evaluations')
          .select('*');

        const { data: cohorts } = await supabase
          .from('cohorts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        
        const currentCohort = cohorts?.[0];

        const programCounts = {
          hotel_de_projetos: companies?.filter(c => c.current_program_key === 'hotel_de_projetos').length || 0,
          pre_residencia: companies?.filter(c => c.current_program_key === 'pre_residencia').length || 0,
          residencia: companies?.filter(c => c.current_program_key === 'residencia').length || 0,
        };

        // Calcular médias por dimensão para o heatmap
        const dimensionAverages = {
          mercado: 0,
          perfil_empreendedor: 0,
          tecnologia_qualidade: 0,
          gestao: 0,
          financeiro: 0,
        };

        if (evaluations && evaluations.length > 0) {
          dimensionAverages.mercado = evaluations.reduce((sum, e) => sum + (e.mercado_score || 0), 0) / evaluations.length;
          dimensionAverages.perfil_empreendedor = evaluations.reduce((sum, e) => sum + (e.perfil_empreendedor_score || 0), 0) / evaluations.length;
          dimensionAverages.tecnologia_qualidade = evaluations.reduce((sum, e) => sum + (e.tecnologia_qualidade_score || 0), 0) / evaluations.length;
          dimensionAverages.gestao = evaluations.reduce((sum, e) => sum + (e.gestao_score || 0), 0) / evaluations.length;
          dimensionAverages.financeiro = evaluations.reduce((sum, e) => sum + (e.financeiro_score || 0), 0) / evaluations.length;
        }

        // Identificar empresas em atraso
        const companiesAtRisk: any[] = [];
        const today = new Date();
        
        if (companies) {
          for (const company of companies) {
            const hasValidEval = evaluations?.some(e => e.company_id === company.id);
            const { data: deliverables } = await supabase
              .from('deliverables')
              .select('*')
              .eq('company_id', company.id)
              .eq('program_key', company.current_program_key);
            
            const pendingRequired = deliverables?.filter(d => d.approval_required && d.status !== 'aprovado').length || 0;
            
            const overdue = deliverables?.filter(d => {
              if (d.status === 'aprovado') return false;
              const createdDate = new Date(d.created_at);
              const daysPending = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
              return daysPending > 30;
            }) || [];
            
            let severity: 'critical' | 'warning' | 'info' = 'info';
            if (overdue.length > 0) severity = 'critical';
            else if (!hasValidEval) severity = 'critical';
            else if (pendingRequired > 0) severity = 'warning';
            
            if (!hasValidEval || pendingRequired > 0 || overdue.length > 0) {
              companiesAtRisk.push({
                name: company.name,
                reason: !hasValidEval 
                  ? 'Sem avaliação válida' 
                  : overdue.length > 0 
                    ? `${overdue.length} deliverable(s) pendente(s) há mais de 30 dias`
                    : `${pendingRequired} deliverable(s) obrigatório(s) pendente(s)`,
                program: company.current_program_key,
                daysOverdue: overdue.length > 0 ? Math.max(...overdue.map(d => {
                  const createdDate = new Date(d.created_at);
                  return Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                })) : undefined,
                severity
              });
            }
          }
        }

        // Calcular tempo médio por programa (simulado - em produção viria do histórico)
        const avgDays = {
          hotel_de_projetos: 45,
          pre_residencia: 60,
          residencia: 90
        };

        // Calcular taxas de avanço (simulado - em produção viria do histórico)
        const advanceRates = {
          hotel_to_pre: 65,
          pre_to_res: 55,
          overall: 60
        };

        setStats({
          totalCompanies: companies?.length || 0,
          totalEvaluations: evaluations?.length || 0,
          programCounts,
          dimensionAverages,
          companiesAtRisk,
          companies,
          allEvaluations,
          currentCohort,
          avgDays,
          advanceRates
        });
      } else if (hasPermission('startup', 'update_self')) {
        // Dashboard para Startup Owner/Member
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (company) {
          const { data: deliverables } = await supabase
            .from('deliverables')
            .select('*')
            .eq('company_id', company.id)
            .eq('program_key', company.current_program_key);

          const { data: latestEvaluation } = await supabase
            .from('evaluations')
            .select('*')
            .eq('company_id', company.id)
            .eq('program_key', company.current_program_key)
            .eq('is_valid', true)
            .order('evaluation_date', { ascending: false })
            .maybeSingle();

          const totalDeliverables = deliverables?.length || 0;
          const approvedDeliverables = deliverables?.filter(d => d.status === 'aprovado').length || 0;
          const completionPercent = totalDeliverables > 0 
            ? Math.round((approvedDeliverables / totalDeliverables) * 100) 
            : 0;

          setStats({
            company,
            deliverables,
            latestEvaluation,
            completionPercent,
            totalDeliverables,
            approvedDeliverables,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Admin, Gestor ou Mentor podem ver dashboard completo
  const canViewFullDashboard = hasAnyPermission('startup', ['update', 'assign', 'read']);
  
  if (canViewFullDashboard) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard HUB Empresas</h2>
          <p className="text-gray-600 mt-1">Visão geral completa do sistema</p>
        </div>

        {/* Filtros Avançados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showFilters && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro de Busca */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Buscar Empresa
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nome da empresa..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filtro de Programa */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Programa/Estágio
                  </label>
                  <select
                    value={filters.programKey}
                    onChange={(e) => setFilters({ ...filters, programKey: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Todos os Programas</option>
                    <option value="hotel_de_projetos">Hotel de Projetos</option>
                    <option value="pre_residencia">Pré-Residência</option>
                    <option value="residencia">Residência</option>
                  </select>
                </div>

                {/* Filtro de Coorte */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Coorte
                  </label>
                  <select
                    value={filters.cohortId}
                    onChange={(e) => setFilters({ ...filters, cohortId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Todas as Coortes</option>
                    {cohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro de Status de Elegibilidade */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status de Elegibilidade
                  </label>
                  <select
                    value={filters.eligibilityStatus}
                    onChange={(e) => setFilters({ ...filters, eligibilityStatus: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Todos os Status</option>
                    <option value="elegivel">Elegível para Avançar</option>
                    <option value="nao_elegivel">Não Elegível</option>
                    <option value="em_avaliacao">Em Avaliação</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {filters.searchTerm && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Busca: {filters.searchTerm}
                      </span>
                    )}
                    {filters.programKey && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Programa: {filters.programKey.replace('_', ' ')}
                      </span>
                    )}
                    {filters.cohortId && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Coorte: {cohorts.find(c => c.id === filters.cohortId)?.name}
                      </span>
                    )}
                    {filters.eligibilityStatus && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Status: {filters.eligibilityStatus.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="flex items-center px-3 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Resultados dos Filtros */}
          {hasActiveFilters && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>{stats?.totalCompanies || 0}</strong> {stats?.totalCompanies === 1 ? 'empresa encontrada' : 'empresas encontradas'} com os filtros aplicados
              </p>
            </div>
          )}
        </div>

        {/* Cards de Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Empresas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalCompanies || 0}</p>
              </div>
              <Building2 className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hotel de Projetos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.programCounts?.hotel_de_projetos || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pré-Residência</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.programCounts?.pre_residencia || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Residência</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.programCounts?.residencia || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Layout Principal: 5 Widgets + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - 5 Widgets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Widget 1: Funil */}
            <FunnelChart 
              data={stats?.programCounts || { hotel_de_projetos: 0, pre_residencia: 0, residencia: 0 }}
              total={stats?.totalCompanies || 0}
            />

            {/* Widget 2: Heatmap */}
            <HeatmapChart 
              data={stats?.dimensionAverages || { 
                mercado: 0, 
                perfil_empreendedor: 0, 
                tecnologia_qualidade: 0, 
                gestao: 0, 
                financeiro: 0 
              }}
            />

            {/* Widget 3: Alertas */}
            <OverdueAlertsWidget 
              alerts={stats?.companiesAtRisk || []}
            />
          </div>

          {/* Coluna Lateral - Quick Actions + Widgets 4 e 5 */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions 
              onNewCompany={() => setShowInviteModal(true)}
              onNewEvaluation={() => navigate('/avaliacoes')}
              onExport={() => alert('Use os botões de Exportar PDF abaixo')}
              onFilter={() => setShowFilters(!showFilters)}
              userRole={profile?.role}
            />

            {/* Botões de Exportação */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Exportações</h3>
              
              <ExportActionsMenu
                type="company-onepager"
                variant="outline"
                size="md"
                label="Exportar Empresa (PDF)"
                className="w-full"
              />
              
              <ExportActionsMenu
                type="cohort-summary"
                cohortId={filters.cohortId || stats?.currentCohort?.id}
                cohortName={filters.cohortId 
                  ? cohorts.find(c => c.id === filters.cohortId)?.name 
                  : stats?.currentCohort?.name}
                variant="outline"
                size="md"
                label="Exportar Coorte (PDF)"
                className="w-full"
              />

              <div className="pt-2 border-t border-gray-200">
                <ExportDataButton 
                  data={stats?.companies || []}
                  filename={`empresas_${new Date().toISOString().split('T')[0]}`}
                  sheetName="Empresas"
                  className="w-full"
                />
              </div>
            </div>

            {/* Widget 4: Tempo Médio */}
            <AvgTimeWidget 
              avgDays={stats?.avgDays || { hotel_de_projetos: 0, pre_residencia: 0, residencia: 0 }}
            />

            {/* Widget 5: Taxa de Avanço */}
            <AdvanceRateWidget 
              rates={stats?.advanceRates || { hotel_to_pre: 0, pre_to_res: 0, overall: 0 }}
              cohortName={stats?.currentCohort?.name || 'Atual'}
            />
          </div>
        </div>

        {/* Modal de Convite de Empresa */}
        <InviteCompanyModal 
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleCompanyAdded}
        />
      </div>
    );
  }

  // Dashboard para Empresa
  const programLabels: Record<string, string> = {
    hotel_de_projetos: 'Hotel de Projetos',
    pre_residencia: 'Pré-Residência',
    residencia: 'Residência'
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{stats?.company?.name}</h2>
        <p className="text-gray-600 mt-1">
          Programa: <span className="font-semibold">{programLabels[stats?.company?.current_program_key]}</span>
        </p>
      </div>

      {/* Progress Bar do Funil */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Progresso no Funil</h3>
        <StageProgressBar 
          currentProgram={stats?.company?.current_program_key}
          completionPercent={stats?.completionPercent}
        />
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progresso de Deliverables</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.completionPercent}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deliverables Aprovados</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.approvedDeliverables}/{stats?.totalDeliverables}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Última Avaliação</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.latestEvaluation?.weighted_score?.toFixed(1) || 'N/A'}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* WIDGET CRÍTICO: What's Missing to Advance */}
      {stats?.company && (
        <WhatsMissingWidget companyId={stats.company.id} />
      )}

      {/* Exportar Dados da Empresa */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Exportar Dados</h3>
            <p className="text-sm text-gray-600 mt-1">Baixe seus dados e relatórios</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Exportar Deliverables */}
          <ExportDataButton
            data={stats?.deliverables || []}
            filename={`${stats?.company?.name.replace(/\s+/g, '_')}_deliverables_${new Date().toISOString().split('T')[0]}`}
            sheetName="Deliverables"
            className="w-full"
          />
          
          {/* Exportar Avaliações */}
          {stats?.latestEvaluation && (
            <ExportDataButton
              data={[stats.latestEvaluation]}
              filename={`${stats?.company?.name.replace(/\s+/g, '_')}_avaliacoes_${new Date().toISOString().split('T')[0]}`}
              sheetName="Avaliacoes"
              className="w-full"
            />
          )}
        </div>
      </div>

      {/* Scores por Dimensão */}
      {stats?.latestEvaluation && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Última Avaliação - Scores por Dimensão</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Mercado', score: stats.latestEvaluation.mercado_score, weight: '28%' },
              { label: 'Perfil Empreendedor', score: stats.latestEvaluation.perfil_empreendedor_score, weight: '21%' },
              { label: 'Tecnologia & Qualidade', score: stats.latestEvaluation.tecnologia_qualidade_score, weight: '14%' },
              { label: 'Gestão', score: stats.latestEvaluation.gestao_score, weight: '16%' },
              { label: 'Financeiro', score: stats.latestEvaluation.financeiro_score, weight: '16%' },
            ].map((dimension) => (
              <div key={dimension.label} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">
                  {dimension.label} <span className="text-xs">({dimension.weight})</span>
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dimension.score?.toFixed(1) || 'N/A'}/10
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${((dimension.score || 0) / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
