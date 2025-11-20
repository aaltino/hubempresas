// Tipos específicos da feature users
export type UserRole = 'admin' | 'mentor' | 'company';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

// Contexto de autenticação
export interface AuthContextType {
  user: import('@supabase/supabase-js').User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Estados possíveis de autenticação
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

// Configuração de permissões por role
export interface RolePermissions {
  canCreateCompany: boolean;
  canEditCompany: boolean;
  canDeleteCompany: boolean;
  canCreateEvaluation: boolean;
  canViewAllEvaluations: boolean;
  canViewMentorData: boolean;
  canAccessAdminPanel: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canCreateCompany: true,
    canEditCompany: true,
    canDeleteCompany: true,
    canCreateEvaluation: true,
    canViewAllEvaluations: true,
    canViewMentorData: true,
    canAccessAdminPanel: true
  },
  mentor: {
    canCreateCompany: false,
    canEditCompany: false,
    canDeleteCompany: false,
    canCreateEvaluation: true,
    canViewAllEvaluations: false,
    canViewMentorData: true,
    canAccessAdminPanel: false
  },
  company: {
    canCreateCompany: false,
    canEditCompany: false,
    canDeleteCompany: false,
    canCreateEvaluation: false,
    canViewAllEvaluations: false,
    canViewMentorData: false,
    canAccessAdminPanel: false
  }
} as const;