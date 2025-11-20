// Tipos específicos da feature evaluations
export interface EvaluationScore {
  mercado_score: number;
  perfil_empreendedor_score: number;
  tecnologia_qualidade_score: number;
  gestao_score: number;
  financeiro_score: number;
}

export interface EvaluationData {
  id: string;
  company_id: string;
  mentor_id: string;
  program_key: string;
  evaluation_date: string;
  weighted_score?: number;
  gate_value?: string;
  notes?: string;
  is_valid: boolean;
}

// Dimensões de avaliação
export type EvaluationDimension = keyof EvaluationScore;

// Gate options
export const GATE_OPTIONS = [
  'Maduro para tornar-se empresa',
  'Avaliável positivamente',
  'Necessita melhorias (não bloqueia)',
  'Muitas falhas / Total falta de amadurecimento (bloqueia)'
] as const;

export type GateOption = typeof GATE_OPTIONS[number];