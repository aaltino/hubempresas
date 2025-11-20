import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  delay = 200
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            positionClasses[position],
            className
          )}
          role="tooltip"
        >
          {content}
          
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
}

// Help Icon com Tooltip
interface HelpTooltipProps {
  content: React.ReactNode;
  className?: string;
}

export function HelpTooltip({ content, className }: HelpTooltipProps) {
  return (
    <Tooltip content={content} position="top">
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors',
          className
        )}
        onClick={(e) => e.preventDefault()}
      >
        <HelpCircle className="w-full h-full" />
      </button>
    </Tooltip>
  );
}

// Wrapper para métricas com tooltip
interface MetricWithTooltipProps {
  label: string;
  value: string | number;
  tooltip: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricWithTooltip({
  label,
  value,
  tooltip,
  icon,
  className
}: MetricWithTooltipProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-gray-500">{icon}</span>}
        <span className="text-sm text-gray-600">{label}</span>
        <HelpTooltip content={tooltip} />
      </div>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

export default Tooltip;
