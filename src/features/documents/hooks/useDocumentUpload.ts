import { useState, useCallback } from 'react';
import { DocumentUpload, DocumentUploadProgress, DocumentUploadValidation } from '../types/document';
import { useToast } from '@/design-system/feedback/Toast';
import {
  validateFile,
  validateExternalUrl,
  uploadDocumentFile,
  registerDocumentUpload,
  getCompanyDocuments,
  deleteDocument,
  approveDocument,
  rejectDocument
} from '../services/documentUpload';

interface UseDocumentUploadReturn {
  // Estado
  documents: DocumentUpload[];
  loading: boolean;
  error: string | null;
  
  // Ações de upload
  uploadFile: (
    file: File,
    companyId: string,
    deliverableKey: string,
    deliverableLabel: string
  ) => Promise<{ success: boolean; error?: string; documentId?: string }>;
  
  uploadExternalUrl: (
    url: string,
    companyId: string,
    deliverableKey: string,
    deliverableLabel: string
  ) => Promise<{ success: boolean; error?: string; documentId?: string }>;
  
  // Ações de gerenciamento
  loadDocuments: (companyId: string) => Promise<void>;
  removeDocument: (documentId: string) => Promise<{ success: boolean; error?: string }>;
  approveDocument: (documentId: string, approvedBy: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  rejectDocument: (documentId: string, approvedBy: string, notes: string) => Promise<{ success: boolean; error?: string }>;
  
  // Utilitários
  validateFile: (file: File) => DocumentUploadValidation;
  validateExternalUrl: (url: string) => boolean;
  
  // Limpar erros
  clearError: () => void;
}

/**
 * Hook para gerenciar upload de documentos
 */
export function useDocumentUpload(): UseDocumentUploadReturn {
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    companyId: string,
    deliverableKey: string,
    deliverableLabel: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Validar arquivo
      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return { success: false, error: validation.errors.join(', ') };
      }

      // Upload do arquivo
      const uploadResult = await uploadDocumentFile(file, companyId, deliverableKey);
      if (!uploadResult.fileUrl || uploadResult.error) {
        const errorMsg = uploadResult.error || 'Erro no upload do arquivo';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Registrar no banco
      const registerResult = await registerDocumentUpload(
        companyId,
        deliverableKey,
        deliverableLabel,
        file.name,
        'pdf', // ou detectar baseado no tipo do arquivo
        uploadResult.fileUrl,
        undefined,
        file.size
      );

      if (!registerResult.id || registerResult.error) {
        const errorMsg = registerResult.error || 'Erro ao registrar documento';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Recarregar documentos
      await loadDocuments(companyId);

      addToast({
        type: 'success',
        title: 'Documento enviado com sucesso!',
        description: `O documento foi enviado e registrado com sucesso.`
      });

      return { success: true, documentId: registerResult.id };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido no upload';
      setError(errorMsg);
      addToast({
        type: 'error',
        title: 'Erro ao enviar documento',
        description: errorMsg || 'Verifique o arquivo e tente novamente.'
      });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadExternalUrl = useCallback(async (
    url: string,
    companyId: string,
    deliverableKey: string,
    deliverableLabel: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Validar URL
      if (!validateExternalUrl(url)) {
        const errorMsg = 'URL inválida. Deve ser um endereço HTTP ou HTTPS válido.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Registrar no banco
      const registerResult = await registerDocumentUpload(
        companyId,
        deliverableKey,
        deliverableLabel,
        url, // usar URL como nome do arquivo
        'url',
        undefined,
        url
      );

      if (!registerResult.id || registerResult.error) {
        const errorMsg = registerResult.error || 'Erro ao registrar documento';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Recarregar documentos
      await loadDocuments(companyId);

      addToast({
        type: 'success',
        title: 'Documento enviado com sucesso!',
        description: `O documento foi enviado e registrado com sucesso.`
      });

      return { success: true, documentId: registerResult.id };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido no upload';
      setError(errorMsg);
      addToast({
        type: 'error',
        title: 'Erro ao enviar documento',
        description: errorMsg || 'Verifique o arquivo e tente novamente.'
      });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDocuments = useCallback(async (companyId: string) => {
    try {
      setLoading(true);
      setError(null);

      const docs = await getCompanyDocuments(companyId);
      setDocuments(docs);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao carregar documentos';
      setError(errorMsg);
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeDocument = useCallback(async (documentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await deleteDocument(documentId);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      // Recarregar documentos
      const document = documents.find(d => d.id === documentId);
      if (document) {
        await loadDocuments(document.company_id);
      }

      return { success: true };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao remover documento';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [documents]);

  const approveDocumentDoc = useCallback(async (
    documentId: string,
    approvedBy: string,
    notes?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await approveDocument(documentId, approvedBy, notes);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      // Recarregar documentos
      const document = documents.find(d => d.id === documentId);
      if (document) {
        await loadDocuments(document.company_id);
      }

      return { success: true };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao aprovar documento';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [documents]);

  const rejectDocumentDoc = useCallback(async (
    documentId: string,
    approvedBy: string,
    notes: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = rejectDocument(documentId, approvedBy, notes);
      if ((await result).error) {
        const errorMsg = (await result).error;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Recarregar documentos
      const document = documents.find(d => d.id === documentId);
      if (document) {
        await loadDocuments(document.company_id);
      }

      return { success: true };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao rejeitar documento';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [documents]);

  return {
    // Estado
    documents,
    loading,
    error,
    
    // Ações
    uploadFile,
    uploadExternalUrl,
    loadDocuments,
    removeDocument,
    approveDocument: approveDocumentDoc,
    rejectDocument: rejectDocumentDoc,
    
    // Utilitários
    validateFile,
    validateExternalUrl,
    clearError
  };
}