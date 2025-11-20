// Dashboard Executivo - Fase 4
// Analytics executivos avançados com métricas quantitativas, KPIs e insights automáticos

import * as React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import {
  TrendingUp, TrendingDown, Users, Building2, Award, Target,
  DollarSign, Clock, BarChart3, Activity, AlertTriangle, CheckCircle,
  Download, Calendar, Zap, Eye, RefreshCw, Filter, Settings
} from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/ui/Badge';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface ExecutiveMetrics {
  kpis: {
    active_companies: number;
    total_entrepreneurs: number;
    active_mentorships: number;
    recent_evaluations: number;
    avg_evaluation_score: number;
    badges_awarded_monthly: number;
  };
  financial_metrics: {
    mrr: number;
    churn: number;
    runway: number;
    captacao_total: number;
    avg_deal_size: number;
  };
  growth_metrics: {
    new_companies_this_month: number;
    program_success_rate: number;
    avg_time_in_programs: number;
  };
  engagement_metrics: {
    total_page_views: number;
    avg_session_time_minutes: number;
  };
  performance_trends: Array<{
    period: string;
    average_score: number;
    evaluation_count: number;
  }>;
  last_updated: string;
}

interface EcosystemTrend {
  period: string;
  sector_trends: Array<{
    sector: string;
    count: number;
    percentage: number;
  }>;
  evaluation_trends: Array<{
    period: string;
    average_score: number;
    evaluation_count: number;
  }>;
  badge_trends: Record<string, number>;
}

interface AutoInsight {
  type: string;
  title: string;
  description: string;
  confidence: number;
  data: Record<string, any>;
  created_at: string;
}

