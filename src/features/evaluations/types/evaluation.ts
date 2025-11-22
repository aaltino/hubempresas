// Tipos específicos da feature evaluations
export interface EvaluationScore {
  mercado_score: number;
  perfil_empreendedor_score: number;
  tecnologia_qualidade_score: number;
  gestao_score: number;
  financeiro_score: number;
}

export interface Rubric {
  [score: string]: string; // "0": "Description for 0", "10": "Description for 10"
}

export interface Criterion {
  id: string;
  name: string;
  weight: number;
  max_score: number;
  description?: string;
  rubric?: Rubric;
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
  ai_feedback?: string;
  checkpoint?: string;
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