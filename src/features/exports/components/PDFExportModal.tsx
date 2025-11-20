// Modal de exportação PDF

import { useState, useEffect } from 'react';
import { X, FileText, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePDFExport } from '../hooks/usePDFExport';
import type { ExportType } from '../types';
import { cn } from '@/design-system/utils';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ExportType;
  companyId?: string;
  cohortId?: string;
  companyName?: string;
  cohortName?: string;
  mode?: 'download' | 'preview';
}

export function PDFExportModal({
  isOpen,
  onClose,
  type,
  companyId,
  cohortId,
  companyName,
  cohortName,
  mode = 'download'
}: PDFExportModalProps) {
  const { exportPDF, status, progress, error, reset } = usePDFExport();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [options, setOptions] = useState({
    includeVisualHeader: true,
    includeCohortStats: true,
    includeDeliverables: true,
    includeDetailedStats: true,
    detailedView: true,
    preview: mode === 'preview'
  });

  // Reset ao abrir/fechar modal
  useEffect(() => {
    if (isOpen) {
      reset();
      setPreviewUrl(null);
      setOptions(prev => ({ ...prev, preview: mode === 'preview' }));
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, mode, reset]);

  const handleExport = async () => {
    const result = await exportPDF({
      type,
      companyId,
      cohortId,
      ...options
    });

    // Se é preview e retornou blob, criar URL
    if (mode === 'preview' && result?.blob) {
      const url = URL.createObjectURL(result.blob);
      setPreviewUrl(url);
    }
  };

  const handleClose = () => {
    if (status !== 'loading' && status !== 'generating') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isCompanyExport = type === 'company-onepager';
  const title = isCompanyExport 
    ? `Exportar Relatório: ${companyName || 'Empresa'}`
    : `Exportar Relatório: ${cohortName || 'Coorte'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={status === 'loading' || status === 'generating'}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Opções de exportação */}
          {status === 'idle' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Configure as opções de exportação do relatório PDF:
              </p>

              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={options.includeVisualHeader}
                    onChange={(e) => setOptions({ ...options, includeVisualHeader: e.target.checked })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Header visual</span>
                    <br />
                    <span className="text-gray-500">Incluir cabeçalho com branding</span>
                  </span>
                </label>

                {isCompanyExport ? (
                  <>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={options.includeCohortStats}
                        onChange={(e) => setOptions({ ...options, includeCohortStats: e.target.checked })}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        <span className="font-medium">Estatísticas da coorte</span>
                        <br />
                        <span className="text-gray-500">Comparar com outras empresas</span>
                      </span>
                    </label>

                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={options.includeDeliverables}
                        onChange={(e) => setOptions({ ...options, includeDeliverables: e.target.checked })}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        <span className="font-medium">Entregas</span>
                        <br />
                        <span className="text-gray-500">Status de deliverables</span>
                      </span>
                    </label>

                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={options.detailedView}
                        onChange={(e) => setOptions({ ...options, detailedView: e.target.checked })}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        <span className="font-medium">Visão detalhada</span>
                        <br />
                        <span className="text-gray-500">Métricas e avaliações completas</span>
                      </span>
                    </label>
                  </>
                ) : (
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={options.includeDetailedStats}
                      onChange={(e) => setOptions({ ...options, includeDetailedStats: e.target.checked })}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      <span className="font-medium">Estatísticas detalhadas</span>
                      <br />
                      <span className="text-gray-500">Análise completa da coorte</span>
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Progress */}
          {(status === 'loading' || status === 'generating') && progress && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-gray-700">
                  {progress.message}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                {progress.progress}% concluído
              </p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && !previewUrl && (
            <div className="flex flex-col items-center space-y-3 py-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <p className="text-lg font-medium text-gray-900">
                Exportação concluída!
              </p>
              <p className="text-sm text-gray-600 text-center">
                O download do PDF foi iniciado automaticamente.
              </p>
            </div>
          )}

          {/* Preview */}
          {status === 'success' && previewUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  Preview do PDF
                </p>
                <a
                  href={previewUrl}
                  download
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Baixar PDF
                </a>
              </div>
              <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <div className="flex flex-col items-center space-y-3 py-4">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <p className="text-lg font-medium text-gray-900">
                Erro na exportação
              </p>
              <p className="text-sm text-red-600 text-center">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {status === 'idle' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar PDF</span>
              </button>
            </>
          )}

          {(status === 'success' || status === 'error') && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
