// Tipos para o sistema de conflito de interesses

export type ConflictStatus = 'clear' | 'warning' | 'blocked';
export type ConflictSeverity = 'info' | 'warning' | 'critical';
export type PartnershipType = 'investor' | 'advisor' | 'employee' | 'founder' | 'family' | 'other';

export interface ConflictReason {
  type: string;
  message: string;
  severity: ConflictSeverity;
  partnership_type?: PartnershipType;
}

export interface ConflictValidationResult {
  success: boolean;
  conflict_detected: boolean;
  conflict_status: ConflictStatus;
  conflict_reasons: ConflictReason[];
  risk_score: number;
  audit_logged: boolean;
  message?: string;
  recommendation?: string;
  error?: {
    message: string;
    code?: string;
  };
  details?: {
    mentor_info: {
      id: string;
      name: string;
      email: string;
    };
    company_info: {
      id: string;
      name: string;
      program: string;
    };
    declared_partnership: MentorCompanyPartnership | null;
    cross_validation_warnings: ConflictReason[];
  };
}

export interface MentorCompanyPartnership {
  id: string;
  mentor_id: string;
  company_id: string;
  partnership_type: PartnershipType;
  start_date: string;
  end_date?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConflictAuditLog {
  id: string;
  mentor_id: string;
  company_id: string;
  action_type: 'evaluation_attempt' | 'conflict_detected' | 'partnership_declared' | 'partnership_updated' | 'notification_sent';
  details: any;
  ip_address?: string;
  user_agent?: string;
  severity: ConflictSeverity;
  created_at: string;
}

export interface ConflictNotification {
  id: string;
  type: 'conflict_detected' | 'partnership_declared' | 'violation_attempt' | 'audit_required';
  mentor_id: string;
  company_id: string;
  title: string;
  message: string;
  severity: ConflictSeverity;
  action_required: boolean;
  created_at: string;
  metadata?: any;
}
