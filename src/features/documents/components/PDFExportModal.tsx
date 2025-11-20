import { useState, useEffect } from 'react';
import { X, Building, BarChart3, FileDown } from 'lucide-react';
import { getAvailableCompanies, getAvailableCohorts } from '@/lib/pdf';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'company' | 'cohort';
  onExport: (id?: string) => void;
}

export default function PDFExportModal({ 
  isOpen, 
  onClose, 
  exportType, 
  onExport 
}: PDFExportModalProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, exportType]);

  const loadData = async () => {
    try {
      if (exportType === 'company') {
        const companiesData = await getAvailableCompanies();
        setCompanies(companiesData);
      } else {
        const cohortsData = await getAvailableCohorts();
        setCohorts(cohortsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleExport = async () => {
    if (exportType === 'company' && !selectedId) {
      alert('Selecione uma empresa para exportar');
      return;
    }
    
    setLoading(true);
    try {
      await onExport(selectedId || undefined);
      onClose();
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert('Erro ao gerar PDF. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
      setSelectedId('');
    }
  };

  const handleClose = () => {
    setSelectedId('');
    onClose();
  };

  if (!isOpen) return null;

  const title = exportType === 'company' ? 'Exportar PDF da Empresa' : 'Exportar PDF da Coorte';
  const description = exportType === 'company' 
    ? 'Selecione uma empresa para gerar o resumo em PDF' 
    : 'Selecione uma coorte para gerar o resumo estatístico em PDF';
  const IconComponent = exportType === 'company' ? Building : BarChart3;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seleção */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {exportType === 'company' ? 'Selecionar Empresa:' : 'Selecionar Coorte:'}
          </label>
          
          {exportType === 'company' ? (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="">Selecione uma empresa...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} - {company.current_program_key.replace('_', ' ')}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="">Coorte atual (mais recente)</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                    {cohort.start_date && cohort.end_date && (
                      ` (${new Date(cohort.start_date).toLocaleDateString('pt-BR')} - ${new Date(cohort.end_date).toLocaleDateString('pt-BR')})`
                    )}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Deixe em branco para usar a coorte mais recente
              </p>
            </div>
          )}
        </div>

        {/* Informações sobre o PDF */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <FileDown className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">O que será incluído:</h4>
              <ul className="text-xs text-gray-600 mt-1 space-y-1">
                {exportType === 'company' ? (
                  <>
                    <li>• Informações gerais da empresa</li>
                    <li>• Última avaliação e scores por dimensão</li>
                    <li>• Status dos deliverables</li>
                    <li>• Observações e considerações</li>
                  </>
                ) : (
                  <>
                    <li>• Estatísticas gerais da coorte</li>
                    <li>• Distribuição por programa</li>
                    <li>• Médias por dimensão</li>
                    <li>• Lista completa de empresas</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={loading || (exportType === 'company' && !selectedId)}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Gerar PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}