import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, type Company, type Evaluation, type Deliverable, type Program } from '@/lib/supabase';
import { ArrowLeft, Edit, CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import StageProgressBar from '@/components/shared/StageProgressBar';
import { ConfirmModal } from '@/components/shared/Modal';
import { DocumentUpload, DocumentHistory } from '@/features/documents';
import { PDFExportButton, ExportActionsMenu } from '@/features/exports';
import { CompanyProgressBar } from '@/features/companies';

export default function CompanyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [latestEval, setLatestEval] = useState<Evaluation | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibilityData, setEligibilityData] = useState<any>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (!companyData) {
        navigate('/empresas');
        return;
      }

      setCompany(companyData);

      const { data: programData } = await supabase
        .from('programs')
        .select('*')
        .eq('key', companyData.current_program_key)
        .single();

      setProgram(programData);

      const { data: evalData } = await supabase
        .from('evaluations')
        .select('*')
        .eq('company_id', id)
        .eq('program_key', companyData.current_program_key)
        .eq('is_valid', true)
        .order('evaluation_date', { ascending: false })
        .maybeSingle();

      setLatestEval(evalData);

      const { data: delivData } = await supabase
        .from('deliverables')
        .select('*')
        .eq('company_id', id)
        .eq('program_key', companyData.current_program_key);

      setDeliverables(delivData || []);

      // Check eligibility
      await checkEligibility(id!);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (companyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-progression-eligibility', {
        body: { company_id: companyId }
      });

      if (!error && data?.data) {
        setEligibilityData(data.data);
      }
    } catch (error) {
      console.error('Erro ao verificar elegibilidade:', error);
    }
  };

  const handleAdvanceProgram = async () => {
    if (!company || !eligibilityData?.eligible) return;

    try {
      const nextProgram = getNextProgram(company.current_program_key);
      if (!nextProgram) {
        alert('Empresa já está no último programa');
        return;
      }

      // Atualizar programa da empresa
      const { error } = await supabase
        .from('companies')
        .update({ 
          current_program_key: nextProgram,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      // Criar deliverables para o novo programa
      await supabase.functions.invoke('create-deliverables-for-company', {
        body: {
          company_id: company.id,
          program_key: nextProgram
        }
      });

      alert('Empresa avançada com sucesso!');
      setShowProgressModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao avançar empresa:', error);
      alert('Erro ao avançar empresa');
    }
  };

  const getNextProgram = (currentKey: string) => {
    if (currentKey === 'hotel_de_projetos') return 'pre_residencia';
    if (currentKey === 'pre_residencia') return 'residencia';
    return null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'em_revisao':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'em_andamento':
        return <TrendingUp className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const programLabels: Record<string, string> = {
    hotel_de_projetos: 'Hotel de Projetos',
    pre_residencia: 'Pré-Residência',
    residencia: 'Residência'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!company) {
    return <div>Empresa não encontrada</div>;
  }

  const completionPercent = deliverables.length > 0
    ? Math.round((deliverables.filter(d => d.status === 'aprovado').length / deliverables.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/empresas')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </button>
        <div className="flex items-center space-x-3">
          <ExportActionsMenu
            type="company-onepager"
            companyId={company.id}
            companyName={company.name}
            variant="outline"
            label="Exportar PDF"
          />
          <button
            onClick={() => navigate(`/empresas/editar/${company.id}`)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="w-5 h-5 mr-2" />
            Editar
          </button>
        </div>
      </div>

      {/* Company Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
            <p className="text-gray-600 mt-1">{company.description}</p>
            {company.website && (
              <a 
                href={company.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm mt-2 inline-block"
              >
                {company.website}
              </a>
            )}
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {programLabels[company.current_program_key]}
            </span>
            <p className="text-xs text-gray-500 mt-2">
              Entrada: {new Date(company.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <StageProgressBar 
            currentProgram={company.current_program_key}
            completionPercent={completionPercent}
          />
        </div>
      </div>

      {/* Scores */}
      {latestEval && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scores da Última Avaliação</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Score Geral</p>
              <p className="text-4xl font-bold text-blue-700 mt-2">
                {latestEval.weighted_score?.toFixed(1) || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-2">Mercado (28%)</p>
              <p className="text-xl font-bold text-gray-900">{latestEval.mercado_score?.toFixed(1)}/10</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-2">Perfil (21%)</p>
              <p className="text-xl font-bold text-gray-900">{latestEval.perfil_empreendedor_score?.toFixed(1)}/10</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-2">Tecnologia (14%)</p>
              <p className="text-xl font-bold text-gray-900">{latestEval.tecnologia_qualidade_score?.toFixed(1)}/10</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-2">Gestão (16%)</p>
              <p className="text-xl font-bold text-gray-900">{latestEval.gestao_score?.toFixed(1)}/10</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-2">Financeiro (16%)</p>
              <p className="text-xl font-bold text-gray-900">{latestEval.financeiro_score?.toFixed(1)}/10</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Gate: <span className="text-gray-900">{latestEval.gate_value || 'N/A'}</span></p>
          </div>
        </div>
      )}

      {/* Deliverables */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliverables</h3>
        <div className="space-y-3">
          {deliverables.map((deliv) => (
            <div key={deliv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                {getStatusIcon(deliv.status)}
                <div>
                  <p className="font-medium text-gray-900">{deliv.deliverable_label}</p>
                  {deliv.approval_required && (
                    <span className="text-xs text-red-600 font-medium">Obrigatório</span>
                  )}
                </div>
              </div>
              <span className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${deliv.status === 'aprovado' ? 'bg-green-100 text-green-800' : ''}
                ${deliv.status === 'em_revisao' ? 'bg-blue-100 text-blue-800' : ''}
                ${deliv.status === 'em_andamento' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${deliv.status === 'a_fazer' ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                {deliv.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de Progresso Visual */}
      {program && (
        <CompanyProgressBar 
          stages={[
            {
              key: 'hotel_de_projetos',
              label: 'Hotel de Projetos',
              completed: ['pre_residencia', 'residencia'].includes(company.current_program_key),
              current: company.current_program_key === 'hotel_de_projetos',
              completedAt: company.current_program_key !== 'hotel_de_projetos' ? 'Concluído' : undefined
            },
            {
              key: 'pre_residencia',
              label: 'Pré-Residência',
              completed: company.current_program_key === 'residencia',
              current: company.current_program_key === 'pre_residencia',
              completedAt: company.current_program_key === 'residencia' ? 'Concluído' : undefined
            },
            {
              key: 'residencia',
              label: 'Residência',
              completed: false,
              current: company.current_program_key === 'residencia',
            }
          ]}
        />
      )}

      {/* Upload de Documentos */}
      <DocumentUpload
        companyId={id!}
        requiredDeliverables={deliverables.map(d => ({
          key: d.deliverable_key,
          label: d.deliverable_label,
          approval_required: d.approval_required
        }))}
        currentDocuments={deliverables.map(d => ({
          deliverable_key: d.deliverable_key,
          deliverable_label: d.deliverable_label,
          status: d.status
        }))}
        onDocumentUploaded={loadData}
      />

      {/* Histórico de Documentos */}
      <DocumentHistory
        companyId={id!}
        documents={[]}
        isEditable={true}
        onDocumentUpdate={loadData}
      />

      {/* Eligibility Checklist */}
      {eligibilityData && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Checklist de Passage</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Avaliação válida</span>
              {eligibilityData.checks.has_valid_evaluation ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">
                Score ponderado ({eligibilityData.checks.current_weighted_score?.toFixed(1)} / {eligibilityData.checks.required_weighted_score})
              </span>
              {eligibilityData.checks.weighted_score_met ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Scores mínimos por dimensão</span>
              {eligibilityData.checks.dimension_mins_met ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Gate positivo</span>
              {eligibilityData.checks.gate_positive ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Deliverables aprovados</span>
              {eligibilityData.checks.deliverables_approved ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-lg border-2 ${
            eligibilityData.eligible 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">
                  {eligibilityData.eligible ? 'ELEGÍVEL PARA PRÓXIMO PROGRAMA' : 'NÃO ELEGÍVEL'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {eligibilityData.eligible 
                    ? 'Empresa atende todos os critérios' 
                    : 'Empresa não atende um ou mais critérios'}
                </p>
              </div>
              {eligibilityData.eligible && getNextProgram(company.current_program_key) && (
                <button
                  onClick={() => setShowProgressModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Avançar para {programLabels[getNextProgram(company.current_program_key)!]}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Progress Modal */}
      <ConfirmModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onConfirm={handleAdvanceProgram}
        title="Confirmar Avanço de Programa"
        message={`Tem certeza que deseja avançar ${company.name} para ${programLabels[getNextProgram(company.current_program_key)!]}? Esta ação criará novos deliverables e atualizará o programa da empresa.`}
        confirmText="Avançar"
        variant="info"
      />
    </div>
  );
}
