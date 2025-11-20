import { Building2 } from 'lucide-react';
import { HelpTooltip, Tooltip } from '@/design-system/feedback';

interface FunnelChartProps {
  data: {
    hotel_de_projetos: number;
    pre_residencia: number;
    residencia: number;
  };
  total: number;
}

export default function FunnelChart({ data, total }: FunnelChartProps) {
  const stages = [
    { 
      key: 'hotel_de_projetos', 
      label: 'Hotel de Projetos',
      count: data.hotel_de_projetos,
      color: 'bg-green-500',
      percentage: total > 0 ? (data.hotel_de_projetos / total) * 100 : 0
    },
    { 
      key: 'pre_residencia', 
      label: 'Pré-Residência',
      count: data.pre_residencia,
      color: 'bg-yellow-500',
      percentage: total > 0 ? (data.pre_residencia / total) * 100 : 0
    },
    { 
      key: 'residencia', 
      label: 'Residência',
      count: data.residencia,
      color: 'bg-purple-500',
      percentage: total > 0 ? (data.residencia / total) * 100 : 0
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Funil por Estágio do Programa</h3>
          <HelpTooltip content="Visualização do fluxo de empresas através dos estágios do programa de aceleração. Mostra a quantidade e percentual de empresas em cada fase." />
        </div>
        <Building2 className="w-6 h-6 text-blue-600" />
      </div>

      <div className="space-y-6">
        {stages.map((stage, index) => {
          const width = 100 - (index * 15); // Efeito funil
          
          return (
            <div key={stage.key} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                  <HelpTooltip content={`Empresas atualmente no estágio ${stage.label} do programa de aceleração`} />
                </div>
                <Tooltip content={`${stage.count} empresas (${stage.percentage.toFixed(1)}% do total)`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">{stage.count} empresas</span>
                    <span className="text-xs text-gray-500">({stage.percentage.toFixed(0)}%)</span>
                  </div>
                </Tooltip>
              </div>
              
              <div className="flex justify-center">
                <Tooltip content={`${stage.count} empresas no estágio ${stage.label} - ${stage.percentage.toFixed(1)}% do total`}>
                  <div 
                    className={`${stage.color} h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-md transition-all hover:shadow-lg cursor-help`}
                    style={{ width: `${width}%` }}
                  >
                    {stage.count}
                  </div>
                </Tooltip>
              </div>

              {/* Seta de conexão */}
              {index < stages.length - 1 && (
                <div className="flex justify-center mt-2">
                  <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-300"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total de Empresas:</span>
          <span className="text-lg font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
}
