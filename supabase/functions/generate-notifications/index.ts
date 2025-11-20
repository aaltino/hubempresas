Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Buscar todas as empresas
    const companiesResponse = await fetch(`${supabaseUrl}/rest/v1/companies?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!companiesResponse.ok) {
      throw new Error(`Failed to fetch companies: ${companiesResponse.statusText}`);
    }

    const companies = await companiesResponse.json();
    const today = new Date();
    const notifications = [];

    // Buscar avaliações válidas
    const evaluationsResponse = await fetch(
      `${supabaseUrl}/rest/v1/evaluations?select=*&is_valid=eq.true`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const evaluations = evaluationsResponse.ok ? await evaluationsResponse.json() : [];

    // Processar cada empresa
    for (const company of companies) {
      const hasValidEval = evaluations.some((e: any) => e.company_id === company.id);

      // Buscar deliverables da empresa
      const deliverablesResponse = await fetch(
        `${supabaseUrl}/rest/v1/deliverables?select=*&company_id=eq.${company.id}&program_key=eq.${company.current_program_key}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      const deliverables = deliverablesResponse.ok ? await deliverablesResponse.json() : [];

      // Verificar deliverables pendentes obrigatórios
      const pendingRequired = deliverables.filter(
        (d: any) => d.approval_required && d.status !== 'aprovado'
      );

      // Verificar deliverables com mais de 30 dias pendentes
      const overdue = deliverables.filter((d: any) => {
        if (d.status === 'aprovado') return false;
        const createdDate = new Date(d.created_at);
        const daysPending = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysPending > 30;
      });

      // Criar notificações para a empresa
      if (!hasValidEval && company.profile_id) {
        notifications.push({
          user_id: company.profile_id,
          type: 'error',
          title: 'Avaliação Pendente',
          message: `Sua empresa ${company.name} ainda não possui avaliação válida. Entre em contato com um mentor.`,
          action_url: '/dashboard',
        });
      }

      if (overdue.length > 0 && company.profile_id) {
        notifications.push({
          user_id: company.profile_id,
          type: 'warning',
          title: 'Deliverables em Atraso',
          message: `Você tem ${overdue.length} deliverable(s) pendente(s) há mais de 30 dias. Ação urgente necessária!`,
          action_url: '/dashboard',
        });
      }

      if (pendingRequired.length > 0 && company.profile_id) {
        notifications.push({
          user_id: company.profile_id,
          type: 'warning',
          title: 'Deliverables Obrigatórios Pendentes',
          message: `Você tem ${pendingRequired.length} deliverable(s) obrigatório(s) pendente(s).`,
          action_url: '/dashboard',
        });
      }

      // Criar notificações para admins/mentores sobre empresas em risco
      if (!hasValidEval || overdue.length > 0 || pendingRequired.length > 0) {
        // Buscar admins e mentores
        const profilesResponse = await fetch(
          `${supabaseUrl}/rest/v1/profiles?select=id&role=in.(admin,mentor)`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        );

        const adminProfiles = profilesResponse.ok ? await profilesResponse.json() : [];

        for (const profile of adminProfiles) {
          let message = `A empresa ${company.name} precisa de atenção: `;
          const issues = [];
          if (!hasValidEval) issues.push('sem avaliação válida');
          if (overdue.length > 0) issues.push(`${overdue.length} deliverable(s) em atraso`);
          if (pendingRequired.length > 0) issues.push(`${pendingRequired.length} pendente(s)`);
          message += issues.join(', ');

          notifications.push({
            user_id: profile.id,
            type: overdue.length > 0 ? 'error' : 'warning',
            title: 'Empresa em Risco',
            message,
            action_url: `/empresas/${company.id}`,
          });
        }
      }
    }

    // Inserir notificações no banco (apenas se houver notificações)
    if (notifications.length > 0) {
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(notifications),
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Failed to insert notifications: ${errorText}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: notifications.length,
        message: `${notifications.length} notificações criadas com sucesso`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'FUNCTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
