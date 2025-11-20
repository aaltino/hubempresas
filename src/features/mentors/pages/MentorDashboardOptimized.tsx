// Dashboard Mentor Otimizado - Fase 3
// Performance <3s, Métricas especializadas, Matching automático, Agenda integrada

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { 
  Calendar, Users, TrendingUp, Star, Bell, MessageSquare, 
  Clock, CheckCircle, AlertCircle, Target, Award, Settings,
  Plus, Filter, ChevronRight, BarChart3, Activity, Zap
} from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Badge } from '@/design-system/ui/Badge';
import { Button } from '@/design-system/ui/Button';
import { DashboardSkeleton } from '@/design-system/feedback/Skeleton';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface MentorMetrics {
  total_mentorships: number;
  active_mentorships: number;
  total_activities: number;
  completed_activities: number;
  upcoming_activities: number;
  avg_satisfaction_rating: number;
  unread_notifications: number;
  next_meeting_date?: string;
}

interface MatchingRecommendation {
  id: string;
  company_id: string;
  compatibility_score: number;
  recommendation_reason: string;
  company_name: string;
  company_sector: string;
  company_stage: string;
  created_at: string;
}

interface MentorshipActivity {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  company_name: string;
  meeting_type: string;
  meeting_url?: string;
  location?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  sent_at: string;
  is_read: boolean;
}

