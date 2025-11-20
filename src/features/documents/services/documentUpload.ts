import { supabase } from '@/lib/supabase';
import { DocumentUpload, DocumentUploadValidation, UploadDocumentType } from '../types/document';

// Configurações de upload
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['pdf', 'docx'] as UploadDocumentType[],
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
};

const STORAGE_BUCKET = 'company-documents';
const STORAGE_PATH_PREFIX = 'documents/';

/**
 * Valida arquivo antes do upload
 */
export function validateFile(file: File): DocumentUploadValidation {
  const errors: string[] = [];

  // Verificar tamanho do arquivo
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    errors.push(`Arquivo muito grande. Máximo permitido: ${(UPLOAD_CONFIG.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
  }

  // Verificar tipo MIME
  if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)) {
    errors.push('Tipo de arquivo não permitido. Use apenas PDF ou DOCX.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida URL externa
 */
export function validateExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Gera path do arquivo no Storage
 */
function generateFilePath(companyId: string, deliverableKey: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${STORAGE_PATH_PREFIX}${companyId}/${deliverableKey}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Faz upload do arquivo para Supabase Storage
 */
export async function uploadDocumentFile(
  file: File,
  companyId: string,
  deliverableKey: string
): Promise<{ fileUrl: string; error?: string }> {
  try {
    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.isValid) {
      return { 
        fileUrl: '', 
        error: validation.errors.join(', ') 
      };
    }

    // Gerar caminho do arquivo
    const filePath = generateFilePath(companyId, deliverableKey, file.name);

    // Upload para Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { fileUrl: '', error: error.message };
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return { fileUrl: '', error: 'Erro ao gerar URL pública do arquivo' };
    }

    return { fileUrl: publicUrlData.publicUrl };

  } catch (error) {
    return { 
      fileUrl: '', 
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload' 
    };
  }
}

/**
 * Registra documento no banco de dados
 */
export async function registerDocumentUpload(
  companyId: string,
  deliverableKey: string,
  deliverableLabel: string,
  fileName: string,
  fileType: UploadDocumentType,
  fileUrl?: string,
  externalUrl?: string,
  fileSize?: number
): Promise<{ id: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('company_documents')
      .insert({
        company_id: companyId,
        deliverable_key: deliverableKey,
        deliverable_label: deliverableLabel,
        file_name: fileName,
        file_type: fileType,
        file_url: fileUrl,
        external_url: externalUrl,
        file_size: fileSize,
        status: 'uploaded',
        uploaded_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      return { id: '', error: error.message };
    }

    return { id: data.id };

  } catch (error) {
    return { 
      id: '', 
      error: error instanceof Error ? error.message : 'Erro ao registrar documento' 
    };
  }
}

/**
 * Busca documentos da empresa
 */
export async function getCompanyDocuments(companyId: string): Promise<DocumentUpload[]> {
  try {
    const { data, error } = await supabase
      .from('company_documents')
      .select('*')
      .eq('company_id', companyId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    return [];
  }
}

/**
 * Deleta documento
 */
export async function deleteDocument(documentId: string): Promise<{ error?: string }> {
  try {
    // Buscar informações do documento
    const { data: document, error: fetchError } = await supabase
      .from('company_documents')
      .select('file_url, file_type')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      return { error: fetchError.message };
    }

    // Se tem arquivo no storage, deletar
    if (document?.file_url && document?.file_type !== 'url') {
      // Extrair path do arquivo da URL
      const url = new URL(document.file_url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-3).join('/'); // companyId/deliverableKey/filename

      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);
    }

    // Deletar registro do banco
    const { error: deleteError } = await supabase
      .from('company_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    return {};

  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Erro ao deletar documento' 
    };
  }
}

/**
 * Aprova documento (apenas mentores/admins)
 */
export async function approveDocument(
  documentId: string,
  approvedBy: string,
  notes?: string
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('company_documents')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy,
        notes: notes
      })
      .eq('id', documentId);

    if (error) {
      return { error: error.message };
    }

    return {};

  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Erro ao aprovar documento' 
    };
  }
}

/**
 * Rejeita documento
 */
export async function rejectDocument(
  documentId: string,
  approvedBy: string,
  notes: string
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('company_documents')
      .update({
        status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy,
        notes: notes
      })
      .eq('id', documentId);

    if (error) {
      return { error: error.message };
    }

    return {};

  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Erro ao rejeitar documento' 
    };
  }
}