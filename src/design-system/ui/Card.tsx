// Componente Card do Design System

import React from 'react';
import { CardProps } from '../types';
import { cn } from '../utils';

export function Card({
  children,
  className,
  title,
  subtitle,
  headerAction,
  footer,
  padding = 'md',
  shadow = 'sm',
  ...props
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 overflow-hidden',
        shadowClasses[shadow],
        className
      )}
      {...props}
    >
      {/* Header */}
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="ml-4 flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={paddingClasses[padding]}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}

// Card components for specific use cases
export function InfoCard({
  children,
  icon,
  title,
  value,
  change,
  changeType,
  ...props
}: {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
} & CardProps) {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Card {...props}>
      <div className="flex items-center">
        {icon && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 text-blue-600">
              {icon}
            </div>
          </div>
        )}
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {change && (
                <div className={cn(
                  'ml-2 flex items-baseline text-sm font-semibold',
                  changeColor[changeType || 'neutral']
                )}>
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </Card>
  );
}

export function StatusCard({
  status,
  title,
  description,
  action,
  ...props
}: {
  status: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  action?: React.ReactNode;
} & CardProps) {
  const statusConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-100'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      iconBg: 'bg-red-100'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100'
    }
  };

  const config = statusConfig[status];

  return (
    <Card className={cn(config.bg, config.border)} {...props}>
      <div className="flex">
        <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', config.iconBg)}>
          <div className={cn('w-5 h-5', config.icon)}>
            {status === 'success' && (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {status === 'warning' && (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {status === 'error' && (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {status === 'info' && (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {description}
          </p>
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}