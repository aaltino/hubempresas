// Loading Skeleton Component
// Componente reutilizável para estados de carregamento

import React from 'react';
import { cn } from '../utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';

  if (variant === 'card') {
    return (
      <div className={cn('rounded-lg border border-gray-200 p-6', className)}>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className={cn('w-12 h-12 rounded-full', baseClasses)} />
            <div className="flex-1 space-y-2">
              <div className={cn('h-4 rounded', baseClasses)} style={{ width: '60%' }} />
              <div className={cn('h-3 rounded', baseClasses)} style={{ width: '40%' }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={cn('h-3 rounded', baseClasses)} />
            <div className={cn('h-3 rounded', baseClasses)} style={{ width: '90%' }} />
            <div className={cn('h-3 rounded', baseClasses)} style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn('h-4 rounded', baseClasses)}
            style={{
              width: i === lines - 1 ? '80%' : '100%',
              ...( width && typeof width === 'number' ? { width: `${width}px` } : {}),
              ...( height && typeof height === 'number' ? { height: `${height}px` } : {})
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={cn('rounded-full', baseClasses, className)}
        style={{
          width: width || '40px',
          height: height || '40px'
        }}
      />
    );
  }

  // rectangular (default)
  return (
    <div
      className={cn('rounded', baseClasses, className)}
      style={{
        width: width || '100%',
        height: height || '20px'
      }}
    />
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="flex-1" height={40} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <Skeleton height={24} width="60%" className="mb-3" />
            <Skeleton height={36} width="40%" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Skeleton height={28} width="30%" className="mb-4" />
        <TableSkeleton rows={5} columns={4} />
      </div>
    </div>
  );
}
