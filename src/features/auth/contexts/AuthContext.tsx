import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserRole, ResourceType, PermissionAction } from '../types/auth';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  getPermissions 
} from '../config/permissions';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (resource: ResourceType, action: PermissionAction) => boolean;
  hasAnyPermission: (resource: ResourceType, actions: PermissionAction[]) => boolean;
  hasAllPermissions: (resource: ResourceType, actions: PermissionAction[]) => boolean;
  getPermissions: (resource: ResourceType) => PermissionAction[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para converter roles antigas para o novo sistema RBAC
function migrateRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    'admin': 'admin',
    'mentor': 'mentor',
    'company': 'startup_owner', // company é agora startup_owner
    'gestor': 'gestor',
    'startup_owner': 'startup_owner',
    'startup_member': 'startup_member',
    'viewer_executivo': 'viewer_executivo',
  };
  
  return roleMap[role] || 'startup_owner'; // Default para startup_owner se role desconhecida
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Verificar se role precisa ser migrada
      const currentRole = data.role;
      const migratedRole = migrateRole(currentRole);
      
      // Se a role foi convertida, atualizar no banco
      if (currentRole !== migratedRole) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: migratedRole })
          .eq('id', userId);

        if (updateError) {
          console.error('Erro ao migrar role:', updateError);
        } else {
          console.log(`Role migrada: ${currentRole} → ${migratedRole}`);
          // Retornar perfil com role atualizada
          return { ...data, role: migratedRole };
        }
      }

      return data;
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await loadProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          const profileData = await loadProfile(currentUser.id);
          setProfile(profileData);
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          loadProfile(session.user.id).then(setProfile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.data.user) {
      const profileData = await loadProfile(result.data.user.id);
      setProfile(profileData);
    }
    return result;
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      // Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: role
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
      }
    }

    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    // Redirecionar para login após logout
    window.location.href = '/login';
  };

  // Funções de verificação de permissão usando o perfil atual
  const checkPermission = (resource: ResourceType, action: PermissionAction): boolean => {
    if (!profile || !profile.role) return false;
    return hasPermission(migrateRole(profile.role), resource, action);
  };

  const checkAnyPermission = (resource: ResourceType, actions: PermissionAction[]): boolean => {
    if (!profile || !profile.role) return false;
    return hasAnyPermission(migrateRole(profile.role), resource, actions);
  };

  const checkAllPermissions = (resource: ResourceType, actions: PermissionAction[]): boolean => {
    if (!profile || !profile.role) return false;
    return hasAllPermissions(migrateRole(profile.role), resource, actions);
  };

  const getUserPermissions = (resource: ResourceType): PermissionAction[] => {
    if (!profile || !profile.role) return [];
    return getPermissions(migrateRole(profile.role), resource);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      refreshProfile,
      hasPermission: checkPermission,
      hasAnyPermission: checkAnyPermission,
      hasAllPermissions: checkAllPermissions,
      getPermissions: getUserPermissions,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}