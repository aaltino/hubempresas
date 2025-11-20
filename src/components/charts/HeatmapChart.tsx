import { HelpTooltip, Tooltip } from '@/design-system/feedback';

interface HeatmapChartProps {
  data: {
    mercado: number;
    perfil_empreendedor: number;
    tecnologia_qualidade: number;
    gestao: number;
    financeiro: number;
  };
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
  const dimensions = [
    { 
      key: 'mercado', 
      label: 'Mercado', 
      score: data.mercado,
      weight: '28%',
      color: getHeatmapColor(data.mercado)
    },
    { 
      key: 'perfil_empreendedor', 
      label: 'Perfil Empreendedor', 
      score: data.perfil_empreendedor,
      weight: '21%',
      color: getHeatmapColor(data.perfil_empreendedor)
    },
    { 
      key: 'tecnologia_qualidade', 
      label: 'Tecnologia & Qualidade', 
      score: data.tecnologia_qualidade,
      weight: '14%',
      color: getHeatmapColor(data.tecnologia_qualidade)
    },
    { 
      key: 'gestao', 
      label: 'Gestão', 
      score: data.gestao,
      weight: '16%',
      color: getHeatmapColor(data.gestao)
    },
    { 
      key: 'financeiro', 
      label: 'Financeiro', 
      score: data.financeiro,
      weight: '16%',
      color: getHeatmapColor(data.financeiro)
    }
  ];

  function getHeatmapColor(score: number): string {
    if (score >= 8) return 'bg-green-500';
    if (score >= 7) return 'bg-green-400';
    if (score >= 6) return 'bg-yellow-400';
    if (score >= 5) return 'bg-orange-400';
    if (score >= 3) return 'bg-red-400';
    return 'bg-red-500';
  }

  function getTextColor(score: number): string {
    if (score >= 8) return 'text-green-700';
    if (score >= 7) return 'text-green-600';
    if (score >= 6) return 'text-yellow-700';
    if (score >= 5) return 'text-orange-700';
    return 'text-red-700';
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Heatmap por Dimensão</h3>
          <HelpTooltip content="Avaliação média das empresas em cada dimensão de negócio. Escala de 0 a 10, onde 8+ é excelente, 6-7.9 é bom e abaixo de 6 é crítico." />
        </div>
        <p className="text-sm text-gray-600 mt-1">Média geral dos scores</p>
      </div>

      <div className="space-y-4">
        {dimensions.map((dim) => (
          <div key={dim.key}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Tooltip content={`Score na dimensão ${dim.label}: ${dim.score?.toFixed(1) || '0.0'}/10`}>
                  <span className="text-sm font-medium text-gray-700 cursor-help">
                    {dim.label}
                  </span>
                </Tooltip>
                <span className="text-xs text-gray-500 font-medium">
                  (Peso: {dim.weight})
                </span>
                <HelpTooltip content={`Avaliação da ${dim.label} - influencia ${dim.weight} do score geral`} />
              </div>
              <Tooltip content={`Score: ${dim.score?.toFixed(1) || '0.0'}/10 na dimensão ${dim.label}`}>
                <span className={`text-sm font-bold ${getTextColor(dim.score)} cursor-help`}>
                  {dim.score?.toFixed(1) || '0.0'}/10
                </span>
              </Tooltip>
            </div>
            
            <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              <Tooltip content={`${((dim.score || 0) / 10) * 100}% da pontuação máxima na dimensão ${dim.label}`}>
                <div
                  className={`${dim.color} h-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-500 cursor-help`}
                  style={{ width: `${((dim.score || 0) / 10) * 100}%` }}
                >
                  {dim.score > 2 && dim.score.toFixed(1)}
                </div>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Excelente (8-10)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span className="text-gray-600">Bom (6-7.9)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span className="text-gray-600">Crítico (&lt;6)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
