import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AdvanceRateWidgetProps {
  rates: {
    hotel_to_pre: number; // Percentual de empresas que avançaram do Hotel para Pré
    pre_to_res: number; // Percentual de empresas que avançaram de Pré para Res
    overall: number; // Taxa geral de avanço
  };
  cohortName?: string;
}

export default function AdvanceRateWidget({ rates, cohortName = 'Atual' }: AdvanceRateWidgetProps) {
  const getTrendIcon = (rate: number) => {
    if (rate >= 70) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (rate >= 40) return <Minus className="w-5 h-5 text-yellow-600" />;
    return <TrendingDown className="w-5 h-5 text-red-600" />;
  };

  const getTrendColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendBg = (rate: number) => {
    if (rate >= 70) return 'bg-green-100';
    if (rate >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const transitions = [
    {
      label: 'Hotel → Pré-Residência',
      rate: rates.hotel_to_pre,
      description: 'Taxa de avanço'
    },
    {
      label: 'Pré-Residência → Residência',
      rate: rates.pre_to_res,
      description: 'Taxa de avanço'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Taxa de Avanço por Cohort</h3>
        <p className="text-sm text-gray-600 mt-1">Cohort: <span className="font-medium">{cohortName}</span></p>
      </div>

      <div className="space-y-4">
        {transitions.map((transition, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{transition.label}</span>
              <div className={`w-8 h-8 ${getTrendBg(transition.rate)} rounded-lg flex items-center justify-center`}>
                {getTrendIcon(transition.rate)}
              </div>
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-3xl font-bold ${getTrendColor(transition.rate)}`}>
                  {transition.rate.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{transition.description}</p>
              </div>
              
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${transition.rate >= 70 ? 'bg-green-500' : transition.rate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${transition.rate}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t-2 border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Taxa Geral de Avanço</p>
            <p className="text-xs text-gray-500 mt-1">Média do cohort</p>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-bold ${getTrendColor(rates.overall)}`}>
              {rates.overall.toFixed(0)}%
            </p>
            <div className="flex items-center justify-end mt-1 space-x-1">
              {getTrendIcon(rates.overall)}
              <span className={`text-xs font-medium ${getTrendColor(rates.overall)}`}>
                {rates.overall >= 70 ? 'Excelente' : rates.overall >= 40 ? 'Regular' : 'Baixo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">≥70% Excelente</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">40-69% Regular</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">&lt;40% Baixo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
