// Tipos para sistema de exportação PDF

export type ExportType = 'company-onepager' | 'cohort-summary';

export type ExportStatus = 'idle' | 'loading' | 'generating' | 'success' | 'error';

export interface ExportOptions {
  type: ExportType;
  companyId?: string;
  cohortId?: string;
  includeVisualHeader?: boolean;
  includeCohortStats?: boolean;
  includeDeliverables?: boolean;
  includeDetailedStats?: boolean;
  detailedView?: boolean;
  customFilename?: string;
  preview?: boolean;
}

export interface ExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
  blob?: Blob;
}

export interface ExportProgress {
  stage: 'preparing' | 'fetching' | 'generating' | 'downloading' | 'complete';
  progress: number;
  message: string;
}
