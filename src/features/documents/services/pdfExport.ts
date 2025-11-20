/**
 * Re-export do módulo consolidado de PDF
 * Este arquivo mantém compatibilidade com imports existentes
 * 
 * @deprecated Use diretamente '@/lib/pdf' para novas implementações
 */

export {
  generateCompanyReport,
  generateCohortReport,
  generateCompanyOnePager,
  generateCompanyOnePagerPDF,
  generateCohortSummary,
  generateCohortSummaryPDF,
  getAvailableCompanies,
  getAvailableCohorts,
  type Company,
  type Evaluation,
  type Program,
  type Deliverable,
  type Cohort,
  type CompanyPDFOptions,
  type CohortPDFOptions,
  hubConfig,
  programLabels
} from '@/lib/pdf';