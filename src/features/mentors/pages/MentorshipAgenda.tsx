// Agenda de Mentorias Integrada - Fase 3
// Sistema de calendário com agendamento e notificações

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { 
  Calendar, Clock, Plus, Video, MapPin, Users, Bell,
  Edit, Trash2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/ui/Badge';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface MentorshipActivity {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_type: string;
  location?: string;
  meeting_url?: string;
  status: string;
  company_name: string;
  company_sector: string;
  mentor_name: string;
  attendees?: any[];
  mentorship_id: string;
  activity_status: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  type: string;
  activity: MentorshipActivity;
}

interface NewMeetingData {
  mentorship_id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_type: string;
  location: string;
  meeting_url: string;
}

export default function MentorshipAgenda() {
  const { profile } = useAuth();
  const { addToast } = useToast();

  // Estados principais
  const [activities, setActivities] = useState<MentorshipActivity[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estados de modal/formulário
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<MentorshipActivity | null>(null);
  const [mentorships, setMentorships] = useState<any[]>([]);
  
  // Formulário nova reunião
  const [newMeeting, setNewMeeting] = useState<NewMeetingData>({
    mentorship_id: '',
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
    meeting_type: 'regular',
    location: 'Online',
    meeting_url: ''
  });

  useEffect(() => {
    if (profile?.role === 'mentor') {
      loadAgendaData();
      loadMentorships();
    }
  }, [profile, currentDate]);

  // Carregar dados da agenda
  const loadAgendaData = async () => {
    try {
      setLoading(true);

      // Buscar atividades do mês atual
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: activitiesData, error } = await supabase
        .from('mentorship_activities_detailed')
        .select('*')
        .eq('mentor_id', profile.id)
        .gte('scheduled_at', startOfMonth.toISOString())
        .lte('scheduled_at', endOfMonth.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      setActivities(activitiesData || []);

      // Converter para eventos do calendário
      const calendarEvents: CalendarEvent[] = (activitiesData || []).map(activity => {
        const start = new Date(activity.scheduled_at);
        const end = new Date(start.getTime() + activity.duration_minutes * 60000);
        
        return {
          id: activity.id,
          title: activity.title,
          start,
          end,
          status: activity.status,
          type: activity.meeting_type,
          activity
        };
      });

      setEvents(calendarEvents);

    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível carregar a agenda'
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar mentorias ativas para o formulário
  const loadMentorships = async () => {
    try {
      const { data, error } = await supabase
        .from('mentorships')
        .select(`
          *,
          company:companies(name, sector),
          mentor:profiles!mentorships_mentor_id_fkey(full_name)
        `)
        .eq('mentor_id', profile.id)
        .eq('status', 'active');

      if (error) throw error;
      setMentorships(data || []);

    } catch (error) {
      console.error('Erro ao carregar mentorias:', error);
    }
  };

  // Agendar nova reunião
  const scheduleNewMeeting = async () => {
    try {
      if (!newMeeting.mentorship_id || !newMeeting.title || !newMeeting.scheduled_at) {
        addToast({
          type: 'error',
          title: 'Dados incompletos',
          description: 'Preencha todos os campos obrigatórios'
        });
        return;
      }

      const response = await supabase.functions.invoke('mentorship-scheduling', {
        body: {
          action: 'schedule_meeting',
          ...newMeeting,
          created_by: profile.id,
          attendees: []
        }
      });

      if (response.data?.success) {
        addToast({
          type: 'success',
          title: 'Reunião agendada',
          description: response.data.message
        });

        // Limpar formulário e fechar modal
        setNewMeeting({
          mentorship_id: '',
          title: '',
          description: '',
          scheduled_at: '',
          duration_minutes: 60,
          meeting_type: 'regular',
          location: 'Online',
          meeting_url: ''
        });
        setShowNewMeetingModal(false);

        // Recarregar agenda
        await loadAgendaData();

      } else {
        throw new Error(response.data?.message || 'Erro ao agendar reunião');
      }

    } catch (error) {
      console.error('Erro ao agendar reunião:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível agendar a reunião'
      });
    }
  };

  // Reagendar reunião
  const rescheduleActivity = async (activityId: string, newDate: string, reason?: string) => {
    try {
      const response = await supabase.functions.invoke('mentorship-scheduling', {
        body: {
          action: 'reschedule_meeting',
          activity_id: activityId,
          new_scheduled_at: newDate,
          reason
        }
      });

      if (response.data?.success) {
        addToast({
          type: 'success',
          title: 'Reunião reagendada',
          description: response.data.message
        });

        await loadAgendaData();
      } else {
        throw new Error(response.data?.message || 'Erro ao reagendar');
      }

    } catch (error) {
      console.error('Erro ao reagendar:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível reagendar a reunião'
      });
    }
  };

  // Cancelar reunião
  const cancelActivity = async (activityId: string, reason?: string) => {
    try {
      const response = await supabase.functions.invoke('mentorship-scheduling', {
        body: {
          action: 'cancel_meeting',
          activity_id: activityId,
          reason
        }
      });

      if (response.data?.success) {
        addToast({
          type: 'success',
          title: 'Reunião cancelada',
          description: response.data.message
        });

        await loadAgendaData();
      } else {
        throw new Error(response.data?.message || 'Erro ao cancelar');
      }

    } catch (error) {
      console.error('Erro ao cancelar:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível cancelar a reunião'
      });
    }
  };

  // Navegação do calendário
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter ícone do tipo de reunião
  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'kickoff': return '🚀';
      case 'checkpoint': return '📋';
      case 'follow_up': return '📞';
      case 'ad_hoc': return '⚡';
      default: return '💼';
    }
  };

  // Gerar dias do calendário
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dias vazios do início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter(event => 
        event.start.getDate() === day &&
        event.start.getMonth() === month &&
        event.start.getFullYear() === year
      );
      
      days.push({
        date: day,
        fullDate: date,
        events: dayEvents,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Mentor', href: '/mentor/dashboard' },
          { label: 'Agenda', href: '/mentor/agenda' }
        ]} />
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-8 h-8 mr-3 text-blue-500" />
              Agenda de Mentorias
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie reuniões e atividades de mentoria
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowNewMeetingModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Reunião</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calendário Principal */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {/* Header do calendário */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric' 
                }).replace(/^./, str => str.toUpperCase())}
              </h2>
              
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Hoje
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Grid do calendário */}
            <div className="grid grid-cols-7 gap-1">
              {/* Headers dos dias */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50">
                  {day}
                </div>
              ))}

              {/* Dias do calendário */}
              {calendarDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`min-h-[120px] border border-gray-200 p-2 ${
                    day ? 'bg-white hover:bg-gray-50' : 'bg-gray-100'
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        day.isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {day.date}
                        {day.isToday && (
                          <span className="ml-1 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                        )}
                      </div>
                      
                      {/* Eventos do dia */}
                      <div className="space-y-1">
                        {day.events.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded cursor-pointer truncate"
                            style={{
                              backgroundColor: event.status === 'scheduled' ? '#dbeafe' : 
                                             event.status === 'confirmed' ? '#dcfce7' : 
                                             event.status === 'completed' ? '#f3f4f6' : '#fecaca'
                            }}
                            onClick={() => setSelectedActivity(event.activity)}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-gray-600">
                              {event.start.toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        ))}
                        {day.events.length > 2 && (
                          <div className="text-xs text-gray-500 p-1">
                            +{day.events.length - 2} mais
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar com próximos eventos */}
        <div className="space-y-6">
          {/* Próximas Reuniões */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Próximas Reuniões
            </h3>

            {activities
              .filter(activity => new Date(activity.scheduled_at) > new Date())
              .slice(0, 5)
              .map(activity => (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg mb-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedActivity(activity)}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">
                    {getMeetingTypeIcon(activity.meeting_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.company_name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.scheduled_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
            {activities.filter(activity => new Date(activity.scheduled_at) > new Date()).length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma reunião agendada</p>
              </div>
            )}
          </Card>

          {/* Estatísticas rápidas */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estatísticas do Mês
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total de reuniões</span>
                <span className="font-medium">{activities.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Concluídas</span>
                <span className="font-medium text-green-600">
                  {activities.filter(a => a.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Agendadas</span>
                <span className="font-medium text-blue-600">
                  {activities.filter(a => a.status === 'scheduled').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Canceladas</span>
                <span className="font-medium text-red-600">
                  {activities.filter(a => a.status === 'cancelled').length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Nova Reunião */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agendar Nova Reunião
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mentorship
                </label>
                <select
                  value={newMeeting.mentorship_id}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, mentorship_id: e.target.value }))}
                  className="w-full rounded-md border-gray-300"
                >
                  <option value="">Selecione uma mentorship</option>
                  {mentorships.map(mentorship => (
                    <option key={mentorship.id} value={mentorship.id}>
                      {mentorship.company?.name} - {mentorship.company?.sector}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-md border-gray-300"
                  placeholder="Ex: Revisão de Estratégia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data e Hora
                </label>
                <input
                  type="datetime-local"
                  value={newMeeting.scheduled_at}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="w-full rounded-md border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duração (min)
                  </label>
                  <select
                    value={newMeeting.duration_minutes}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                    className="w-full rounded-md border-gray-300"
                  >
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1h 30min</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newMeeting.meeting_type}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, meeting_type: e.target.value }))}
                    className="w-full rounded-md border-gray-300"
                  >
                    <option value="regular">Regular</option>
                    <option value="kickoff">Kickoff</option>
                    <option value="checkpoint">Checkpoint</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="ad_hoc">Ad-hoc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localização
                </label>
                <input
                  type="text"
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-md border-gray-300"
                  placeholder="Online, Escritório, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Reunião (opcional)
                </label>
                <input
                  type="url"
                  value={newMeeting.meeting_url}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, meeting_url: e.target.value }))}
                  className="w-full rounded-md border-gray-300"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-md border-gray-300"
                  rows={3}
                  placeholder="Agenda da reunião, tópicos a discutir..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowNewMeetingModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={scheduleNewMeeting}
                className="flex-1"
              >
                Agendar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes da Atividade */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Detalhes da Reunião
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedActivity.title}</h4>
                <p className="text-gray-600">{selectedActivity.company_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Data e Hora</label>
                  <p className="font-medium">
                    {new Date(selectedActivity.scheduled_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Duração</label>
                  <p className="font-medium">{selectedActivity.duration_minutes} minutos</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(selectedActivity.status)}>
                    {selectedActivity.status}
                  </Badge>
                </div>
              </div>

              {selectedActivity.location && (
                <div>
                  <label className="text-sm text-gray-600">Localização</label>
                  <p className="font-medium">{selectedActivity.location}</p>
                </div>
              )}

              {selectedActivity.description && (
                <div>
                  <label className="text-sm text-gray-600">Descrição</label>
                  <p className="text-gray-900">{selectedActivity.description}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setSelectedActivity(null)}
              >
                Fechar
              </Button>
              
              {selectedActivity.meeting_url && (
                <Button
                  variant="primary"
                  onClick={() => window.open(selectedActivity.meeting_url, '_blank')}
                  className="flex items-center space-x-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Participar</span>
                </Button>
              )}

              {selectedActivity.status === 'scheduled' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const reason = prompt('Motivo do cancelamento (opcional):');
                      if (reason !== null) {
                        cancelActivity(selectedActivity.id, reason);
                        setSelectedActivity(null);
                      }
                    }}
                    className="text-red-600"
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}