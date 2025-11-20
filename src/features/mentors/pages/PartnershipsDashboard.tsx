// Dashboard de Parcerias Ativas - Fase 3
// Sistema de acompanhamento de mentorias e métricas de sucesso

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { 
  Users, TrendingUp, Target, Award, Calendar, MessageSquare,
  Eye, Edit, BarChart3, Clock, CheckCircle, AlertTriangle,
  Filter, ChevronDown, ChevronUp, Activity
} from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/ui/Badge';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface Partnership {
  id: string;
  mentor_id: string;
  company_id: string;
  status: string;
  partnership_stage: string;
  start_date?: string;
  end_date?: string;
  focus_areas?: string[];
  meeting_frequency?: string;
  notes?: string;
  success_metrics?: {
    sessions_completed: number;
    goals_achieved: number;
    satisfaction_avg: number;
    feedback_count: number;
  };
  last_activity_at?: string;
  next_milestone_date?: string;
  milestone_description?: string;
  impact_assessment?: {
    business_growth: string;
    mentor_feedback: string;
    key_achievements: string[];
  };
  company: {
    id: string;
    name: string;
    sector: string;
    stage: string;
    description?: string;
  };
  mentor: {
    id: string;
    full_name: string;
    email: string;
    expertise?: string;
  };
  activities_count?: number;
  recent_activities?: any[];
  feedback_summary?: any;
}

interface PartnershipFilters {
  stage?: string;
  status?: string;
  sector?: string;
  meeting_frequency?: string;
}

