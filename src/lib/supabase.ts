import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para as tabelas
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'mentor' | 'company' | 'gestor' | 'startup_owner' | 'startup_member' | 'viewer_executivo';
  avatar_url?: string;
  phone?: string;
  expertise?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Hub {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  colors?: { primary: string; secondary: string };
  created_at: string;
  updated_at: string;
}

export interface HubMember {
  id: string;
  hub_id: string;
  user_id: string;
  role: 'admin' | 'gestor' | 'mentor' | 'startup_owner' | 'startup_member' | 'viewer_executivo';
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  current_program_key: 'hotel_de_projetos' | 'pre_residencia' | 'residencia';
  cohort_id?: string;
  founded_date?: string;
  profile_id?: string;
  logo_url?: string;
  website?: string;
  // Novos campos Fase 2
  sector?: string;
  stage?: 'idea' | 'mvp' | 'traction' | 'growth' | 'scale';
  team_size?: number;
  status?: 'active' | 'paused' | 'completed' | 'archived';
  pitch_deck_url?: string;
  business_model?: string;
  target_market?: string;
  revenue_model?: string;
  investment_stage?: string;
  tags?: string[];
  social_links?: Record<string, string>;
  contact_info?: Record<string, string>;
  metrics?: Record<string, any>;
  hub_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  key: string;
  label: string;
  questionnaire_items_target: number;
  config: {
    required_deliverables: Array<{
      key: string;
      label: string;
      approval_required: boolean;
    }>;
    passage_to_next_program?: {
      weighted_score_min: number;
      dimension_mins: {
        mercado: number;
        perfil_empreendedor: number;
        tecnologia_qualidade: number;
        gestao: number;
        financeiro: number;
      };
      gate_required: boolean;
    };
    maintenance_thresholds?: {
      weighted_score_min: number;
      dimension_mins: {
        mercado: number;
        perfil_empreendedor: number;
        tecnologia_qualidade: number;
        gestao: number;
        financeiro: number;
      };
      gate_required: boolean;
    };
  };
  created_at: string;
}

export interface Evaluation {
  id: string;
  company_id: string;
  mentor_id: string;
  program_key: string;
  mercado_score?: number;
  perfil_empreendedor_score?: number;
  tecnologia_qualidade_score?: number;
  gestao_score?: number;
  financeiro_score?: number;
  weighted_score?: number;
  gate_value?: string;
  evaluation_date: string;
  expires_at: string;
  is_valid: boolean;
  notes?: string;
  // Novos campos Fase 2
  template_id?: string;
  criteria_scores?: Record<string, any>;
  recommendations?: string;
  attachments?: string[];
  evaluation_type?: 'gate' | 'periodic' | 'ad_hoc';
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
}

export interface EvaluationTemplate {
  id: string;
  name: string;
  description: string;
  total_weight: number;
  criteria: {
    id: string;
    name: string;
    weight: number;
    max_score: number;
    description?: string;
    rubric?: { [score: string]: string };
  }[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  badge_key: string;
  label: string;
  description?: string;
  icon?: string;
  badge_type: string;
  category?: string;
  criteria?: Record<string, any>;
  auto_award: boolean;
  is_active: boolean;
  level?: 'bronze' | 'silver' | 'gold' | 'platinum';
  points?: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyBadge {
  id: string;
  company_id: string;
  badge_id: string;
  awarded_at: string;
  awarded_by?: string;
  metadata?: Record<string, any>;
  evidence_url?: string;
  achievement_description?: string;
  created_at: string;
  badge?: Badge;
}

export interface Mentorship {
  id: string;
  mentor_id: string;
  company_id: string;
  status: 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date?: string;
  focus_areas?: string[];
  meeting_frequency?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MentorshipActivity {
  id: string;
  mentorship_id: string;
  activity_type: 'meeting' | 'feedback' | 'milestone' | 'note';
  title: string;
  description?: string;
  scheduled_at?: string;
  completed_at?: string;
  notes?: string;
  attachments?: string[];
  created_by?: string;
  created_at: string;
}

export interface Deliverable {
  id: string;
  company_id: string;
  program_key: string;
  deliverable_key: string;
  deliverable_label: string;
  status: 'a_fazer' | 'em_andamento' | 'em_revisao' | 'aprovado';
  approval_required: boolean;
  approved_by?: string;
  approved_at?: string;
  submission_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Cohort {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  created_at: string;
}

// FASE 3: Tipos para Sistema Mentor-Startup

export interface FeedbackSession {
  id: string;
  mentorship_id: string;
  activity_id?: string;
  rating: number; // 1-5
  feedback_text: string;
  strengths?: string;
  areas_for_improvement?: string;
  action_items?: string[];
  next_session_goals?: string;
  created_by: string;
  feedback_type: 'mentor_to_startup' | 'startup_to_mentor';
  session_date: string;
  created_at: string;
  updated_at: string;
}

export interface MentorRecommendation {
  id: string;
  mentor_id: string;
  company_id: string;
  compatibility_score: number; // 0-100%
  reasoning: Record<string, any>; // JSON com detalhes do score
  focus_area: 'tech' | 'business' | 'marketing' | 'product' | 'legal' | 'finance';
  status: 'pending' | 'accepted' | 'rejected';
  auto_generated: boolean;
  created_at: string;
  expires_at?: string;
}

export interface MentorMetrics {
  id: string;
  mentor_id: string;
  month_year: string; // YYYY-MM format
  active_partnerships: number;
  sessions_conducted: number;
  average_feedback_rating: number;
  startups_graduated: number;
  response_time_hours: number;
  areas_of_impact: string[];
  success_metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
}
