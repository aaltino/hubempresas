// Utilitários do Design System

import { colors, spacing, borderRadius, shadows } from '../tokens';

// Funções de cor
export const getColor = (palette: keyof typeof colors, scale: keyof typeof colors[typeof palette]) => {
  return colors[palette][scale];
};

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const lighten = (hex: string, percent: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.round(rgb.r + (255 - rgb.r) * (percent / 100));
  const g = Math.round(rgb.g + (255 - rgb.g) * (percent / 100));
  const b = Math.round(rgb.b + (255 - rgb.b) * (percent / 100));
  
  return rgbToHex(r, g, b);
};

export const darken = (hex: string, percent: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.round(rgb.r * (1 - percent / 100));
  const g = Math.round(rgb.g * (1 - percent / 100));
  const b = Math.round(rgb.b * (1 - percent / 100));
  
  return rgbToHex(r, g, b);
};

// Funções de espaçamento
export const getSpacing = (scale: keyof typeof spacing) => {
  return spacing[scale];
};

// Funções de border radius
export const getBorderRadius = (scale: keyof typeof borderRadius) => {
  return borderRadius[scale];
};

// Funções de sombra
export const getShadow = (scale: keyof typeof shadows) => {
  return shadows[scale];
};

// Gerador de classes CSS
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Formatação de valores
export const formatNumber = (value: number, locale = 'pt-BR') => {
  return new Intl.NumberFormat(locale).format(value);
};

export const formatCurrency = (value: number, currency = 'BRL', locale = 'pt-BR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
};

export const formatDate = (value: Date | string, locale = 'pt-BR', options?: Intl.DateTimeFormatOptions) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(locale, options);
};

// Validações
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string) => {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-?\d{4}$/;
  return phoneRegex.test(phone);
};

// Classes de status
export const getStatusClasses = (status: 'success' | 'warning' | 'error' | 'info') => {
  const classes = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    }
  };
  
  return classes[status];
};

// Classes de variantes de componentes
export const getVariantClasses = (variant: string) => {
  const variants = {
    primary: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
      border: 'border-blue-600',
      focus: 'focus:ring-blue-500'
    },
    secondary: {
      bg: 'bg-gray-600',
      hover: 'hover:bg-gray-700',
      text: 'text-white',
      border: 'border-gray-600',
      focus: 'focus:ring-gray-500'
    },
    success: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      text: 'text-white',
      border: 'border-green-600',
      focus: 'focus:ring-green-500'
    },
    warning: {
      bg: 'bg-yellow-600',
      hover: 'hover:bg-yellow-700',
      text: 'text-white',
      border: 'border-yellow-600',
      focus: 'focus:ring-yellow-500'
    },
    error: {
      bg: 'bg-red-600',
      hover: 'hover:bg-red-700',
      text: 'text-white',
      border: 'border-red-600',
      focus: 'focus:ring-red-500'
    },
    info: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
      border: 'border-blue-600',
      focus: 'focus:ring-blue-500'
    }
  };
  
  return variants[variant as keyof typeof variants] || variants.primary;
};

// Classes de tamanho
export const getSizeClasses = (size: string) => {
  const sizes = {
    xs: {
      padding: 'px-2 py-1',
      fontSize: 'text-xs',
      height: 'h-6'
    },
    sm: {
      padding: 'px-3 py-2',
      fontSize: 'text-sm',
      height: 'h-8'
    },
    md: {
      padding: 'px-4 py-2',
      fontSize: 'text-sm',
      height: 'h-10'
    },
    lg: {
      padding: 'px-6 py-3',
      fontSize: 'text-base',
      height: 'h-12'
    },
    xl: {
      padding: 'px-8 py-4',
      fontSize: 'text-lg',
      height: 'h-14'
    }
  };
  
  return sizes[size as keyof typeof sizes] || sizes.md;
};

// Debounce
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Local storage com TTL
export const setStorageItem = (key: string, value: any, ttl?: number) => {
  const item = {
    value,
    timestamp: Date.now(),
    ttl: ttl ? ttl * 1000 : null
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const getStorageItem = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return defaultValue || null;
    
    const item = JSON.parse(itemStr);
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      localStorage.removeItem(key);
      return defaultValue || null;
    }
    
    return item.value;
  } catch (error) {
    console.warn('Failed to read from localStorage:', error);
    return defaultValue || null;
  }
};

// Class name builder para componentes
export const buildComponentClasses = (
  base: string,
  variants?: Record<string, string | undefined>,
  sizes?: Record<string, string | undefined>,
  states?: Record<string, boolean | undefined>,
  custom?: string
) => {
  const classes = [base];
  
  if (variants) {
    Object.entries(variants).forEach(([key, value]) => {
      if (value) classes.push(value);
    });
  }
  
  if (sizes) {
    Object.entries(sizes).forEach(([key, value]) => {
      if (value) classes.push(value);
    });
  }
  
  if (states) {
    Object.entries(states).forEach(([key, value]) => {
      if (value) classes.push(`${base}--${key}`);
    });
  }
  
  if (custom) classes.push(custom);
  
  return classes.filter(Boolean).join(' ');
};