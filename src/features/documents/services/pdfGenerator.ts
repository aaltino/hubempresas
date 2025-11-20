import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Company, Evaluation, Deliverable, Program } from '@/lib/supabase';

// Gerar One-Pager da Empresa
export const generateCompanyOnePager = async (
  company: Company,
  program: Program,
  latestEvaluation: Evaluation | null,
  deliverables: Deliverable[]
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HUB Empresas - One-Pager', 105, 20, { align: 'center' });
  
  // Linha separadora
  doc.setDrawColor(59, 130, 246); // blue-600
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  // Informações da Empresa
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, 20, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 45;
  
  if (company.description) {
    doc.text(`Descricao: ${company.description}`, 20, yPos);
    yPos += 10;
  }
  
  if (company.website) {
    doc.text(`Website: ${company.website}`, 20, yPos);
    yPos += 10;
  }
  
  doc.text(`Programa Atual: ${program.label}`, 20, yPos);
  yPos += 15;
  
  // Avaliação Mais Recente
  if (latestEvaluation) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ultima Avaliacao', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const evalDate = new Date(latestEvaluation.evaluation_date).toLocaleDateString('pt-BR');
    doc.text(`Data: ${evalDate}`, 20, yPos);
    yPos += 6;
    
    doc.text(`Score Ponderado: ${latestEvaluation.weighted_score?.toFixed(2) || 'N/A'}`, 20, yPos);
    yPos += 6;
    
    if (latestEvaluation.gate_value) {
      doc.text(`Gate: ${latestEvaluation.gate_value}`, 20, yPos);
      yPos += 10;
    }
    
    // Tabela de Scores por Dimensão
    const dimensionData = [
      ['Mercado (28%)', (latestEvaluation.mercado_score || 0).toFixed(1)],
      ['Perfil Empreendedor (21%)', (latestEvaluation.perfil_empreendedor_score || 0).toFixed(1)],
      ['Tecnologia & Qualidade (14%)', (latestEvaluation.tecnologia_qualidade_score || 0).toFixed(1)],
      ['Gestao (16%)', (latestEvaluation.gestao_score || 0).toFixed(1)],
      ['Financeiro (16%)', (latestEvaluation.financeiro_score || 0).toFixed(1)],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Dimensao', 'Score']],
      body: dimensionData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 50, halign: 'center' }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Deliverables
  if (deliverables && deliverables.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Deliverables', 20, yPos);
    yPos += 8;
    
    const deliverableData = deliverables.map(d => [
      d.deliverable_label,
      d.status === 'aprovado' ? 'Aprovado' : 
        d.status === 'em_revisao' ? 'Em Revisao' : 
        d.status === 'em_andamento' ? 'Em Andamento' : 'A Fazer',
      d.approval_required ? 'Sim' : 'Nao'
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Deliverable', 'Status', 'Aprovacao Obrigatoria']],
      body: deliverableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
  }
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Pagina ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')} - HUB Empresas`,
      105,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }
  
  // Salvar PDF
  doc.save(`${company.name.replace(/\s+/g, '_')}_one_pager.pdf`);
};

// Gerar Resumo de Cohort
export const generateCohortSummary = async (
  cohortName: string,
  companies: Company[],
  evaluations: Evaluation[],
  programs: Program[]
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HUB Empresas - Resumo de Cohort', 105, 20, { align: 'center' });
  
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  // Nome da Cohort
  doc.setFontSize(16);
  doc.text(cohortName, 20, 35);
  
  let yPos = 45;
  
  // Estatísticas Gerais
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Estatisticas Gerais', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const totalCompanies = companies.length;
  const hotelCount = companies.filter(c => c.current_program_key === 'hotel_de_projetos').length;
  const preResidenciaCount = companies.filter(c => c.current_program_key === 'pre_residencia').length;
  const residenciaCount = companies.filter(c => c.current_program_key === 'residencia').length;
  
  doc.text(`Total de Empresas: ${totalCompanies}`, 20, yPos);
  yPos += 6;
  doc.text(`Hotel de Projetos: ${hotelCount}`, 20, yPos);
  yPos += 6;
  doc.text(`Pre-Residencia: ${preResidenciaCount}`, 20, yPos);
  yPos += 6;
  doc.text(`Residencia: ${residenciaCount}`, 20, yPos);
  yPos += 15;
  
  // Tabela de Empresas
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Empresas por Programa', 20, yPos);
  yPos += 8;
  
  const companyData = companies.map(company => {
    const programLabel = programs.find(p => p.key === company.current_program_key)?.label || company.current_program_key;
    const lastEval = evaluations
      .filter(e => e.company_id === company.id)
      .sort((a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime())[0];
    
    return [
      company.name,
      programLabel,
      lastEval ? lastEval.weighted_score?.toFixed(2) : 'N/A'
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Empresa', 'Programa', 'Ultimo Score']],
    body: companyData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Estatísticas de Avaliação
  if (evaluations.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Estatisticas de Avaliacao', 20, yPos);
    yPos += 8;
    
    const avgScores = {
      mercado: evaluations.reduce((sum, e) => sum + (e.mercado_score || 0), 0) / evaluations.length,
      perfil: evaluations.reduce((sum, e) => sum + (e.perfil_empreendedor_score || 0), 0) / evaluations.length,
      tecnologia: evaluations.reduce((sum, e) => sum + (e.tecnologia_qualidade_score || 0), 0) / evaluations.length,
      gestao: evaluations.reduce((sum, e) => sum + (e.gestao_score || 0), 0) / evaluations.length,
      financeiro: evaluations.reduce((sum, e) => sum + (e.financeiro_score || 0), 0) / evaluations.length,
    };
    
    const avgData = [
      ['Mercado', avgScores.mercado.toFixed(2)],
      ['Perfil Empreendedor', avgScores.perfil.toFixed(2)],
      ['Tecnologia & Qualidade', avgScores.tecnologia.toFixed(2)],
      ['Gestao', avgScores.gestao.toFixed(2)],
      ['Financeiro', avgScores.financeiro.toFixed(2)],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Dimensao', 'Media do Cohort']],
      body: avgData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
  }
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Pagina ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')} - HUB Empresas`,
      105,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }
  
  doc.save(`${cohortName.replace(/\s+/g, '_')}_resumo.pdf`);
};
