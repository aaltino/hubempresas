import { PermissionMatrix, UserRole, PermissionAction, ResourceType } from '../types/auth';

// Matriz de permissões conforme PRD v1.1
export const PERMISSION_MATRIX: PermissionMatrix = {
  startup: {
    admin: ['create', 'read', 'update', 'delete', 'assign', 'advance'],
    gestor: ['read', 'update', 'assign', 'advance'],
    mentor: ['read'],
    startup_owner: ['read', 'update_self'],
    startup_member: ['read', 'update_partial'],
    viewer_executivo: ['read'],
  },
  evaluation: {
    admin: ['create', 'read', 'update', 'delete', 'publish', 'assign'],
    gestor: ['read', 'assign', 'evaluate'],
    mentor: ['read', 'comment'],
    startup_owner: ['read', 'answer'],
    startup_member: ['read', 'answer'],
    viewer_executivo: ['read_aggregated'],
  },
  deliverable: {
    admin: ['read', 'update', 'delete'],
    gestor: ['read', 'approve', 'request_changes'],
    mentor: ['read', 'comment'],
    startup_owner: ['create', 'read', 'update'],
    startup_member: ['create', 'read'],
    viewer_executivo: [],
  },
  mentorship: {
    admin: ['schedule', 'read', 'delete'],
    gestor: ['schedule', 'read'],
    mentor: ['read', 'log_notes'],
    startup_owner: ['request', 'read'],
    startup_member: ['read'],
    viewer_executivo: [],
  },
  badge: {
    admin: ['create', 'assign'],
    gestor: ['read', 'assign'],
    mentor: ['read'],
    startup_owner: ['read'],
    startup_member: ['read'],
    viewer_executivo: ['read'],
  },
  user: {
    admin: ['create', 'read', 'update', 'delete'],
    gestor: ['read', 'update'],
    mentor: ['read'],
    startup_owner: ['read'],
    startup_member: ['read'],
    viewer_executivo: ['read'],
  },
  permission: {
    admin: ['create', 'read', 'update', 'delete'],
    gestor: ['read'],
    mentor: [],
    startup_owner: [],
    startup_member: [],
    viewer_executivo: [],
  },
};

// Função auxiliar para verificar permissão
export function hasPermission(
  userRole: UserRole,
  resource: ResourceType,
  action: PermissionAction
): boolean {
  const resourcePermissions = PERMISSION_MATRIX[resource];
  if (!resourcePermissions) return false;

  const rolePermissions = resourcePermissions[userRole];
  if (!rolePermissions) return false;

  return rolePermissions.includes(action);
}

// Função para obter todas as permissões de uma role em um recurso
export function getPermissions(
  userRole: UserRole,
  resource: ResourceType
): PermissionAction[] {
  const resourcePermissions = PERMISSION_MATRIX[resource];
  if (!resourcePermissions) return [];

  return resourcePermissions[userRole] || [];
}

// Função para verificar múltiplas permissões (OR)
export function hasAnyPermission(
  userRole: UserRole,
  resource: ResourceType,
  actions: PermissionAction[]
): boolean {
  return actions.some(action => hasPermission(userRole, resource, action));
}

// Função para verificar múltiplas permissões (AND)
export function hasAllPermissions(
  userRole: UserRole,
  resource: ResourceType,
  actions: PermissionAction[]
): boolean {
  return actions.every(action => hasPermission(userRole, resource, action));
}

// Labels amigáveis para roles
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor de Programa',
  mentor: 'Mentor',
  startup_owner: 'Líder da Startup',
  startup_member: 'Membro da Startup',
  viewer_executivo: 'Visualizador Executivo',
};

// Cores para badges de roles
export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800',
  gestor: 'bg-purple-100 text-purple-800',
  mentor: 'bg-blue-100 text-blue-800',
  startup_owner: 'bg-green-100 text-green-800',
  startup_member: 'bg-teal-100 text-teal-800',
  viewer_executivo: 'bg-gray-100 text-gray-800',
};

// Descrições das roles
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso completo ao sistema. Pode gerenciar usuários, configurações e todos os recursos.',
  gestor: 'Gerencia programas de incubação/aceleração. Pode atribuir mentores, avaliar startups e aprovar deliverables.',
  mentor: 'Acompanha e avalia startups. Pode comentar em avaliações e deliverables.',
  startup_owner: 'Líder da startup. Gerencia a equipe, responde avaliações e envia deliverables.',
  startup_member: 'Membro da equipe da startup. Pode visualizar informações e contribuir com deliverables.',
  viewer_executivo: 'Acesso somente leitura para visualização executiva de métricas e relatórios.',
};
