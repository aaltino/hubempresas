import { CheckCircle, Clock, Circle } from 'lucide-react';
import { Tooltip } from '@/design-system/feedback';

interface Stage {
  key: string;
  label: string;
  completed: boolean;
  current: boolean;
  completedAt?: string;
}

interface CompanyProgressBarProps {
  stages: Stage[];
  className?: string;
}

export function CompanyProgressBar({ stages, className = '' }: CompanyProgressBarProps) {
  const completedCount = stages.filter(s => s.completed).length;
  const totalCount = stages.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Progresso da Empresa</h3>
          <span className="text-sm font-medium text-gray-600">
            {completedCount} de {totalCount} estagios
          </span>
        </div>
        
        {/* Barra de progresso geral */}
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
          </div>
        </div>
        
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span className="font-medium text-blue-600">{progressPercentage.toFixed(0)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Timeline de estagios */}
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <Tooltip
            key={stage.key}
            content={
              stage.completed
                ? `Concluido em ${stage.completedAt || 'data nao disponivel'}`
                : stage.current
                ? 'Estagio atual'
                : 'Nao iniciado'
            }
            position="top"
          >
            <div
              className={`relative flex items-center p-3 rounded-lg border-2 transition-all cursor-help ${
                stage.completed
                  ? 'bg-green-50 border-green-300'
                  : stage.current
                  ? 'bg-blue-50 border-blue-400 shadow-md'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Icone de status */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  stage.completed
                    ? 'bg-green-500'
                    : stage.current
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-300'
                }`}
              >
                {stage.completed ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : stage.current ? (
                  <Clock className="w-6 h-6 text-white" />
                ) : (
                  <Circle className="w-6 h-6 text-white" />
                )}
              </div>

              {/* Informacoes do estagio */}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-semibold ${
                      stage.completed
                        ? 'text-green-900'
                        : stage.current
                        ? 'text-blue-900'
                        : 'text-gray-600'
                    }`}
                  >
                    {stage.label}
                  </h4>
                  
                  {stage.completed && (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      Concluido
                    </span>
                  )}
                  {stage.current && (
                    <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full animate-pulse">
                      Em progresso
                    </span>
                  )}
                  {!stage.completed && !stage.current && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      Pendente
                    </span>
                  )}
                </div>
                
                {stage.completedAt && stage.completed && (
                  <p className="text-xs text-green-700 mt-1">
                    Concluido em {stage.completedAt}
                  </p>
                )}
              </div>

              {/* Linha conectora (exceto no ultimo) */}
              {index < stages.length - 1 && (
                <div
                  className={`absolute left-[1.25rem] top-[3.5rem] w-0.5 h-6 ${
                    stage.completed ? 'bg-green-300' : 'bg-gray-200'
                  }`}
                ></div>
              )}
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Resumo */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-600">Concluidos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {stages.filter(s => s.current).length}
            </p>
            <p className="text-xs text-gray-600">Atual</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">
              {stages.filter(s => !s.completed && !s.current).length}
            </p>
            <p className="text-xs text-gray-600">Pendentes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyProgressBar;
