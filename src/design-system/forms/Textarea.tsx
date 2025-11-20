// Componente Textarea do Design System

import React from 'react';
import { cn } from '../utils';

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  showCount?: boolean;
  maxLength?: number;
}

export function Textarea({
  label,
  helperText,
  error,
  required,
  resize = 'vertical',
  showCount = false,
  maxLength,
  value,
  defaultValue,
  className,
  onChange,
  ...props
}: TextareaProps) {
  const textareaClasses = cn(
    // Base styles
    'block w-full rounded-lg border-gray-300 shadow-sm transition-colors',
    'focus:border-blue-500 focus:ring-blue-500 focus:ring-1',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'placeholder:text-gray-400',
    
    // Resize
    resize === 'none' && 'resize-none',
    resize === 'vertical' && 'resize-y',
    resize === 'horizontal' && 'resize-x',
    resize === 'both' && 'resize',
    
    // States
    error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
    
    // Padding
    'px-3 py-2 text-sm',
    
    className
  );

  const labelClasses = cn(
    'block text-sm font-medium text-gray-700 mb-1',
    required && "after:content-['*'] after:ml-0.5 after:text-red-500"
  );

  const helpTextClasses = cn(
    'mt-1 text-sm',
    error ? 'text-red-600' : 'text-gray-500'
  );

  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className={labelClasses}>
          {label}
        </label>
      )}
      
      {/* Textarea */}
      <textarea
        className={textareaClasses}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={onChange}
        {...props}
      />
      
      {/* Character count */}
      {showCount && maxLength && (
        <div className="flex justify-between mt-1">
          <span className={helpTextClasses}>
            {helperText}
          </span>
          <span className={cn(
            'text-sm',
            currentLength > maxLength * 0.9 ? 'text-red-500' : 'text-gray-500'
          )}>
            {currentLength}/{maxLength}
          </span>
        </div>
      )}
      
      {/* Help Text */}
      {(!showCount || !maxLength) && (helperText || error) && (
        <p className={helpTextClasses}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

// Rich Text Editor component (basic implementation)
interface RichTextEditorProps extends TextareaProps {
  onSave?: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  label,
  helperText,
  error,
  required,
  showCount = true,
  maxLength = 5000,
  onSave,
  placeholder = 'Digite seu conteúdo aqui...',
  value,
  onChange,
  className,
  ...props
}: RichTextEditorProps) {
  const [content, setContent] = React.useState(value as string || '');
  const [isPreview, setIsPreview] = React.useState(false);

  React.useEffect(() => {
    if (value !== undefined) {
      setContent(value as string);
    }
  }, [value]);

  const handleChange = (newContent: string) => {
    setContent(newContent);
    onChange?.({ target: { value: newContent } } as any);
  };

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea[name="rich-text-editor"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    handleChange(newText);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const formatButtons = [
    {
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 000 2h.01a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 100 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
        </svg>
      ),
      action: () => insertFormatting('**', '**'),
      tooltip: 'Negrito (Ctrl+B)'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 110 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h3a1 1 0 011 1v3a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v3a1 1 0 11-2 0V14.414l-2.293 2.293a1 1 0 11-1.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      ),
      action: () => insertFormatting('_', '_'),
      tooltip: 'Itálico (Ctrl+I)'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 000 2h.01a1 1 0 100-2H3zm0 4a1 1 0 000 2h.01a1 1 0 100-2H3zm0 4a1 1 0 100 2h.01a1 1 0 100-2H3zm0 4a1 1 0 100 2h.01a1 1 0 100-2H3zm0 4a1 1 0 100 2h.01a1 1 0 100-2H3z" clipRule="evenodd" />
        </svg>
      ),
      action: () => insertFormatting('```', '```'),
      tooltip: 'Código (Ctrl+K)'
    }
  ];

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className={cn(
          'block text-sm font-medium text-gray-700 mb-2',
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}>
          {label}
        </label>
      )}
      
      {/* Toolbar */}
      <div className="border border-gray-300 rounded-t-lg border-b-0 bg-gray-50 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {formatButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={button.action}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              title={button.tooltip}
            >
              {button.icon}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              isPreview 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {isPreview ? 'Editar' : 'Visualizar'}
          </button>
          
          {/* Save Button */}
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(content)}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          )}
        </div>
      </div>
      
      {/* Editor/Preview */}
      {isPreview ? (
        <div className="border border-gray-300 rounded-b-lg bg-white p-3 min-h-[200px] overflow-auto">
          <div className="prose prose-sm max-w-none">
            {/* Simple markdown preview */}
            <div dangerouslySetInnerHTML={{
              __html: content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/_(.*?)_/g, '<em>$1</em>')
                .replace(/```([\s\S]*?)```/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
                .replace(/\n/g, '<br>')
            }} />
          </div>
        </div>
      ) : (
        <Textarea
          name="rich-text-editor"
          placeholder={placeholder}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          showCount={showCount}
          maxLength={maxLength}
          className={cn('rounded-t-none border-t-0', className)}
          {...props}
        />
      )}
      
      {/* Help Text */}
      {(showCount ? !maxLength : helperText || error) && (
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