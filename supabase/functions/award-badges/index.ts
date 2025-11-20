// Edge Function: Atribuição Automática de Badges
// Descrição: Processa eventos e atribui badges automaticamente baseado em condições
// Dispara notificações quando badges são conquistados

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

interface BadgeCondition {
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

interface Badge {
  id: string;
  badge_key: string;
  label: string;
  description: string;
  icon: string;
  badge_type: string;
  conditions: BadgeCondition;
}

interface AwardBadgeRequest {
  company_id: string;
  event_type: string;
  event_data: Record<string, any>;
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

    const requestData: AwardBadgeRequest = await req.json();
    const { company_id, event_type, event_data } = requestData;

    // 1. Buscar todos os badges ativos
    const { data: badges, error: badgesError } = await supabaseClient
      .from('badges')
      .select('*')
      .eq('is_active', true);

    if (badgesError) {
      throw new Error(`Error fetching badges: ${badgesError.message}`);
    }

    const allBadges = badges as Badge[];
    const badgesAwarded: string[] = [];

    // 2. Verificar cada badge se deve ser concedido
    for (const badge of allBadges) {
      const shouldAward = await evaluateBadgeConditions(
        badge,
        event_type,
        event_data,
        company_id,
        supabaseClient
      );

      if (shouldAward) {
        // Verificar se já não foi concedido
        const { data: existing } = await supabaseClient
          .from('company_badges')
          .select('id')
          .eq('company_id', company_id)
          .eq('badge_id', badge.id)
          .maybeSingle();

        if (!existing) {
          // Conceder badge
          const { error: awardError } = await supabaseClient
            .from('company_badges')
            .insert({
              company_id: company_id,
              badge_id: badge.id,
              earned_by_event: event_type,
              metadata: event_data
            });

          if (!awardError) {
            badgesAwarded.push(badge.id);
            
            // Disparar notificação
            await createBadgeNotification(
              supabaseClient,
              company_id,
              badge,
              event_data
            );
          }
        }
      }
    }

    // 3. Registrar evento de badges
    if (badgesAwarded.length > 0) {
      await supabaseClient
        .from('badge_events')
        .update({ badges_awarded: badgesAwarded })
        .eq('company_id', company_id)
        .eq('event_type', event_type)
        .order('triggered_at', { ascending: false })
        .limit(1);
    }

