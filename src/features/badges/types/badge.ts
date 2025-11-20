// Tipos TypeScript para Sistema de Badges e Gamificação
// Conforme PRD v1.1 e migration aplicada

export interface BadgeCondition {
  stage?: string;
  score_min?: number;
  all_stages?: boolean;
  canvas_approved?: boolean;
  no_revisions?: boolean;
  completion_time_hours?: number;
  consecutive_questionnaires?: number;
  metric?: string;
  interviews?: number;
  mvp_validated?: boolean;
  growth_months?: number;
}

export interface Badge {
  id: string;
  badge_key: string;
  label: string;
  description: string;
  icon: string; // Emoji ou URL
  badge_type: 'stage_progression' | 'achievement' | 'milestone';
  conditions: BadgeCondition;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface CompanyBadge {
  id: string;
  company_id: string;
  badge_id: string;
  earned_at: string;
  earned_by_event: string; // 'stage_advancement', 'score_achievement', etc
  metadata?: Record<string, any>;
  // Joined data
  badge?: Badge;
}

export interface BadgeEvent {
  id: string;
  company_id: string;
  event_type: string; // 'questionnaire_completed', 'stage_advanced', etc
  event_data: Record<string, any>;
  badges_awarded?: string[]; // Array de badge IDs
  triggered_at: string;
}

// Tipos para API Requests
export interface AwardBadgeRequest {
  company_id: string;
  event_type: string;
  event_data: Record<string, any>;
}

export interface CreateBadgeRequest {
  badge_key: string;
  label: string;
  description: string;
  icon: string;
  badge_type: 'stage_progression' | 'achievement' | 'milestone';
  conditions: BadgeCondition;
}

// Biblioteca de badges padrão (conforme migration)
export const DEFAULT_BADGES = {
  // Progressão de Etapa
  HOTEL_APROVADO: {
    badge_key: 'hotel_aprovado',
    label: 'Hotel de Projetos Aprovado',
    description: 'Completou com sucesso a etapa Hotel de Projetos',
    icon: '🏨',
    badge_type: 'stage_progression' as const
  },
  PRE_RESIDENCIA_APROVADO: {
    badge_key: 'pre_residencia_aprovado',
    label: 'Pré-Residência Aprovado',
    description: 'Completou com sucesso a etapa Pré-Residência',
    icon: '🚀',
    badge_type: 'stage_progression' as const
  },
  RESIDENCIA_APROVADO: {
    badge_key: 'residencia_aprovado',
    label: 'Residência Aprovado',
    description: 'Completou com sucesso a etapa Residência',
    icon: '💼',
    badge_type: 'stage_progression' as const
  },
  GRADUADO_PROGRAMA: {
    badge_key: 'graduado_programa',
    label: 'Graduado do Programa',
    description: 'Completou todas as etapas do programa',
    icon: '👑',
    badge_type: 'stage_progression' as const
  },
  
  // Performance
  SCORE_EXCEPCIONAL: {
    badge_key: 'score_excepcional',
    label: 'Score Excepcional',
    description: 'Atingiu score ≥ 90% em questionário',
    icon: '🎯',
    badge_type: 'achievement' as const
  },
  MESTRE_CANVAS: {
    badge_key: 'mestre_canvas',
    label: 'Mestre do Canvas',
    description: 'Canvas aprovado sem revisões',
    icon: '📊',
    badge_type: 'achievement' as const
  },
  RESPOSTA_RAPIDA: {
    badge_key: 'resposta_rapida',
    label: 'Resposta Rápida',
    description: 'Completou questionário em menos de 24 horas',
    icon: '⚡',
    badge_type: 'achievement' as const
  },
  STREAK_MASTER: {
    badge_key: 'streak_master',
    label: 'Streak Master',
    description: 'Completou 3 questionários consecutivos',
    icon: '🔥',
    badge_type: 'achievement' as const
  },
  
  // Conquistas Específicas
  META_FINANCEIRA: {
    badge_key: 'meta_financeira',
    label: 'Meta Financeira Atingida',
    description: 'Atingiu meta financeira estabelecida',
    icon: '💰',
    badge_type: 'milestone' as const
  },
  VALIDACAO_USUARIOS: {
    badge_key: 'validacao_usuarios',
    label: 'Validação com Usuários',
    description: 'Realizou ≥ 20 entrevistas com usuários',
    icon: '👥',
    badge_type: 'milestone' as const
  },
  MVP_VALIDADO: {
    badge_key: 'mvp_validado',
    label: 'MVP Validado',
    description: 'MVP testado com sucesso',
    icon: '🛠️',
    badge_type: 'milestone' as const
  },
  CRESCIMENTO_SUSTENTAVEL: {
    badge_key: 'crescimento_sustentavel',
    label: 'Crescimento Sustentável',
    description: 'Crescimento mensal consistente por 3 meses',
    icon: '📈',
    badge_type: 'milestone' as const
  }
};

// Labels amigáveis para tipos de badges
export const BADGE_TYPE_LABELS: Record<string, string> = {
  stage_progression: 'Progressão de Etapa',
  achievement: 'Conquista',
  milestone: 'Marco'
};

// Cores para badges de tipos
export const BADGE_TYPE_COLORS: Record<string, string> = {
  stage_progression: 'bg-purple-100 text-purple-800',
  achievement: 'bg-blue-100 text-blue-800',
  milestone: 'bg-green-100 text-green-800'
};

// Tipos de eventos que podem conceder badges
export const BADGE_EVENT_TYPES = {
  QUESTIONNAIRE_COMPLETED: 'questionnaire_completed',
  STAGE_ADVANCED: 'stage_advanced',
  SCORE_EXCEPCIONAL: 'score_excepcional',
  DELIVERABLE_APPROVED: 'deliverable_approved',
  METRIC_TARGET_REACHED: 'metric_target_reached',
  MILESTONE_REACHED: 'milestone_reached'
} as const;

export type BadgeEventType = typeof BADGE_EVENT_TYPES[keyof typeof BADGE_EVENT_TYPES];

// Estatísticas de badges para dashboard
export interface BadgeStatistics {
  total_badges_available: number;
  total_badges_earned: number;
  completion_percentage: number;
  recent_badges: CompanyBadge[];
  badges_by_type: Record<string, number>;
}

// Ranking de badges (para dashboard gestor)
export interface BadgeRanking {
  badge: Badge;
  earned_count: number;
  companies_with_badge: number;
}

// Progress para próximo badge
export interface BadgeProgress {
  badge: Badge;
  progress_percentage: number;
  missing_criteria: string[];
  estimated_completion_date?: string;
}
