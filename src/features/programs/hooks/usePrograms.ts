import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Program {
  id: string;
  name: string;
  description: string;
  duration_weeks: number;
  cohorts: string[];
  companies: string[];
  created_at: string;
  updated_at: string;
}

export interface UseProgramsReturn {
  programs: Program[];
  loading: boolean;
  error: string | null;
  refreshPrograms: () => Promise<void>;
  createProgram: (program: Partial<Program>) => Promise<void>;
  updateProgram: (id: string, updates: Partial<Program>) => Promise<void>;
}

export function usePrograms(): UseProgramsReturn {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPrograms(data || []);
    } catch (err) {
      setError('Erro ao carregar programas');
      console.error('Erro ao carregar programas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPrograms = useCallback(async () => {
    await loadPrograms();
  }, [loadPrograms]);

  const createProgram = useCallback(async (program: Partial<Program>) => {
    try {
      setError(null);
      
      const { data, error: createError } = await supabase
        .from('programs')
        .insert(program)
        .select()
        .single();

      if (createError) throw createError;

      await refreshPrograms();
    } catch (err) {
      setError('Erro ao criar programa');
      console.error('Erro ao criar programa:', err);
    }
  }, [refreshPrograms]);

  const updateProgram = useCallback(async (id: string, updates: Partial<Program>) => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await refreshPrograms();
    } catch (err) {
      setError('Erro ao atualizar programa');
      console.error('Erro ao atualizar programa:', err);
    }
  }, [refreshPrograms]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  return {
    programs,
    loading,
    error,
    refreshPrograms,
    createProgram,
    updateProgram
  };
}