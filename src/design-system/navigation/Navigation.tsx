// Componentes de Navegação do Design System

import React, { useState } from 'react';
import { cn } from '../utils';

// Navbar principal
export function Navbar({
  children,
  className,
  logo,
  navigation,
  actions,
  user,
  variant = 'solid',
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  logo?: React.ReactNode;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
  user?: React.ReactNode;
  variant?: 'solid' | 'transparent';
} & React.HTMLAttributes<HTMLElement>) {
  const variantClasses = {
    solid: 'bg-white border-b border-gray-200 shadow-sm',
    transparent: 'bg-transparent'
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-40 px-4 sm:px-6 lg:px-8',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <div className="flex h-16 items-center justify-between">
        {/* Logo */}
        {logo && (
          <div className="flex items-center">
            {logo}
          </div>
        )}
        
        {/* Navigation */}
        {navigation && (
          <div className="hidden md:flex items-center space-x-8">
            {navigation}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center space-x-4">
          {actions}
          {user}
        </div>
      </div>
    </nav>
  );
}

// Breadcrumbs
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export function Breadcrumbs({
  items,
  separator = 'chevron',
  className,
  ...props
}: {
  items: BreadcrumbItem[];
  separator?: 'slash' | 'chevron' | 'arrow';
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const separators = {
    slash: (
      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ),
    chevron: (
      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ),
    arrow: (
      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <nav
      className={cn('flex', className)}
      aria-label="Breadcrumb"
      {...props}
    >
      <ol className="flex items-center space-x-4">
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              {index > 0 && (
                <div className="flex-shrink-0 mx-2">
                  {separators[separator]}
                </div>
              )}
              {item.current ? (
                <span className="text-sm font-medium text-gray-900">
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-sm text-gray-500">
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// QuickActions refatorado
interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  color?: string;
  show?: boolean;
  hasSubmenu?: boolean;
  submenu?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    description?: string;
  }>;
}

export function QuickActions({
  actions,
  className,
  title = "Ações Rápidas"
}: {
  actions: QuickAction[];
  className?: string;
  title?: string;
}) {
  const [showSubmenu, setShowSubmenu] = useState<string | null>(null);

  const visibleActions = actions.filter(action => action.show !== false);

  return (
    <div className={cn('bg-white rounded-lg shadow-sm p-4 border border-gray-200', className)}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {visibleActions.map((action) => (
          <div key={action.label} className="relative">
            <button
              onClick={() => {
                if (action.hasSubmenu) {
                  setShowSubmenu(showSubmenu === action.label ? null : action.label);
                } else {
                  action.onClick?.();
                }
              }}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 text-white rounded-lg transition-all transform hover:scale-105 shadow-sm',
                action.color || 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {action.icon && <span className="w-5 h-5">{action.icon}</span>}
              <span className="text-sm font-medium">{action.label}</span>
              {action.hasSubmenu && (
                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            
            {/* Submenu */}
            {action.hasSubmenu && showSubmenu === action.label && action.submenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  {action.submenu.map((subAction) => (
                    <button
                      key={subAction.label}
                      onClick={() => {
                        subAction.onClick?.();
                        setShowSubmenu(null);
                      }}
                      className="w-full flex items-start space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                    >
                      {subAction.icon && (
                        <span className="w-5 h-5 text-blue-600 mt-0.5">{subAction.icon}</span>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{subAction.label}</div>
                        {subAction.description && (
                          <div className="text-xs text-gray-500">{subAction.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}