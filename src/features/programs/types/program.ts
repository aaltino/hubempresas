// Tipos específicos da feature programs
export interface ProgramData {
  id: string;
  name: string;
  key: string;
  label: string;
  description?: string;
  duration_weeks?: number;
  max_companies?: number;
  is_active: boolean;
  created_at: string;
}

// Program flow stages
export interface ProgramStage {
  id: string;
  program_key: string;
  stage_order: number;
  stage_name: string;
  stage_description?: string;
  requirements: string[];
  deliverables: DeliverableDefinition[];
}

export interface DeliverableDefinition {
  id: string;
  name: string;
  description: string;
  due_date_offset_days: number;
  is_required: boolean;
}

// Configuração de elegibilidade
export interface EligibilityConfig {
  program_key: string;
  min_weighted_score: number;
  required_evaluations_count: number;
  min_dimension_scores: {
    mercado_score: number;
    perfil_empreendedor_score: number;
    tecnologia_qualidade_score: number;
    gestao_score: number;
    financeiro_score: number;
  };
}

// Programa labels (localização)
export const PROGRAM_LABELS: Record<string, string> = {
  hotel_de_projetos: 'Hotel de Projetos',
  pre_residencia: 'Pré-Residência',
  residencia: 'Residência'
} as const;