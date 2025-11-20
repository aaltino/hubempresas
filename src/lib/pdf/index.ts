/**
 * Módulo Consolidado de Geração PDF - HUB Empresas
 * 
 * Este módulo consolida as funcionalidades de geração PDF anteriormente distribuídas
 * em múltiplos arquivos, eliminando duplicação e mantendo compatibilidade.
 * 
 * Abordagem Híbrida:
 * - Suporte a dados diretos (compatibilidade com pdfGenerator.ts)
 * - Suporte a busca automática por ID (compatibilidade com pdfExport.ts)
 * - Interface unificada e melhor layout visual
 * 
 * @version 2.0.0
 * @author HUB Empresas Team
 * @date 2025-11-06
 */

// Imports principais
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/lib/supabase';

// Tipos e interfaces
export interface Company {
  id: string;
  name: string;
  description?: string;
  current_program_key: string;
  cohort_id?: string;
  founded_date?: string;
  logo_url?: string;
  website?: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  company_id: string;
  mentor_id: string;
  program_key: string;
  mercado_score?: number;
  perfil_empreendedor_score?: number;
  tecnologia_qualidade_score?: number;
  gestao_score?: number;
  financeiro_score?: number;
  weighted_score?: number;
  gate_value?: string;
  evaluation_date: string;
  is_valid: boolean;
  notes?: string;
}

export interface Program {
  key: string;
  label: string;
  description?: string;
}

export interface Deliverable {
  id: string;
  key: string;
  label: string;
  deliverable_label?: string;
  status: string;
  approval_required?: boolean;
  program_key: string;
  company_id: string;
  created_at: string;
}

export interface Cohort {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  created_at: string;
}

// Tipos para exportações específicas
export interface ExportFilterOptions {
  programKey?: string;
  dateFrom?: string;
  dateTo?: string;
  includeSummary?: boolean;
  includeRankings?: boolean;
  includeDetailedMetrics?: boolean;
}

export interface CompanyOnePagerData {
  company: Company;
  program: Program;
  cohort?: Cohort | null;
  latestEvaluation?: Evaluation | null;
  evaluations: Evaluation[];
  deliverables: Deliverable[];
  progressMetrics: {
    totalDeliverables: number;
    completedDeliverables: number;
    progressPercentage: number;
    daysInProgram: number;
    averageScore: number;
  };
}

export interface CohortSummaryData {
  cohort: Cohort | null;
  companies: Company[];
  evaluations: Evaluation[];
  deliverables: Deliverable[];
  statistics: {
    totalCompanies: number;
    companiesWithEvaluations: number;
    averageScore: number;
    topPerformers: Company[];
    programDistribution: Record<string, number>;
    dimensionAverages: Record<string, number>;
    completionRates: Record<string, number>;
  };
}

export interface ScheduledExport {
  id: string;
  type: 'company' | 'cohort';
  filters: ExportFilterOptions;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
  recipients: string[];
  isActive: boolean;
  createdAt: string;
  lastExecuted?: string;
}

export interface EmailNotification {
  id: string;
  to: string[];
  subject: string;
  body: string;
  attachmentUrl?: string;
  exportType: 'company' | 'cohort';
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
}

// Configurações centralizadas do HUB MVP
export const hubConfig = {
  dimensions: [
    { key: 'mercado', label: 'Mercado', weight: 0.28 },
    { key: 'perfil_empreendedor', label: 'Perfil Empreendedor', weight: 0.21 },
    { key: 'tecnologia_qualidade', label: 'Tecnologia & Qualidade', weight: 0.14 },
    { key: 'gestao', label: 'Gestão', weight: 0.16 },
    { key: 'financeiro', label: 'Financeiro', weight: 0.16 }
  ]
};

export const programLabels: Record<string, string> = {
  hotel_de_projetos: 'Hotel de Projetos',
  pre_residencia: 'Pré-Residência',
  residencia: 'Residência'
};

// Configurações de branding e templates
export const brandingConfig = {
  primaryColor: [59, 130, 246] as [number, number, number], // Blue 600
  secondaryColor: [99, 102, 241] as [number, number, number], // Indigo 500
  accentColor: [16, 185, 129] as [number, number, number], // Emerald 500
  textColor: [31, 41, 55] as [number, number, number], // Gray 800
  lightText: [107, 114, 128] as [number, number, number], // Gray 500
  headerHeight: 30,
  footerHeight: 15,
  fontFamily: 'helvetica',
  logoUrl: '/logo-hub-empresas.png'
};

// Templates de notificação
export const emailTemplates = {
  companyReport: {
    subject: 'Relatório da Empresa: {{companyName}}',
    body: `Olá,\n\nSegue em anexo o relatório da empresa {{companyName}}.\n\nAtenciosamente,\nHUB Empresas`
  },
  cohortReport: {
    subject: 'Relatório da Coorte: {{cohortName}}',
    body: `Olá,\n\nSegue em anexo o relatório da coorte {{cohortName}}.\n\nAtenciosamente,\nHUB Empresas`
  }
};

// Options interface para abordagem híbrida
export interface CompanyPDFOptions {
  // Modo 1: Dados diretos (compatibilidade com pdfGenerator.ts)
  company?: Company;
  program?: Program;
  evaluation?: Evaluation;
  deliverables?: Deliverable[];
  
  // Modo 2: ID para busca automática (compatibilidade com pdfExport.ts)
  companyId?: string;
  cohortId?: string;
  
