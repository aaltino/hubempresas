// Serviço para operações com Questionários
// Comunicação com Edge Functions e banco de dados

import { supabase } from '@/lib/supabase';
import type {
  QuestionnaireTemplate,
  QuestionnaireResponse,
  QuestionnaireResponses,
  QuestionnaireScoreResult,
  ActionPlan,
  SaveResponseRequest,
  CalculateScoreRequest
} from '../types/questionnaire';

export class QuestionnaireService {
  // Buscar templates de questionários ativos
  static async getActiveTemplates(): Promise<QuestionnaireTemplate[]> {
    const { data, error } = await supabase
      .from('questionnaire_templates')
      .select('*')
      .eq('is_active', true)
      .order('program_key', { ascending: true });

    if (error) throw new Error(`Erro ao buscar templates: ${error.message}`);
    return data || [];
  }

  // Buscar template específico por programa
  static async getTemplateByProgram(programKey: string): Promise<QuestionnaireTemplate | null> {
    const { data, error } = await supabase
      .from('questionnaire_templates')
      .select('*')
      .eq('program_key', programKey)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Erro ao buscar template:', error);
      return null;
    }
    return data;
  }

  // Buscar respostas de questionário de uma empresa
  static async getCompanyResponses(companyId: string): Promise<QuestionnaireResponse[]> {
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar respostas: ${error.message}`);
    return data || [];
  }

  // Buscar resposta específica (em andamento ou última)
  static async getLatestResponse(
    companyId: string, 
    programKey?: string
  ): Promise<QuestionnaireResponse | null> {
    let query = supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('company_id', companyId);

    if (programKey) {
      query = query.eq('program_key', programKey);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar última resposta:', error);
      return null;
    }
    return data;
  }

  // Salvar respostas (auto-save) via Edge Function
  static async saveResponses(request: SaveResponseRequest): Promise<{
    response_id: string;
    progress_percent: number;
    answered_count: number;
    total_questions: number;
  }> {
    const { data, error } = await supabase.functions.invoke('save-questionnaire-response', {
      body: request
    });

    if (error) throw new Error(`Erro ao salvar respostas: ${error.message}`);
    return data.data;
  }

  // Calcular score via Edge Function
  static async calculateScore(request: CalculateScoreRequest): Promise<QuestionnaireScoreResult> {
    const { data, error } = await supabase.functions.invoke('calculate-questionnaire-score', {
      body: request
    });

    if (error) throw new Error(`Erro ao calcular score: ${error.message}`);
    return data.data;
  }

  // Buscar plano de ação de uma resposta
  static async getActionPlans(companyId: string, programKey?: string): Promise<ActionPlan[]> {
    let query = supabase
      .from('action_plans')
      .select('*')
      .eq('company_id', companyId)
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true });

    if (programKey) {
      query = query.eq('program_key', programKey);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Erro ao buscar action plans: ${error.message}`);
    return data || [];
  }

  // Atualizar status de action plan
  static async updateActionPlanStatus(
    actionPlanId: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<void> {
    const { error } = await supabase
      .from('action_plans')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', actionPlanId);

    if (error) throw new Error(`Erro ao atualizar action plan: ${error.message}`);
  }

  // Criar novo questionário para empresa
  static async startQuestionnaire(
    companyId: string,
    templateId: string
  ): Promise<QuestionnaireResponse> {
    const { data: template } = await supabase
      .from('questionnaire_templates')
      .select('program_key, blocks')
      .eq('id', templateId)
      .single();

    if (!template) throw new Error('Template não encontrado');

    const totalSteps = template.blocks.blocks?.length || 1;

    const { data, error } = await supabase
      .from('questionnaire_responses')
      .insert({
        company_id: companyId,
        template_id: templateId,
        program_key: template.program_key,
        current_step: 1,
        total_steps: totalSteps,
        responses: {},
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar questionário: ${error.message}`);
    return data;
  }

  // Buscar histórico de evolução de scores
  static async getScoreHistory(companyId: string): Promise<Array<{
    program_key: string;
    total_score: number;
    completed_at: string;
  }>> {
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select('program_key, total_score, completed_at')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .not('total_score', 'is', null)
      .order('completed_at', { ascending: true });

    if (error) throw new Error(`Erro ao buscar histórico: ${error.message}`);
    return data || [];
  }

  // Estatísticas gerais de questionários (para dashboard gestor)
  static async getQuestionnaireStatistics(): Promise<{
    total_responses: number;
    completed_responses: number;
    average_score: number;
    completion_rate: number;
  }> {
    const { count: totalCount } = await supabase
      .from('questionnaire_responses')
      .select('*', { count: 'exact', head: true });

    const { count: completedCount } = await supabase
      .from('questionnaire_responses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { data: scores } = await supabase
      .from('questionnaire_responses')
      .select('total_score')
      .eq('status', 'completed')
      .not('total_score', 'is', null);

    const averageScore = scores && scores.length > 0
      ? scores.reduce((sum, r) => sum + (r.total_score || 0), 0) / scores.length
      : 0;

    return {
      total_responses: totalCount || 0,
      completed_responses: completedCount || 0,
      average_score: Math.round(averageScore * 100) / 100,
      completion_rate: totalCount ? Math.round((completedCount / totalCount) * 100) : 0
    };
  }
}
