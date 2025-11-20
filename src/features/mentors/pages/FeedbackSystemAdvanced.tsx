// Sistema de Feedback Avançado - Fase 3
// Feedback estruturado bidirecional após sessões de mentoria

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { 
  MessageSquare, Star, TrendingUp, CheckCircle, Clock, Plus,
  User, Building2, Calendar, Target, FileText, Award,
  Edit, Send, Filter, BarChart3
} from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/ui/Badge';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface FeedbackItem {
  id: string;
  activity_id: string;
  mentorship_id: string;
  feedback_from: string;
  feedback_to: string;
  session_quality_rating?: number;
  mentor_preparation_rating?: number;
  startup_engagement_rating?: number;
  goals_achievement_rating?: number;
  overall_satisfaction_rating?: number;
  what_went_well?: string;
  areas_for_improvement?: string;
  specific_suggestions?: string;
  next_session_goals?: string;
  additional_comments?: string;
  action_items?: any[];
  follow_up_required?: boolean;
  follow_up_date?: string;
  created_at: string;
  activity?: {
    title: string;
    scheduled_at: string;
  };
  feedback_from_profile?: {
    full_name: string;
  };
  feedback_to_profile?: {
    full_name: string;
  };
}

interface NewFeedbackData {
  activity_id: string;
  mentorship_id: string;
  feedback_to: string;
  session_quality_rating: number;
  mentor_preparation_rating: number;
  startup_engagement_rating: number;
  goals_achievement_rating: number;
  overall_satisfaction_rating: number;
  what_went_well: string;
  areas_for_improvement: string;
  specific_suggestions: string;
  next_session_goals: string;
  additional_comments: string;
  action_items: any[];
  follow_up_required: boolean;
  follow_up_date: string;
}