  // Configurações de layout e funcionalidade
  includeVisualHeader?: boolean;
  includeCohortStats?: boolean;
  includeDeliverables?: boolean;
  detailedView?: boolean;
  customFilename?: string;
}

export interface CohortPDFOptions {
  // Modo 1: Dados diretos
  cohort?: Cohort;
  companies?: Company[];
  evaluations?: Evaluation[];
  programs?: Program[];
  deliverables?: Deliverable[];
  
  // Modo 2: ID para busca automática
  cohortId?: string;
  
  // Configurações
  includeDetailedStats?: boolean;
  customFilename?: string;
}

/**
 * Configura o header visual profissional do PDF
 */
function setupVisualHeader(pdf: jsPDF, title: string, subtitle?: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Header com fundo azul
  pdf.setFillColor(59, 130, 246); // Blue 600
  pdf.rect(0, 0, pageWidth, 30, 'F');
  
  // Texto do header
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HUB Empresas', 20, 20);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(title, pageWidth - 80, 15);
  
  if (subtitle) {
    pdf.setFontSize(10);
    pdf.text(subtitle, pageWidth - 80, 23);
  }
}

/**
 * Configura o footer padrão do PDF
 */
function setupFooter(pdf: jsPDF, filename: string) {
  const pageCount = (pdf as any).internal.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128); // Gray 500
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(
      `Pagina ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    pdf.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')} - HUB Empresas`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }
}

/**
 * Busca dados de uma empresa por ID (modo híbrido)
 */
async function fetchCompanyData(companyId: string): Promise<{
  company: Company | null;
  program: Program | null;
  evaluations: Evaluation[];
  deliverables: Deliverable[];
  cohort: Cohort | null;
}> {
  // Buscar dados da empresa
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (companyError || !company) {
    throw new Error('Erro ao buscar dados da empresa');
  }

  // Buscar programa atual
  const program = {
    key: company.current_program_key,
    label: programLabels[company.current_program_key] || company.current_program_key
  };

  // Buscar avaliações válidas
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_valid', true)
    .order('evaluation_date', { ascending: false });

  // Buscar dados da coorte se existir
  let cohort = null;
  if (company.cohort_id) {
    const { data: cohortData } = await supabase
      .from('cohorts')
      .select('*')
      .eq('id', company.cohort_id)
      .single();
    cohort = cohortData;
  }

  // Buscar deliverables
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('company_id', companyId)
    .eq('program_key', company.current_program_key);

  return {
    company,
    program,
    evaluations: evaluations || [],
    deliverables: deliverables || [],
    cohort
  };
}

/**
 * Busca dados de uma coorte por ID (modo híbrido)
 */
