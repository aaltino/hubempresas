import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Mentor {
  id: string;
  email: string;
  full_name: string;
  expertise: string[];
  company_partnerships: string[];
  created_at: string;
  updated_at: string;
}

export interface UseMentorsReturn {
  mentors: Mentor[];
  loading: boolean;
  error: string | null;
  refreshMentors: () => Promise<void>;
  createMentor: (mentor: Partial<Mentor>) => Promise<void>;
  updateMentor: (id: string, updates: Partial<Mentor>) => Promise<void>;
}

export function useMentors(): UseMentorsReturn {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mentor')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMentors(data || []);
    } catch (err) {
      setError('Erro ao carregar mentores');
      console.error('Erro ao carregar mentores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMentors = useCallback(async () => {
    await loadMentors();
  }, [loadMentors]);

  const createMentor = useCallback(async (mentor: Partial<Mentor>) => {
    try {
      setError(null);
      
      const { data, error: createError } = await supabase
        .from('profiles')
        .insert(mentor)
        .select()
        .single();

      if (createError) throw createError;

      await refreshMentors();
    } catch (err) {
      setError('Erro ao criar mentor');
      console.error('Erro ao criar mentor:', err);
    }
  }, [refreshMentors]);

  const updateMentor = useCallback(async (id: string, updates: Partial<Mentor>) => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await refreshMentors();
    } catch (err) {
      setError('Erro ao atualizar mentor');
      console.error('Erro ao atualizar mentor:', err);
    }
  }, [refreshMentors]);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  return {
    mentors,
    loading,
    error,
    refreshMentors,
    createMentor,
    updateMentor
  };
}