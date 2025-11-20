// Tipos específicos da feature documents
export interface PDFExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'A4' | 'A3';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface PDFDocumentData {
  companyName: string;
  companyDescription?: string;
  programName: string;
  currentDate: string;
  evaluations: Array<{
    date: string;
    weightedScore: number;
    dimensions: {
      mercado: number;
      perfil_empreendedor: number;
      tecnologia_qualidade: number;
      gestao: number;
      financeiro: number;
    };
    gate: string;
    notes?: string;
  }>;
  deliverables: Array<{
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    dueDate: string;
    description?: string;
  }>;
}

// Tipos de documentos suportados
export type DocumentType = 'one_pager' | 'evaluation_report' | 'progress_report' | 'company_profile';

// Formatos de exportação suportados
export type ExportFormat = 'pdf' | 'docx' | 'html';

// Novos tipos para upload de documentos
export type UploadDocumentType = 'pdf' | 'docx' | 'url';

export interface DocumentUpload {
  id: string;
  company_id: string;
  deliverable_key: string;
  deliverable_label: string;
  file_name: string;
  file_type: UploadDocumentType;
  file_size?: number;
  file_url?: string;
  external_url?: string;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  uploaded_at: string;
  approved_at?: string;
  approved_by?: string;
  notes?: string;
}

export interface DocumentUploadProgress {
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface DocumentUploadValidation {
  isValid: boolean;
  errors: string[];
}

export interface DocumentUploadOptions {
  maxFileSize: number; // em bytes
  allowedTypes: UploadDocumentType[];
  requiredDeliverables?: string[];
}