async function fetchCohortData(cohortId?: string): Promise<{
  cohort: Cohort | null;
  companies: Company[];
  evaluations: Evaluation[];
  deliverables: Deliverable[];
}> {
  // Buscar dados da coorte
  let cohort = null;
  if (cohortId) {
    const { data: cohortData } = await supabase
      .from('cohorts')
      .select('*')
      .eq('id', cohortId)
      .single();
    cohort = cohortData;
  } else {
    // Se não especificar coorte, usar a mais recente
    const { data: cohortsData } = await supabase
      .from('cohorts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    cohort = cohortsData?.[0] || null;
  }

  // Buscar empresas da coorte
  let companiesQuery = supabase.from('companies').select('*');
  if (cohort?.id) {
    companiesQuery = companiesQuery.eq('cohort_id', cohort.id);
  }
  const { data: companies } = await companiesQuery;

  if (!companies || companies.length === 0) {
    throw new Error('Nenhuma empresa encontrada para a coorte especificada');
  }

  // Buscar avaliações válidas
  const companyIds = companies.map(c => c.id);
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*')
    .in('company_id', companyIds)
    .eq('is_valid', true);

  // Buscar deliverables
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .in('company_id', companyIds);

  return {
    cohort,
    companies,
    evaluations: evaluations || [],
    deliverables: deliverables || []
  };
}

/**
 * Gera Company One-Pager com layout profissional e métricas expandidas
 */
export const generateCompanyOnePagerAdvanced = async (
  companyId: string,
  filters?: ExportFilterOptions
): Promise<{ success: boolean; fileName?: string }> => {
  try {
    // Buscar dados completos
    const { company, program, evaluations, deliverables, cohort } = await fetchCompanyData(companyId);
    
    // Aplicar filtros de data se especificados
    let filteredEvaluations = evaluations;
    if (filters?.dateFrom || filters?.dateTo) {
      filteredEvaluations = evaluations.filter(evaluation => {
        const evalDate = new Date(evaluation.evaluation_date);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        
        if (fromDate && evalDate < fromDate) return false;
        if (toDate && evalDate > toDate) return false;
        return true;
      });
    }
    
    // Calcular métricas de progresso
    const progressMetrics = calculateCompanyProgressMetrics(company, filteredEvaluations, deliverables);
    
    // Criar PDF com layout avançado
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 45;
    
    // Header profissional com branding
    setupProfessionalHeader(pdf, 'Company One-Pager', company.name, cohort?.name);
    
    // Seção: Informações da Empresa
    yPosition = addCompanyInfoSection(pdf, company, program, cohort, yPosition);
    
    // Seção: Métricas de Progresso
    yPosition = addProgressMetricsSection(pdf, progressMetrics, yPosition);
    
    // Seção: Evolução das Avaliações (se solicitada)
    if (filters?.includeDetailedMetrics && filteredEvaluations.length > 1) {
      yPosition = addEvaluationsEvolutionSection(pdf, filteredEvaluations, yPosition);
    }
    
    // Seção: Performance por Dimensão
    if (filteredEvaluations.length > 0) {
      yPosition = addDimensionsPerformanceSection(pdf, filteredEvaluations[0], yPosition);
    }
    
    // Seção: Deliverables com Progresso
    yPosition = addDeliverablesProgressSection(pdf, deliverables, yPosition);
    
    // Seção: Observações e Recomendações
    if (filteredEvaluations.length > 0 && filteredEvaluations[0].notes) {
      yPosition = addObservationsSection(pdf, filteredEvaluations[0].notes, yPosition);
    }
    
    // Footer profissional
    const filename = `company_one_pager_${company.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    setupProfessionalFooter(pdf, filename);
    
    // Download
    pdf.save(filename);
    
    return { success: true, fileName: filename };
    
  } catch (error) {
    console.error('Erro ao gerar Company One-Pager avançado:', error);
    throw error;
  }
};

/**
 * Gera Cohort Summary Report com estatísticas completas
 */
export const generateCohortSummaryAdvanced = async (
  cohortId?: string,
  filters?: ExportFilterOptions
): Promise<{ success: boolean; fileName?: string }> => {
  try {
    // Buscar dados da coorte
    const { cohort, companies, evaluations, deliverables } = await fetchCohortData(cohortId);
    
    // Aplicar filtros se especificados
    let filteredCompanies = companies;
    let filteredEvaluations = evaluations;
    
    if (filters?.programKey) {
      filteredCompanies = companies.filter(c => c.current_program_key === filters.programKey);
      filteredEvaluations = evaluations.filter(e => 
        filteredCompanies.some(c => c.id === e.company_id)
      );
    }
    
    // Calcular estatísticas
    const statistics = calculateCohortStatistics(filteredCompanies, filteredEvaluations, deliverables);
    
    // Criar PDF com layout profissional
    const pdf = new jsPDF();
    let yPosition = 45;
    
    // Header profissional
    setupProfessionalHeader(pdf, 'Cohort Summary Report', cohort?.name || 'Coorte Atual');
    
    // Seção: Resumo Executivo
    yPosition = addExecutiveSummarySection(pdf, statistics, cohort, yPosition);
    
    // Seção: Métricas de Performance
    yPosition = addPerformanceMetricsSection(pdf, statistics, yPosition);
    
    // Seção: Rankings (se solicitado)
    if (filters?.includeRankings) {
      yPosition = addRankingsSection(pdf, statistics, yPosition);
    }
    
    // Seção: Distribuição por Programa
    yPosition = addProgramDistributionSection(pdf, statistics, yPosition);
    
    // Seção: Análise por Dimensões
    yPosition = addDimensionsAnalysisSection(pdf, statistics, yPosition);
    
    // Seção: Lista de Empresas com Status
    yPosition = addCompanyListSection(pdf, filteredCompanies, filteredEvaluations, statistics, yPosition);
    
    // Footer profissional
    const filename = `cohort_summary_${cohort?.name?.replace(/\s+/g, '_').toLowerCase() || 'atual'}_${new Date().toISOString().split('T')[0]}.pdf`;
    setupProfessionalFooter(pdf, filename);
    
    // Download
    pdf.save(filename);
    
    return { success: true, fileName: filename };
    
  } catch (error) {
    console.error('Erro ao gerar Cohort Summary avançado:', error);
    throw error;
  }
};

/**
 * Gera PDF de uma empresa (One-Pager)
 * Abordagem híbrida: suporta dados diretos ou busca por ID
 */
export const generateCompanyReport = async (options: CompanyPDFOptions): Promise<{ success: boolean; fileName?: string }> => {
  try {
    // Resolver dados (modo híbrido)
    let company: Company;
    let program: Program;
    let evaluations: Evaluation[];
    let deliverables: Deliverable[];
    let cohort: Cohort | null = null;

    if (options.companyId) {
      // Modo pdfExport - buscar dados
      const data = await fetchCompanyData(options.companyId);
      ({ company, program, evaluations, deliverables, cohort } = data);
    } else if (options.company) {
      // Modo pdfGenerator - usar dados fornecidos
      company = options.company;
      program = options.program || { key: company.current_program_key, label: company.current_program_key };
      evaluations = options.evaluation ? [options.evaluation] : [];
      deliverables = options.deliverables || [];
    } else {
      throw new Error('Forneça companyId ou dados diretos da empresa');
    }

    // Criar PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 45;

    // Header visual (melhor layout)
    setupVisualHeader(pdf, 'Resumo Executivo da Empresa', cohort?.name);
    
    // Nome da empresa
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(company.name, 20, yPosition);
    yPosition += 10;

    // Descrição
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    if (company.description) {
      const descLines = pdf.splitTextToSize(company.description, pageWidth - 40);
      pdf.text(descLines, 20, yPosition);
      yPosition += descLines.length * 4 + 5;
    }

    // Informações básicas
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Informações Gerais', 20, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    const infoData = [
      ['Programa Atual:', program.label],
      ['Data de Fundação:', company.founded_date ? new Date(company.founded_date).toLocaleDateString('pt-BR') : 'Não informada'],
      ['Data de Entrada:', new Date(company.created_at).toLocaleDateString('pt-BR')],
      ['Website:', company.website || 'Não informado'],
      ['Coorte:', cohort?.name || 'Não atribuído']
    ];

    infoData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 70, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Última avaliação
    const latestEvaluation = evaluations.length > 0 ? evaluations[0] : null;
    
    if (latestEvaluation) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Última Avaliação', 20, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Data: ${new Date(latestEvaluation.evaluation_date).toLocaleDateString('pt-BR')}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Score Ponderado: ${latestEvaluation.weighted_score?.toFixed(2) || 'N/A'}/10`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Gate: ${latestEvaluation.gate_value || 'Não definido'}`, 20, yPosition);
      yPosition += 10;

      // Scores por dimensão (usando configuração centralizada)
      const dimensionData = hubConfig.dimensions.map(dim => [
        `${dim.label} (${(dim.weight * 100).toFixed(0)}%)`,
        String(latestEvaluation[`${dim.key}_score` as keyof Evaluation] || 'N/A')
      ]);

      autoTable(pdf, {
        head: [['Dimensão', 'Score']],
        body: dimensionData,
        startY: yPosition,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 20, right: 20 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      // Observações
      if (latestEvaluation.notes) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Observações:', 20, yPosition);
        yPosition += 6;
        
        pdf.setFont('helvetica', 'normal');
        const noteLines = pdf.splitTextToSize(latestEvaluation.notes, pageWidth - 40);
        pdf.text(noteLines, 20, yPosition);
        yPosition += noteLines.length * 4 + 10;
      }
    } else {
      pdf.setFontSize(12);
      pdf.setTextColor(239, 68, 68); // Red 500
      pdf.text('⚠️ Nenhuma avaliação válida encontrada', 20, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 10;
    }

    // Status dos Deliverables
    if (options.includeDeliverables !== false && deliverables && deliverables.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Status dos Deliverables', 20, yPosition);
      yPosition += 8;

      const deliverablesData = deliverables.map(d => [
        d.key || d.deliverable_label,
        d.status,
        d.approval_required ? 'Sim' : 'Não',
        new Date(d.created_at).toLocaleDateString('pt-BR')
      ]);

      autoTable(pdf, {
        head: [['Deliverable', 'Status', 'Obrigatório', 'Criado em']],
        body: deliverablesData,
        startY: yPosition,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 20, right: 20 }
      });
    }

    // Footer
    const filename = options.customFilename || `empresa_${company.name.replace(/\s+/g, '_').toLowerCase()}_resumo.pdf`;
    setupFooter(pdf, filename);

    // Download do PDF
    pdf.save(filename);

    return { success: true, fileName: filename };

  } catch (error) {
    console.error('Erro ao gerar PDF da empresa:', error);
    throw error;
  }
};

/**
 * Gera PDF de resumo de coorte
 * Abordagem híbrida: suporta dados diretos ou busca por ID
 */
export const generateCohortReport = async (options: CohortPDFOptions): Promise<{ success: boolean; fileName?: string }> => {
  try {
    // Resolver dados (modo híbrido)
    let cohort: Cohort;
    let companies: Company[];
    let evaluations: Evaluation[];
    let deliverables: Deliverable[];

    if (options.cohortId) {
      // Modo pdfExport - buscar dados
      const data = await fetchCohortData(options.cohortId);
      ({ cohort, companies, evaluations, deliverables } = data);
    } else if (options.cohort) {
      // Modo pdfGenerator - usar dados fornecidos
      cohort = options.cohort;
      companies = options.companies || [];
      evaluations = options.evaluations || [];
      deliverables = options.deliverables || [];
    } else {
      throw new Error('Forneça cohortId ou dados diretos da coorte');
    }

    // Criar PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 45;

    // Header visual
    setupVisualHeader(pdf, 'Resumo Estatístico da Coorte');
    
    // Nome da coorte
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(cohort?.name || 'Coorte Atual', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    if (cohort?.description) {
      const descLines = pdf.splitTextToSize(cohort.description, pageWidth - 40);
      pdf.text(descLines, 20, yPosition);
      yPosition += descLines.length * 4 + 10;
    }

    // Estatísticas gerais
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Estatísticas Gerais', 20, yPosition);
    yPosition += 8;

    const totalCompanies = companies.length;
    const companiesWithEvaluations = evaluations ? new Set(evaluations.map(e => e.company_id)).size : 0;
    const totalDeliverables = deliverables?.length || 0;
    const approvedDeliverables = deliverables?.filter(d => d.status === 'aprovado').length || 0;

    const statsData = [
      ['Total de Empresas', totalCompanies.toString()],
      ['Empresas com Avaliação', companiesWithEvaluations.toString()],
      ['Total de Deliverables', totalDeliverables.toString()],
      ['Deliverables Aprovados', approvedDeliverables.toString()],
      ['Taxa de Aprovação', totalDeliverables > 0 ? `${((approvedDeliverables / totalDeliverables) * 100).toFixed(1)}%` : '0%']
    ];

    autoTable(pdf, {
      head: [['Métrica', 'Valor']],
      body: statsData,
      startY: yPosition,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;

    // Distribuição por programa
    const programDistribution = {
      hotel_de_projetos: companies.filter(c => c.current_program_key === 'hotel_de_projetos').length,
      pre_residencia: companies.filter(c => c.current_program_key === 'pre_residencia').length,
      residencia: companies.filter(c => c.current_program_key === 'residencia').length,
    };

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Distribuição por Programa', 20, yPosition);
    yPosition += 8;

    const programData = [
      [programLabels.hotel_de_projetos, programDistribution.hotel_de_projetos.toString()],
      [programLabels.pre_residencia, programDistribution.pre_residencia.toString()],
      [programLabels.residencia, programDistribution.residencia.toString()]
    ];

    autoTable(pdf, {
      head: [['Programa', 'Empresas']],
      body: programData,
      startY: yPosition,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;

    // Médias por dimensão (se houver avaliações)
    if (evaluations && evaluations.length > 0) {
      const dimensionAverages = {
        mercado: 0,
        perfil_empreendedor: 0,
        tecnologia_qualidade: 0,
        gestao: 0,
        financeiro: 0,
      };

      evaluations.forEach(evaluation => {
        if (evaluation.mercado_score) dimensionAverages.mercado += evaluation.mercado_score;
        if (evaluation.perfil_empreendedor_score) dimensionAverages.perfil_empreendedor += evaluation.perfil_empreendedor_score;
        if (evaluation.tecnologia_qualidade_score) dimensionAverages.tecnologia_qualidade += evaluation.tecnologia_qualidade_score;
        if (evaluation.gestao_score) dimensionAverages.gestao += evaluation.gestao_score;
        if (evaluation.financeiro_score) dimensionAverages.financeiro += evaluation.financeiro_score;
      });

      // Calcular médias
      Object.keys(dimensionAverages).forEach(key => {
        dimensionAverages[key as keyof typeof dimensionAverages] /= evaluations.length;
      });

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Médias por Dimensão', 20, yPosition);
      yPosition += 8;

      const dimensionData = hubConfig.dimensions.map(dim => [
        dim.label,
        dimensionAverages[dim.key as keyof typeof dimensionAverages]?.toFixed(1) || 'N/A',
        `${(dim.weight * 100).toFixed(0)}%`
      ]);

      autoTable(pdf, {
        head: [['Dimensão', 'Média', 'Peso']],
        body: dimensionData,
        startY: yPosition,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 20, right: 20 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    // Lista de empresas
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Empresas da Coorte', 20, yPosition);
    yPosition += 8;

    const companiesData = companies.map(company => {
      const companyEvaluations = evaluations?.filter(e => e.company_id === company.id) || [];
      const latestEval = companyEvaluations.length > 0 ? companyEvaluations[0] : null;
      
      return [
        company.name,
        programLabels[company.current_program_key],
        latestEval?.weighted_score?.toFixed(1) || 'N/A',
        latestEval?.gate_value || 'Não avaliado'
      ];
    });

    autoTable(pdf, {
      head: [['Empresa', 'Programa', 'Score', 'Gate']],
      body: companiesData,
      startY: yPosition,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 45 }
      }
    });

    // Footer
    const filename = options.customFilename || `coorte_${cohort?.name?.replace(/\s+/g, '_').toLowerCase() || 'atual'}_resumo.pdf`;
    setupFooter(pdf, filename);

    // Download do PDF
    pdf.save(filename);

    return { success: true, fileName: filename };

  } catch (error) {
    console.error('Erro ao gerar PDF da coorte:', error);
    throw error;
  }
};

/**
 * Lista todas as coortes disponíveis para seleção
 */
export const getAvailableCohorts = async (): Promise<Cohort[]> => {
  try {
    const { data: cohorts, error } = await supabase
      .from('cohorts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return cohorts || [];
  } catch (error) {
    console.error('Erro ao buscar coortes:', error);
    return [];
  }
};

/**
 * Lista todas as empresas para seleção
 */
export const getAvailableCompanies = async (): Promise<Company[]> => {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    return companies || [];
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return [];
  }
};

/**
 * Funções de compatibilidade para migração gradual
 * Mantêm as interfaces antigas como deprecated
 */

// @deprecated Use generateCompanyReport
export const generateCompanyOnePager = async (
  company: Company,
  program: Program,
  latestEvaluation: Evaluation | null,
  deliverables: Deliverable[]
) => {
  return generateCompanyReport({
    company,
    program,
    evaluation: latestEvaluation || undefined,
    deliverables,
    includeVisualHeader: true,
    includeDeliverables: true
  });
};

// @deprecated Use generateCompanyReport
export const generateCompanyOnePagerPDF = async (companyId: string) => {
  return generateCompanyReport({
    companyId,
    includeVisualHeader: true,
    includeDeliverables: true
  });
};

// @deprecated Use generateCohortReport
export const generateCohortSummary = async (
  cohortName: string,
  companies: Company[],
  evaluations: Evaluation[],
  programs: Program[]
) => {
  const cohort: Cohort = {
    id: 'legacy',
    name: cohortName,
    created_at: new Date().toISOString()
  };
  
  return generateCohortReport({
    cohort,
    companies,
    evaluations,
    programs,
    includeDetailedStats: true
  });
};

// @deprecated Use generateCohortReport
export const generateCohortSummaryPDF = async (cohortId?: string) => {
  return generateCohortReport({
    cohortId,
    includeDetailedStats: true
  });
};

/**
 * Calcula métricas de progresso da empresa
 */
export function calculateCompanyProgressMetrics(
  company: Company,
  evaluations: Evaluation[],
  deliverables: Deliverable[]
) {
  const totalDeliverables = deliverables.length;
  const completedDeliverables = deliverables.filter(d => d.status === 'aprovado').length;
  const progressPercentage = totalDeliverables > 0 ? (completedDeliverables / totalDeliverables) * 100 : 0;
  
  const daysInProgram = Math.floor(
    (new Date().getTime() - new Date(company.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const validEvaluations = evaluations.filter(e => e.is_valid && e.weighted_score !== null);
  const averageScore = validEvaluations.length > 0 
    ? validEvaluations.reduce((sum, e) => sum + (e.weighted_score || 0), 0) / validEvaluations.length
    : 0;
  
  return {
    totalDeliverables,
    completedDeliverables,
    progressPercentage: Math.round(progressPercentage * 10) / 10,
    daysInProgram,
    averageScore: Math.round(averageScore * 10) / 10
  };
}

/**
 * Calcula estatísticas da coorte
 */
export function calculateCohortStatistics(
  companies: Company[],
  evaluations: Evaluation[],
  deliverables: Deliverable[]
) {
  const totalCompanies = companies.length;
  const companiesWithEvaluations = new Set(evaluations.map(e => e.company_id)).size;
  
  const validEvaluations = evaluations.filter(e => e.is_valid && e.weighted_score !== null);
  const averageScore = validEvaluations.length > 0
    ? validEvaluations.reduce((sum, e) => sum + (e.weighted_score || 0), 0) / validEvaluations.length
    : 0;
  
  // Top performers (empresas com melhor score)
  const companyScores = companies.map(company => {
    const companyEvals = evaluations.filter(e => e.company_id === company.id && e.is_valid);
    const latestEval = companyEvals.length > 0 ? companyEvals[0] : null;
    return {
      company,
      score: latestEval?.weighted_score || 0
    };
  });
  
  const topPerformers = companyScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.company);
  
  // Distribuição por programa
  const programDistribution = companies.reduce((acc, company) => {
    acc[company.current_program_key] = (acc[company.current_program_key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Médias por dimensão
  const dimensionTotals = {
    mercado: 0,
    perfil_empreendedor: 0,
    tecnologia_qualidade: 0,
    gestao: 0,
    financeiro: 0
  };
  
  validEvaluations.forEach(evaluation => {
    if (evaluation.mercado_score) dimensionTotals.mercado += evaluation.mercado_score;
    if (evaluation.perfil_empreendedor_score) dimensionTotals.perfil_empreendedor += evaluation.perfil_empreendedor_score;
    if (evaluation.tecnologia_qualidade_score) dimensionTotals.tecnologia_qualidade += evaluation.tecnologia_qualidade_score;
    if (evaluation.gestao_score) dimensionTotals.gestao += evaluation.gestao_score;
    if (evaluation.financeiro_score) dimensionTotals.financeiro += evaluation.financeiro_score;
  });
  
  const dimensionAverages = Object.keys(dimensionTotals).reduce((acc, key) => {
    acc[key] = validEvaluations.length > 0 
      ? Math.round((dimensionTotals[key as keyof typeof dimensionTotals] / validEvaluations.length) * 10) / 10
      : 0;
    return acc;
  }, {} as Record<string, number>);
  
  // Taxas de conclusão
  const completionRates = companies.reduce((acc, company) => {
    const companyDeliverables = deliverables.filter(d => d.company_id === company.id);
    const total = companyDeliverables.length;
    const completed = companyDeliverables.filter(d => d.status === 'aprovado').length;
    acc[company.id] = total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalCompanies,
    companiesWithEvaluations,
    averageScore: Math.round(averageScore * 10) / 10,
    topPerformers,
    programDistribution,
    dimensionAverages,
    completionRates
  };
}/**
 * Configura header profissional com branding
 */
function setupProfessionalHeader(pdf: jsPDF, title: string, companyName?: string, cohortName?: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Background gradiente
  pdf.setFillColor(...brandingConfig.primaryColor);
  pdf.rect(0, 0, pageWidth, brandingConfig.headerHeight, 'F');
  
  // Overlay para efeito gradiente
  pdf.setFillColor(...brandingConfig.secondaryColor);
  pdf.rect(0, 0, pageWidth * 0.3, brandingConfig.headerHeight, 'F');
  
  // Logo e título principal
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HUB Empresas', 20, 20);
  
  // Subtítulo
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(title, 20, 28);
  
  // Informações à direita
  if (companyName) {
    pdf.setFontSize(10);
    pdf.text(companyName, pageWidth - 20, 18, { align: 'right' });
  }
  
  if (cohortName) {
    pdf.setFontSize(8);
    pdf.text(cohortName, pageWidth - 20, 26, { align: 'right' });
  }
}

/**
 * Configura footer profissional
 */
function setupProfessionalFooter(pdf: jsPDF, filename: string) {
  const pageCount = (pdf as any).internal.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Linha divisória
    pdf.setDrawColor(...brandingConfig.primaryColor);
    pdf.setLineWidth(0.5);
    pdf.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
    
    // Informações do footer
    pdf.setFontSize(8);
    pdf.setTextColor(...brandingConfig.lightText);
    
    pdf.text(
      `Página ${i} de ${pageCount}`,
      20,
      pageHeight - 12
    );
    
    pdf.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')} | HUB Empresas`,
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
    
    pdf.text(
      filename,
      pageWidth - 20,
      pageHeight - 12,
      { align: 'right' }
    );
  }
}

/**
 * Adiciona seção de informações da empresa
 */
function addCompanyInfoSection(pdf: jsPDF, company: Company, program: Program, cohort: Cohort | null, yPosition: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Título da seção
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Informações da Empresa', 20, yPosition);
  yPosition += 10;
  
  // Dados da empresa
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const companyData = [
    ['Nome:', company.name],
    ['Programa:', program.label],
    ['Data de Fundação:', company.founded_date ? new Date(company.founded_date).toLocaleDateString('pt-BR') : 'Não informada'],
    ['Data de Entrada:', new Date(company.created_at).toLocaleDateString('pt-BR')],
    ['Website:', company.website || 'Não informado'],
    ['Coorte:', cohort?.name || 'Não atribuído']
  ];
  
  companyData.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, 80, yPosition);
    yPosition += 6;
  });
  
  // Descrição se disponível
  if (company.description) {
    yPosition += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Descrição:', 20, yPosition);
    yPosition += 6;
    
    pdf.setFont('helvetica', 'normal');
    const descLines = pdf.splitTextToSize(company.description, pageWidth - 40);
    pdf.text(descLines, 20, yPosition);
    yPosition += descLines.length * 4 + 15;
  } else {
    yPosition += 15;
  }
  
  return yPosition;
}

