// Componente Badge do Design System

import React from 'react';
import { BadgeProps } from '../types';
import { cn } from '../utils';

export function Badge({
  children,
  className,
  variant = 'solid',
  status = 'default',
  dot = false,
  ...props
}: BadgeProps) {
  const variantClasses = {
    solid: {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800'
    },
    outline: {
      default: 'border border-gray-300 text-gray-700 bg-white',
      success: 'border border-green-300 text-green-700 bg-white',
      warning: 'border border-yellow-300 text-yellow-700 bg-white',
      error: 'border border-red-300 text-red-700 bg-white',
      info: 'border border-blue-300 text-blue-700 bg-white'
    },
    soft: {
      default: 'bg-gray-50 text-gray-600',
      success: 'bg-green-50 text-green-600',
      warning: 'bg-yellow-50 text-yellow-600',
      error: 'bg-red-50 text-red-600',
      info: 'bg-blue-50 text-blue-600'
    }
  };

  const baseClasses = cn(
    'inline-flex items-center font-medium rounded-full',
    'text-xs px-2.5 py-0.5'
  );

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant][status],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          status === 'default' && 'bg-gray-400',
          status === 'success' && 'bg-green-400',
          status === 'warning' && 'bg-yellow-400',
          status === 'error' && 'bg-red-400',
          status === 'info' && 'bg-blue-400'
        )} />
      )}
      {children}
    </span>
  );
}

// Pre-defined badge types for common use cases
export const SuccessBadge = (props: Omit<BadgeProps, 'status'>) => (
  <Badge status="success" {...props} />
);

export const WarningBadge = (props: Omit<BadgeProps, 'status'>) => (
  <Badge status="warning" {...props} />
);

export const ErrorBadge = (props: Omit<BadgeProps, 'status'>) => (
  <Badge status="error" {...props} />
);

export const InfoBadge = (props: Omit<BadgeProps, 'status'>) => (
  <Badge status="info" {...props} />
);

// Status indicator badge
export function StatusIndicator({
  status,
  label,
  pulse = false,
  className,
  ...props
}: {
  status: 'online' | 'offline' | 'away' | 'busy';
  label?: string;
  pulse?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const statusConfig = {
    online: {
      color: 'bg-green-400',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      label: label || 'Online'
    },
    offline: {
      color: 'bg-gray-400',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50',
      label: label || 'Offline'
    },
    away: {
      color: 'bg-yellow-400',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      label: label || 'Ausente'
    },
    busy: {
      color: 'bg-red-400',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      label: label || 'Ocupado'
    }
  };

  const config = statusConfig[status];

  return (
    <span 
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
      {...props}
    >
      <span className={cn(
        'relative flex h-2 w-2 mr-2',
        pulse && 'animate-pulse'
      )}>
        <span className={cn(
          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
          config.color
        )} />
        <span className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          config.color
        )} />
      </span>
      {config.label}
    </span>
  );
}