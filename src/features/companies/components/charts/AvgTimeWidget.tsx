import { Clock } from 'lucide-react';
import { HelpTooltip, Tooltip } from '@/design-system/feedback';

interface AvgTimeWidgetProps {
  avgDays: {
    hotel_de_projetos: number;
    pre_residencia: number;
    residencia: number;
  };
}

export default function AvgTimeWidget({ avgDays }: AvgTimeWidgetProps) {
  const programs = [
    { key: 'hotel_de_projetos', label: 'Hotel de Projetos', days: avgDays.hotel_de_projetos, color: 'text-green-600', bg: 'bg-green-100' },
    { key: 'pre_residencia', label: 'Pré-Residência', days: avgDays.pre_residencia, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { key: 'residencia', label: 'Residência', days: avgDays.residencia, color: 'text-purple-600', bg: 'bg-purple-100' }
  ];

  const totalAvg = Object.values(avgDays).reduce((a, b) => a + b, 0) / Object.values(avgDays).length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Tempo Medio no Programa</h3>
            <HelpTooltip content="Numero medio de dias que as empresas permanecem em cada estagio do programa antes de avancar" />
          </div>
          <p className="text-sm text-gray-600 mt-1">Dias de permanência por estágio</p>
        </div>
        <Clock className="w-6 h-6 text-blue-600" />
      </div>

      <div className="space-y-4">
        {programs.map((program) => (
          <div key={program.key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{program.label}</span>
                <HelpTooltip content={`Media de dias que empresas ficam no estagio ${program.label}`} />
              </div>
              <div className="flex items-center space-x-2">
                <Tooltip content={`${program.days || 0} dias em media`}>
                  <div className={`w-10 h-10 ${program.bg} rounded-lg flex items-center justify-center cursor-help`}>
                    <Clock className={`w-5 h-5 ${program.color}`} />
                  </div>
                </Tooltip>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${program.color}`}>
                    {program.days || 0}
                  </p>
                  <p className="text-xs text-gray-500">dias</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Média Geral:</span>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">
              {totalAvg.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">dias</p>
          </div>
        </div>
      </div>
    </div>
  );
}