/**
 * Adiciona seção de métricas de progresso
 */
function addProgressMetricsSection(pdf: jsPDF, metrics: any, yPosition: number): number {
  // Título da seção
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Métricas de Progresso', 20, yPosition);
  yPosition += 10;
  
  // Cards de métricas
  const metricsCards = [
    { label: 'Progresso Geral', value: `${metrics.progressPercentage}%`, color: brandingConfig.accentColor },
    { label: 'Deliverables', value: `${metrics.completedDeliverables}/${metrics.totalDeliverables}`, color: brandingConfig.primaryColor },
    { label: 'Dias no Programa', value: metrics.daysInProgram.toString(), color: brandingConfig.secondaryColor },
    { label: 'Score Médio', value: metrics.averageScore.toFixed(1), color: brandingConfig.accentColor }
  ];
  
  const cardWidth = 45;
  const cardHeight = 20;
  const spacing = 5;
  
  metricsCards.forEach((card, index) => {
    const x = 20 + (index % 2) * (cardWidth + spacing);
    const y = yPosition + Math.floor(index / 2) * (cardHeight + spacing);
    
    // Background do card
    pdf.setFillColor(248, 250, 252); // Gray 50
    pdf.rect(x, y, cardWidth, cardHeight, 'F');
    pdf.setDrawColor(229, 231, 235); // Gray 200
    pdf.rect(x, y, cardWidth, cardHeight, 'S');
    
    // Título do card
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...brandingConfig.lightText);
    pdf.text(card.label, x + 5, y + 8);
    
    // Valor do card
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...card.color);
    pdf.text(card.value, x + 5, y + 16);
  });
  
  return yPosition + 50;
}

