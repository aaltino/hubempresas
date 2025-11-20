import { useEffect, useState } from 'react';
import { supabase, type Company, type Evaluation } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Building2, CheckCircle, Clock, AlertTriangle, X, ClipboardCheck } from 'lucide-react';
import { DashboardSkeleton } from '@/design-system/feedback/Skeleton';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';

export default function MentorDashboardPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [evaluations, setEvaluations] = useState<(Evaluation & { company?: Company })[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [conflictValidation, setConflictValidation] = useState<any>(null);
  const [conflictChecking, setConflictChecking] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [formData, setFormData] = useState({
    mercado_score: '',
    perfil_empreendedor_score: '',
    tecnologia_qualidade_score: '',
    gestao_score: '',
    financeiro_score: '',
    gate_value: '',
    notes: '',
  });

  useEffect(() => {
    if (profile?.role === 'mentor') {
      loadMentorData();
    }
  }, [profile]);

  const loadMentorData = async () => {
    try {
      setLoading(true);
      
      // Carregar empresas atribuídas ao mentor (que não são empresas do próprio mentor)
      const { data: partnershipData } = await supabase
        .from('mentor_company_partnerships')
        .select('company_id, partnership_type')
        .eq('mentor_id', profile?.id);

      setPartnerships(partnershipData || []);
      const partnerCompanyIds = partnershipData?.map(p => p.company_id) || [];

      // RF 4.5: Mentor não avalia empresa da qual seja sócio - validação na submissão
      // OTIMIZAÇÃO: Remover validação N+1 no carregamento inicial
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (companiesData) {
        // Carregar todas as empresas sem validação prévia
        // A validação acontecerá apenas no momento da submissão da avaliação
        setCompanies(companiesData);
      }

      // Carregar avaliações do mentor
      const { data: evalData } = await supabase
        .from('evaluations')
        .select('*')
        .eq('mentor_id', profile?.id)
        .order('evaluation_date', { ascending: false });

      if (evalData && companiesData) {
        const evaluationsWithCompanies = evalData.map(evaluation => ({
          ...evaluation,
          company: companiesData.find(c => c.id === evaluation.company_id)
        }));
        setEvaluations(evaluationsWithCompanies);
      }

      // Carregar logs de auditoria recentes
      const { data: auditData } = await supabase
        .from('conflict_audit_logs')
        .select('*')
        .eq('mentor_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setAuditLogs(auditData || []);

    } catch (error) {
      console.error('Erro ao carregar dados do mentor:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateConflictBeforeSubmission = async (companyId: string) => {
    setConflictChecking(true);
    
    try {
      // Validação robusta client-side
      const { data: validation, error } = await supabase.functions.invoke('validate-conflict-of-interest', {
        body: {
          mentor_id: profile?.id,
          company_id: companyId,
          action_type: 'evaluation_attempt',
          details: {
            client_validation_timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        }
      });

      setConflictChecking(false);
      return { validation, error };
    } catch (error) {
      setConflictChecking(false);
      throw error;
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompany) {
      alert('Selecione uma empresa para avaliar');
      return;
    }

    const company = companies.find(c => c.id === selectedCompany);
    if (!company) return;

    // Validação robusta de conflito de interesses
    try {
      const { validation, error } = await validateConflictBeforeSubmission(selectedCompany);
      
      if (error || !validation?.success) {
        alert(`❌ ERRO: Validação de conflito falhou\n\n${error?.message || 'Erro na validação'}`);
        return;
      }

      if (validation.conflict_detected) {
        // Log da tentativa bloqueada
        await supabase.functions.invoke('notify-conflict-incident', {
          body: {
            notification_type: 'conflict_detected',
            mentor_id: profile?.id,
            company_id: selectedCompany,
            severity: 'critical',
            message: `Tentativa de avaliação bloqueada: ${validation.conflict_reasons?.map((r: any) => r.message).join(', ')}`,
            action_required: true
          }
        });

        alert(`❌ CONFLITO DE INTERESSE DETECTADO!\n\nMotivos:\n${validation.conflict_reasons?.map((r: any) => `• ${r.message}`).join('\n')}\n\nRecomendação: ${validation.recommendation || 'Revise suas declarações de parceria'}`);
        return;
      }

      // Validação adicional: verificar parcerias declaradas
      const hasDeclaredPartnership = partnerships.some(p => p.company_id === selectedCompany);
      if (hasDeclaredPartnership) {
        const partnership = partnerships.find(p => p.company_id === selectedCompany);
        alert(`❌ ERRO: Parceria declarada detectada!\n\nVocê declaradamente é ${partnership?.partnership_type} desta empresa e não pode avaliá-la.\n\nPara remover esta declaração, acesse: Configurações > Minhas Parcerias`);
        return;
      }

    } catch (error) {
      console.error('Erro na validação de conflito:', error);
      alert('❌ ERRO: Falha na validação de conflito de interesses. Tente novamente ou contacte o suporte.');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('calculate-evaluation-score', {
        body: {
          company_id: selectedCompany,
          mentor_id: profile?.id,
          program_key: company.current_program_key,
          mercado_score: parseFloat(formData.mercado_score) || null,
          perfil_empreendedor_score: parseFloat(formData.perfil_empreendedor_score) || null,
          tecnologia_qualidade_score: parseFloat(formData.tecnologia_qualidade_score) || null,
          gestao_score: parseFloat(formData.gestao_score) || null,
          financeiro_score: parseFloat(formData.financeiro_score) || null,
          gate_value: formData.gate_value || null,
          notes: formData.notes || null,
        }
      });

      if (error) throw error;

      alert(`✅ Avaliação salva com sucesso!\n\nScore ponderado: ${data.data.weighted_score}\n\n🎯 Validação de Conflito: APROVADO\n🛡️ Status: ${data.data.conflict_validation?.status || 'Clear'}\n📊 Risco: ${data.data.conflict_validation?.risk_score || 0}/100\n📋 ID da Avaliação: ${data.data.evaluation.id}`);
      
      setShowEvaluationModal(false);
      setSelectedCompany('');
      setFormData({
        mercado_score: '',
        perfil_empreendedor_score: '',
        tecnologia_qualidade_score: '',
        gestao_score: '',
        financeiro_score: '',
        gate_value: '',
        notes: '',
      });
      loadMentorData();
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      alert(`❌ Erro ao salvar avaliação: ${error.message}`);
    }
  };

  const gateOptions = [
    'Maduro para tornar-se empresa',
    'Avaliável positivamente',
    'Necessita melhorias (não bloqueia)',
    'Muchas falhas / Total falta de amadurecimento (bloqueia)'
  ];

  const programLabels: Record<string, string> = {
    hotel_de_projetos: 'Hotel de Projetos',
    pre_residencia: 'Pré-Residência',
    residencia: 'Residência'
  };

  const getCompanyStatus = (company: Company) => {
    const latestEvaluation = evaluations.find(e => e.company_id === company.id);
    if (!latestEvaluation) {
      return { status: 'pending', label: 'Pendente de Avaliação', color: 'text-yellow-600' };
    }
    
    if (latestEvaluation.is_valid) {
      return { status: 'evaluated', label: 'Avaliada', color: 'text-green-600' };
    } else {
      return { status: 'expired', label: 'Expirada', color: 'text-red-600' };
    }
  };

  if (profile?.role !== 'mentor') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
        <p className="text-gray-600">Esta página é exclusiva para mentores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Dashboard Mentor', icon: <ClipboardCheck className="w-4 h-4" /> }
        ]} />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Dashboard Mentor', icon: <ClipboardCheck className="w-4 h-4" /> }
      ]} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard do Mentor</h1>
            <p className="text-blue-100">Gerencie suas avaliações de empresas</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{evaluations.length}</div>
            <div className="text-sm text-blue-100">Avaliações Realizadas</div>
            {auditLogs.length > 0 && (
              <button
                onClick={() => setShowAuditModal(true)}
                className="mt-2 text-xs text-blue-200 hover:text-white underline"
              >
                Ver Logs de Auditoria ({auditLogs.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empresas Atribuídas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Empresas Atribuídas</h2>
            <span className="text-sm text-gray-500">{companies.length} empresas</span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid gap-4">
            {companies.map((company) => {
              const status = getCompanyStatus(company);
              return (
                <div key={company.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{company.name}</h3>
                        <p className="text-sm text-gray-500">{company.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {programLabels[company.current_program_key]}
                          </span>
                          <span className={`text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {status.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedCompany(company.id);
                            setShowEvaluationModal(true);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          <span>Avaliar</span>
                        </button>
                      )}
                      
                      {status.status === 'evaluated' && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Avaliada</span>
                        </div>
                      )}
                      
                      {status.status === 'expired' && (
                        <button
                          onClick={() => {
                            setSelectedCompany(company.id);
                            setShowEvaluationModal(true);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Re-avaliar</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Preview da última avaliação */}
                  {evaluations.find(e => e.company_id === company.id) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Última avaliação: </span>
                        {new Date(evaluations.find(e => e.company_id === company.id)?.evaluation_date || '').toLocaleDateString('pt-BR')}
                        <span className="ml-4 font-medium">
                          Score: {evaluations.find(e => e.company_id === company.id)?.weighted_score?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {companies.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma empresa atribuída ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Avaliação Simplificada */}
      {showEvaluationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nova Avaliação</h3>
            
            <form onSubmit={handleSubmitEvaluation} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Validação de Conflito de Interesses
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Verificando se você não é sócio desta empresa...
                </p>
                {partnerships.length > 0 && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                    ⚠️ Conflito detectado! Você não pode avaliar esta empresa.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score Mercado (0-10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.mercado_score}
                  onChange={(e) => setFormData({ ...formData, mercado_score: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score Perfil Empreendedor (0-10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.perfil_empreendedor_score}
                  onChange={(e) => setFormData({ ...formData, perfil_empreendedor_score: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score Tecnologia & Qualidade (0-10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.tecnologia_qualidade_score}
                  onChange={(e) => setFormData({ ...formData, tecnologia_qualidade_score: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score Gestão (0-10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.gestao_score}
                  onChange={(e) => setFormData({ ...formData, gestao_score: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score Financeiro (0-10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.financeiro_score}
                  onChange={(e) => setFormData({ ...formData, financeiro_score: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Validação de Conflito em Tempo Real */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Validação de Conflito de Interesses
                    </span>
                  </div>
                  {conflictChecking && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  O sistema validará automaticamente se você não possui conflitos antes de permitir a submissão.
                </p>
                {conflictValidation?.conflict_detected && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                    ❌ Conflito detectado: {conflictValidation.conflict_reasons?.map((r: any) => r.message).join(', ')}
                  </div>
                )}
                {conflictValidation && !conflictValidation.conflict_detected && (
                  <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-800">
                    ✅ Nenhum conflito detectado. Status: {conflictValidation.conflict_status}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consideração Final
                </label>
                <select
                  value={formData.gate_value}
                  onChange={(e) => setFormData({ ...formData, gate_value: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma opção</option>
                  {gateOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Comentários sobre a avaliação..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEvaluationModal(false);
                    setSelectedCompany('');
                    setFormData({
                      mercado_score: '',
                      perfil_empreendedor_score: '',
                      tecnologia_qualidade_score: '',
                      gestao_score: '',
                      financeiro_score: '',
                      gate_value: '',
                      notes: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={partnerships.length > 0}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    partnerships.length > 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {partnerships.length > 0 ? 'Conflito Detectado' : 'Salvar Avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Logs de Auditoria */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 my-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Logs de Auditoria</h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum log de auditoria encontrado.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          log.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          log.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {log.action_type}
                        </span>
                        <span className="text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <span className={`text-xs font-medium ${
                        log.severity === 'critical' ? 'text-red-600' :
                        log.severity === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {log.severity}
                      </span>
                    </div>
                    {log.details && (
                      <div className="mt-2 text-sm text-gray-700">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}