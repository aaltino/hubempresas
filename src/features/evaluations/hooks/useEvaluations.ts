import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/design-system/feedback/Toast';

export interface Evaluation {
  id: string;
  company_id: string;
  mentor_id: string;
  score: number;
  criteria: Record<string, any>;
  comments: string;
  created_at: string;
  updated_at: string;
}

export interface UseEvaluationsReturn {
  evaluations: Evaluation[];
  loading: boolean;
  error: string | null;
  refreshEvaluations: () => Promise<void>;
  createEvaluation: (evaluation: Partial<Evaluation>) => Promise<void>;
  updateEvaluation: (id: string, updates: Partial<Evaluation>) => Promise<void>;
}

export function useEvaluations(): UseEvaluationsReturn {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadEvaluations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setEvaluations(data || []);
    } catch (err) {
      setError('Erro ao carregar avaliações');
      console.error('Erro ao carregar avaliações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshEvaluations = useCallback(async () => {
    await loadEvaluations();
  }, [loadEvaluations]);

  const createEvaluation = useCallback(async (evaluation: Partial<Evaluation>) => {
    try {
      setError(null);
      
      const { data, error: createError } = await supabase
        .from('evaluations')
        .insert(evaluation)
        .select()
        .single();

      if (createError) throw createError;

      await refreshEvaluations();
      
      addToast({
        type: 'success',
        title: 'Avaliação salva com sucesso!',
        description: 'A avaliação foi criada e salva no sistema.'
      });
    } catch (err) {
      const errorMessage = 'Erro ao criar avaliação';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Erro ao salvar avaliação',
        description: err instanceof Error ? err.message : 'Tente novamente em alguns minutos.'
      });
      console.error('Erro ao criar avaliação:', err);
    }
  }, [refreshEvaluations, addToast]);

  const updateEvaluation = useCallback(async (id: string, updates: Partial<Evaluation>) => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('evaluations')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await refreshEvaluations();
      
      addToast({
        type: 'success',
        title: 'Avaliação atualizada com sucesso!',
        description: 'As alterações da avaliação foram salvas.'
      });
    } catch (err) {
      const errorMessage = 'Erro ao atualizar avaliação';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Erro ao atualizar avaliação',
        description: err instanceof Error ? err.message : 'Tente novamente em alguns minutos.'
      });
      console.error('Erro ao atualizar avaliação:', err);
    }
  }, [refreshEvaluations, addToast]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  return {
    evaluations,
    loading,
    error,
    refreshEvaluations,
    createEvaluation,
    updateEvaluation
  };
}