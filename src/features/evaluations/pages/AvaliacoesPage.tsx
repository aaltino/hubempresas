import { useEffect, useState } from 'react';
import { supabase, type Company, type Evaluation } from '@/lib/supabase';
import { Plus, Eye, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth';
import { useConflictDetection, ConflictAlert, type ConflictValidationResult } from '../../conflicts';

const gateOptions = [
  'Maduro para tornar-se empresa',
  'Avaliável positivamente',
  'Necessita melhorias (não bloqueia)',
  'Muitas falhas / Total falta de amadurecimento (bloqueia)'
];

export default function AvaliacoesPage() {
  const { profile } = useAuth();
  const { validateConflict, loading: conflictLoading } = useConflictDetection();
  const [evaluations, setEvaluations] = useState<(Evaluation & { company?: Company })[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [conflictResult, setConflictResult] = useState<ConflictValidationResult | null>(null);
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
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (profile?.role === 'admin') {
        // Admin vê todas avaliações
        const { data: evalData } = await supabase
          .from('evaluations')
          .select('*')
          .order('evaluation_date', { ascending: false });

        if (evalData) {
          // Carregar informações das empresas
          const { data: companiesData } = await supabase
            .from('companies')
            .select('*');

          const evaluationsWithCompanies = evalData.map(evaluation => ({
            ...evaluation,
            company: companiesData?.find(c => c.id === evaluation.company_id)
          }));

          setEvaluations(evaluationsWithCompanies);
        }

        // Carregar todas empresas para o formulário
        const { data: allCompanies } = await supabase
          .from('companies')
          .select('*')
          .order('name');
        
        if (allCompanies) setCompanies(allCompanies);
      } else if (profile?.role === 'mentor') {
        // Mentor vê apenas suas avaliações
        const { data: evalData } = await supabase
          .from('evaluations')
          .select('*')
          .eq('mentor_id', profile.id)
          .order('evaluation_date', { ascending: false });

        if (evalData) {
          const { data: companiesData } = await supabase
            .from('companies')
            .select('*');

          const evaluationsWithCompanies = evalData.map(evaluation => ({
            ...evaluation,
            company: companiesData?.find(c => c.id === evaluation.company_id)
          }));

          setEvaluations(evaluationsWithCompanies);
        }

        // Carregar empresas (exceto aquelas onde o mentor é sócio)
        const { data: partnerships } = await supabase
          .from('mentor_company_partnerships')
          .select('company_id')
          .eq('mentor_id', profile.id);

        const excludeIds = partnerships?.map(p => p.company_id) || [];

        const { data: availableCompanies } = await supabase
          .from('companies')
          .select('*')
          .order('name');

        if (availableCompanies) {
          setCompanies(availableCompanies.filter(c => !excludeIds.includes(c.id)));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validar conflito ao selecionar empresa
  const handleCompanySelect = async (companyId: string) => {
    setSelectedCompany(companyId);
    setConflictResult(null);

    if (!companyId || !profile?.id) return;

    // Validar conflito de interesse
    const result = await validateConflict(profile.id, companyId);
    if (result) {
      setConflictResult(result);
      
      // Se houver erro na validação, mostrar ao usuário
      if (!result.success && result.error) {
        console.error('⚠️ Erro ao validar conflito:', result.error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompany) {
      alert('Selecione uma empresa para avaliar');
      return;
    }

    // Bloquear se houver conflito bloqueador
    if (conflictResult?.conflict_status === 'blocked') {
      alert('❌ Avaliação bloqueada devido a conflito de interesse. Não é possível prosseguir.');
      return;
    }

    const company = companies.find(c => c.id === selectedCompany);
    if (!company) return;

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

      alert(`Avaliação salva com sucesso!\nScore ponderado: ${data.data.weighted_score}`);
      
      setShowModal(false);
      setSelectedCompany('');
      setConflictResult(null);
      setFormData({
        mercado_score: '',
        perfil_empreendedor_score: '',
        tecnologia_qualidade_score: '',
        gestao_score: '',
        financeiro_score: '',
        gate_value: '',
        notes: '',
      });
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      alert(`Erro ao salvar avaliação: ${error.message}`);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Avaliações</h2>
          <p className="text-gray-600 mt-1">Gerencie as avaliações das empresas</p>
        </div>
        {(profile?.role === 'mentor' || profile?.role === 'admin') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Avaliação</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Programa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score Ponderado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {evaluations.map((evaluation) => (
              <tr key={evaluation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{evaluation.company?.name || 'N/A'}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {programLabels[evaluation.program_key] || evaluation.program_key}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">
                    {evaluation.weighted_score?.toFixed(2) || 'N/A'}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>Mercado: {evaluation.mercado_score?.toFixed(1) || '-'}</div>
                    <div>Perfil: {evaluation.perfil_empreendedor_score?.toFixed(1) || '-'}</div>
                    <div>Tecnologia: {evaluation.tecnologia_qualidade_score?.toFixed(1) || '-'}</div>
                    <div>Gestão: {evaluation.gestao_score?.toFixed(1) || '-'}</div>
                    <div>Financeiro: {evaluation.financeiro_score?.toFixed(1) || '-'}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700">{evaluation.gate_value || '-'}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(evaluation.evaluation_date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4">
                  {evaluation.is_valid ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Válida
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      Expirada
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {evaluations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma avaliação registrada ainda.</p>
          </div>
        )}
      </div>

      {/* Modal de Nova Avaliação */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evaluation-modal-title"
          onClick={(e) => {
            // Fecha o modal ao clicar fora (no backdrop)
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setSelectedCompany('');
              setConflictResult(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 id="evaluation-modal-title" className="text-xl font-bold text-gray-900 mb-4">Nova Avaliação</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="company-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Empresa *
                </label>
                <select
                  id="company-select"
                  value={selectedCompany}
                  onChange={(e) => handleCompanySelect(e.target.value)}
                  required
                  disabled={conflictLoading}
                  aria-required="true"
                  aria-describedby={conflictLoading ? "conflict-loading-msg" : undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} - {programLabels[company.current_program_key]}
                    </option>
                  ))}
                </select>
                {conflictLoading && (
                  <p id="conflict-loading-msg" className="text-sm text-gray-500 mt-1">
                    Validando conflito de interesse...
                  </p>
                )}
              </div>

              {/* Alerta de Erro de API */}
              {conflictResult && !conflictResult.success && conflictResult.error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-800 mb-1">
                      Erro ao Validar Conflito de Interesse
                    </h4>
                    <p className="text-sm text-red-700">
                      {conflictResult.error.message}
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      Por favor, tente novamente ou contate o suporte se o problema persistir.
                    </p>
                  </div>
                </div>
              )}

              {/* Alerta de Conflito */}
              {conflictResult && conflictResult.success && conflictResult.conflict_detected && (
                <ConflictAlert
                  conflictData={conflictResult}
                  onDismiss={() => {
                    if (conflictResult.conflict_status !== 'blocked') {
                      setConflictResult(null);
                    }
                  }}
                  onContest={() => {
                    alert('Funcionalidade de contestação será implementada em breve.');
                  }}
                  className="mb-4"
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mercado (0-10) - Peso: 28%
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.mercado_score}
                    onChange={(e) => setFormData({ ...formData, mercado_score: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perfil Empreendedor (0-10) - Peso: 21%
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.perfil_empreendedor_score}
                    onChange={(e) => setFormData({ ...formData, perfil_empreendedor_score: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tecnologia & Qualidade (0-10) - Peso: 14%
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.tecnologia_qualidade_score}
                    onChange={(e) => setFormData({ ...formData, tecnologia_qualidade_score: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gestão (0-10) - Peso: 16%
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.gestao_score}
                    onChange={(e) => setFormData({ ...formData, gestao_score: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Financeiro (0-10) - Peso: 16%
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.financeiro_score}
                    onChange={(e) => setFormData({ ...formData, financeiro_score: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consideração Final (Gate) *
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
                    setShowModal(false);
                    setSelectedCompany('');
                    setConflictResult(null);
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
                  disabled={conflictResult?.conflict_status === 'blocked'}
                  aria-label="Salvar avaliação"
                  aria-disabled={conflictResult?.conflict_status === 'blocked'}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={conflictResult?.conflict_status === 'blocked' ? 'Avaliação bloqueada por conflito de interesse' : ''}
                >
                  Salvar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
