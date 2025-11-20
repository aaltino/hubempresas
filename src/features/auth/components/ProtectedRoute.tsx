import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ResourceType, PermissionAction } from '../types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  resource?: ResourceType;
  action?: PermissionAction;
  requireAny?: { resource: ResourceType; actions: PermissionAction[] };
  requireAll?: { resource: ResourceType; actions: PermissionAction[] };
  fallbackPath?: string;
}

/**
 * Componente para proteger rotas baseado em permissões RBAC
 * 
 * @example
 * // Proteger rota simples
 * <ProtectedRoute resource="user" action="create">
 *   <AdminPage />
 * </ProtectedRoute>
 * 
 * @example
 * // Proteger com múltiplas permissões (OR)
 * <ProtectedRoute requireAny={{ resource: "evaluation", actions: ["create", "update"] }}>
 *   <EvaluationsPage />
 * </ProtectedRoute>
 * 
 * @example
 * // Proteger com múltiplas permissões (AND)
 * <ProtectedRoute requireAll={{ resource: "deliverable", actions: ["read", "approve"] }}>
 *   <ApprovalPage />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({
  children,
  resource,
  action,
  requireAny,
  requireAll,
  fallbackPath = '/dashboard'
}: ProtectedRouteProps) {
  const { profile, loading, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  const location = useLocation();

  // Aguardar carregamento do perfil
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirecionar se não autenticado
  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permissão simples
  if (resource && action) {
    if (!hasPermission(resource, action)) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Verificar múltiplas permissões (OR)
  if (requireAny) {
    if (!hasAnyPermission(requireAny.resource, requireAny.actions)) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Verificar múltiplas permissões (AND)
  if (requireAll) {
    if (!hasAllPermissions(requireAll.resource, requireAll.actions)) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
}