/**
 * Adiciona seção de evolução das avaliações
 */
function addEvaluationsEvolutionSection(pdf: jsPDF, evaluations: Evaluation[], yPosition: number): number {
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Evolução das Avaliações', 20, yPosition);
  yPosition += 10;
  
  const evalData = evaluations.map(evaluation => [
    new Date(evaluation.evaluation_date).toLocaleDateString('pt-BR'),
    evaluation.weighted_score?.toFixed(1) || 'N/A',
    evaluation.gate_value || 'Não definido'
  ]);
  
  autoTable(pdf, {
    head: [['Data', 'Score', 'Gate']],
    body: evalData,
    startY: yPosition,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: brandingConfig.primaryColor, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 }
  });
  
  return (pdf as any).lastAutoTable.finalY + 15;
}

/**
 * Adiciona seção de performance por dimensão
 */
function addDimensionsPerformanceSection(pdf: jsPDF, evaluation: Evaluation, yPosition: number): number {
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Performance por Dimensão', 20, yPosition);
  yPosition += 10;
  
  const dimensionData = hubConfig.dimensions.map(dim => [
    dim.label,
    String(evaluation[`${dim.key}_score` as keyof Evaluation] || 'N/A'),
    `${(dim.weight * 100).toFixed(0)}%`
  ]);
  
  autoTable(pdf, {
    head: [['Dimensão', 'Score', 'Peso']],
    body: dimensionData,
    startY: yPosition,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: brandingConfig.primaryColor, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 }
  });
  
  return (pdf as any).lastAutoTable.finalY + 15;
}

