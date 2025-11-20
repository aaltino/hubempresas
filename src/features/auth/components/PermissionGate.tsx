import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ResourceType, PermissionAction } from '../types/auth';

interface PermissionGateProps {
  children: ReactNode;
  resource: ResourceType;
  action?: PermissionAction;
  requireAny?: PermissionAction[];
  requireAll?: PermissionAction[];
  fallback?: ReactNode;
}

/**
 * Componente para renderização condicional baseada em permissões
 * 
 * @example
 * // Mostrar botão apenas se tem permissão
 * <PermissionGate resource="startup" action="create">
 *   <button>Nova Startup</button>
 * </PermissionGate>
 * 
 * @example
 * // Mostrar se tem qualquer uma das permissões (OR)
 * <PermissionGate resource="evaluation" requireAny={["create", "update"]}>
 *   <button>Gerenciar Avaliações</button>
 * </PermissionGate>
 * 
 * @example
 * // Mostrar se tem todas as permissões (AND)
 * <PermissionGate resource="deliverable" requireAll={["read", "approve"]}>
 *   <button>Aprovar</button>
 * </PermissionGate>
 * 
 * @example
 * // Com fallback
 * <PermissionGate resource="user" action="delete" fallback={<span>Sem permissão</span>}>
 *   <button>Excluir</button>
 * </PermissionGate>
 */
export default function PermissionGate({
  children,
  resource,
  action,
  requireAny,
  requireAll,
  fallback = null
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let hasAccess = false;

  // Verificar permissão simples
  if (action) {
    hasAccess = hasPermission(resource, action);
  }
  // Verificar múltiplas permissões (OR)
  else if (requireAny && requireAny.length > 0) {
    hasAccess = hasAnyPermission(resource, requireAny);
  }
  // Verificar múltiplas permissões (AND)
  else if (requireAll && requireAll.length > 0) {
    hasAccess = hasAllPermissions(resource, requireAll);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
