// Página: AvaliacoesPageEnhanced - Sistema Avançado de Avaliações (Fase 2)
// Implementa formulários dinâmicos, validação de pesos, histórico e relatórios

import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase, type Company, type Evaluation, type EvaluationTemplate } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { DashboardSkeleton } from '@/design-system/feedback/Skeleton';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { Alert } from '@/design-system/feedback/Alert';
import { Button } from '@/design-system/ui/Button';
import { Card } from '@/design-system/ui/Card';
import { Badge } from '@/design-system/ui/Badge';
import { RubricInput } from '../components/RubricInput';
import {
  Plus,
  Eye,
  Edit3,
  Download,
  FileText,
  TrendingUp,
  AlertCircle,
  ClipboardList,
  BarChart3,
  History,
  Settings,
  Sparkles,
  Loader2
} from 'lucide-react';

interface EvaluationWithHistory extends Evaluation {
  company?: Company;
  template?: EvaluationTemplate;
  version: number;
  edited_count: number;
  last_edited_at?: string;
  last_edited_by?: string;
  checkpoint?: string;
  ai_feedback?: string;
  mode?: 'human' | 'hybrid' | 'ai';
  ai_model_used?: string;
  audit_log?: any[];
}

interface EvaluationStats {
  total_evaluations: number;
  avg_score: number;
  completed_this_month: number;
  pending_reviews: number;
}

interface FormState {
  template_id: string;
  company_id: string;
  criteria_scores: Record<string, number>;
  notes: string;
  gate_value: string;
  checkpoint: string;
  ai_feedback: string;
  mentorship_mode: 'human' | 'hybrid' | 'ai';
  ai_raw_response: string;
}