export default function MentorDashboardOptimized() {
  const { profile } = useAuth();
  const { addToast } = useToast();

  // Estados principais
  const [metrics, setMetrics] = useState<MentorMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<MatchingRecommendation[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<MentorshipActivity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtro e paginação
  const [activitiesFilter, setActivitiesFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRecommendationDetails, setShowRecommendationDetails] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === 'mentor') {
      loadDashboardData();
    }
  }, [profile]);

  // Função principal de carregamento otimizada (<3s)
  const loadDashboardData = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);

      // Carregamento paralelo para performance otimizada
      const [
        metricsResponse,
        recommendationsResponse,
        activitiesResponse,
        notificationsResponse
      ] = await Promise.all([
        // 1. Métricas do mentor (view otimizada)
        supabase
          .from('mentor_dashboard_metrics')
          .select('*')
          .eq('mentor_id', profile.id)
          .single(),

        // 2. Recomendações de matching pendentes
        supabase
          .from('mentor_compatibility_ranking')
          .select('*')
          .eq('mentor_id', profile.id)
          .limit(5),

        // 3. Próximas atividades (limitado para performance)
        supabase
          .from('mentorship_activities_detailed')
          .select('*')
          .eq('mentor_id', profile.id)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(10),

        // 4. Notificações recentes não lidas
        supabase.functions.invoke('mentorship-notifications', {
          body: { action: 'get_summary', user_id: profile.id }
        })
      ]);

      // Processar resultados
      if (metricsResponse.data) {
        setMetrics(metricsResponse.data);
      }

      if (recommendationsResponse.data) {
        setRecommendations(recommendationsResponse.data);
      }

      if (activitiesResponse.data) {
        setUpcomingActivities(activitiesResponse.data);
      }

      if (notificationsResponse.data?.success) {
        // Buscar notificações detalhadas
        const notifResponse = await supabase.functions.invoke('mentorship-notifications', {
          body: { action: 'get_notifications', user_id: profile.id }
        });
        
        if (notifResponse.data?.success) {
          setNotifications(notifResponse.data.grouped.unread || []);
        }
      }

      const loadTime = Date.now() - startTime;
      console.log(`Dashboard carregado em ${loadTime}ms`);

      if (loadTime > 3000) {
        addToast({
          type: 'warning',
          title: 'Performance',
          description: 'Dashboard carregou mais lento que o esperado'
        });
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível carregar o dashboard'
      });
    } finally {
      setLoading(false);
    }
  };

  // Processar recomendação de matching
  const handleRecommendation = async (recommendationId: string, action: 'approved' | 'rejected', notes?: string) => {
    try {
      const recommendation = recommendations.find(r => r.id === recommendationId);
      if (!recommendation) return;

      const response = await supabase.functions.invoke('mentor-matching-algorithm', {
        body: {
          action: 'process_recommendation',
          mentor_id: profile.id,
          company_id: recommendation.company_id,
          status: action,
          notes
        }
      });

      if (response.data?.success) {
        addToast({
          type: 'success',
          title: 'Recomendação processada',
          description: `Recomendação ${action === 'approved' ? 'aceita' : 'rejeitada'} com sucesso`
        });

        // Remover da lista
        setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
        
        // Recarregar métricas se aprovada (nova mentorship criada)
        if (action === 'approved') {
          loadDashboardData();
        }
      } else {
        throw new Error(response.data?.message || 'Erro ao processar recomendação');
      }
    } catch (error) {
      console.error('Erro ao processar recomendação:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível processar a recomendação'
      });
    }
  };

  // Marcar notificações como lidas
  const markNotificationsAsRead = async () => {
    try {
      await supabase.functions.invoke('mentorship-notifications', {
        body: {
          action: 'mark_as_read',
          user_id: profile.id
        }
      });

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Erro ao marcar notificações:', error);
    }
  };

  // Agendar nova reunião
  const scheduleNewMeeting = () => {
    addToast({
      type: 'info',
      title: 'Em breve',
      description: 'Funcionalidade de agendamento será implementada em breve'
    });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Dashboard Mentor', href: '/mentor/dashboard' }
        ]} />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Mentor</h1>
            <p className="text-gray-600 mt-1">Gerencie suas mentorias e atividades</p>
          </div>
          
          {/* Ações rápidas */}
          <div className="flex space-x-3">
            <Button 
              variant="secondary" 
              onClick={scheduleNewMeeting}
              className="flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Reunião</span>
            </Button>
            
            <Button 
              variant="primary"
              onClick={() => window.location.href = '/mentor/partnerships'}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Parceria</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mentorias Ativas</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.active_mentorships || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Próximas Reuniões</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics?.upcoming_activities || 0}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfação Média</p>
              <p className="text-2xl font-bold text-yellow-600">
                {metrics?.avg_satisfaction_rating ? `${Number(metrics.avg_satisfaction_rating).toFixed(1)}/5` : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Notificações</p>
              <p className="text-2xl font-bold text-purple-600">
                {notifications.length}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Matching e Atividades */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sistema de Matching Automático */}
          {recommendations.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                  Novas Recomendações de Matching
                </h3>
                <Badge variant="info">{recommendations.length}</Badge>
              </div>
              
              <div className="space-y-4">
                {recommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{rec.company_name}</h4>
                          <Badge variant="success">
                            {rec.compatibility_score}% compatível
                          </Badge>
                          <Badge variant="info">{rec.company_stage}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{rec.company_sector}</p>
                        <p className="text-sm text-gray-700 mt-2">{rec.recommendation_reason}</p>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRecommendation(rec.id, 'rejected')}
                        >
                          Rejeitar
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRecommendation(rec.id, 'approved')}
                        >
                          Aceitar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Agenda de Próximas Atividades */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                Próximas Reuniões
              </h3>
              {upcomingActivities.length > 0 && (
                <Button variant="secondary" size="sm">
                  Ver todas
                </Button>
              )}
            </div>

            {upcomingActivities.length > 0 ? (
              <div className="space-y-3">
                {upcomingActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{activity.company_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.scheduled_at).toLocaleString('pt-BR')} • 
                        {activity.duration_minutes}min
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      {activity.meeting_url && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(activity.meeting_url, '_blank')}
                        >
                          Participar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma reunião agendada</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={scheduleNewMeeting}
                  className="mt-2"
                >
                  Agendar reunião
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Notificações e Stats */}
        <div className="space-y-6">
          
          {/* Centro de Notificações */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-purple-500" />
                Notificações
              </h3>
              {notifications.length > 0 && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={markNotificationsAsRead}
                >
                  Marcar como lidas
                </Button>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="p-3 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.sent_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            )}
          </Card>

          {/* Estatísticas de Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-500" />
              Performance
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Atividades Concluídas</span>
                  <span>{metrics?.completed_activities || 0}/{metrics?.total_activities || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: metrics?.total_activities 
                        ? `${((metrics?.completed_activities || 0) / metrics.total_activities) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Satisfação Média</span>
                  <span>{metrics?.avg_satisfaction_rating ? Number(metrics.avg_satisfaction_rating).toFixed(1) : '0'}/5</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (metrics?.avg_satisfaction_rating || 0) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Links Rápidos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Links Rápidos</h3>
            
            <div className="space-y-2">
              <Button 
                variant="secondary" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/mentor/partnerships'}
              >
                <Users className="w-4 h-4 mr-3" />
                Gerenciar Parcerias
              </Button>
              
              <Button 
                variant="secondary" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/avaliacoes'}
              >
                <CheckCircle className="w-4 h-4 mr-3" />
                Avaliações
              </Button>
              
              <Button 
                variant="secondary" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/badges'}
              >
                <Award className="w-4 h-4 mr-3" />
                Badges
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}