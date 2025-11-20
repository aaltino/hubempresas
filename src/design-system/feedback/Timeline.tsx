// Componente StageProgressBar refatorado do Design System

import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '../utils';

interface StageProgressBarProps {
  stages: Array<{
    key: string;
    label: string;
    shortLabel: string;
  }>;
  currentStage: string;
  completionPercent?: number;
  className?: string;
}

export function StageProgressBar({ 
  stages, 
  currentStage, 
  completionPercent = 0,
  className 
}: StageProgressBarProps) {
  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.key === currentStage);
  };

  const currentIndex = getCurrentStageIndex();

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div key={stage.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                index < currentIndex 
                  ? 'bg-green-500 text-white' 
                  : index === currentIndex 
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200' 
                    : 'bg-gray-200 text-gray-500'
              )}>
                {index < currentIndex ? (
                  <CheckCircle className="w-6 h-6" />
                ) : index === currentIndex ? (
                  <Circle className="w-6 h-6 fill-current" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium mt-2 text-center",
                index === currentIndex ? 'text-blue-600 font-bold' : 'text-gray-600'
              )}>
                {stage.shortLabel}
              </span>
              {index === currentIndex && completionPercent > 0 && (
                <span className="text-xs text-gray-500 mt-1">
                  ({completionPercent}%)
                </span>
              )}
            </div>
            {index < stages.length - 1 && (
              <div className={cn(
                "h-1 flex-1 mx-2 rounded transition-colors",
                index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente Timeline para visualização mais avançada
export function Timeline({
  items,
  orientation = 'vertical',
  showConnector = true,
  className
}: {
  items: Array<{
    id: string;
    title: string;
    description?: string;
    status: 'completed' | 'current' | 'upcoming';
    timestamp?: string;
    icon?: React.ReactNode;
  }>;
  orientation?: 'vertical' | 'horizontal';
  showConnector?: boolean;
  className?: string;
}) {
  const statusClasses = {
    completed: 'bg-green-500 text-white',
    current: 'bg-blue-500 text-white ring-4 ring-blue-200',
    upcoming: 'bg-gray-200 text-gray-500'
  };

  const connectorClasses = {
    completed: 'bg-green-500',
    current: 'bg-blue-500',
    upcoming: 'bg-gray-200'
  };

  if (orientation === 'horizontal') {
    return (
      <div className={cn("flex items-center", className)}>
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center">
            <div className="flex flex-col items-center">
              {/* Timeline Item */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-semibold",
                statusClasses[item.status]
              )}>
                {item.icon || <span className="text-sm">{index + 1}</span>}
              </div>
              
              {/* Content */}
              <div className="mt-3 text-center max-w-32">
                <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                )}
                {item.timestamp && (
                  <p className="text-xs text-gray-400 mt-1">{item.timestamp}</p>
                )}
              </div>
            </div>
            
            {/* Connector */}
            {showConnector && index < items.length - 1 && (
              <div className={cn(
                "h-1 w-16 mx-4 rounded",
                connectorClasses[item.status]
              )} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex">
          {/* Connector Line */}
          {showConnector && index < items.length - 1 && (
            <div className={cn(
              "absolute left-6 top-12 w-0.5 h-full",
              connectorClasses[item.status]
            )} />
          )}
          
          {/* Timeline Item */}
          <div className={cn(
            "relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-semibold z-10",
            statusClasses[item.status]
          )}>
            {item.icon || <span className="text-sm">{index + 1}</span>}
          </div>
          
          {/* Content */}
          <div className="ml-4 flex-1">
            <h4 className="text-base font-medium text-gray-900">{item.title}</h4>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            )}
            {item.timestamp && (
              <p className="text-xs text-gray-400 mt-2">{item.timestamp}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}