export default function AvaliacoesPageEnhanced() {
  const { profile } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationWithHistory[]>([]);
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<EvaluationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'active' | 'history' | 'templates'>('active');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormState>({
    template_id: '',
    company_id: '',
    criteria_scores: {},
    notes: '',
    gate_value: '',
    checkpoint: 'week_4',

    ai_feedback: '',
    mentorship_mode: 'human',
    ai_raw_response: ''
  });
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithHistory | null>(null);
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationWithHistory[]>([]);

  // Validação e cálculos
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [calculatedScore, setCalculatedScore] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const selectedTemplate = templates.find(t => t.id === formData.template_id);

  useEffect(() => {
    loadData();
  }, [profile, selectedTab]);

  useEffect(() => {
    // Recalcular score quando critérios mudam
    if (selectedTemplate) {
      calculateScore();
    }
  }, [formData.criteria_scores, selectedTemplate]);

  // Fetch mentorship mode when company changes
  useEffect(() => {
    if (formData.company_id) {
      fetchMentorshipMode(formData.company_id);
    }
  }, [formData.company_id]);

  const fetchMentorshipMode = async (companyId: string) => {
    try {
      // Check for specific mentorship config first
      const { data: mentorship } = await supabase
        .from('mentorships')
        .select('mentorship_mode')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .single();

      if (mentorship?.mentorship_mode) {
        setFormData(prev => ({ ...prev, mentorship_mode: mentorship.mentorship_mode }));
        return;
      }

      // Fallback to program default (mocked for now)
      setFormData(prev => ({ ...prev, mentorship_mode: 'hybrid' }));

    } catch (error) {
      console.error('Error fetching mentorship mode:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar dados básicos
      const [templatesRes, companiesRes, evaluationsRes, statsRes] = await Promise.all([
        supabase.from('evaluation_templates').select('*').eq('is_active', true),
        loadCompanies(),
        loadEvaluations(),
        loadStats()
      ]);

      if (templatesRes.data) setTemplates(templatesRes.data);
      if (companiesRes) setCompanies(companiesRes);
      if (evaluationsRes) setEvaluations(evaluationsRes);
      if (statsRes) setStats(statsRes);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async (): Promise<Company[]> => {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('status', 'active')
      .order('name');
    return data || [];
  };

  const loadEvaluations = async (): Promise<EvaluationWithHistory[]> => {
    let query = supabase
      .from('evaluations')
      .select(`
        *,
        companies:company_id(*),
        evaluation_templates:template_id(*)
      `)
      .order('created_at', { ascending: false });

    // Filtrar por perfil
    if (profile?.role === 'mentor') {
      query = query.eq('mentor_id', profile.id);
    }

    const { data } = await query;
    return (data || []).map((evaluation: any) => ({
      ...evaluation,
      company: evaluation.companies,
      template: evaluation.evaluation_templates,
      version: 1,
      edited_count: 0
    }));
  };

  const loadStats = async (): Promise<EvaluationStats | null> => {
    try {
      let baseQuery = supabase.from('evaluations').select('*');

      if (profile?.role === 'mentor') {
        baseQuery = baseQuery.eq('mentor_id', profile.id);
      }

      // Count total evaluations
      let totalQuery = supabase.from('evaluations').select('id', { count: 'exact', head: true });
      if (profile?.role === 'mentor') {
        totalQuery = totalQuery.eq('mentor_id', profile.id);
      }
      const { count: total } = await totalQuery;

      const { data: scores } = await baseQuery.select('weighted_score').not('weighted_score', 'is', null);
      const avgScore = scores && scores.length > 0
        ? scores.reduce((sum, evaluation) => sum + (evaluation.weighted_score || 0), 0) / scores.length
        : 0;

      const thisMonth = new Date();
      thisMonth.setDate(1);

      // Count this month evaluations
      let thisMonthQuery = supabase.from('evaluations').select('id', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString());
      if (profile?.role === 'mentor') {
        thisMonthQuery = thisMonthQuery.eq('mentor_id', profile.id);
      }
      const { count: thisMonthCount } = await thisMonthQuery;

      // Count pending evaluations  
      let pendingQuery = supabase.from('evaluations').select('id', { count: 'exact', head: true })
        .eq('status', 'submitted');
      if (profile?.role === 'mentor') {
        pendingQuery = pendingQuery.eq('mentor_id', profile.id);
      }
      const { count: pendingCount } = await pendingQuery;

      return {
        total_evaluations: total || 0,
        avg_score: Math.round(avgScore * 10) / 10,
        completed_this_month: thisMonthCount || 0,
        pending_reviews: pendingCount || 0
      };
    } catch {
      return null;
    }
  };

  const calculateScore = () => {
    if (!selectedTemplate || !selectedTemplate.criteria) {
      setCalculatedScore(0);
      return;
    }

    let totalScore = 0;
    let totalWeight = 0;

    selectedTemplate.criteria.forEach(criterion => {
      const score = formData.criteria_scores[criterion.id] || 0;
      totalScore += (score / criterion.max_score) * criterion.weight;
      totalWeight += criterion.weight;
    });

    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    setCalculatedScore(Math.round(finalScore * 10) / 10);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.template_id) {
      errors.push('Selecione um template de avaliação');
    }

    if (!formData.company_id) {
      errors.push('Selecione uma empresa para avaliar');
    }

    if (selectedTemplate) {
      // Validar se todos os critérios foram preenchidos
      const missingCriteria = selectedTemplate.criteria.filter(
        criterion => formData.criteria_scores[criterion.id] === undefined || formData.criteria_scores[criterion.id] < 0
      );

      if (missingCriteria.length > 0) {
        errors.push(`Complete a avaliação para: ${missingCriteria.map(c => c.name).join(', ')}`);
      }

      // Validar coerência dos pesos
      const totalWeight = selectedTemplate.criteria.reduce((sum, c) => sum + c.weight, 0);
      if (Math.abs(totalWeight - selectedTemplate.total_weight) > 0.01) {
        errors.push('Inconsistência nos pesos do template. Contacte o administrador.');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const generateAIFeedback = async () => {
    if (!selectedTemplate) return;

    setIsGeneratingAI(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-mentor', {
        body: {
          company_id: formData.company_id,
          evaluation_data: {
            criteria_scores: formData.criteria_scores,
            weighted_score: calculatedScore,
            notes: formData.notes
          },
          persona: 'product_expert' // Could be dynamic
        }
      });

      if (error) throw error;

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          ai_raw_response: data.feedback,
          // If AI mode, auto-apply. If Hybrid, just store raw for review.
          ai_feedback: prev.mentorship_mode === 'ai' ? data.feedback : prev.ai_feedback
        }));
      }

    } catch (error) {
      console.error('Erro ao gerar feedback IA:', error);
      // Fallback mock
      let feedback = "Análise Preliminar com IA (Fallback):\n\n";
      if (calculatedScore > 80) {
        feedback += "🚀 **Pontos Fortes:** Excelente maturidade.\n💡 **Sugestão:** Focar em escala.";
      } else {
        feedback += "⚠️ **Atenção:** Precisa de validação.\n💡 **Sugestão:** Mais entrevistas.";
      }
      setFormData(prev => ({ ...prev, ai_raw_response: feedback }));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const approveAIResponse = () => {
    setFormData(prev => ({
      ...prev,
      ai_feedback: prev.ai_raw_response,
      ai_raw_response: '' // Clear raw after approval
    }));
  };

  const discardAIResponse = () => {
    setFormData(prev => ({ ...prev, ai_raw_response: '' }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const evaluationData = {
        company_id: formData.company_id,
        mentor_id: profile?.id,
        template_id: formData.template_id,
        criteria_scores: formData.criteria_scores,
        weighted_score: calculatedScore,
        notes: formData.notes,
        gate_value: formData.gate_value || null,
        checkpoint: formData.checkpoint,
        ai_feedback: formData.ai_feedback,
        mode: formData.mentorship_mode,
        ai_raw_response: formData.ai_raw_response || null,
        status: 'approved',
        evaluation_type: 'periodic'
      };

      const { data, error } = await supabase.functions.invoke('process-evaluation', {
        body: evaluationData
      });

      if (error) throw error;

      // Sucesso - recarregar dados e fechar modal
      await loadData();
      setShowCreateModal(false);
      resetForm();

      // Tentar conceder badges automaticamente
      try {
        await supabase.functions.invoke('auto-award-badges', {
          body: { company_id: formData.company_id }
        });
      } catch (badgeError) {
        console.warn('Erro ao conceder badges automaticamente:', badgeError);
      }

    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      setValidationErrors([`Erro ao salvar: ${error.message}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      template_id: '',
      company_id: '',
      criteria_scores: {},
      notes: '',
      gate_value: '',
      gate_value: '',
      checkpoint: 'week_4',
      ai_feedback: '',
      mentorship_mode: 'human',
      ai_raw_response: ''
    });
    setValidationErrors([]);
    setCalculatedScore(0);
  };

  const openEditModal = async (evaluation: EvaluationWithHistory) => {
    setSelectedEvaluation(evaluation);

    // Carregar dados da avaliação para edição
    setFormData({
      template_id: evaluation.template_id || '',
      company_id: evaluation.company_id,
      criteria_scores: evaluation.criteria_scores || {},
      notes: evaluation.notes || '',
      gate_value: evaluation.gate_value || '',
      checkpoint: evaluation.checkpoint || 'week_4',
      ai_feedback: evaluation.ai_feedback || '',
      mentorship_mode: evaluation.mode || 'human',
      ai_raw_response: ''
    });

    setShowEditModal(true);
  };

  const openHistoryModal = async (evaluation: EvaluationWithHistory) => {
    try {
      // Carregar histórico da avaliação
      const { data } = await supabase
        .from('evaluations')
        .select('*, companies:company_id(*)')
        .eq('company_id', evaluation.company_id)
        .order('created_at', { ascending: false });

      setEvaluationHistory((data || []).map((evaluation: any) => ({
        ...evaluation,
        company: evaluation.companies,
        version: 1,
        edited_count: 0
      })));

      setSelectedEvaluation(evaluation);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const exportReport = async (evaluation: EvaluationWithHistory) => {
    try {
      // Implementar exportação de relatório
      const reportData = {
        evaluation,
        company: evaluation.company,
        template: evaluation.template,
        generated_at: new Date().toISOString(),
        generated_by: profile?.full_name
      };

      // Criar e download do relatório
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_avaliacao_${evaluation.company?.name}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Avaliações', icon: <ClipboardList className="w-4 h-4" /> }
        ]} />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Avaliações', icon: <ClipboardList className="w-4 h-4" /> }
      ]} />

      {/* Header com Statistics */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sistema de Avaliações</h1>
            <p className="text-blue-100">Gerencie avaliações dinâmicas com templates configuráveis</p>
          </div>
          <div className="flex space-x-6">
            {stats && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total_evaluations}</div>
                  <div className="text-sm text-blue-100">Total de Avaliações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.avg_score}</div>
                  <div className="text-sm text-blue-100">Score Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.completed_this_month}</div>
                  <div className="text-sm text-blue-100">Este Mês</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedTab('active')}
            className={`px-4 py-2 rounded-lg transition-colors ${selectedTab === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <ClipboardList className="w-4 h-4 inline mr-2" />
            Avaliações Ativas
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`px-4 py-2 rounded-lg transition-colors ${selectedTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            Histórico
          </button>
          <button
            onClick={() => setSelectedTab('templates')}
            className={`px-4 py-2 rounded-lg transition-colors ${selectedTab === 'templates'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Templates
          </button>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Avaliação</span>
        </Button>
      </div>

      {/* Content */}
      {selectedTab === 'active' && (
        <div className="grid gap-4">
          {evaluations.length === 0 ? (
            <Card className="p-12 text-center">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação encontrada</h3>
              <p className="text-gray-500 mb-4">Comece criando sua primeira avaliação</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Avaliação
              </Button>
            </Card>
          ) : (
            evaluations.map((evaluation) => (
              <Card key={evaluation.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {evaluation.company?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {evaluation.template?.name} • Score: {evaluation.weighted_score?.toFixed(1) || 'N/A'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant={evaluation.status === 'approved' ? 'secondary' : 'warning'}
                        >
                          {evaluation.status === 'approved' ? 'Concluída' : 'Em Andamento'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(evaluation.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => openHistoryModal(evaluation)}
                      className="p-2"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => openEditModal(evaluation)}
                      className="p-2"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => exportReport(evaluation)}
                      className="p-2"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {evaluation.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{evaluation.notes}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {selectedTab === 'templates' && (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-600">
                      {template.criteria?.length || 0} critérios
                    </span>
                    <span className="text-xs text-gray-600">
                      Peso total: {template.total_weight}
                    </span>
                  </div>
                </div>
                <Badge variant={template.is_active ? 'secondary' : 'secondary'}>
                  {template.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Nova Avaliação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Nova Avaliação</h3>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert type="error" className="mb-6">
                <div>
                  <p className="font-medium">Corrija os seguintes erros:</p>
                  <ul className="list-disc list-inside mt-2">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template de Avaliação
                </label>
                <select
                  value={formData.template_id}
                  onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkpoint Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fase / Checkpoint
                </label>
                <select
                  value={formData.checkpoint}
                  onChange={(e) => setFormData({ ...formData, checkpoint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="week_4">Validação (Semana 1-4)</option>
                  <option value="week_8">Market Fit (Semana 5-8)</option>
                  <option value="week_12">Go-to-Market (Semana 9-12)</option>
                  <option value="final">Avaliação Final</option>
                </select>
              </div>

              {/* Dynamic Criteria with Rubric */}
              {selectedTemplate && selectedTemplate.criteria && (
                <div className="space-y-6">
                  <h4 className="font-medium text-gray-900 text-lg border-b pb-2">Critérios de Avaliação</h4>
                  {selectedTemplate.criteria.map((criterion) => (
                    <div key={criterion.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="font-semibold text-gray-900 text-lg">{criterion.name}</h5>
                          {criterion.description && (
                            <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-white">
                          Peso: {criterion.weight}
                        </Badge>
                      </div>

                      <RubricInput
                        criterionId={criterion.id}
                        maxScore={criterion.max_score}
                        value={formData.criteria_scores[criterion.id] || 0}
                        onChange={(val) => setFormData(prev => ({
                          ...prev,
                          criteria_scores: {
                            ...prev.criteria_scores,
                            [criterion.id]: val
                          }
                        }))}
                        rubric={criterion.rubric}
                      />
                    </div>
                  ))}

                  {/* Calculated Score */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center justify-between">
                    <div>
                      <span className="block font-medium text-blue-900">Score Final Calculado</span>
                      <span className="text-sm text-blue-700">Baseado nos pesos configurados</span>
                    </div>
                    <span className="text-4xl font-bold text-blue-900">
                      {calculatedScore.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {/* AI Feedback Section */}
              {formData.mentorship_mode !== 'human' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">
                        Feedback Inteligente (IA)
                        <Badge variant="secondary" className="ml-2 bg-purple-200 text-purple-800">
                          {formData.mentorship_mode === 'hybrid' ? 'Human-in-the-Loop' : 'Automático'}
                        </Badge>
                      </h4>
                    </div>
                    <Button
                      onClick={generateAIFeedback}
                      disabled={isGeneratingAI || calculatedScore === 0}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      size="sm"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar Sugestão
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Review Area for Hybrid Mode */}
                  {formData.ai_raw_response && formData.mentorship_mode === 'hybrid' && (
                    <div className="mb-4 p-4 bg-white rounded border border-purple-100 shadow-sm">
                      <h5 className="text-sm font-medium text-purple-800 mb-2">Sugestão da IA:</h5>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                        {formData.ai_raw_response}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={approveAIResponse} className="bg-green-600 hover:bg-green-700 text-white">
                          ✔️ Aprovar & Usar
                        </Button>
                        <Button size="sm" variant="secondary" onClick={discardAIResponse}>
                          ❌ Descartar
                        </Button>
                      </div>
                    </div>
                  )}

                  {formData.ai_feedback ? (
                    <div>
                      <label className="block text-sm font-medium text-purple-900 mb-1">
                        Feedback Final (Editável)
                      </label>
                      <textarea
                        value={formData.ai_feedback}
                        onChange={(e) => setFormData({ ...formData, ai_feedback: e.target.value })}
                        rows={5}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-800"
                        placeholder="O feedback gerado pela IA aparecerá aqui..."
                      />
                    </div>
                  ) : (
                    !formData.ai_raw_response && (
                      <div className="text-center py-8 text-purple-400 text-sm italic">
                        Preencha a avaliação e clique em "Gerar Sugestão" para iniciar.
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Comentários extras do mentor..."
                />
              </div>

              {/* Gate Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consideração Final
                </label>
                <select
                  value={formData.gate_value}
                  onChange={(e) => setFormData({ ...formData, gate_value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma opção</option>
                  <option value="approved">Aprovado para próxima fase</option>
                  <option value="conditional">Aprovado com condições</option>
                  <option value="needs_improvement">Necessita melhorias</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6 border-t mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Avaliação'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}