/**
 * Adiciona seção de progresso dos deliverables
 */
function addDeliverablesProgressSection(pdf: jsPDF, deliverables: Deliverable[], yPosition: number): number {
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Status dos Deliverables', 20, yPosition);
  yPosition += 10;
  
  const deliverablesData = deliverables.map(d => [
    d.key || d.deliverable_label || 'N/A',
    d.status,
    d.approval_required ? 'Sim' : 'Não',
    new Date(d.created_at).toLocaleDateString('pt-BR')
  ]);
  
  autoTable(pdf, {
    head: [['Deliverable', 'Status', 'Obrigatório', 'Criado em']],
    body: deliverablesData,
    startY: yPosition,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: brandingConfig.primaryColor, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 }
  });
  
  return (pdf as any).lastAutoTable.finalY + 15;
}

/**
 * Adiciona seção de observações
 */
function addObservationsSection(pdf: jsPDF, notes: string, yPosition: number): number {
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Observações e Recomendações', 20, yPosition);
  yPosition += 10;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const noteLines = pdf.splitTextToSize(notes, pdf.internal.pageSize.getWidth() - 40);
  pdf.text(noteLines, 20, yPosition);
  
  return yPosition + noteLines.length * 4 + 15;
}

/**
 * Adiciona seção de resumo executivo
 */
