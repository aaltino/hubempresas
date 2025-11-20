import { User } from '@supabase/supabase-js';

// Tipos de roles conforme PRD v1.1
export type UserRole =
  | 'admin'
  | 'gestor'
  | 'mentor'
  | 'startup_owner'
  | 'startup_member'
  | 'viewer_executivo';

// Ações disponíveis no sistema
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'assign'
  | 'evaluate'
  | 'comment'
  | 'answer'
  | 'schedule'
  | 'request'
  | 'log_notes'
  | 'publish'
  | 'request_changes'
  | 'advance'
  | 'update_self'
  | 'update_partial'
  | 'read_aggregated'
  | 'read_statistics';

// Recursos do sistema
export type ResourceType =
  | 'startup'
  | 'evaluation'
  | 'deliverable'
  | 'mentorship'
  | 'badge'
  | 'user'
  | 'permission'
  | 'questionnaire';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
  updated_at: string;
  phone?: string;
  expertise?: string;
  bio?: string;
  avatar_url?: string;
}

export interface AuthState {
  user: User | null;
  profile: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export type AuthContextType = AuthState & AuthActions;

// Matriz de permissões por recurso e role
export interface PermissionMatrix {
  [resource: string]: {
    [role: string]: PermissionAction[];
  };
}

// Membro de equipe de startup
export interface StartupTeamMember {
  id: string;
  startup_id: string;
  user_id: string;
  role: 'startup_owner' | 'startup_member';
  permissions: Record<string, any>;
  joined_at: string;
}

// Log de auditoria de permissões
export interface PermissionAuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  allowed: boolean;
  reason?: string;
  created_at: string;
}
