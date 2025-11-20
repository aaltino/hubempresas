// Re-exportar tudo da feature auth
export { AuthProvider, useAuth } from './contexts/AuthContext';
export { default as ProtectedRoute } from './components/ProtectedRoute';
export { default as PermissionGate } from './components/PermissionGate';
export * from './types/auth';
export * from './config/permissions';