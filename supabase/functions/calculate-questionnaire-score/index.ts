// Edge Function: Calcular Score de Questionário Automaticamente
// Descrição: Processa respostas e calcula scores por bloco + score final ponderado
// Gera plano de ação automático baseado nos gaps identificados

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

interface QuestionnaireBlock {
  name: string;
  weight: number;
  questions: Array<{
    id: string;
    text: string;
    type: string;
  }>;
}

interface QuestionnaireTemplate {
  id: string;
  program_key: string;
  title: string;
  blocks: { blocks: QuestionnaireBlock[] };
  scoring_rules: { scale: string; max_score_per_question: number };
  pass_threshold: number;
}

interface ScoringRequest {
  response_id: string;
  company_id: string;
  template_id: string;
  responses: Record<string, number>; // {question_id: answer (0, 1, or 2)}
  current_step?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: ScoringRequest = await req.json();
    const { response_id, company_id, template_id, responses, current_step } = requestData;

    // 1. Buscar template do questionário
    const { data: template, error: templateError } = await supabaseClient
      .from('questionnaire_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateError?.message}`);
    }

    const templateData = template as QuestionnaireTemplate;
    const blocks = templateData.blocks.blocks;
    const maxScorePerQuestion = templateData.scoring_rules.max_score_per_question;

    // 2. Calcular score por bloco
    const blockScores: Record<string, number> = {};
    
    blocks.forEach((block) => {
      const blockQuestions = block.questions;
      let blockTotal = 0;
      let answeredQuestions = 0;

      blockQuestions.forEach((question) => {
        const answer = responses[question.id];
        if (answer !== undefined && answer !== null) {
          blockTotal += answer;
          answeredQuestions++;
        }
      });

      // Score do bloco: (total / maxPossível) * 100
      const maxPossible = blockQuestions.length * maxScorePerQuestion;
      const blockScore = maxPossible > 0 ? (blockTotal / maxPossible) * 100 : 0;
      blockScores[block.name] = Math.round(blockScore * 100) / 100; // 2 decimais
    });

    // 3. Calcular score ponderado final
    let weightedScore = 0;
    blocks.forEach((block) => {
      const blockScore = blockScores[block.name] || 0;
      weightedScore += blockScore * block.weight;
    });
    weightedScore = Math.round(weightedScore * 100) / 100;

    // 4. Verificar se passou no threshold
    const passThreshold = templateData.pass_threshold * 100; // Converter para 0-100
    const isPassed = weightedScore >= passThreshold;

    // 5. Identificar gaps (blocos com score < 70%)
    const gaps: Array<{ block: string; score: number; weight: number }> = [];
    blocks.forEach((block) => {
      const blockScore = blockScores[block.name] || 0;
      if (blockScore < 70) {
        gaps.push({
          block: block.name,
          score: blockScore,
          weight: block.weight
        });
      }
    });

    // 6. Gerar plano de ação (se questionário completo)
    const totalQuestions = blocks.reduce((sum, block) => sum + block.questions.length, 0);
    const answeredCount = Object.keys(responses).length;
    const isComplete = answeredCount >= totalQuestions;

    let actionPlan: Array<any> = [];
    if (isComplete && gaps.length > 0) {
      actionPlan = generateActionPlan(gaps, blocks, responses, company_id, templateData.program_key);
    }

    // 7. Atualizar questionnaire_responses
    const { error: updateError } = await supabaseClient
      .from('questionnaire_responses')
      .update({
        block_scores: blockScores,
        total_score: weightedScore,
        status: isComplete ? 'completed' : 'in_progress',
        completed_at: isComplete ? new Date().toISOString() : null,
        expires_at: isComplete ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', response_id);

    if (updateError) {
      throw new Error(`Failed to update response: ${updateError.message}`);
    }

    // 8. Salvar action plans se houver
    if (actionPlan.length > 0) {
      const { error: actionError } = await supabaseClient
        .from('action_plans')
        .insert(actionPlan);

      if (actionError) {
        console.error('Error saving action plans:', actionError);
      }
    }

    // 9. Se score excepcional (>= 90%), disparar evento para badge
    if (isComplete && weightedScore >= 90) {
      await triggerBadgeEvent(supabaseClient, company_id, 'score_excepcional', {
        score: weightedScore,
        program_key: templateData.program_key,
        response_id: response_id
      });
    }

    // 10. Se completou questionário, disparar evento
    if (isComplete) {
      await triggerBadgeEvent(supabaseClient, company_id, 'questionnaire_completed', {
        score: weightedScore,
        program_key: templateData.program_key,
        response_id: response_id,
        completion_time_hours: calculateCompletionTime(response_id, supabaseClient)
      });
    }

    return new Response(
      JSON.stringify({
        data: {
          block_scores: blockScores,
          weighted_score: weightedScore,
          pass_threshold: passThreshold,
          is_passed: isPassed,
          gaps: gaps,
          action_plan: actionPlan,
          completion_rate: Math.round((answeredCount / totalQuestions) * 100)
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error calculating questionnaire score:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'CALCULATION_ERROR',
          message: error.message
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Função auxiliar: Gerar plano de ação baseado nos gaps
function generateActionPlan(
  gaps: Array<{ block: string; score: number; weight: number }>,
  blocks: QuestionnaireBlock[],
  responses: Record<string, number>,
  company_id: string,
  program_key: string
): Array<any> {
  const actions: Array<any> = [];

  // Ordenar gaps por peso (mais críticos primeiro)
  const sortedGaps = gaps.sort((a, b) => b.weight - a.weight);

  sortedGaps.forEach((gap) => {
    const block = blocks.find(b => b.name === gap.block);
    if (!block) return;

    // Analisar questões não satisfatórias (score < 2)
    block.questions.forEach((question) => {
      const answer = responses[question.id] || 0;
      if (answer < 2) {
        const priority = gap.score < 50 ? 'high' : gap.score < 70 ? 'medium' : 'low';
        
        actions.push({
          company_id: company_id,
          program_key: program_key,
          priority: priority,
          category: 'question',
          item_reference: question.id,
          action_description: `Melhorar: ${question.text}`,
          estimated_effort_hours: answer === 0 ? 8 : 4, // Não iniciado = 8h, Parcial = 4h
          status: 'pending'
        });
      }
    });
  });

  return actions;
}

// Função auxiliar: Disparar evento de badge
async function triggerBadgeEvent(
  supabaseClient: any,
  company_id: string,
  event_type: string,
  event_data: any
): Promise<void> {
  try {
    await supabaseClient
      .from('badge_events')
      .insert({
        company_id: company_id,
        event_type: event_type,
        event_data: event_data
      });
  } catch (error) {
    console.error('Error triggering badge event:', error);
  }
}

// Função auxiliar: Calcular tempo de conclusão
async function calculateCompletionTime(response_id: string, supabaseClient: any): Promise<number> {
  try {
    const { data } = await supabaseClient
      .from('questionnaire_responses')
      .select('started_at, completed_at')
      .eq('id', response_id)
      .single();

    if (data && data.started_at && data.completed_at) {
      const start = new Date(data.started_at).getTime();
      const end = new Date(data.completed_at).getTime();
      return Math.round((end - start) / (1000 * 60 * 60)); // horas
    }
  } catch (error) {
    console.error('Error calculating completion time:', error);
  }
  return 0;
}
