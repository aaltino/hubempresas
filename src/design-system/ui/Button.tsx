// Componente Button do Design System

import React from 'react';
import { ButtonProps } from '../types';
import { cn, getVariantClasses, getSizeClasses } from '../utils';

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  ...props
}: ButtonProps) {
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);
  
  const baseClasses = cn(
    // Base styles
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'relative overflow-hidden',
    
    // Variant styles
    variantClasses.bg,
    variantClasses.hover,
    variantClasses.text,
    variantClasses.focus,
    
    // Size styles
    sizeClasses.padding,
    sizeClasses.fontSize,
    sizeClasses.height,
    
    // States
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'cursor-wait',
    fullWidth && 'w-full'
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={cn(baseClasses, className)}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Content */}
      <div className={cn('flex items-center space-x-2', loading && 'opacity-0')}>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </div>
    </button>
  );
}

// Button variants for convenience
export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="secondary" {...props} />
);

export const SuccessButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="success" {...props} />
);

export const WarningButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="warning" {...props} />
);

export const ErrorButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="error" {...props} />
);

export const InfoButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="info" {...props} />
);