export default function FeedbackSystemAdvanced() {
  const { profile } = useAuth();
  const { addToast } = useToast();

  // Estados principais
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFeedbackModal, setShowNewFeedbackModal] = useState(false);
  const [availableActivities, setAvailableActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    type: 'all', // 'sent', 'received', 'all'
    rating: 0,   // mínimo
    mentorship_id: ''
  });

  // Estados de estatísticas
  const [stats, setStats] = useState({
    total_feedbacks: 0,
    avg_rating: 0,
    pending_feedback: 0,
    follow_ups_pending: 0
  });

  // Formulário novo feedback
  const [newFeedback, setNewFeedback] = useState<NewFeedbackData>({
    activity_id: '',
    mentorship_id: '',
    feedback_to: '',
    session_quality_rating: 5,
    mentor_preparation_rating: 5,
    startup_engagement_rating: 5,
    goals_achievement_rating: 5,
    overall_satisfaction_rating: 5,
    what_went_well: '',
    areas_for_improvement: '',
    specific_suggestions: '',
    next_session_goals: '',
    additional_comments: '',
    action_items: [],
    follow_up_required: false,
    follow_up_date: ''
  });

  useEffect(() => {
    loadFeedbackData();
    loadAvailableActivities();
  }, [filters]);

  // Carregar dados de feedback
  const loadFeedbackData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('mentorship_feedback')
        .select(`
          *,
          activity:mentorship_activities(title, scheduled_at),
          feedback_from_profile:profiles!mentorship_feedback_feedback_from_fkey(full_name),
          feedback_to_profile:profiles!mentorship_feedback_feedback_to_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.type === 'sent') {
        query = query.eq('feedback_from', profile.id);
      } else if (filters.type === 'received') {
        query = query.eq('feedback_to', profile.id);
      } else {
        // 'all' - feedback que o usuário enviou ou recebeu
        query = query.or(`feedback_from.eq.${profile.id},feedback_to.eq.${profile.id}`);
      }

      if (filters.rating > 0) {
        query = query.gte('overall_satisfaction_rating', filters.rating);
      }

      if (filters.mentorship_id) {
        query = query.eq('mentorship_id', filters.mentorship_id);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setFeedbacks(data || []);

      // Calcular estatísticas
      const totalFeedbacks = data?.length || 0;
      const avgRating = totalFeedbacks > 0 
        ? data.reduce((acc, f) => acc + (f.overall_satisfaction_rating || 0), 0) / totalFeedbacks
        : 0;
      
      const pendingFollowUps = data?.filter(f => 
        f.follow_up_required && 
        (!f.follow_up_date || new Date(f.follow_up_date) <= new Date())
      ).length || 0;

      setStats({
        total_feedbacks: totalFeedbacks,
        avg_rating: avgRating,
        pending_feedback: 0, // Calculado separadamente se necessário
        follow_ups_pending: pendingFollowUps
      });

    } catch (error) {
      console.error('Erro ao carregar feedback:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível carregar os feedbacks'
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar atividades disponíveis para feedback
  const loadAvailableActivities = async () => {
    try {
      // Buscar atividades concluídas sem feedback ainda
      const { data: activities } = await supabase
        .from('mentorship_activities_detailed')
        .select('*')
        .eq('mentor_id', profile.id)
        .eq('status', 'completed')
        .lt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: false })
        .limit(20);

      if (activities) {
        // Filtrar atividades que ainda não têm feedback deste usuário
        const activitiesWithoutFeedback = [];
        
        for (const activity of activities) {
          const { data: existingFeedback } = await supabase
            .from('mentorship_feedback')
            .select('id')
            .eq('activity_id', activity.id)
            .eq('feedback_from', profile.id);

          if (!existingFeedback || existingFeedback.length === 0) {
            activitiesWithoutFeedback.push(activity);
          }
        }

        setAvailableActivities(activitiesWithoutFeedback);
      }

    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    }
  };

  // Submeter novo feedback
  const submitFeedback = async () => {
    try {
      if (!newFeedback.activity_id || !newFeedback.feedback_to) {
        addToast({
          type: 'error',
          title: 'Dados incompletos',
          description: 'Selecione uma atividade e destinatário'
        });
        return;
      }

      const response = await supabase.functions.invoke('mentorship-feedback-processor', {
        body: {
          action: 'submit_feedback',
          ...newFeedback,
          feedback_from: profile.id
        }
      });

      if (response.data?.success) {
        addToast({
          type: 'success',
          title: 'Feedback enviado',
          description: response.data.message
        });

        // Resetar formulário
        setNewFeedback({
          activity_id: '',
          mentorship_id: '',
          feedback_to: '',
          session_quality_rating: 5,
          mentor_preparation_rating: 5,
          startup_engagement_rating: 5,
          goals_achievement_rating: 5,
          overall_satisfaction_rating: 5,
          what_went_well: '',
          areas_for_improvement: '',
          specific_suggestions: '',
          next_session_goals: '',
          additional_comments: '',
          action_items: [],
          follow_up_required: false,
          follow_up_date: ''
        });

        setShowNewFeedbackModal(false);
        setSelectedActivity(null);

        // Recarregar dados
        await loadFeedbackData();
        await loadAvailableActivities();

      } else {
        throw new Error(response.data?.message || 'Erro ao enviar feedback');
      }

    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível enviar o feedback'
      });
    }
  };

  // Adicionar action item
  const addActionItem = () => {
    setNewFeedback(prev => ({
      ...prev,
      action_items: [
        ...prev.action_items,
        {
          task: '',
          owner: '',
          deadline: '',
          status: 'pending'
        }
      ]
    }));
  };

  // Atualizar action item
  const updateActionItem = (index: number, field: string, value: string) => {
    setNewFeedback(prev => ({
      ...prev,
      action_items: prev.action_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Remover action item
  const removeActionItem = (index: number) => {
    setNewFeedback(prev => ({
      ...prev,
      action_items: prev.action_items.filter((_, i) => i !== index)
    }));
  };

  // Render star rating
  const renderStarRating = (rating: number, onClick?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-5 h-5 cursor-pointer ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
            onClick={() => onClick && onClick(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Mentor', href: '/mentor/dashboard' },
          { label: 'Feedback', href: '/mentor/feedback' }
        ]} />
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-8 h-8 mr-3 text-purple-500" />
              Sistema de Feedback Avançado
            </h1>
            <p className="text-gray-600 mt-1">
              Feedback estruturado e acompanhamento de mentorias
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowNewFeedbackModal(true)}
            disabled={availableActivities.length === 0}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Feedback</span>
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Feedbacks</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total_feedbacks}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.avg_rating.toFixed(1)}/5</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Atividades Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{availableActivities.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Follow-ups</p>
              <p className="text-2xl font-bold text-red-600">{stats.follow_ups_pending}</p>
            </div>
            <Target className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>

          <select 
            value={filters.type} 
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="rounded border-gray-300 text-sm"
          >
            <option value="all">Todos</option>
            <option value="sent">Enviados</option>
            <option value="received">Recebidos</option>
          </select>

          <select 
            value={filters.rating} 
            onChange={(e) => setFilters(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
            className="rounded border-gray-300 text-sm"
          >
            <option value="0">Todas avaliações</option>
            <option value="4">4+ estrelas</option>
            <option value="3">3+ estrelas</option>
            <option value="2">2+ estrelas</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilters({ type: 'all', rating: 0, mentorship_id: '' })}
          >
            Limpar
          </Button>
        </div>
      </Card>

      {/* Lista de Feedbacks */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : feedbacks.length > 0 ? (
        <div className="space-y-6">
          {feedbacks.map(feedback => (
            <Card key={feedback.id} className="p-6">
              {/* Header do feedback */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {feedback.activity?.title || 'Feedback de Sessão'}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      De: {feedback.feedback_from_profile?.full_name}
                    </span>
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Para: {feedback.feedback_to_profile?.full_name}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={feedback.overall_satisfaction_rating >= 4 ? 'success' : 
                                  feedback.overall_satisfaction_rating >= 3 ? 'warning' : 'error'}>
                    {feedback.overall_satisfaction_rating}/5
                  </Badge>
                  {feedback.follow_up_required && (
                    <Badge variant="info">Follow-up</Badge>
                  )}
                </div>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Qualidade da Sessão</div>
                  {renderStarRating(feedback.session_quality_rating || 0)}
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Preparação do Mentor</div>
                  {renderStarRating(feedback.mentor_preparation_rating || 0)}
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Engajamento Startup</div>
                  {renderStarRating(feedback.startup_engagement_rating || 0)}
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Objetivos Alcançados</div>
                  {renderStarRating(feedback.goals_achievement_rating || 0)}
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Satisfação Geral</div>
                  {renderStarRating(feedback.overall_satisfaction_rating || 0)}
                </div>
              </div>

              {/* Feedback qualitativo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feedback.what_went_well && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">O que funcionou bem:</h4>
                    <p className="text-gray-700 text-sm bg-green-50 p-3 rounded-lg">
                      {feedback.what_went_well}
                    </p>
                  </div>
                )}

                {feedback.areas_for_improvement && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Áreas para melhoria:</h4>
                    <p className="text-gray-700 text-sm bg-yellow-50 p-3 rounded-lg">
                      {feedback.areas_for_improvement}
                    </p>
                  </div>
                )}

                {feedback.specific_suggestions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sugestões específicas:</h4>
                    <p className="text-gray-700 text-sm bg-blue-50 p-3 rounded-lg">
                      {feedback.specific_suggestions}
                    </p>
                  </div>
                )}

                {feedback.next_session_goals && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Objetivos próxima sessão:</h4>
                    <p className="text-gray-700 text-sm bg-purple-50 p-3 rounded-lg">
                      {feedback.next_session_goals}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Items */}
              {feedback.action_items && feedback.action_items.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Action Items:</h4>
                  <div className="space-y-2">
                    {feedback.action_items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{item.task}</div>
                          <div className="text-xs text-gray-600">
                            Responsável: {item.owner} | Prazo: {item.deadline}
                          </div>
                        </div>
                        <Badge variant={item.status === 'completed' ? 'success' : 'warning'}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up */}
              {feedback.follow_up_required && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center text-orange-800">
                    <Target className="w-4 h-4 mr-2" />
                    <span className="font-medium">Follow-up necessário</span>
                  </div>
                  {feedback.follow_up_date && (
                    <p className="text-sm text-orange-700 mt-1">
                      Data prevista: {new Date(feedback.follow_up_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum feedback encontrado
          </h3>
          <p className="text-gray-600">
            Não há feedbacks que atendam aos filtros aplicados.
          </p>
        </Card>
      )}

      {/* Modal Novo Feedback */}
      {showNewFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Enviar Novo Feedback
            </h3>
            
            {/* Seleção de atividade */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Atividade *
              </label>
              <select
                value={newFeedback.activity_id}
                onChange={(e) => {
                  const activity = availableActivities.find(a => a.id === e.target.value);
                  setNewFeedback(prev => ({
                    ...prev,
                    activity_id: e.target.value,
                    mentorship_id: activity?.mentorship_id || '',
                    feedback_to: activity?.company.profile_id || ''
                  }));
                  setSelectedActivity(activity);
                }}
                className="w-full rounded-md border-gray-300"
              >
                <option value="">Selecione uma atividade</option>
                {availableActivities.map(activity => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title} - {activity.company_name} ({new Date(activity.scheduled_at).toLocaleDateString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>

            {selectedActivity && (
              <>
                {/* Avaliações */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">Avaliações (1-5 estrelas)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Qualidade da Sessão</label>
                      {renderStarRating(newFeedback.session_quality_rating, (rating) =>
                        setNewFeedback(prev => ({ ...prev, session_quality_rating: rating }))
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Preparação do Mentor</label>
                      {renderStarRating(newFeedback.mentor_preparation_rating, (rating) =>
                        setNewFeedback(prev => ({ ...prev, mentor_preparation_rating: rating }))
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Engajamento da Startup</label>
                      {renderStarRating(newFeedback.startup_engagement_rating, (rating) =>
                        setNewFeedback(prev => ({ ...prev, startup_engagement_rating: rating }))
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Objetivos Alcançados</label>
                      {renderStarRating(newFeedback.goals_achievement_rating, (rating) =>
                        setNewFeedback(prev => ({ ...prev, goals_achievement_rating: rating }))
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm text-gray-700 mb-2">Satisfação Geral</label>
                    {renderStarRating(newFeedback.overall_satisfaction_rating, (rating) =>
                      setNewFeedback(prev => ({ ...prev, overall_satisfaction_rating: rating }))
                    )}
                  </div>
                </div>

                {/* Feedback qualitativo */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">Feedback Qualitativo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">O que funcionou bem</label>
                      <textarea
                        value={newFeedback.what_went_well}
                        onChange={(e) => setNewFeedback(prev => ({ ...prev, what_went_well: e.target.value }))}
                        className="w-full rounded-md border-gray-300"
                        rows={3}
                        placeholder="Descreva os pontos positivos da sessão..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Áreas para melhoria</label>
                      <textarea
                        value={newFeedback.areas_for_improvement}
                        onChange={(e) => setNewFeedback(prev => ({ ...prev, areas_for_improvement: e.target.value }))}
                        className="w-full rounded-md border-gray-300"
                        rows={3}
                        placeholder="Identifique áreas que podem ser melhoradas..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Sugestões específicas</label>
                      <textarea
                        value={newFeedback.specific_suggestions}
                        onChange={(e) => setNewFeedback(prev => ({ ...prev, specific_suggestions: e.target.value }))}
                        className="w-full rounded-md border-gray-300"
                        rows={3}
                        placeholder="Ofereça sugestões concretas..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Objetivos próxima sessão</label>
                      <textarea
                        value={newFeedback.next_session_goals}
                        onChange={(e) => setNewFeedback(prev => ({ ...prev, next_session_goals: e.target.value }))}
                        className="w-full rounded-md border-gray-300"
                        rows={3}
                        placeholder="Defina objetivos para a próxima reunião..."
                      />
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Action Items</h4>
                    <Button variant="secondary" size="sm" onClick={addActionItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {newFeedback.action_items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="text"
                        placeholder="Tarefa"
                        value={item.task}
                        onChange={(e) => updateActionItem(index, 'task', e.target.value)}
                        className="rounded-md border-gray-300 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Responsável"
                        value={item.owner}
                        onChange={(e) => updateActionItem(index, 'owner', e.target.value)}
                        className="rounded-md border-gray-300 text-sm"
                      />
                      <input
                        type="date"
                        value={item.deadline}
                        onChange={(e) => updateActionItem(index, 'deadline', e.target.value)}
                        className="rounded-md border-gray-300 text-sm"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => removeActionItem(index)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Follow-up */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="follow-up"
                      checked={newFeedback.follow_up_required}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, follow_up_required: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="follow-up" className="text-sm font-medium text-gray-700">
                      Requer follow-up
                    </label>
                  </div>
                  
                  {newFeedback.follow_up_required && (
                    <div className="mt-3">
                      <label className="block text-sm text-gray-700 mb-2">Data do follow-up</label>
                      <input
                        type="date"
                        value={newFeedback.follow_up_date}
                        onChange={(e) => setNewFeedback(prev => ({ ...prev, follow_up_date: e.target.value }))}
                        className="rounded-md border-gray-300"
                      />
                    </div>
                  )}
                </div>

                {/* Comentários adicionais */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentários adicionais
                  </label>
                  <textarea
                    value={newFeedback.additional_comments}
                    onChange={(e) => setNewFeedback(prev => ({ ...prev, additional_comments: e.target.value }))}
                    className="w-full rounded-md border-gray-300"
                    rows={4}
                    placeholder="Qualquer informação adicional relevante..."
                  />
                </div>
              </>
            )}

            {/* Ações */}
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewFeedbackModal(false);
                  setSelectedActivity(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={submitFeedback}
                disabled={!selectedActivity}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Feedback</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}