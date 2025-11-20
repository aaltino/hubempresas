import { Plus, FileText, Filter, Download, Users, Building2, FileDown, BarChart3, Building } from 'lucide-react';
import { useState } from 'react';

interface QuickActionsProps {
  onNewCompany?: () => void;
  onNewEvaluation?: () => void;
  onExport?: () => void;
  onFilter?: () => void;
  userRole?: string;
  onExportCompanyPDF?: (companyId?: string) => void;
  onExportCohortPDF?: (cohortId?: string) => void;
}

export default function QuickActions({ 
  onNewCompany, 
  onNewEvaluation, 
  onExport, 
  onFilter,
  userRole = 'admin',
  onExportCompanyPDF,
  onExportCohortPDF
}: QuickActionsProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const actions = [
    {
      label: 'Nova Empresa',
      icon: Building2,
      onClick: onNewCompany,
      color: 'bg-blue-600 hover:bg-blue-700',
      show: userRole === 'admin'
    },
    {
      label: 'Nova Avaliação',
      icon: FileText,
      onClick: onNewEvaluation,
      color: 'bg-green-600 hover:bg-green-700',
      show: userRole === 'admin' || userRole === 'mentor'
    },
    {
      label: 'Exportar PDF',
      icon: Download,
      onClick: () => setShowExportMenu(!showExportMenu),
      color: 'bg-purple-600 hover:bg-purple-700',
      show: true,
      hasSubmenu: true
    },
    {
      label: 'Filtrar',
      icon: Filter,
      onClick: onFilter,
      color: 'bg-gray-600 hover:bg-gray-700',
      show: true
    }
  ];

  const exportActions = [
    {
      label: 'Resumo da Empresa',
      icon: Building,
      onClick: onExportCompanyPDF,
      description: 'Gerar PDF com dados de uma empresa específica'
    },
    {
      label: 'Resumo da Coorte',
      icon: BarChart3,
      onClick: onExportCohortPDF,
      description: 'Gerar PDF com estatísticas da coorte'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Ações Rápidas</h3>
      <div className="space-y-2">
        {actions.filter(action => action.show).map((action) => (
          <div key={action.label} className="relative">
            <button
              onClick={action.onClick}
              className={`w-full flex items-center space-x-3 px-4 py-3 ${action.color} text-white rounded-lg transition-all transform hover:scale-105 shadow-sm`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{action.label}</span>
              {action.hasSubmenu && (
                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            
            {/* Menu de Exportação */}
            {action.hasSubmenu && showExportMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  {exportActions.map((exportAction) => (
                    <button
                      key={exportAction.label}
                      onClick={() => {
                        exportAction.onClick?.();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-start space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <exportAction.icon className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{exportAction.label}</div>
                        <div className="text-xs text-gray-500">{exportAction.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Overlay para fechar menu ao clicar fora */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}
