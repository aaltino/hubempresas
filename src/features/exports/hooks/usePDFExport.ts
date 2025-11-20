// Hook customizado para exportação PDF

import { useState, useCallback } from 'react';
import { pdfExportService } from '../services/pdfExportService';
import { useToast } from '@/design-system/feedback/Toast';
import type { ExportOptions, ExportResult, ExportStatus, ExportProgress } from '../types';

interface UsePDFExportReturn {
  exportPDF: (options: ExportOptions) => Promise<ExportResult>;
  status: ExportStatus;
  progress: ExportProgress | null;
  error: string | null;
  result: ExportResult | null;
  reset: () => void;
}

/**
 * Hook para gerenciar exportações PDF com estado e progresso
 * 
 * @example
 * ```tsx
 * const { exportPDF, status, progress } = usePDFExport();
 * 
 * const handleExport = async () => {
 *   await exportPDF({
 *     type: 'company-onepager',
 *     companyId: 'abc123'
 *   });
 * };
 * ```
 */
export function usePDFExport(): UsePDFExportReturn {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const { addToast } = useToast();

  /**
   * Configura callback de progresso no serviço
   */
  const setupProgressCallback = useCallback(() => {
    pdfExportService.setProgressCallback((progressData: ExportProgress) => {
      setProgress(progressData);
      
      // Atualiza status baseado no stage
      if (progressData.stage === 'complete') {
        setStatus('success');
      } else {
        setStatus('generating');
      }
    });
  }, []);

  /**
   * Executa exportação PDF
   */
  const exportPDF = useCallback(async (options: ExportOptions): Promise<ExportResult> => {
    try {
      // Reset estado
      setStatus('loading');
      setError(null);
      setResult(null);
      setProgress(null);

      // Configura callback de progresso
      setupProgressCallback();

      // Executa exportação
      const exportResult = await pdfExportService.export(options);

      // Atualiza estado baseado no resultado
      if (exportResult.success) {
        setStatus('success');
        setResult(exportResult);
        setError(null);
        
        addToast({
          type: 'success',
          title: 'PDF exportado com sucesso!',
          description: 'O arquivo PDF foi gerado e está pronto para download.'
        });
      } else {
        setStatus('error');
        const errorMsg = exportResult.error || 'Erro desconhecido ao exportar PDF';
        setError(errorMsg);
        setResult(exportResult);
        
        addToast({
          type: 'error',
          title: 'Erro ao exportar PDF',
          description: errorMsg
        });
      }

      return exportResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado ao exportar PDF';
      setStatus('error');
      setError(errorMessage);
      setResult({
        success: false,
        error: errorMessage
      });
      
      addToast({
        type: 'error',
        title: 'Erro ao exportar PDF',
        description: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [setupProgressCallback]);

  /**
   * Reset estado do hook
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(null);
    setError(null);
    setResult(null);
  }, []);

  return {
    exportPDF,
    status,
    progress,
    error,
    result,
    reset
  };
}
