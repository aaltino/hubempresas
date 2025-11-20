// Spinner Component
// Indicador de carregamento reutilizável

import React from 'react';
import { Loader } from 'lucide-react';
import { cn } from '../utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'text-blue-600',
  white: 'text-white',
  gray: 'text-gray-600'
};

export function Spinner({ size = 'md', className, color = 'primary', label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <Loader
        className={cn(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
      />
      {label && (
        <p className={cn('mt-2 text-sm', colorClasses[color])}>
          {label}
        </p>
      )}
    </div>
  );
}

// Loading Overlay
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <Spinner size="lg" label={message || 'Carregando...'} />
      </div>
    </div>
  );
}

// Inline Loading
export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <Spinner size="md" label={message} />
    </div>
  );
}
