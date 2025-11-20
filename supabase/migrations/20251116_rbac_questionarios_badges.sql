-- =====================================================
-- MIGRATION: RBAC Expandido + Questionários + Badges
-- Data: 2025-11-16
-- Descrição: Implementa as 3 funcionalidades P0 do PRD v1.1
-- =====================================================

-- ==================== PARTE 1: RBAC EXPANDIDO ====================

-- 1.1 Expandir roles de 3 para 6
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'gestor', 'mentor', 'startup_owner', 'startup_member', 'viewer_executivo'));

-- 1.2 Migrar dados existentes (company → startup_owner)
UPDATE profiles 
SET role = 'startup_owner' 
WHERE role = 'company';

-- 1.3 Criar tabela de auditoria de permissões
CREATE TABLE IF NOT EXISTS permissions_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    allowed BOOLEAN NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permissions_audit_log_user ON permissions_audit_log(user_id);
CREATE INDEX idx_permissions_audit_log_resource ON permissions_audit_log(resource_type, resource_id);

-- ==================== PARTE 2: QUESTIONÁRIOS E SCORING ====================

-- 2.1 Tabela de templates de questionários
CREATE TABLE IF NOT EXISTS questionnaire_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_key TEXT NOT NULL, -- 'hotel_de_projetos', 'pre_residencia', 'residencia'
    version VARCHAR(10) NOT NULL DEFAULT 'v1',
    title TEXT NOT NULL,
    blocks JSONB NOT NULL, -- Array de blocos com weights e questões
    scoring_rules JSONB NOT NULL, -- Regras de scoring
    pass_threshold DECIMAL(3,2) NOT NULL, -- 0.70, 0.75, 0.80
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(program_key, version)
);

-- 2.2 Tabela de respostas dos questionários
CREATE TABLE IF NOT EXISTS questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    template_id UUID NOT NULL REFERENCES questionnaire_templates(id),
    program_key TEXT NOT NULL,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER NOT NULL,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- {question_id: answer}
    block_scores JSONB, -- Scores por bloco
    total_score DECIMAL(5,2), -- Score final 0-100
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('draft', 'in_progress', 'completed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- 90 dias
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questionnaire_responses_company ON questionnaire_responses(company_id);
CREATE INDEX idx_questionnaire_responses_status ON questionnaire_responses(status);
CREATE INDEX idx_questionnaire_responses_template ON questionnaire_responses(template_id);

-- 2.3 Tabela de planos de ação gerados automaticamente
CREATE TABLE IF NOT EXISTS action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES questionnaire_responses(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    program_key TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    category TEXT NOT NULL, -- 'question', 'deliverable', 'mentorship'
    item_reference TEXT NOT NULL, -- question_id, deliverable_key, etc
    action_description TEXT NOT NULL,
    estimated_effort_hours INTEGER,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_action_plans_company ON action_plans(company_id);
CREATE INDEX idx_action_plans_status ON action_plans(status);
CREATE INDEX idx_action_plans_response ON action_plans(response_id);

-- ==================== PARTE 3: BADGES E GAMIFICAÇÃO ====================

-- 3.1 Tabela de badges (biblioteca)
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_key TEXT UNIQUE NOT NULL, -- 'stage_approved_pre_residencia', 'canvas_master'
    label TEXT NOT NULL, -- 'Aprovado na Pré-Residência'
    description TEXT,
    icon TEXT, -- Emoji ou URL
    badge_type TEXT NOT NULL CHECK (badge_type IN ('stage_progression', 'achievement', 'milestone')),
    conditions JSONB NOT NULL, -- Regras para conquista
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Tabela de badges conquistados pelas empresas
CREATE TABLE IF NOT EXISTS company_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    badge_id UUID NOT NULL REFERENCES badges(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    earned_by_event TEXT, -- 'stage_advancement', 'score_achievement', 'metric_target'
    metadata JSONB, -- Dados contextuais da conquista
    UNIQUE(company_id, badge_id)
);

CREATE INDEX idx_company_badges_company ON company_badges(company_id);
CREATE INDEX idx_company_badges_badge ON company_badges(badge_id);
CREATE INDEX idx_company_badges_earned ON company_badges(earned_at);

-- 3.3 Tabela de eventos de badges (auditoria)
CREATE TABLE IF NOT EXISTS badge_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    event_type TEXT NOT NULL, -- 'questionnaire_completed', 'stage_advanced', 'score_reached'
    event_data JSONB NOT NULL,
    badges_awarded JSONB, -- Array de badge_ids concedidos
    triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_badge_events_company ON badge_events(company_id);
CREATE INDEX idx_badge_events_type ON badge_events(event_type);

-- 3.4 Atualizar tabela evaluations para vincular com questionários
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'mentor' CHECK (source_type IN ('mentor', 'questionnaire'));
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS questionnaire_response_id UUID REFERENCES questionnaire_responses(id);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;

-- ==================== PARTE 4: RLS POLICIES ====================

-- 4.1 Policies para questionnaire_templates
ALTER TABLE questionnaire_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar templates" ON questionnaire_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Gestor pode ler templates" ON questionnaire_templates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
  );

CREATE POLICY "Startups podem ler templates ativos" ON questionnaire_templates
  FOR SELECT USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('startup_owner', 'startup_member'))
  );