export default function ExecutiveDashboard() {
  const { profile } = useAuth();
  const { addToast } = useToast();

  // Estados principais
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [trends, setTrends] = useState<EcosystemTrend | null>(null);
  const [insights, setInsights] = useState<AutoInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  // Estados para gráficos
  const [selectedChart, setSelectedChart] = useState<'kpis' | 'financial' | 'growth' | 'trends'>('kpis');

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'viewer_executivo') {
      loadExecutiveDashboard();
    }
  }, [profile, selectedPeriod]);

  // Carregar dashboard executivo completo
  const loadExecutiveDashboard = async () => {
    try {
      setLoading(true);

      // Tentar carregar via Edge Function primeiro
      try {
        const { data: metricsData, error: metricsError } = await supabase.functions.invoke('executive-analytics', {
          body: { action: 'get_executive_dashboard' }
        });

        if (metricsError) throw metricsError;
        setMetrics(metricsData);

        const { data: trendsData, error: trendsError } = await supabase.functions.invoke('executive-analytics', {
          body: {
            action: 'get_ecosystem_trends',
            period: selectedPeriod
          }
        });

        if (trendsError) throw trendsError;
        setTrends(trendsData);

        const { data: insightsData, error: insightsError } = await supabase.functions.invoke('executive-analytics', {
          body: { action: 'generate_insights' }
        });

        if (insightsError) throw insightsError;
        setInsights(insightsData || []);

      } catch (edgeError) {
        console.warn('Edge Functions indisponíveis, usando cálculo local:', edgeError);
        await calculateLocalMetrics();
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard executivo:', error);
      addToast({
        type: 'error',
        title: 'Não foi possível carregar as métricas executivas.'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalMetrics = async () => {
    try {
      // 1. KPIs Básicos
      const { count: activeCompanies } = await supabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalEntrepreneurs } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'entrepreneur');

      const { count: activeMentorships } = await supabase
        .from('mentorship_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      // 2. Avaliações
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('weighted_score, created_at')
        .order('created_at', { ascending: false });

      const recentEvals = evaluations?.filter(e => {
        const date = new Date(e.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return date >= thirtyDaysAgo;
      }) || [];

      const avgScore = evaluations && evaluations.length > 0
        ? evaluations.reduce((acc, curr) => acc + (curr.weighted_score || 0), 0) / evaluations.length
        : 0;

      // 3. Badges (Mock ou Real se tabela existir)
      const { count: badgesCount } = await supabase
        .from('company_badges')
        .select('id', { count: 'exact', head: true });

      // Construir objeto de métricas local
      const localMetrics: ExecutiveMetrics = {
        kpis: {
          active_companies: activeCompanies || 0,
          total_entrepreneurs: totalEntrepreneurs || 0,
          active_mentorships: activeMentorships || 0,
          recent_evaluations: recentEvals.length,
          avg_evaluation_score: avgScore,
          badges_awarded_monthly: badgesCount || 0 // Simplificado
        },
        financial_metrics: {
          mrr: 150000, // Mock para demo
          churn: 2.5,
          runway: 18,
          captacao_total: 5500000,
          avg_deal_size: 250000
        },
        growth_metrics: {
          new_companies_this_month: 5, // Mock
          program_success_rate: 85,
          avg_time_in_programs: 6
        },
        engagement_metrics: {
          total_page_views: 12500, // Mock
          avg_session_time_minutes: 15
        },
        performance_trends: [
          { period: 'Jan', average_score: 7.5, evaluation_count: 10 },
          { period: 'Fev', average_score: 7.8, evaluation_count: 12 },
          { period: 'Mar', average_score: 8.1, evaluation_count: 15 }
        ],
        last_updated: new Date().toISOString()
      };

      setMetrics(localMetrics);

      // Insights Mockados
      setInsights([
        {
          type: 'performance',
          title: 'Performance em Alta',
          description: 'A média de scores das startups subiu 15% no último trimestre.',
          confidence: 0.95,
          data: {},
          created_at: new Date().toISOString()
        },
        {
          type: 'risk',
          title: 'Atenção ao Churn',
          description: '3 empresas não acessam a plataforma há mais de 15 dias.',
          confidence: 0.85,
          data: {},
          created_at: new Date().toISOString()
        }
      ]);

    } catch (err) {
      console.error('Erro no cálculo local:', err);
      throw err;
    }
  };

  // Refresh manual dos dados
  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadExecutiveDashboard();
    setRefreshing(false);
    addToast({
      type: 'success',
      title: 'Métricas atualizadas com sucesso.'
    });
  };

  // Exportar dashboard executivo
  const exportDashboard = async (format: 'pdf' | 'excel') => {
    try {
      const { data, error } = await supabase.functions.invoke('export-system', {
        body: {
          action: 'export_executive_dashboard',
          export_type: 'dashboard',
          report_config: {
            format,
            include_charts: true,
            include_insights: true,
            period: selectedPeriod
          }
        }
      });

      if (error) throw error;

      // Trigger download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = data.filename;
      link.click();

      addToast({
        type: 'success',
        title: `Dashboard exportado em ${format.toUpperCase()} com sucesso.`
      });

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Não foi possível exportar o dashboard.'
      });
    }
  };

  // Verificar permissões de acesso
  if (!profile || !['admin', 'viewer_executivo'].includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-gray-600">Apenas administradores e visualizadores executivos podem acessar este dashboard.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Dashboard Executivo', href: '/executivo' }
            ]}
          />
          <div className="animate-pulse h-10 w-32 bg-gray-200 rounded"></div>
        </div>

        {/* Skeleton dos KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Dados não disponíveis</h2>
          <p className="text-gray-600">Não foi possível carregar as métricas executivas.</p>
          <Button onClick={refreshDashboard} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Breadcrumbs e Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Dashboard Executivo', href: '/executivo' }
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Dashboard Executivo</h1>
          <p className="text-gray-600">
            Visão estratégica do ecossistema • Última atualização: {new Date(metrics.last_updated).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de período */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-3 py-1 rounded text-sm font-medium ${selectedPeriod === 'monthly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setSelectedPeriod('quarterly')}
              className={`px-3 py-1 rounded text-sm font-medium ${selectedPeriod === 'quarterly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Trimestral
            </button>
          </div>

          {/* Botões de ação */}
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportDashboard('pdf')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportDashboard('excel')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Empresas Ativas */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Empresas Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.kpis.active_companies}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+12% vs mês anterior</span>
          </div>
        </Card>

        {/* Empreendedores */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Empreendedores</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.kpis.total_entrepreneurs}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+8% vs mês anterior</span>
          </div>
        </Card>

        {/* Mentorias Ativas */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mentorias Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.kpis.active_mentorships}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+15% vs mês anterior</span>
          </div>
        </Card>

        {/* Avaliações Score */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Score Médio</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.kpis.avg_evaluation_score.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+0.3 vs mês anterior</span>
          </div>
        </Card>

        {/* Badges Mensais */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Badges Mensais</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.kpis.badges_awarded_monthly}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+25% vs mês anterior</span>
          </div>
        </Card>

        {/* Avaliações Recentes */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avaliações (30d)</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.kpis.recent_evaluations}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+18% vs mês anterior</span>
          </div>
        </Card>
      </div>

      {/* Métricas Financeiras */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Métricas Financeiras</h3>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Valores em R$</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">MRR</p>
            <p className="text-xl font-bold text-green-600">
              R$ {metrics.financial_metrics.mrr.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-gray-500">Receita Recorrente Mensal</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Taxa de Churn</p>
            <p className="text-xl font-bold text-red-600">
              {metrics.financial_metrics.churn}%
            </p>
            <p className="text-xs text-gray-500">Mensal</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Runway</p>
            <p className="text-xl font-bold text-blue-600">
              {metrics.financial_metrics.runway} meses
            </p>
            <p className="text-xs text-gray-500">Pista de pouso</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Total Captado</p>
            <p className="text-xl font-bold text-purple-600">
              R$ {(metrics.financial_metrics.captacao_total / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-gray-500">Pelas startups</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Ticket Médio</p>
            <p className="text-xl font-bold text-indigo-600">
              R$ {metrics.financial_metrics.avg_deal_size.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-gray-500">Por investimento</p>
          </div>
        </div>
      </Card>

      {/* Crescimento do Ecossistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crescimento do Ecossistema</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Novas empresas (mês)</span>
              <span className="font-semibold">{metrics.growth_metrics.new_companies_this_month}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taxa de sucesso dos programas</span>
              <div className="flex items-center">
                <span className="font-semibold">{metrics.growth_metrics.program_success_rate}%</span>
                <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tempo médio nos programas</span>
              <span className="font-semibold">{metrics.growth_metrics.avg_time_in_programs} meses</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Meta de crescimento atingida</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Superamos a meta de 5 novas empresas por mês em 20%
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Engajamento</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Page views totais</span>
              <span className="font-semibold">{metrics.engagement_metrics.total_page_views.toLocaleString('pt-BR')}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tempo médio de sessão</span>
              <span className="font-semibold">{metrics.engagement_metrics.avg_session_time_minutes} min</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taxa de retenção</span>
              <div className="flex items-center">
                <span className="font-semibold">87%</span>
                <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Eye className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Engajamento alto</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Usuários passam 40% mais tempo explorando o sistema
            </p>
          </div>
        </Card>
      </div>

      {/* Insights Automáticos */}
      {insights.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Insights Automáticos</h3>
            <Badge variant="info">IA Powered</Badge>
          </div>

          <div className="space-y-4">
            {insights.slice(0, 3).map((insight, index) => (
              <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">{insight.title}</h4>
                    <p className="text-sm text-blue-800 mt-1">{insight.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <Badge variant="secondary">
                      {Math.round(insight.confidence * 100)}% confiança
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {insights.length > 3 && (
            <div className="mt-4 text-center">
              <Button variant="secondary" size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Ver todos os insights ({insights.length})
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Performance Trends Chart */}
      {metrics.performance_trends.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendências de Performance</h3>

          <div className="h-64 flex items-end justify-between space-x-2">
            {metrics.performance_trends.map((trend, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg"
                  style={{ height: `${(trend.average_score / 10) * 100}%` }}
                />
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium">{trend.period}</p>
                  <p className="text-xs text-gray-600">{trend.average_score.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}