// Serviço de exportação PDF - HUB Empresas
// Wrapper unificado para funções de geração PDF existentes

import { 
  generateCompanyOnePagerAdvanced,
  generateCohortSummaryAdvanced
} from '@/lib/pdf';
import type { ExportOptions, ExportResult, ExportProgress } from '../types';

/**
 * Serviço principal de exportação PDF
 * Centraliza todas as operações de geração de relatórios
 */
export class PDFExportService {
  private progressCallback?: (progress: ExportProgress) => void;

  /**
   * Configura callback de progresso
   */
  setProgressCallback(callback: (progress: ExportProgress) => void) {
    this.progressCallback = callback;
  }

  /**
   * Atualiza progresso da exportação
   */
  private updateProgress(stage: ExportProgress['stage'], progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message });
    }
  }

  /**
   * Exporta Company One-Pager
   */
  async exportCompanyOnePager(options: ExportOptions): Promise<ExportResult> {
    try {
      if (!options.companyId) {
        throw new Error('ID da empresa é obrigatório');
      }

      this.updateProgress('preparing', 0, 'Preparando exportação...');

      this.updateProgress('fetching', 25, 'Buscando dados da empresa...');

      this.updateProgress('generating', 50, 'Gerando PDF...');

      // Se preview está ativado, gera blob ao invés de download
      if (options.preview) {
        // Importar supabase e jsPDF para gerar blob diretamente
        const { generateCompanyPDFBlob } = await import('@/lib/pdf/preview');
        const blob = await generateCompanyPDFBlob(
          options.companyId,
          {
            includeSummary: true,
            includeRankings: options.includeCohortStats,
            includeDetailedMetrics: options.detailedView
          }
        );

        this.updateProgress('complete', 100, 'Preview pronto!');
        return {
          success: true,
          fileName: `preview_${options.companyId}.pdf`,
          blob
        };
      }

      // Usa a função avançada para download direto
      const result = await generateCompanyOnePagerAdvanced(
        options.companyId,
        {
          includeSummary: true,
          includeRankings: options.includeCohortStats,
          includeDetailedMetrics: options.detailedView
        }
      );

      this.updateProgress('downloading', 90, 'Preparando download...');

      if (result.success) {
        this.updateProgress('complete', 100, 'Exportação concluída!');
        return {
          success: true,
          fileName: result.fileName
        };
      } else {
        throw new Error('Falha ao gerar PDF');
      }
    } catch (error) {
      console.error('Erro ao exportar Company One-Pager:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao exportar PDF'
      };
    }
  }

  /**
   * Exporta Cohort Summary Report
   */
  async exportCohortSummary(options: ExportOptions): Promise<ExportResult> {
    try {
      this.updateProgress('preparing', 0, 'Preparando exportação...');

      this.updateProgress('fetching', 25, 'Buscando dados da coorte...');

      this.updateProgress('generating', 50, 'Gerando relatório da coorte...');

      // Se preview está ativado, gera blob ao invés de download
      if (options.preview) {
        const { generateCohortPDFBlob } = await import('@/lib/pdf/preview');
        const blob = await generateCohortPDFBlob(
          options.cohortId,
          {
            includeSummary: true,
            includeRankings: true,
            includeDetailedMetrics: options.includeDetailedStats
          }
        );

        this.updateProgress('complete', 100, 'Preview pronto!');
        return {
          success: true,
          fileName: `preview_cohort_${options.cohortId || 'current'}.pdf`,
          blob
        };
      }

      // Usa a função avançada para download direto
      const result = await generateCohortSummaryAdvanced(
        options.cohortId,
        {
          includeSummary: true,
          includeRankings: true,
          includeDetailedMetrics: options.includeDetailedStats
        }
      );

      this.updateProgress('downloading', 90, 'Preparando download...');

      if (result.success) {
        this.updateProgress('complete', 100, 'Exportação concluída!');
        return {
          success: true,
          fileName: result.fileName
        };
      } else {
        throw new Error('Falha ao gerar PDF');
      }
    } catch (error) {
      console.error('Erro ao exportar Cohort Summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao exportar PDF'
      };
    }
  }

  /**
   * Método unificado de exportação
   * Detecta tipo e chama função apropriada
   */
  async export(options: ExportOptions): Promise<ExportResult> {
    switch (options.type) {
      case 'company-onepager':
        return this.exportCompanyOnePager(options);
      case 'cohort-summary':
        return this.exportCohortSummary(options);
      default:
        return {
          success: false,
          error: `Tipo de exportação não suportado: ${options.type}`
        };
    }
  }

  /**
   * Gera preview do PDF (retorna blob ao invés de baixar)
   */
  async generatePreview(options: ExportOptions): Promise<ExportResult> {
    // TODO: Implementar geração de preview sem download automático
    // Por enquanto, usa o mesmo fluxo mas retorna blob
    return this.export(options);
  }
}

// Singleton instance
export const pdfExportService = new PDFExportService();