-- 4.2 Policies para questionnaire_responses
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin e Gestor podem ver todas respostas" ON questionnaire_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'viewer_executivo'))
  );

CREATE POLICY "Mentor pode ver respostas de suas startups" ON questionnaire_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN evaluations e ON e.mentor_id = p.id
      WHERE p.id = auth.uid() AND p.role = 'mentor' AND e.company_id = questionnaire_responses.company_id
    )
  );

CREATE POLICY "Startup pode ver e criar suas respostas" ON questionnaire_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN companies c ON c.profile_id = p.id
      WHERE p.id = auth.uid() AND c.id = questionnaire_responses.company_id AND p.role IN ('startup_owner', 'startup_member')
    )
  );

-- 4.3 Policies para action_plans
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin e Gestor podem gerenciar action plans" ON action_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
  );

CREATE POLICY "Startup pode ver seus action plans" ON action_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN companies c ON c.profile_id = p.id
      WHERE p.id = auth.uid() AND c.id = action_plans.company_id
    )
  );

-- 4.4 Policies para badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler badges ativos" ON badges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin pode gerenciar badges" ON badges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4.5 Policies para company_badges
ALTER TABLE company_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin e Gestor podem ver todos os badges" ON company_badges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'viewer_executivo'))
  );

CREATE POLICY "Admin e Gestor podem atribuir badges" ON company_badges
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
  );

CREATE POLICY "Startup pode ver seus badges" ON company_badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN companies c ON c.profile_id = p.id
      WHERE p.id = auth.uid() AND c.id = company_badges.company_id
    )
  );

-- 4.6 Policies para badge_events
ALTER TABLE badge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver todos eventos de badges" ON badge_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4.7 Policies para permissions_audit_log
ALTER TABLE permissions_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver logs de auditoria" ON permissions_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Sistema pode inserir logs" ON permissions_audit_log
  FOR INSERT WITH CHECK (true);

-- ==================== PARTE 5: POPULAR DADOS INICIAIS ====================

