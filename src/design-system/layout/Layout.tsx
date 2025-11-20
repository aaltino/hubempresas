// Componentes de Layout do Design System

import React from 'react';
import { cn } from '../utils';

// Container principal
export function Container({
  children,
  className,
  size = 'lg',
  padding = true,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-full',
    full: 'max-w-full'
  };

  return (
    <div
      className={cn(
        'mx-auto',
        sizeClasses[size],
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Grid System
export function Grid({
  children,
  className,
  cols = 12,
  gap = 4,
  responsive = true,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  cols?: number;
  gap?: number;
  responsive?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const gapClasses = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
    12: 'gap-12'
  };

  const gridClasses = responsive
    ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(cols, 12)} xl:grid-cols-${cols}`
    : `grid grid-cols-${cols}`;

  return (
    <div
      className={cn(
        gridClasses,
        gapClasses[gap as keyof typeof gapClasses] || 'gap-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Coluna individual para usar com Grid
export function Col({
  children,
  className,
  span = 1,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  span?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'col-span-1',
        span > 1 && `col-span-${span}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Stack - para empilhar elementos verticalmente
export function Stack({
  children,
  className,
  direction = 'vertical',
  spacing = 4,
  align = 'stretch',
  justify = 'flex-start',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal';
  spacing?: number;
  align?: 'stretch' | 'start' | 'center' | 'end';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
} & React.HTMLAttributes<HTMLDivElement>) {
  const spacingClasses = {
    0: 'space-y-0',
    1: 'space-y-1',
    2: 'space-y-2',
    3: 'space-y-3',
    4: 'space-y-4',
    5: 'space-y-5',
    6: 'space-y-6',
    8: 'space-y-8',
    10: 'space-y-10',
    12: 'space-y-12'
  };

  const alignClasses = {
    stretch: 'items-stretch',
    start: 'items-start',
    center: 'items-center',
    end: 'items-end'
  };

  const justifyClasses = {
    'flex-start': 'justify-start',
    center: 'justify-center',
    'flex-end': 'justify-end',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly'
  };

  const directionClasses = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row'
  };

  const spacingKey = direction === 'vertical' ? 'space-y' : 'space-x';

  return (
    <div
      className={cn(
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        spacingClasses[spacing as keyof typeof spacingClasses],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Flex container
export function Flex({
  children,
  className,
  direction = 'row',
  wrap = 'nowrap',
  justify = 'flex-start',
  align = 'stretch',
  gap = 0,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
  gap?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  const gapClasses = {
    0: '',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10'
  };

  return (
    <div
      className={cn(
        'flex',
        `flex-${direction}`,
        `flex-${wrap}`,
        `justify-${justify}`,
        `items-${align}`,
        gap > 0 && gapClasses[gap as keyof typeof gapClasses],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Spacer - para criar espaçamento
export function Spacer({
  size = 4,
  direction = 'vertical',
  className
}: {
  size?: number;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}) {
  const spacingClasses = {
    1: 'h-1',
    2: 'h-2',
    3: 'h-3',
    4: 'h-4',
    5: 'h-5',
    6: 'h-6',
    8: 'h-8',
    10: 'h-10',
    12: 'h-12',
    16: 'h-16',
    20: 'h-20',
    24: 'h-24'
  };

  const widthClasses = {
    1: 'w-1',
    2: 'w-2',
    3: 'w-3',
    4: 'w-4',
    5: 'w-5',
    6: 'w-6',
    8: 'w-8',
    10: 'w-10',
    12: 'w-12',
    16: 'w-16',
    20: 'w-20',
    24: 'w-24'
  };

  return (
    <div
      className={cn(
        direction === 'vertical' ? spacingClasses[size as keyof typeof spacingClasses] : widthClasses[size as keyof typeof widthClasses],
        className
      )}
    />
  );
}

// Center - para centralizar conteúdo
export function Center({
  children,
  className,
  direction = 'both',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'both' | 'horizontal' | 'vertical';
} & React.HTMLAttributes<HTMLDivElement>) {
  const directionClasses = {
    both: 'items-center justify-center',
    horizontal: 'justify-center',
    vertical: 'items-center'
  };

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}