// Botão reutilizável de exportação PDF

import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { PDFExportModal } from './PDFExportModal';
import type { ExportType } from '../types';
import { cn } from '@/design-system/utils';

interface PDFExportButtonProps {
  type: ExportType;
  companyId?: string;
  cohortId?: string;
  companyName?: string;
  cohortName?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Botão de exportação PDF com modal integrado
 * 
 * @example
 * ```tsx
 * <PDFExportButton
 *   type="company-onepager"
 *   companyId="abc123"
 *   companyName="Acme Inc"
 * />
 * ```
 */
export function PDFExportButton({
  type,
  companyId,
  cohortId,
  companyName,
  cohortName,
  variant = 'primary',
  size = 'md',
  className,
  children
}: PDFExportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'inline-flex items-center space-x-2 font-medium rounded-lg transition-colors',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
      >
        <FileText className={iconSizes[size]} />
        <span>{children || 'Exportar PDF'}</span>
      </button>

      <PDFExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        companyId={companyId}
        cohortId={cohortId}
        companyName={companyName}
        cohortName={cohortName}
      />
    </>
  );
}

/**
 * Botão compacto apenas com ícone
 */
export function PDFExportIconButton({
  type,
  companyId,
  cohortId,
  companyName,
  cohortName,
  className
}: Omit<PDFExportButtonProps, 'children' | 'variant' | 'size'>) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors',
          className
        )}
        title="Exportar PDF"
      >
        <Download className="w-5 h-5" />
      </button>

      <PDFExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        companyId={companyId}
        cohortId={cohortId}
        companyName={companyName}
        cohortName={cohortName}
      />
    </>
  );
}
