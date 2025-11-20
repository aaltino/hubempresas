import React from 'react';
import { File, ExternalLink, Download, Trash2, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Card, Button } from '@/design-system/ui';
import { Badge } from '@/design-system/feedback';
import { DocumentUpload } from '../types/document';
import { useDocumentUpload } from '../hooks/useDocumentUpload';

interface DocumentHistoryProps {
  companyId: string;
  documents: DocumentUpload[];
  isEditable?: boolean;
  onDocumentUpdate?: () => void;
  className?: string;
}

export function DocumentHistory({
  companyId,
  documents: initialDocuments,
  isEditable = false,
  onDocumentUpdate,
  className = ''
}: DocumentHistoryProps) {
  const { removeDocument, loadDocuments, documents: loadedDocuments, loading } = useDocumentUpload();
  
  // Usar documentos carregados se initialDocuments estiver vazio
  const documents = initialDocuments.length > 0 ? initialDocuments : loadedDocuments;

  // Carregar documentos ao montar componente se não foram passados
  React.useEffect(() => {
    if (companyId && initialDocuments.length === 0) {
      loadDocuments(companyId);
    }
  }, [companyId, initialDocuments.length, loadDocuments]);

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      const result = await removeDocument(documentId);
      if (result.success) {
        onDocumentUpdate?.();
      } else {
        alert(`Erro ao excluir documento: ${result.error}`);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'uploaded':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge status="success">Aprovado</Badge>;
      case 'rejected':
        return <Badge status="error">Rejeitado</Badge>;
      case 'uploaded':
        return <Badge status="info">Enviado</Badge>;
      default:
        return <Badge status="warning">Pendente</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handlePreview = (document: DocumentUpload) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    } else if (document.external_url) {
      window.open(document.external_url, '_blank');
    }
  };

  const handleDownload = (doc: DocumentUpload) => {
    const url = doc.file_url || doc.external_url;
    if (url) {
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  if (documents.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum documento enviado
          </h3>
          <p className="text-sm text-gray-600">
            Use o formulário acima para fazer upload dos deliverables
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Histórico de Documentos
            </h3>
            <p className="text-sm text-gray-600">
              Documentos enviados pela empresa
            </p>
          </div>

          {/* Lista de Documentos */}
          <div className="space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {document.file_type === 'url' ? (
                        <ExternalLink className="w-5 h-5 text-blue-600" />
                      ) : (
                        <File className="w-5 h-5 text-gray-600" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {document.deliverable_label}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {document.file_name}
                          {document.file_size && ` • ${formatFileSize(document.file_size)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-3">
                      {getStatusIcon(document.status)}
                      {getStatusBadge(document.status)}
                      <span className="text-xs text-gray-500">
                        Enviado em {new Date(document.uploaded_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {document.approved_at && (
                      <div className="text-xs text-gray-500">
                        {document.status === 'approved' ? 'Aprovado' : 'Rejeitado'} em{' '}
                        {new Date(document.approved_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}

                    {document.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <p className="text-gray-700">{document.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Preview/Download */}
                    {(document.file_url || document.external_url) && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePreview(document)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {document.file_type !== 'url' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}

                    {/* Excluir */}
                    {isEditable && document.status !== 'approved' && (
                      <Button
                        variant="error"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {documents.filter(d => d.status === 'uploaded').length}
                </p>
                <p className="text-sm text-gray-600">Enviados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Aprovados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {documents.filter(d => d.status === 'rejected').length}
                </p>
                <p className="text-sm text-gray-600">Rejeitados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default DocumentHistory;