function addExecutiveSummarySection(pdf: jsPDF, statistics: any, cohort: Cohort | null, yPosition: number): number {
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Resumo Executivo', 20, yPosition);
  yPosition += 10;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  const summaryText = `A coorte ${cohort?.name || 'atual'} apresenta um total de ${statistics.totalCompanies} empresas, ` +
    `sendo ${statistics.companiesWithEvaluations} com avaliações válidas. ` +
    `O score médio geral é de ${statistics.averageScore} pontos, ` +
    `indicando ${statistics.averageScore >= 7 ? 'excelente' : statistics.averageScore >= 5 ? 'bom' : 'necessita melhoria'} performance.`;
  
  const summaryLines = pdf.splitTextToSize(summaryText, pdf.internal.pageSize.getWidth() - 40);
  pdf.text(summaryLines, 20, yPosition);
  
  return yPosition + summaryLines.length * 4 + 15;
}

/**
 * Adiciona seção de métricas de performance
 */
function addPerformanceMetricsSection(pdf: jsPDF, statistics: any, yPosition: number): number {
  // Similar ao addProgressMetricsSection mas para coorte
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Métricas de Performance da Coorte', 20, yPosition);
  yPosition += 10;
  
  const metricsCards = [
    { label: 'Total Empresas', value: statistics.totalCompanies.toString(), color: brandingConfig.primaryColor },
    { label: 'Com Avaliação', value: statistics.companiesWithEvaluations.toString(), color: brandingConfig.secondaryColor },
    { label: 'Score Médio', value: statistics.averageScore.toFixed(1), color: brandingConfig.accentColor },
    { label: 'Top Performers', value: statistics.topPerformers.length.toString(), color: brandingConfig.primaryColor }
  ];
  
  const cardWidth = 45;
  const cardHeight = 20;
  const spacing = 5;
  
  metricsCards.forEach((card, index) => {
    const x = 20 + (index % 2) * (cardWidth + spacing);
    const y = yPosition + Math.floor(index / 2) * (cardHeight + spacing);
    
    pdf.setFillColor(248, 250, 252);
    pdf.rect(x, y, cardWidth, cardHeight, 'F');
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(x, y, cardWidth, cardHeight, 'S');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...brandingConfig.lightText);
    pdf.text(card.label, x + 5, y + 8);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...card.color);
    pdf.text(card.value, x + 5, y + 16);
  });
  
  return yPosition + 50;
}

