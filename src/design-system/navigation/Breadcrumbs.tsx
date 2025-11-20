// Breadcrumbs Component
// Navegação em migalhas de pão

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            
            {isLast ? (
              <span className="flex items-center space-x-1 font-medium text-gray-900">
                {item.icon}
                <span>{item.label}</span>
              </span>
            ) : (
              <Link
                to={item.href || '#'}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
