// Funções de geração de PDF para preview (retornam Blob ao invés de baixar)
// Baseadas nas funções de lib/pdf/index.ts mas sem download automático

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../supabase';
import type { ExportFilterOptions } from './index';

/**
 * Gera blob de PDF para Company One-Pager (sem download)
 */
export async function generateCompanyPDFBlob(
  companyId: string,
  filters?: ExportFilterOptions
): Promise<Blob> {
  try {
    // Buscar dados completos (mesma lógica do index.ts)
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    const { data: program } = await supabase
      .from('programs')
      .select('*')
      .eq('key', company.current_program_key)
      .single();

    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_valid', true)
      .order('evaluation_date', { ascending: false });

    const { data: deliverables } = await supabase
      .from('deliverables')
      .select('*')
      .eq('company_id', companyId)
      .eq('program_key', company.current_program_key);

    // Criar PDF
    const pdf = new jsPDF();
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Company One-Pager', 20, yPosition);
    yPosition += 15;

    // Informações da empresa
    pdf.setFontSize(16);
    pdf.setTextColor(59, 130, 246);
    pdf.text(company.name, 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Programa: ${program?.name || company.current_program_key}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Status: ${company.status}`, 20, yPosition);
    yPosition += 10;

    // Avaliação mais recente
    if (evaluations && evaluations.length > 0) {
      const latestEval = evaluations[0];
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);
      pdf.text('Última Avaliação', 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Score Ponderado: ${latestEval.weighted_score?.toFixed(2) || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Gate Value: ${latestEval.gate_value || 'Não avaliado'}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Data: ${new Date(latestEval.evaluation_date).toLocaleDateString('pt-BR')}`, 20, yPosition);
      yPosition += 12;
    }

    // Deliverables
    if (deliverables && deliverables.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Deliverables', 20, yPosition);
      yPosition += 8;

      const approved = deliverables.filter(d => d.status === 'aprovado').length;
      const total = deliverables.length;
      const percentage = ((approved / total) * 100).toFixed(0);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Progresso: ${approved}/${total} (${percentage}%)`, 20, yPosition);
      yPosition += 10;

      // Tabela de deliverables
      const delivTableData = deliverables.slice(0, 10).map(d => [
        d.title.substring(0, 40),
        d.status === 'aprovado' ? 'Aprovado' : 
        d.status === 'em_revisao' ? 'Em Revisão' : 
        d.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'
      ]);

      autoTable(pdf, {
        head: [['Deliverable', 'Status']],
        body: delivTableData,
        startY: yPosition,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 40 }
        },
        margin: { left: 20, right: 20 }
      });
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} - HUB Empresas`, 20, 280);

    // Retornar blob ao invés de baixar
    return pdf.output('blob');

  } catch (error) {
    console.error('Erro ao gerar PDF blob:', error);
    throw error;
  }
}

/**
 * Gera blob de PDF para Cohort Summary (sem download)
 */
export async function generateCohortPDFBlob(
  cohortId?: string,
  filters?: ExportFilterOptions
): Promise<Blob> {
  try {
    // Buscar dados da coorte
    let cohortQuery = supabase.from('cohorts').select('*');
    
    if (cohortId) {
      cohortQuery = cohortQuery.eq('id', cohortId);
    } else {
      cohortQuery = cohortQuery.order('created_at', { ascending: false }).limit(1);
    }

    const { data: cohorts } = await cohortQuery;
    const cohort = cohorts?.[0];

    if (!cohort) {
      throw new Error('Coorte não encontrada');
    }

    // Buscar empresas da coorte
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .eq('cohort_id', cohort.id);

    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('*')
      .in('company_id', companies?.map(c => c.id) || [])
      .eq('is_valid', true);

    // Criar PDF
    const pdf = new jsPDF();
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Cohort Summary Report', 20, yPosition);
    yPosition += 15;

    // Nome da coorte
    pdf.setFontSize(16);
    pdf.setTextColor(59, 130, 246);
    pdf.text(cohort.name, 20, yPosition);
    yPosition += 10;

    // Estatísticas
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Resumo Executivo', 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total de Empresas: ${companies?.length || 0}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Com Avaliação: ${evaluations?.length || 0}`, 20, yPosition);
    yPosition += 6;

    const avgScore = evaluations && evaluations.length > 0
      ? (evaluations.reduce((sum, e) => sum + (e.weighted_score || 0), 0) / evaluations.length).toFixed(2)
      : 'N/A';
    pdf.text(`Score Médio: ${avgScore}`, 20, yPosition);
    yPosition += 12;

    // Tabela de empresas
    if (companies && companies.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Empresas na Coorte', 20, yPosition);
      yPosition += 8;

      const companyTableData = companies.slice(0, 15).map(c => {
        const companyEval = evaluations?.find(e => e.company_id === c.id);
        return [
          c.name.substring(0, 35),
          c.current_program_key.replace('_', ' '),
          companyEval?.weighted_score?.toFixed(1) || 'N/A'
        ];
      });

      autoTable(pdf, {
        head: [['Empresa', 'Programa', 'Score']],
        body: companyTableData,
        startY: yPosition,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 }
        },
        margin: { left: 20, right: 20 }
      });
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} - HUB Empresas`, 20, 280);

    // Retornar blob ao invés de baixar
    return pdf.output('blob');

  } catch (error) {
    console.error('Erro ao gerar PDF blob:', error);
    throw error;
  }
}
