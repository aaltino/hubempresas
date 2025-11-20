import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/design-system/feedback/Toast';

export interface Company {
  id: string;
  name: string;
  email: string;
  sector: string;
  size: string;
  status: string;
  created_at: string;
  updated_at: string;
  mentor_id?: string;
  program_id?: string;
}

export interface UseCompaniesReturn {
  companies: Company[];
  loading: boolean;
  error: string | null;
  refreshCompanies: () => Promise<void>;
  inviteCompany: (companyData: Partial<Company>) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
}

export function useCompanies(): UseCompaniesReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCompanies(data || []);
    } catch (err) {
      setError('Erro ao carregar empresas');
      console.error('Erro ao carregar empresas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCompanies = useCallback(async () => {
    await loadCompanies();
  }, [loadCompanies]);

  const inviteCompany = useCallback(async (companyData: Partial<Company>) => {
    try {
      setError(null);
      
      const { data, error: inviteError } = await supabase
        .functions
        .invoke('invite-company', {
          body: companyData
        });

      if (inviteError) throw inviteError;

      await refreshCompanies();
      
      addToast({
        type: 'success',
        title: 'Empresa convidada com sucesso!',
        description: `A empresa ${companyData.name} foi adicionada e receberá um convite por email.`
      });
    } catch (err) {
      const errorMessage = 'Erro ao convidar empresa';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Erro ao convidar empresa',
        description: err instanceof Error ? err.message : 'Tente novamente em alguns minutos.'
      });
      console.error('Erro ao convidar empresa:', err);
    }
  }, [refreshCompanies, addToast]);

  const updateCompany = useCallback(async (id: string, updates: Partial<Company>) => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await refreshCompanies();
      
      addToast({
        type: 'success',
        title: 'Empresa atualizada com sucesso!',
        description: 'As informações da empresa foram salvas e atualizadas.'
      });
    } catch (err) {
      const errorMessage = 'Erro ao atualizar empresa';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Erro ao atualizar empresa',
        description: err instanceof Error ? err.message : 'Tente novamente em alguns minutos.'
      });
      console.error('Erro ao atualizar empresa:', err);
    }
  }, [refreshCompanies, addToast]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  return {
    companies,
    loading,
    error,
    refreshCompanies,
    inviteCompany,
    updateCompany
  };
}