// Exports do módulo de Conflitos de Interesse

// Components
export { ConflictAlert } from './components/ConflictAlert';
export { ConflictDashboard } from './components/ConflictDashboard';

// Hooks
export { useConflictDetection } from './hooks/useConflictDetection';

// Services
export {
  validateConflictOfInterest,
  getMentorPartnerships,
  getConflictAuditLogs,
  declarePartnership,
  updatePartnershipStatus,
  notifyConflictIncident
} from './services/conflictService';

// Types
export type {
  ConflictStatus,
  ConflictSeverity,
  PartnershipType,
  ConflictReason,
  ConflictValidationResult,
  MentorCompanyPartnership,
  ConflictAuditLog,
  ConflictNotification
} from './types/conflict';