export default function PartnershipsDashboard() {
  const { profile } = useAuth();
  const { addToast } = useToast();

  // Estados principais
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PartnershipFilters>({});
  const [expandedPartnership, setExpandedPartnership] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Estados de métricas gerais
  const [overallMetrics, setOverallMetrics] = useState({
    total_partnerships: 0,
    active_partnerships: 0,
    avg_satisfaction: 0,
    total_sessions: 0,
    pending_follow_ups: 0
  });

  useEffect(() => {
    if (profile?.role === 'mentor') {
      loadPartnershipsData();
    }
  }, [profile, filters]);

  // Carregar dados das parcerias
  const loadPartnershipsData = async () => {
    try {
      setLoading(true);

      // Query base para as parcerias
      let query = supabase
        .from('mentorships')
        .select(`
          *,
          company:companies(*),
          mentor:profiles!mentorships_mentor_id_fkey(*)
        `)
        .eq('mentor_id', profile.id);

      // Aplicar filtros
      if (filters.stage) {
        query = query.eq('partnership_stage', filters.stage);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data: partnershipsData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Para cada parceria, buscar dados adicionais
      const enhancedPartnerships = await Promise.all(
        (partnershipsData || []).map(async (partnership) => {
          // Contar atividades
          const { count: activitiesCount } = await supabase
            .from('mentorship_activities')
            .select('id', { count: 'exact' })
            .eq('mentorship_id', partnership.id);

          // Buscar atividades recentes
          const { data: recentActivities } = await supabase
            .from('mentorship_activities')
            .select('*')
            .eq('mentorship_id', partnership.id)
            .order('scheduled_at', { ascending: false })
            .limit(3);

          // Buscar resumo de feedback
          const { data: feedbackSummary } = await supabase.functions.invoke('mentorship-feedback-processor', {
            body: {
              action: 'get_feedback_summary',
              mentorship_id: partnership.id
            }
          });

          return {
            ...partnership,
            activities_count: activitiesCount || 0,
            recent_activities: recentActivities || [],
            feedback_summary: feedbackSummary?.data || null
          };
        })
      );

      setPartnerships(enhancedPartnerships);

      // Calcular métricas gerais
      const metrics = {
        total_partnerships: enhancedPartnerships.length,
        active_partnerships: enhancedPartnerships.filter(p => p.status === 'active').length,
        avg_satisfaction: enhancedPartnerships.reduce((acc, p) => {
          const metrics = p.success_metrics as any;
          return acc + (metrics?.satisfaction_avg || 0);
        }, 0) / enhancedPartnerships.length || 0,
        total_sessions: enhancedPartnerships.reduce((acc, p) => {
          const metrics = p.success_metrics as any;
          return acc + (metrics?.sessions_completed || 0);
        }, 0),
        pending_follow_ups: enhancedPartnerships.filter(p => 
          p.next_milestone_date && new Date(p.next_milestone_date) <= new Date()
        ).length
      };

      setOverallMetrics(metrics);

    } catch (error) {
      console.error('Erro ao carregar parcerias:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível carregar as parcerias'
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar estágio da parceria
  const updatePartnershipStage = async (partnershipId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('mentorships')
        .update({ 
          partnership_stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnershipId);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Estágio atualizado',
        description: `Parceria movida para ${newStage}`
      });

      await loadPartnershipsData();

    } catch (error) {
      console.error('Erro ao atualizar estágio:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível atualizar o estágio'
      });
    }
  };

  // Obter cor do estágio
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'matching': return 'bg-blue-100 text-blue-800';
      case 'onboarding': return 'bg-purple-100 text-purple-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter próximo estágio
  const getNextStage = (currentStage: string) => {
    const stageFlow = {
      'matching': 'onboarding',
      'onboarding': 'active',
      'active': 'monitoring',
      'monitoring': 'completed'
    };
    return stageFlow[currentStage];
  };

  // Calcular score de saúde da parceria
  const calculateHealthScore = (partnership: Partnership) => {
    let score = 100;
    
    // Deduzir por falta de atividade recente
    if (partnership.last_activity_at) {
      const daysSinceLastActivity = (Date.now() - new Date(partnership.last_activity_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastActivity > 30) score -= 20;
      else if (daysSinceLastActivity > 14) score -= 10;
    }
    
    // Deduzir por baixa satisfação
    const avgSatisfaction = (partnership.success_metrics as any)?.satisfaction_avg || 0;
    if (avgSatisfaction < 3) score -= 30;
    else if (avgSatisfaction < 4) score -= 15;
    
    // Deduzir por milestones atrasados
    if (partnership.next_milestone_date && new Date(partnership.next_milestone_date) < new Date()) {
      score -= 25;
    }
    
    return Math.max(0, score);
  };

  const filteredPartnerships = partnerships.filter(partnership => {
    if (filters.sector && !partnership.company.sector.toLowerCase().includes(filters.sector.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-300 rounded w-1/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Mentor', href: '/mentor/dashboard' },
          { label: 'Parcerias', href: '/mentor/partnerships' }
        ]} />
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-500" />
              Dashboard de Parcerias
            </h1>
            <p className="text-gray-600 mt-1">
              Acompanhe o progresso e métricas das suas mentorias
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Parcerias</p>
              <p className="text-2xl font-bold text-blue-600">
                {overallMetrics.total_partnerships}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ativas</p>
              <p className="text-2xl font-bold text-green-600">
                {overallMetrics.active_partnerships}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfação Média</p>
              <p className="text-2xl font-bold text-yellow-600">
                {overallMetrics.avg_satisfaction.toFixed(1)}/5
              </p>
            </div>
            <Award className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessões</p>
              <p className="text-2xl font-bold text-purple-600">
                {overallMetrics.total_sessions}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Follow-ups Pendentes</p>
              <p className="text-2xl font-bold text-red-600">
                {overallMetrics.pending_follow_ups}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>

          <select 
            value={filters.stage || ''} 
            onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value || undefined }))}
            className="rounded border-gray-300 text-sm"
          >
            <option value="">Todos os estágios</option>
            <option value="matching">Matching</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Ativa</option>
            <option value="monitoring">Monitoramento</option>
            <option value="completed">Concluída</option>
            <option value="paused">Pausada</option>
          </select>

          <select 
            value={filters.status || ''} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
            className="rounded border-gray-300 text-sm"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="completed">Concluído</option>
          </select>

          <input
            type="text"
            placeholder="Filtrar por setor..."
            value={filters.sector || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value || undefined }))}
            className="rounded border-gray-300 text-sm"
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilters({})}
          >
            Limpar
          </Button>
        </div>
      </Card>

      {/* Lista de Parcerias */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPartnerships.map((partnership) => {
            const healthScore = calculateHealthScore(partnership);
            const nextStage = getNextStage(partnership.partnership_stage);
            
            return (
              <Card key={partnership.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Header da parceria */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{partnership.company.name}</h3>
                    <p className="text-sm text-gray-600">{partnership.company.sector}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getStageColor(partnership.partnership_stage)}>
                        {partnership.partnership_stage}
                      </Badge>
                      <Badge variant={partnership.status === 'active' ? 'success' : 'warning'}>
                        {partnership.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      healthScore >= 80 ? 'text-green-600' :
                      healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      Saúde: {healthScore}%
                    </div>
                  </div>
                </div>

                {/* Métricas da parceria */}
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {partnership.activities_count}
                    </div>
                    <div className="text-xs text-gray-600">Atividades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {(partnership.success_metrics as any)?.sessions_completed || 0}
                    </div>
                    <div className="text-xs text-gray-600">Sessões</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {(partnership.success_metrics as any)?.satisfaction_avg?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600">Satisfação</div>
                  </div>
                </div>

                {/* Última atividade */}
                {partnership.last_activity_at && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Última atividade: {' '}
                      <span className="font-medium">
                        {new Date(partnership.last_activity_at).toLocaleDateString('pt-BR')}
                      </span>
                    </p>
                  </div>
                )}

                {/* Próximo milestone */}
                {partnership.next_milestone_date && (
                  <div className="mb-4">
                    <div className={`text-sm p-2 rounded ${
                      new Date(partnership.next_milestone_date) < new Date() 
                        ? 'bg-red-50 text-red-700' 
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      <div className="font-medium">Próximo milestone:</div>
                      <div>{partnership.milestone_description}</div>
                      <div className="text-xs mt-1">
                        {new Date(partnership.next_milestone_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ações */}
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setExpandedPartnership(
                      expandedPartnership === partnership.id ? null : partnership.id
                    )}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Detalhes</span>
                    {expandedPartnership === partnership.id ? 
                      <ChevronUp className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                    }
                  </Button>

                  {nextStage && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => updatePartnershipStage(partnership.id, nextStage)}
                      className="flex items-center space-x-1"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Avançar</span>
                    </Button>
                  )}
                </div>

                {/* Detalhes expandidos */}
                {expandedPartnership === partnership.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Atividades Recentes</h4>
                    <div className="space-y-2">
                      {partnership.recent_activities?.slice(0, 3).map(activity => (
                        <div key={activity.id} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-gray-600">
                            {new Date(activity.scheduled_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      ))}
                      
                      {(partnership.recent_activities?.length || 0) === 0 && (
                        <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
                      )}
                    </div>

                    {partnership.feedback_summary?.stats && (
                      <div className="mt-3">
                        <h4 className="font-medium text-gray-900 mb-2">Resumo de Feedback</h4>
                        <div className="text-sm text-gray-600">
                          <p>{partnership.feedback_summary.stats.total_feedbacks} feedbacks recebidos</p>
                          <p>Satisfação média: {partnership.feedback_summary.stats.avg_overall_satisfaction}/5</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        // Vista em lista
        <div className="space-y-4">
          {filteredPartnerships.map((partnership) => (
            <Card key={partnership.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{partnership.company.name}</h3>
                    <p className="text-sm text-gray-600">{partnership.company.sector}</p>
                  </div>
                  
                  <Badge className={getStageColor(partnership.partnership_stage)}>
                    {partnership.partnership_stage}
                  </Badge>
                  
                  <div className="text-sm text-gray-600">
                    {partnership.activities_count} atividades
                  </div>
                  
                  <div className={`text-sm font-medium ${
                    calculateHealthScore(partnership) >= 80 ? 'text-green-600' :
                    calculateHealthScore(partnership) >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Saúde: {calculateHealthScore(partnership)}%
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="sm">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredPartnerships.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma parceria encontrada
          </h3>
          <p className="text-gray-600">
            Não há parcerias que atendam aos filtros aplicados.
          </p>
        </Card>
      )}
    </div>
  );
}