-- 5.1 Popular templates de questionários (3 programas)
INSERT INTO questionnaire_templates (program_key, version, title, blocks, scoring_rules, pass_threshold, is_active) VALUES
-- Hotel de Projetos
('hotel_de_projetos', 'v1', 'Hotel de Projetos — Diagnóstico Inicial', 
'{
  "blocks": [
    {
      "name": "Problema & Mercado",
      "weight": 0.25,
      "questions": [
        {"id": "hp_prob_1", "text": "Problema validado com ≥ 10 entrevistas?", "type": "scale"},
        {"id": "hp_prob_2", "text": "Persona definida (dados demográficos/psicográficos)?", "type": "scale"},
        {"id": "hp_prob_3", "text": "Concorrentes mapeados e diferenciais claros?", "type": "scale"},
        {"id": "hp_prob_4", "text": "TAM/SAM/SOM estimados?", "type": "scale"}
      ]
    },
    {
      "name": "Proposta de Valor & Solução",
      "weight": 0.25,
      "questions": [
        {"id": "hp_prop_1", "text": "Proposta de valor escrita e testável?", "type": "scale"},
        {"id": "hp_prop_2", "text": "Protótipo de baixa fidelidade criado?", "type": "scale"},
        {"id": "hp_prop_3", "text": "Hipóteses de solução documentadas?", "type": "scale"}
      ]
    },
    {
      "name": "Equipe & Gestão",
      "weight": 0.25,
      "questions": [
        {"id": "hp_equipe_1", "text": "Papéis definidos e dedicação mínima acordada?", "type": "scale"},
        {"id": "hp_equipe_2", "text": "Competências críticas mapeadas?", "type": "scale"},
        {"id": "hp_equipe_3", "text": "Ritual de gestão (reunião semanal/Kanban)?", "type": "scale"}
      ]
    },
    {
      "name": "Negócios & Métricas",
      "weight": 0.25,
      "questions": [
        {"id": "hp_neg_1", "text": "Canvas completo e revisado?", "type": "scale"},
        {"id": "hp_neg_2", "text": "Métricas norteadoras definidas?", "type": "scale"},
        {"id": "hp_neg_3", "text": "Custos e fontes de receita estimados?", "type": "scale"}
      ]
    }
  ]
}'::jsonb,
'{"scale": "0=Não, 1=Parcial, 2=Sim", "max_score_per_question": 2}'::jsonb,
0.70, true),

-- Pré-Residência
('pre_residencia', 'v1', 'Pré-Residência — Validação de MVP',
'{
  "blocks": [
    {
      "name": "MVP & Produto",
      "weight": 0.35,
      "questions": [
        {"id": "pr_mvp_1", "text": "MVP funcional disponível?", "type": "scale"},
        {"id": "pr_mvp_2", "text": "≥ 20 usuários testando?", "type": "scale"},
        {"id": "pr_mvp_3", "text": "2+ iterações realizadas a partir de feedback?", "type": "scale"}
      ]
    },
    {
      "name": "Métricas & Tração",
      "weight": 0.35,
      "questions": [
        {"id": "pr_met_1", "text": "Taxa de ativação definida e medida?", "type": "scale"},
        {"id": "pr_met_2", "text": "Retenção/coorte inicial medida?", "type": "scale"},
        {"id": "pr_met_3", "text": "Norte de crescimento definido (NSM)?", "type": "scale"}
      ]
    },
    {
      "name": "Go-to-Market & Canais",
      "weight": 0.2,
      "questions": [
        {"id": "pr_gtm_1", "text": "Landing page ativa e captação de leads?", "type": "scale"},
        {"id": "pr_gtm_2", "text": "Testes de aquisição (orgânico/paid) executados?", "type": "scale"},
        {"id": "pr_gtm_3", "text": "Canal promissor identificado?", "type": "scale"}
      ]
    },
    {
      "name": "Gestão & Finanças",
      "weight": 0.1,
      "questions": [
        {"id": "pr_gest_1", "text": "Backlog priorizado e rituais quinzenais?", "type": "scale"},
        {"id": "pr_gest_2", "text": "Projeção de custos e monetização inicial?", "type": "scale"}
      ]
    }
  ]
}'::jsonb,
'{"scale": "0=Não, 1=Parcial, 2=Sim", "max_score_per_question": 2}'::jsonb,
0.75, true),

