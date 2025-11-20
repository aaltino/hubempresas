import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, X, ExternalLink, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, Button } from '@/design-system/ui';
import { Progress } from '@/design-system/feedback';
import { useDocumentUpload } from '../hooks/useDocumentUpload';

interface DocumentUploadProps {
  companyId: string;
  requiredDeliverables: Array<{
    key: string;
    label: string;
    approval_required: boolean;
  }>;
  currentDocuments?: Array<{
    deliverable_key: string;
    deliverable_label: string;
    status: string;
  }>;
  onDocumentUploaded?: () => void;
  className?: string;
}

export function DocumentUpload({
  companyId,
  requiredDeliverables,
  currentDocuments = [],
  onDocumentUploaded,
  className = ''
}: DocumentUploadProps) {
  const {
    uploadFile,
    uploadExternalUrl,
    loadDocuments,
    documents,
    loading,
    error,
    clearError
  } = useDocumentUpload();

  const [dragActive, setDragActive] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [externalUrl, setExternalUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar documentos ao montar componente
  React.useEffect(() => {
    if (companyId) {
      loadDocuments(companyId);
    }
  }, [companyId, loadDocuments]);

  // Calcular quais deliverables já têm documentos
  const deliveredKeys = new Set(currentDocuments.map(d => d.deliverable_key));
  const missingDeliverables = requiredDeliverables.filter(
    req => !deliveredKeys.has(req.key)
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [selectedDeliverable]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [selectedDeliverable]);

  const handleFileUpload = async (file: File) => {
    if (!selectedDeliverable) {
      alert('Selecione um deliverable primeiro');
      return;
    }

    const deliverable = requiredDeliverables.find(d => d.key === selectedDeliverable);
    if (!deliverable) {
      alert('Deliverable não encontrado');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadFile(
        file,
        companyId,
        selectedDeliverable,
        deliverable.label
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        alert('Documento enviado com sucesso!');
        onDocumentUploaded?.();
        setSelectedDeliverable('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert(`Erro no upload: ${result.error}`);
      }

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro no upload do documento');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUrlUpload = async () => {
    if (!selectedDeliverable || !externalUrl.trim()) {
      alert('Selecione um deliverable e digite uma URL válida');
      return;
    }

    const deliverable = requiredDeliverables.find(d => d.key === selectedDeliverable);
    if (!deliverable) {
      alert('Deliverable não encontrado');
      return;
    }

    setUploading(true);

    try {
      const result = await uploadExternalUrl(
        externalUrl.trim(),
        companyId,
        selectedDeliverable,
        deliverable.label
      );

      if (result.success) {
        alert('URL adicionada com sucesso!');
        onDocumentUploaded?.();
        setSelectedDeliverable('');
        setExternalUrl('');
      } else {
        alert(`Erro ao adicionar URL: ${result.error}`);
      }

    } catch (error) {
      console.error('Erro no upload da URL:', error);
      alert('Erro ao adicionar URL do documento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <Card className="p-6 border-2 border-blue-200 shadow-lg">
        <div className="space-y-6">
          {/* Header com destaque */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 -m-6 mb-6 p-6 rounded-t-lg border-b-2 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg shadow-md">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Upload de Documentos
                </h3>
                <p className="text-sm text-gray-700 font-medium">
                  Faça upload dos deliverables obrigatórios da empresa
                </p>
              </div>
            </div>
          </div>

          {/* Seletor de Deliverable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Deliverable *
            </label>
            <select
              value={selectedDeliverable}
              onChange={(e) => setSelectedDeliverable(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={uploading}
            >
              <option value="">Escolha um deliverable...</option>
              {requiredDeliverables.map((deliv) => (
                <option key={deliv.key} value={deliv.key}>
                  {deliv.label} {deliv.approval_required ? '(Obrigatório)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Upload Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modo de Upload
            </label>
            <div className="inline-flex rounded-lg border-2 border-blue-200 p-1 bg-white shadow-md">
              <button
                type="button"
                className={`px-5 py-3 text-sm font-semibold rounded-md transition-all duration-200 ${
                  uploadMode === 'file'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setUploadMode('file')}
                disabled={uploading}
              >
                <Upload className="w-5 h-5 inline mr-2" />
                Arquivo
              </button>
              <button
                type="button"
                className={`px-5 py-3 text-sm font-semibold rounded-md transition-all duration-200 ${
                  uploadMode === 'url'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setUploadMode('url')}
                disabled={uploading}
              >
                <ExternalLink className="w-5 h-5 inline mr-2" />
                URL Externa
              </button>
            </div>
          </div>

          {/* Upload por Arquivo */}
          {uploadMode === 'file' && (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Arraste e solte o arquivo aqui
              </p>
              <p className="text-sm text-gray-600 mb-4">
                ou clique para selecionar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading || !selectedDeliverable}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                disabled={uploading || !selectedDeliverable}
              >
                <Upload className="w-5 h-5 mr-2" />
                Selecionar Arquivo
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Formatos aceitos: PDF, DOCX (máx. 10MB)
              </p>
            </div>
          )}

          {/* Upload por URL */}
          {uploadMode === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do Documento
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://exemplo.com/documento.pdf"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={uploading}
                />
              </div>
              <Button
                type="button"
                onClick={handleUrlUpload}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                disabled={uploading || !selectedDeliverable || !externalUrl.trim()}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Adicionar URL
              </Button>
            </div>
          )}

          {/* Progress de Upload */}
          {uploading && uploadMode === 'file' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fazendo upload...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={clearError}
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Deliverables em Falta */}
          {missingDeliverables.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">
                Deliverables Pendentes
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {missingDeliverables.map((deliv) => (
                  <li key={deliv.key}>
                    • {deliv.label} {deliv.approval_required ? '(Obrigatório)' : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default DocumentUpload;