import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )

        const { company_id, evaluation_data, persona } = await req.json()

        // 1. Fetch Company Context
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('name, sector, description')
            .eq('id', company_id)
            .single()

        if (companyError) throw companyError

        // 2. Generate Prompt (Mocked logic for now)
        console.log(`Generating feedback for ${company.name} using persona: ${persona}`)

        // 3. Call LLM (Mocked)
        // In a real scenario, we would call OpenAI/Anthropic here.
        const mockResponse = generateMockResponse(company, evaluation_data, persona)

        // 4. Return Response
        return new Response(
            JSON.stringify({
                success: true,
                feedback: mockResponse,
                model_used: 'mock-gpt-4',
                persona_used: persona
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})

function generateMockResponse(company: any, evaluation: any, persona: string) {
    const score = evaluation.weighted_score || 0

    let tone = "profissional e direto"
    if (persona === 'product_expert') tone = "focado em produto e métricas de uso"
    if (persona === 'sales_expert') tone = "agressivo em vendas e funil"

    return `[IA Mentor - ${persona}]
  
Olá time da ${company.name}, analisei seus dados com um olhar ${tone}.

**Análise Geral (Score: ${score})**
Com base na avaliação, vejo que vocês estão ${score > 70 ? 'em um bom caminho' : 'precisando de ajustes'}.

**Pontos Fortes:**
- Setor ${company.sector} tem boas oportunidades.
- Critérios de avaliação indicam evolução.

**Recomendações:**
1. Focar em validação rápida.
2. Melhorar a definição do ICP.
3. (Sugestão específica do ${persona}): Rever o CAC e LTV.

*Esta é uma sugestão automática. O mentor humano deve validar.*`
}
