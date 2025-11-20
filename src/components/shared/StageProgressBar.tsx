import { CheckCircle, Circle } from 'lucide-react';

interface StageProgressBarProps {
  currentProgram: 'hotel_de_projetos' | 'pre_residencia' | 'residencia';
  completionPercent?: number;
}

const stages = [
  { key: 'hotel_de_projetos', label: 'Hotel de Projetos', shortLabel: 'Hotel' },
  { key: 'pre_residencia', label: 'Pré-Residência', shortLabel: 'Pré-Res' },
  { key: 'residencia', label: 'Residência', shortLabel: 'Res' }
];

export default function StageProgressBar({ currentProgram, completionPercent = 0 }: StageProgressBarProps) {
  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.key === currentProgram);
  };

  const currentIndex = getCurrentStageIndex();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div key={stage.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                ${index < currentIndex 
                  ? 'bg-green-500 text-white' 
                  : index === currentIndex 
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200' 
                    : 'bg-gray-200 text-gray-500'
                }
              `}>
                {index < currentIndex ? (
                  <CheckCircle className="w-6 h-6" />
                ) : index === currentIndex ? (
                  <Circle className="w-6 h-6 fill-current" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </div>
              <span className={`
                text-xs font-medium mt-2 text-center
                ${index === currentIndex ? 'text-blue-600 font-bold' : 'text-gray-600'}
              `}>
                {stage.shortLabel}
              </span>
              {index === currentIndex && (
                <span className="text-xs text-gray-500 mt-1">
                  ({completionPercent}%)
                </span>
              )}
            </div>
            {index < stages.length - 1 && (
              <div className={`
                h-1 flex-1 mx-2 rounded
                ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'}
              `}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
