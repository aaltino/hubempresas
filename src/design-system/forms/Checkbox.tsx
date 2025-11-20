// Componentes de Checkbox e Radio do Design System

import React from 'react';
import { cn } from '../utils';

// Checkbox
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({
  label,
  description,
  error,
  size = 'md',
  indeterminate = false,
  onCheckedChange,
  className,
  checked,
  onChange,
  ...props
}: CheckboxProps) {
  const [isChecked, setIsChecked] = React.useState(checked || false);

  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    setIsChecked(newChecked);
    onChange?.(event);
    onCheckedChange?.(newChecked);
  };

  React.useEffect(() => {
    const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (checkbox) {
      checkbox.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          className={cn(
            'rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors',
            sizeClasses[size],
            error && 'border-red-300',
            className
          )}
          checked={isChecked}
          onChange={handleChange}
          {...props}
        />
      </div>
      {(label || description) && (
        <div className="ml-3 text-sm">
          {label && (
            <label className={cn(
              'font-medium text-gray-700',
              props.disabled && 'text-gray-400 cursor-not-allowed'
            )}>
              {label}
            </label>
          )}
          {description && (
            <p className={cn(
              'text-gray-500',
              props.disabled && 'text-gray-400'
            )}>
              {description}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Radio Button
interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  onCheckedChange?: (checked: boolean) => void;
}

export function Radio({
  label,
  description,
  error,
  size = 'md',
  onCheckedChange,
  className,
  checked,
  onChange,
  ...props
}: RadioProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          type="radio"
          className={cn(
            'border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors',
            sizeClasses[size],
            error && 'border-red-300',
            className
          )}
          onChange={handleChange}
          {...props}
        />
      </div>
      {(label || description) && (
        <div className="ml-3 text-sm">
          {label && (
            <label className={cn(
              'font-medium text-gray-700',
              props.disabled && 'text-gray-400 cursor-not-allowed'
            )}>
              {label}
            </label>
          )}
          {description && (
            <p className={cn(
              'text-gray-500',
              props.disabled && 'text-gray-400'
            )}>
              {description}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Radio Group
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  error?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RadioGroup({
  options,
  value,
  defaultValue,
  onChange,
  name,
  error,
  orientation = 'vertical',
  size = 'md',
  className
}: RadioGroupProps) {
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || '');

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={cn(
      orientation === 'horizontal' ? 'flex space-x-6' : 'space-y-3',
      className
    )}>
      {options.map((option) => (
        <div
          key={option.value}
          className={orientation === 'horizontal' ? 'flex-1' : ''}
        >
          <Radio
            name={name}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={() => handleChange(option.value)}
            disabled={option.disabled}
            label={option.label}
            description={option.description}
            size={size}
            className="w-full"
          />
        </div>
      ))}
      {error && (
        <p className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}

// Switch (Toggle)
interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  className?: string;
}

export function Switch({
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className
}: SwitchProps) {
  const [isChecked, setIsChecked] = React.useState(checked || defaultChecked || false);

  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  const sizeClasses = {
    sm: {
      container: 'w-8 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-3'
    },
    md: {
      container: 'w-10 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-4'
    },
    lg: {
      container: 'w-12 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-5'
    }
  };

  const config = sizeClasses[size];

  return (
    <div className={cn('flex items-start', className)}>
      <button
        type="button"
        className={cn(
          'relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          config.container,
          isChecked 
            ? 'bg-blue-600' 
            : 'bg-gray-200',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        role="switch"
        aria-checked={isChecked}
        onClick={() => {
          if (!disabled) {
            const newChecked = !isChecked;
            setIsChecked(newChecked);
            onChange?.(newChecked);
          }
        }}
        disabled={disabled}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
            config.thumb,
            isChecked && config.translate
          )}
        />
      </button>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span className={cn(
              'block text-sm font-medium text-gray-700',
              disabled && 'text-gray-400'
            )}>
              {label}
            </span>
          )}
          {description && (
            <p className={cn(
              'block text-sm text-gray-500',
              disabled && 'text-gray-400'
            )}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}