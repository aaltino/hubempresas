// Types do Design System

import { colors, spacing, borderRadius, typography } from '../tokens';

// Cores
export type ColorScale = keyof typeof colors.primary;
export type ColorPalette = keyof typeof colors;
export type ColorValue = string;

// Espaçamento
export type SpacingScale = keyof typeof spacing;
export type SpacingValue = string;

// Border Radius
export type BorderRadiusScale = keyof typeof borderRadius;
export type BorderRadiusValue = string;

// Tipografia
export type FontFamilyScale = keyof typeof typography.fontFamily;
export type FontSizeScale = keyof typeof typography.fontSize;
export type FontWeightScale = keyof typeof typography.fontWeight;

// Componentes Base
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface VariantProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface StatusProps {
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

// Modal
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
}

export interface ConfirmModalProps extends Omit<ModalProps, 'children' | 'footer'> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

// Button
export interface ButtonProps extends BaseComponentProps, VariantProps {
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

// Input
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

// Select
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends BaseComponentProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

// Badge
export interface BadgeProps extends BaseComponentProps, StatusProps {
  variant?: 'solid' | 'outline' | 'soft';
  dot?: boolean;
}

// Progress
export interface ProgressProps extends BaseComponentProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
}

// Toast
export interface ToastProps extends BaseComponentProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Dropdown
export interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownProps extends BaseComponentProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

// Navigation
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
  children?: NavigationItem[];
}

export interface NavigationProps extends BaseComponentProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  collapsible?: boolean;
  collapsed?: boolean;
}

// Layout
export interface LayoutProps extends BaseComponentProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarCollapsible?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

// Table
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface TableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onRowClick?: (record: T, index: number) => void;
  rowSelection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  };
}

// Form
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

export interface FormProps extends BaseComponentProps {
  onSubmit: (values: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  disabled?: boolean;
  loading?: boolean;
}

// Card
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}