    return new Response(
      JSON.stringify({
        data: {
          badges_awarded: badgesAwarded,
          total_badges: badgesAwarded.length,
          event_processed: true
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error awarding badges:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'BADGE_AWARD_ERROR',
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

// Função principal: Avaliar se badge deve ser concedido
async function evaluateBadgeConditions(
  badge: Badge,
  event_type: string,
  event_data: Record<string, any>,
  company_id: string,
  supabaseClient: any
): Promise<boolean> {
  const conditions = badge.conditions;

  // Score Excepcional: score >= 90%
  if (badge.badge_key === 'score_excepcional') {
    if (event_type === 'questionnaire_completed' || event_type === 'score_excepcional') {
      return event_data.score >= (conditions.score_min || 90);
    }
  }

  // Aprovação de Etapa
  if (badge.badge_key.includes('_aprovado')) {
    if (event_type === 'stage_advanced') {
      const stage = conditions.stage;
      const scoreMin = (conditions.score_min || 70);
      return event_data.to_stage === stage && event_data.score >= scoreMin;
    }
  }

  // Graduado do Programa (todas etapas)
  if (badge.badge_key === 'graduado_programa') {
    if (event_type === 'stage_advanced' && event_data.to_stage === 'residencia') {
      // Verificar se completou todas as etapas
      const completedAllStages = await checkAllStagesCompleted(company_id, supabaseClient);
      return completedAllStages;
    }
  }

  // Mestre do Canvas
  if (badge.badge_key === 'mestre_canvas') {
    if (event_type === 'deliverable_approved') {
      return event_data.deliverable_type === 'canvas' && 
             event_data.revisions_count === 0;
    }
  }

  // Resposta Rápida (< 24h)
  if (badge.badge_key === 'resposta_rapida') {
    if (event_type === 'questionnaire_completed') {
      const completionHours = event_data.completion_time_hours || 0;
      return completionHours <= (conditions.completion_time_hours || 24);
    }
  }

  // Streak Master (3 questionários consecutivos)
  if (badge.badge_key === 'streak_master') {
    if (event_type === 'questionnaire_completed') {
      const consecutiveCount = await countConsecutiveQuestionnaires(company_id, supabaseClient);
      return consecutiveCount >= (conditions.consecutive_questionnaires || 3);
    }
  }

  // Meta Financeira
  if (badge.badge_key === 'meta_financeira') {
    if (event_type === 'metric_target_reached') {
      return event_data.metric === 'financial_target';
    }
  }

  // Validação com Usuários (20+ entrevistas)
  if (badge.badge_key === 'validacao_usuarios') {
    if (event_type === 'milestone_reached') {
      return event_data.milestone === 'user_interviews' && 
             event_data.count >= (conditions.interviews || 20);
    }
  }

  // MVP Validado
  if (badge.badge_key === 'mvp_validado') {
    if (event_type === 'milestone_reached') {
      return event_data.milestone === 'mvp_validated';
    }
  }

  // Crescimento Sustentável (3 meses)
  if (badge.badge_key === 'crescimento_sustentavel') {
    if (event_type === 'metric_target_reached') {
      return event_data.metric === 'consistent_growth' && 
             event_data.months >= (conditions.growth_months || 3);
    }
  }

  return false;
}

// Função auxiliar: Verificar se completou todas as etapas
async function checkAllStagesCompleted(
  company_id: string,
  supabaseClient: any
): Promise<boolean> {
  try {
    // Verificar se tem questionários completos para todas as 3 etapas
    const { data: responses, error } = await supabaseClient
      .from('questionnaire_responses')
      .select('program_key, status, total_score')
      .eq('company_id', company_id)
      .eq('status', 'completed');

    if (error || !responses) return false;

    const stages = ['hotel_de_projetos', 'pre_residencia', 'residencia'];
    const completedStages = new Set(responses.map((r: any) => r.program_key));

    return stages.every(stage => completedStages.has(stage));
  } catch (error) {
    console.error('Error checking stages:', error);
    return false;
  }
}

// Função auxiliar: Contar questionários consecutivos
async function countConsecutiveQuestionnaires(
  company_id: string,
  supabaseClient: any
): Promise<number> {
  try {
    const { data: responses, error } = await supabaseClient
      .from('questionnaire_responses')
      .select('completed_at')
      .eq('company_id', company_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    if (error || !responses || responses.length === 0) return 0;

    // Contar consecutivos (sem gap > 30 dias)
    let consecutive = 1;
    for (let i = 1; i < responses.length; i++) {
      const current = new Date(responses[i].completed_at);
      const previous = new Date(responses[i - 1].completed_at);
      const daysDiff = Math.abs((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 30) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  } catch (error) {
    console.error('Error counting consecutive questionnaires:', error);
    return 0;
  }
}

// Função auxiliar: Criar notificação de badge conquistado
async function createBadgeNotification(
  supabaseClient: any,
  company_id: string,
  badge: Badge,
  event_data: Record<string, any>
): Promise<void> {
  try {
    // Buscar profile_id da empresa
    const { data: company } = await supabaseClient
      .from('companies')
      .select('profile_id')
      .eq('id', company_id)
      .single();

    if (!company) return;

    await supabaseClient
      .from('notifications')
      .insert({
        user_id: company.profile_id,
        title: 'Badge Conquistado!',
        message: `Parabéns! Você conquistou o badge "${badge.label}". ${badge.description}`,
        type: 'badge_earned',
        priority: 'normal',
        metadata: {
          badge_id: badge.id,
          badge_key: badge.badge_key,
          badge_icon: badge.icon,
          event_data: event_data
        }
      });
  } catch (error) {
    console.error('Error creating badge notification:', error);
  }
}
