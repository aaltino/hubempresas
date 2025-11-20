// Edge Function: Salvar Respostas de Questionário (Auto-Save)
// Descrição: Endpoint para salvar respostas de questionários em tempo real
// Suporta auto-save frequente durante o preenchimento

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

interface SaveResponseRequest {
  company_id: string;
  template_id: string;
  responses: Record<string, number>;
  current_step?: number;
  response_id?: string; // Para updates
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

    const requestData: SaveResponseRequest = await req.json();
    const { company_id, template_id, responses, current_step, response_id } = requestData;

    // Buscar template para pegar program_key e total_steps
    const { data: template, error: templateError } = await supabaseClient
      .from('questionnaire_templates')
      .select('program_key, blocks')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateError?.message}`);
    }

    const program_key = template.program_key;
    const total_steps = template.blocks.blocks?.length || 1;

    let savedResponseId: string;

    if (response_id) {
      // UPDATE: Atualizar resposta existente
      const { data: updatedResponse, error: updateError } = await supabaseClient
        .from('questionnaire_responses')
        .update({
          responses: responses,
          current_step: current_step || 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', response_id)
        .select('id')
        .single();

      if (updateError) {
        throw new Error(`Failed to update response: ${updateError.message}`);
      }

      savedResponseId = updatedResponse.id;
    } else {
      // INSERT: Criar nova resposta
      const { data: newResponse, error: insertError } = await supabaseClient
        .from('questionnaire_responses')
        .insert({
          company_id: company_id,
          template_id: template_id,
          program_key: program_key,
          current_step: current_step || 1,
          total_steps: total_steps,
          responses: responses,
          status: 'in_progress'
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Failed to create response: ${insertError.message}`);
      }

      savedResponseId = newResponse.id;
    }

    // Calcular progresso
    const { data: templateData } = await supabaseClient
      .from('questionnaire_templates')
      .select('blocks')
      .eq('id', template_id)
      .single();

    const totalQuestions = templateData?.blocks?.blocks?.reduce(
      (sum: number, block: any) => sum + (block.questions?.length || 0),
      0
    ) || 0;

    const answeredCount = Object.keys(responses).length;
    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    return new Response(
      JSON.stringify({
        data: {
          response_id: savedResponseId,
          saved: true,
          progress_percent: progressPercent,
          answered_count: answeredCount,
          total_questions: totalQuestions
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error saving questionnaire response:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'SAVE_ERROR',
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
