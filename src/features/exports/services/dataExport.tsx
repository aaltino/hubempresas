import { Download } from 'lucide-react';
import { useState } from 'react';

// Exportar dados para CSV
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }

  // Obter colunas dos dados
  const columns = Object.keys(data[0]);
  
  // Criar header
  const csvHeader = columns.join(',');
  
  // Criar linhas
  const csvRows = data.map(row => {
    return columns.map(column => {
      const value = row[column];
      // Escapar valores com virgula ou aspas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });
  
  // Combinar header e linhas
  const csvContent = [csvHeader, ...csvRows].join('\n');
  
  // Criar blob e download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Exportar dados para XLSX (formato simples, sem biblioteca externa)
export function exportToXLSX(data: any[], filename: string, sheetName: string = 'Dados') {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }

  // Criar formato XML do Excel
  const columns = Object.keys(data[0]);
  
  // Header XML
  let xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${sheetName}">
  <Table>
   <Row>`;
  
  // Adicionar colunas
  columns.forEach(col => {
    xmlContent += `<Cell><Data ss:Type="String">${escapeXml(col)}</Data></Cell>`;
  });
  xmlContent += `</Row>`;
  
  // Adicionar linhas de dados
  data.forEach(row => {
    xmlContent += `<Row>`;
    columns.forEach(col => {
      const value = row[col];
      const type = typeof value === 'number' ? 'Number' : 'String';
      xmlContent += `<Cell><Data ss:Type="${type}">${escapeXml(String(value ?? ''))}</Data></Cell>`;
    });
    xmlContent += `</Row>`;
  });
  
  xmlContent += `</Table>
 </Worksheet>
</Workbook>`;
  
  // Criar blob e download
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Funcao auxiliar para escapar XML
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Interface para opcoes de exportacao
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filename: string;
  data: any[];
  sheetName?: string;
}

// Funcao unificada de exportacao
export async function exportData(options: ExportOptions) {
  const { format, filename, data, sheetName = 'Dados' } = options;

  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }

  try {
    switch (format) {
      case 'csv':
        exportToCSV(data, filename);
        break;
      case 'xlsx':
        exportToXLSX(data, filename, sheetName);
        break;
      case 'pdf':
        // PDF ja e tratado pelo sistema existente
        console.log('Exportacao PDF deve ser tratada pelo sistema de PDF existente');
        break;
      default:
        throw new Error(`Formato nao suportado: ${format}`);
    }
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    alert('Erro ao exportar dados. Tente novamente.');
  }
}

// Componente de botao de exportacao com multiplos formatos
interface ExportButtonProps {
  data: any[];
  filename: string;
  sheetName?: string;
  className?: string;
}

export function ExportDataButton({ data, filename, sheetName = 'Dados', className = '' }: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (format: 'csv' | 'xlsx') => {
    exportData({ format, filename, data, sheetName });
    setShowMenu(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
      >
        <Download className="w-4 h-4" />
        Exportar Dados
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-t-lg transition-colors"
            >
              <div className="font-medium text-gray-900">Exportar CSV</div>
              <div className="text-xs text-gray-500">Arquivo de texto separado por virgulas</div>
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-b-lg transition-colors border-t border-gray-100"
            >
              <div className="font-medium text-gray-900">Exportar XLSX</div>
              <div className="text-xs text-gray-500">Planilha do Microsoft Excel</div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ExportDataButton;