-- Residência
('residencia', 'v1', 'Residência — Escala e Governança',
'{
  "blocks": [
    {
      "name": "Produto & Experiência",
      "weight": 0.3,
      "questions": [
        {"id": "res_prod_1", "text": "Roadmap trimestral definido?", "type": "scale"},
        {"id": "res_prod_2", "text": "NPS medido (meta >30)?", "type": "scale"},
        {"id": "res_prod_3", "text": "Ciclo de releases contínuo?", "type": "scale"}
      ]
    },
    {
      "name": "Crescimento & Receita",
      "weight": 0.4,
      "questions": [
        {"id": "res_cresc_1", "text": "Crescimento mensal consistente?", "type": "scale"},
        {"id": "res_cresc_2", "text": "Funil de vendas com taxas conhecidas?", "type": "scale"},
        {"id": "res_cresc_3", "text": "Receita recorrente (quando aplicável)?", "type": "scale"}
      ]
    },
    {
      "name": "Estrutura & Governança",
      "weight": 0.3,
      "questions": [
        {"id": "res_gov_1", "text": "Processos documentados (suporte, sucesso do cliente)?", "type": "scale"},
        {"id": "res_gov_2", "text": "Acordo de sócios e compliance em dia?", "type": "scale"},
        {"id": "res_gov_3", "text": "Indicadores financeiros com rotina de fechamento?", "type": "scale"}
      ]
    }
  ]
}'::jsonb,
'{"scale": "0=Não, 1=Parcial, 2=Sim", "max_score_per_question": 2}'::jsonb,
0.80, true);

-- 5.2 Popular biblioteca de badges (12 badges conforme análise)
INSERT INTO badges (badge_key, label, description, icon, badge_type, conditions, is_active) VALUES
-- Progressão de Etapa
('hotel_aprovado', 'Hotel de Projetos Aprovado', 'Completou com sucesso a etapa Hotel de Projetos', '🏨', 'stage_progression', '{"stage": "hotel_de_projetos", "score_min": 70}'::jsonb, true),
('pre_residencia_aprovado', 'Pré-Residência Aprovado', 'Completou com sucesso a etapa Pré-Residência', '🚀', 'stage_progression', '{"stage": "pre_residencia", "score_min": 75}'::jsonb, true),
('residencia_aprovado', 'Residência Aprovado', 'Completou com sucesso a etapa Residência', '💼', 'stage_progression', '{"stage": "residencia", "score_min": 80}'::jsonb, true),
('graduado_programa', 'Graduado do Programa', 'Completou todas as etapas do programa', '👑', 'stage_progression', '{"all_stages": true}'::jsonb, true),

-- Performance
('score_excepcional', 'Score Excepcional', 'Atingiu score ≥ 90% em questionário', '🎯', 'achievement', '{"score_min": 90}'::jsonb, true),
('mestre_canvas', 'Mestre do Canvas', 'Canvas aprovado sem revisões', '📊', 'achievement', '{"canvas_approved": true, "no_revisions": true}'::jsonb, true),
('resposta_rapida', 'Resposta Rápida', 'Completou questionário em menos de 24 horas', '⚡', 'achievement', '{"completion_time_hours": 24}'::jsonb, true),
('streak_master', 'Streak Master', 'Completou 3 questionários consecutivos', '🔥', 'achievement', '{"consecutive_questionnaires": 3}'::jsonb, true),

-- Conquistas Específicas
('meta_financeira', 'Meta Financeira Atingida', 'Atingiu meta financeira estabelecida', '💰', 'milestone', '{"metric": "financial_target"}'::jsonb, true),
('validacao_usuarios', 'Validação com Usuários', 'Realizou ≥ 20 entrevistas com usuários', '👥', 'milestone', '{"interviews": 20}'::jsonb, true),
('mvp_validado', 'MVP Validado', 'MVP testado com sucesso', '🛠️', 'milestone', '{"mvp_validated": true}'::jsonb, true),
('crescimento_sustentavel', 'Crescimento Sustentável', 'Crescimento mensal consistente por 3 meses', '📈', 'milestone', '{"growth_months": 3}'::jsonb, true);

-- ==================== CONCLUÍDO ====================
-- Migration completa: RBAC + Questionários + Badges
-- Próximos passos: Edge Functions para scoring e atribuição automática de badges
