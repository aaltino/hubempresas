// Componente Select do Design System

import React, { useState } from 'react';
import { SelectProps } from '../types';
import { cn } from '../utils';

export function Select({
  options,
  value,
  defaultValue,
  placeholder = 'Selecione uma opção',
  disabled = false,
  error,
  helperText,
  onChange,
  onBlur,
  onFocus,
  className,
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');

  const handleChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange?.(newValue);
    setIsOpen(false);
  };

  const handleBlur = () => {
    setIsOpen(false);
    onBlur?.();
  };

  const selectedOption = options.find(opt => opt.value === selectedValue);

  const selectClasses = cn(
    // Base styles
    'block w-full rounded-lg border-gray-300 shadow-sm transition-colors bg-white',
    'focus:border-blue-500 focus:ring-blue-500 focus:ring-1',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    
    // States
    error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
    disabled && 'bg-gray-50',
    
    // Padding for icon
    className
  );

  return (
    <div className="relative w-full">
      {/* Select */}
      <div className="relative">
        <select
          className={selectClasses}
          value={selectedValue}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onFocus={onFocus}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Help Text */}
      {(helperText || error) && (
        <p className={cn(
          'mt-1 text-sm',
          error ? 'text-red-600' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

// Multi-Select Component
export function MultiSelect({
  options,
  value = [],
  placeholder = 'Selecione múltiplas opções',
  disabled = false,
  error,
  helperText,
  onChange,
  className,
  maxDisplayed = 3,
  ...props
}: Omit<SelectProps, 'value' | 'onChange'> & {
  value?: string[];
  onChange?: (values: string[]) => void;
  maxDisplayed?: number;
}) {
  const [selectedValues, setSelectedValues] = useState<string[]>(value);
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue];
    
    setSelectedValues(newValues);
    onChange?.(newValues);
  };

  const removeOption = (optionValue: string) => {
    const newValues = selectedValues.filter(v => v !== optionValue);
    setSelectedValues(newValues);
    onChange?.(newValues);
  };

  const displayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length <= maxDisplayed) {
      return selectedValues
        .map(v => options.find(opt => opt.value === v)?.label)
        .join(', ');
    }
    return `${selectedValues.length} itens selecionados`;
  };

  return (
    <div className="relative w-full">
      {/* Multi-Select Trigger */}
      <div
        className={cn(
          'block w-full rounded-lg border border-gray-300 bg-white shadow-sm transition-colors cursor-pointer',
          'focus-within:border-blue-500 focus-within:ring-blue-500 focus-within:ring-1',
          disabled && 'bg-gray-50 cursor-not-allowed',
          error && 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500',
          'px-3 py-2 min-h-[42px] flex items-center'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={cn(
          'flex-1 text-left',
          selectedValues.length === 0 && 'text-gray-500'
        )}>
          {displayText()}
        </span>
        
        {/* Selected items display */}
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-1 ml-2">
            {selectedValues.slice(0, maxDisplayed).map(value => {
              const option = options.find(opt => opt.value === value);
              return (
                <span
                  key={value}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {option?.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(value);
                    }}
                    className="ml-1 inline-flex text-blue-400 hover:text-blue-600"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              );
            })}
            {selectedValues.length > maxDisplayed && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{selectedValues.length - maxDisplayed}
              </span>
            )}
          </div>
        )}
        
        {/* Dropdown arrow */}
        <svg
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform duration-200 ml-2',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Options dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                disabled={option.disabled}
                className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={cn(
                'text-sm',
                option.disabled && 'text-gray-400'
              )}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Help Text */}
      {(helperText || error) && (
        <p className={cn(
          'mt-1 text-sm',
          error ? 'text-red-600' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}