// Menu de contexto para ações de exportação PDF
// Fornece opções de download direto, preview e configurações avançadas

import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Eye, Settings, ChevronDown } from 'lucide-react';
import { PDFExportModal } from './PDFExportModal';
import type { ExportType } from '../types';
import { cn } from '@/design-system/utils';

interface ExportActionsMenuProps {
  type: ExportType;
  companyId?: string;
  cohortId?: string;
  companyName?: string;
  cohortName?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

/**
 * Menu dropdown com opções de exportação
 * 
 * @example
 * ```tsx
 * <ExportActionsMenu
 *   type="company-onepager"
 *   companyId="abc123"
 *   companyName="Acme Inc"
 *   label="Exportar"
 * />
 * ```
 */
export function ExportActionsMenu({
  type,
  companyId,
  cohortId,
  companyName,
  cohortName,
  variant = 'outline',
  size = 'md',
  className,
  label = 'Exportar PDF'
}: ExportActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'download' | 'preview'>('download');
  const menuRef = useRef<HTMLDivElement>(null);

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Fecha menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleQuickDownload = () => {
    setModalMode('download');
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handlePreview = () => {
    setModalMode('preview');
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleConfigure = () => {
    setModalMode('download');
    setIsModalOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative inline-block" ref={menuRef}>
        {/* Botão principal */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'inline-flex items-center justify-center space-x-2 font-medium rounded-lg transition-colors',
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
        >
          <FileText className="w-4 h-4" />
          <span>{label}</span>
          <ChevronDown 
            className={cn(
              'w-4 h-4 transition-transform',
              isOpen && 'transform rotate-180'
            )} 
          />
        </button>

        {/* Menu dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
            {/* Download direto */}
            <button
              onClick={handleQuickDownload}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">Download Rápido</div>
                <div className="text-xs text-gray-500">Baixar PDF com configurações padrão</div>
              </div>
            </button>

            {/* Preview */}
            <button
              onClick={handlePreview}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <Eye className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">Visualizar Preview</div>
                <div className="text-xs text-gray-500">Ver antes de baixar</div>
              </div>
            </button>

            {/* Divisor */}
            <div className="my-1 border-t border-gray-200"></div>

            {/* Configurações avançadas */}
            <button
              onClick={handleConfigure}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">Configurar Exportação</div>
                <div className="text-xs text-gray-500">Opções avançadas</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Modal de exportação */}
      <PDFExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        companyId={companyId}
        cohortId={cohortId}
        companyName={companyName}
        cohortName={cohortName}
        mode={modalMode}
      />
    </>
  );
}
