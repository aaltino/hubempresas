-- Migration: Add AI Mentorship Configuration and Audit Logs
-- Date: 2025-11-22

-- 1. Create Enum for Mentorship Mode
CREATE TYPE public.mentorship_mode AS ENUM ('human', 'hybrid', 'ai');

-- 2. Update Programs table (Default configuration)
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS default_mentorship_mode mentorship_mode DEFAULT 'human',
ADD COLUMN IF NOT EXISTS default_ai_persona VARCHAR(100) DEFAULT 'general_mentor';

-- 3. Update Mentorships table (Specific configuration override)
ALTER TABLE public.mentorships
ADD COLUMN IF NOT EXISTS mentorship_mode mentorship_mode DEFAULT 'human',
ADD COLUMN IF NOT EXISTS ai_persona VARCHAR(100);

-- 4. Update Evaluations table for Audit Logs
ALTER TABLE public.evaluations
ADD COLUMN IF NOT EXISTS mode mentorship_mode DEFAULT 'human',
ADD COLUMN IF NOT EXISTS ai_model_used VARCHAR(100),
ADD COLUMN IF NOT EXISTS ai_raw_response TEXT,
ADD COLUMN IF NOT EXISTS human_final_response TEXT,
ADD COLUMN IF NOT EXISTS audit_log JSONB DEFAULT '[]'::jsonb;

-- 5. Comments
COMMENT ON COLUMN public.evaluations.audit_log IS 'Log of edits made to the AI suggestion: [{who, when, what_changed}]';
COMMENT ON COLUMN public.mentorships.mentorship_mode IS 'human, hybrid (HITL), or ai (automated)';
