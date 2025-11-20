import { useState, useCallback } from 'react';
import { ConflictValidationResult } from '../types/conflict';
import { validateConflictOfInterest, notifyConflictIncident } from '../services/conflictService';

interface UseConflictDetectionReturn {
  validateConflict: (mentorId: string, companyId: string) => Promise<ConflictValidationResult | null>;
  notifyIncident: (type: string, mentorId: string, companyId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para detecção e gerenciamento de conflitos de interesse
 */
export function useConflictDetection(): UseConflictDetectionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Valida se há conflito entre mentor e empresa
   */
  const validateConflict = useCallback(async (
    mentorId: string,
    companyId: string
  ): Promise<ConflictValidationResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await validateConflictOfInterest(mentorId, companyId, 'evaluation_attempt');
      
      // Validar resposta
      if (!result || !result.success) {
        throw new Error(result?.error?.message || 'Resposta inválida da API de validação');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao validar conflito de interesse';
      setError(errorMessage);
      console.error('❌ Erro na validação de conflito:', err);
      
      // Retornar um resultado de erro para exibir ao usuário
      return {
        success: false,
        conflict_detected: false,
        conflict_status: 'clear',
        conflict_reasons: [],
        risk_score: 0,
        audit_logged: false,
        message: errorMessage,
        error: {
          code: 'VALIDATION_ERROR',
          message: errorMessage
        }
      } as ConflictValidationResult;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Notifica incidente de conflito
   */
  const notifyIncident = useCallback(async (
    type: string,
    mentorId: string,
    companyId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await notifyConflictIncident(
        type,
        mentorId,
        companyId,
        'warning',
        undefined,
        false,
        {}
      );

      if (!result.success) {
        setError(result.error || 'Erro ao enviar notificação');
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao notificar incidente';
      setError(errorMessage);
      console.error('Erro ao notificar incidente:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    validateConflict,
    notifyIncident,
    loading,
    error
  };
}

export default useConflictDetection;