/**
 * Adiciona seção de rankings
 */
function addRankingsSection(pdf: jsPDF, statistics: any, yPosition: number): number {
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Top 5 Empresas', 20, yPosition);
  yPosition += 10;
  
  const rankingData = statistics.topPerformers.map((company: Company, index: number) => [
    `#${index + 1}`,
    company.name,
    programLabels[company.current_program_key]
  ]);
  
  autoTable(pdf, {
    head: [['Posição', 'Empresa', 'Programa']],
    body: rankingData,
    startY: yPosition,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: brandingConfig.accentColor, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 }
  });
  
  return (pdf as any).lastAutoTable.finalY + 15;
}

/**
 * Adiciona seção de distribuição por programa
 */
function addProgramDistributionSection(pdf: jsPDF, statistics: any, yPosition: number): number {
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Distribuição por Programa', 20, yPosition);
  yPosition += 10;
  
  const programData = Object.entries(statistics.programDistribution).map(([program, count]) => [
    programLabels[program] || program,
    String(count),
    `${((Number(count) / statistics.totalCompanies) * 100).toFixed(1)}%`
  ]);
  
  autoTable(pdf, {
    head: [['Programa', 'Empresas', 'Percentual']],
    body: programData,
    startY: yPosition,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: brandingConfig.secondaryColor, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 }
  });
  
  return (pdf as any).lastAutoTable.finalY + 15;
}

/**
 * Adiciona seção de análise por dimensões
 */
function addDimensionsAnalysisSection(pdf: jsPDF, statistics: any, yPosition: number): number {
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Média de Scores por Dimensão', 20, yPosition);
  yPosition += 10;
  
  const dimensionData = hubConfig.dimensions.map(dim => [
    dim.label,
    statistics.dimensionAverages[dim.key]?.toFixed(1) || 'N/A',
    `${(dim.weight * 100).toFixed(0)}%`
  ]);
  
  autoTable(pdf, {
    head: [['Dimensão', 'Média', 'Peso']],
    body: dimensionData,
    startY: yPosition,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: brandingConfig.primaryColor, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 }
  });
  
  return (pdf as any).lastAutoTable.finalY + 15;
}

/**
 * Adiciona seção de lista de empresas
 */
function addCompanyListSection(pdf: jsPDF, companies: Company[], evaluations: Evaluation[], statistics: any, yPosition: number): number {
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...brandingConfig.textColor);
  pdf.text('Lista Completa de Empresas', 20, yPosition);
  yPosition += 10;
  
  const companiesData = companies.map(company => {
    const companyEval = evaluations.filter(e => e.company_id === company.id && e.is_valid)[0];
    const completionRate = statistics.completionRates[company.id] || 0;
    
    return [
      company.name,
      programLabels[company.current_program_key],
      companyEval?.weighted_score?.toFixed(1) || 'N/A',
      companyEval?.gate_value || 'Não avaliado',
      `${completionRate}%`
    ];
  });
  
  autoTable(pdf, {
    head: [['Empresa', 'Programa', 'Score', 'Gate', 'Progresso']],
    body: companiesData,
    startY: yPosition,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: brandingConfig.primaryColor, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 }
    }
  });
  
  return (pdf as any).lastAutoTable.finalY + 15;
}