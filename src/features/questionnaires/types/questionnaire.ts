// Tipos TypeScript para Sistema de Questionários
// Conforme PRD v1.1 e migration aplicada

export interface QuestionnaireQuestion {
  id: string;
  text: string;
  type: 'scale'; // 0=Não, 1=Parcial, 2=Sim
}

export interface QuestionnaireBlock {
  name: string;
  weight: number; // 0-1 (ex: 0.25 = 25%)
  questions: QuestionnaireQuestion[];
}

export interface QuestionnaireScoringRules {
  scale: string; // "0=Não, 1=Parcial, 2=Sim"
  max_score_per_question: number; // 2
}

export interface QuestionnaireTemplate {
  id: string;
  program_key: 'hotel_de_projetos' | 'pre_residencia' | 'residencia';
  version: string;
  title: string;
  blocks: {
    blocks: QuestionnaireBlock[];
  };
  scoring_rules: QuestionnaireScoringRules;
  pass_threshold: number; // 0.70, 0.75, 0.80
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireResponses {
  [questionId: string]: number; // 0, 1, or 2
}

export interface QuestionnaireBlockScores {
  [blockName: string]: number; // 0-100
}

export interface QuestionnaireResponse {
  id: string;
  company_id: string;
  template_id: string;
  program_key: string;
  current_step: number;
  total_steps: number;
  responses: QuestionnaireResponses;
  block_scores?: QuestionnaireBlockScores;
  total_score?: number; // 0-100
  status: 'draft' | 'in_progress' | 'completed';
  started_at: string;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ActionPlan {
  id: string;
  response_id?: string;
  company_id: string;
  program_key: string;
  priority: 'high' | 'medium' | 'low';
  category: 'question' | 'deliverable' | 'mentorship';
  item_reference: string;
  action_description: string;
  estimated_effort_hours?: number;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireGap {
  block: string;
  score: number;
  weight: number;
}

export interface QuestionnaireScoreResult {
  block_scores: QuestionnaireBlockScores;
  weighted_score: number;
  pass_threshold: number;
  is_passed: boolean;
  gaps: QuestionnaireGap[];
  action_plan: ActionPlan[];
  completion_rate: number;
}

// Tipos para API Requests
export interface SaveResponseRequest {
  company_id: string;
  template_id: string;
  responses: QuestionnaireResponses;
  current_step?: number;
  response_id?: string;
}

export interface CalculateScoreRequest {
  response_id: string;
  company_id: string;
  template_id: string;
  responses: QuestionnaireResponses;
  current_step?: number;
}

// Labels amigáveis
export const PROGRAM_LABELS: Record<string, string> = {
  hotel_de_projetos: 'Hotel de Projetos',
  pre_residencia: 'Pré-Residência',
  residencia: 'Residência'
};

export const QUESTIONNAIRE_STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  in_progress: 'Em Andamento',
  completed: 'Concluído'
};

export const ACTION_PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa'
};

export const ACTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado'
};

// Cores para badges de status
export const QUESTIONNAIRE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800'
};

export const ACTION_PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};
