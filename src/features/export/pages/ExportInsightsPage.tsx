// Sistema de Exportação e Insights Avançados - Fase 4
// Exportação PDF/CSV/Excel, relatórios agendados, insights automáticos e analytics

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { 
  Download, FileText, Calendar, Clock, TrendingUp, Zap,
  BarChart3, Target, AlertCircle, CheckCircle, Settings,
  Mail, Filter, Eye, Play, Pause, Trash2, Plus, Brain
} from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/ui/Badge';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  format: 'pdf' | 'csv' | 'excel';
  type: 'companies' | 'evaluations' | 'executive_dashboard' | 'mentor_analytics';
  icon: React.ComponentType<any>;
}

interface ScheduledReport {
  id: string;
  report_name: string;
  report_type: string;
  schedule_frequency: string;
  is_active: boolean;
  last_sent_at?: string;
  next_send_at: string;
  recipients: string[];
}

interface InsightItem {
  type: string;
  title: string;
  description: string;
  confidence: number;
  created_at: string;
  data: Record<string, any>;
}

interface TrendPrediction {
  trend_type: string;
  title: string;
  description: string;
  confidence: number;
  predicted_growth?: number;
  key_drivers?: string[];
}

export default function ExportInsightsPage() {
  const { profile } = useAuth();
  const { addToast } = useToast();

  // Estados principais
  const [activeTab, setActiveTab] = useState<'export' | 'scheduled' | 'insights' | 'trends'>('export');
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [trendPredictions, setTrendPredictions] = useState<TrendPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  // Estados para novo relatório agendado
  const [showNewReport, setShowNewReport] = useState(false);
  const [newReportForm, setNewReportForm] = useState({
    report_name: '',
    report_type: 'executive_dashboard',
    frequency: 'monthly',
    recipients: [''],
    format: 'pdf' as 'pdf' | 'excel'
  });

  // Estados para insights
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [selectedInsightTypes, setSelectedInsightTypes] = useState<string[]>(['trends', 'predictions', 'recommendations']);

  // Opções de exportação disponíveis
  const exportOptions: ExportOption[] = [
    {
      id: 'companies_csv',
      title: 'Empresas (CSV)',
      description: 'Lista completa de empresas com métricas e status',
      format: 'csv',
      type: 'companies',
      icon: FileText
    },
    {
      id: 'companies_excel',
      title: 'Empresas (Excel)',
      description: 'Planilha avançada com gráficos e análises',
      format: 'excel',
      type: 'companies',
      icon: BarChart3
    },
    {
      id: 'evaluations_pdf',
      title: 'Relatório de Avaliações (PDF)',
      description: 'Relatório formatado com scores e tendências',
      format: 'pdf',
      type: 'evaluations',
      icon: Target
    },
    {
      id: 'executive_pdf',
      title: 'Dashboard Executivo (PDF)',
      description: 'Relatório executivo com KPIs e insights',
      format: 'pdf',
      type: 'executive_dashboard',
      icon: TrendingUp
    },
    {
      id: 'mentor_analytics',
      title: 'Analytics de Mentores (Excel)',
      description: 'Performance detalhada dos mentores',
      format: 'excel',
      type: 'mentor_analytics',
      icon: CheckCircle
    }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar dados iniciais
  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadScheduledReports(),
        loadInsights(),
        loadTrendPredictions()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar relatórios agendados
  const loadScheduledReports = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('export-system', {
        body: { action: 'get_scheduled_reports' }
      });

      if (error) throw error;
      setScheduledReports(data || []);
    } catch (error) {
      console.error('Erro ao carregar relatórios agendados:', error);
    }
  };

  // Carregar insights automáticos
  const loadInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('search-analytics', {
        body: {
          action: 'generate_insights',
          insight_types: ['trends', 'predictions', 'recommendations', 'anomalies']
        }
      });

      if (error) throw error;
      setInsights(data.insights?.recommendations || []);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    }
  };

  // Carregar previsões de tendências
  const loadTrendPredictions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('search-analytics', {
        body: {
          action: 'predict_trends',
          trend_types: ['sector', 'score', 'growth'],
          time_horizon: '3_months'
        }
      });

      if (error) throw error;
      setTrendPredictions(data.sector_trends || []);
    } catch (error) {
      console.error('Erro ao carregar previsões:', error);
    }
  };

  // Realizar exportação
  const performExport = async (option: ExportOption) => {
    try {
      setExporting(option.id);

      const { data, error } = await supabase.functions.invoke('export-system', {
        body: {
          action: `export_${option.type}`,
          export_type: option.type,
          report_config: {
            format: option.format,
            filters: {},
            include_charts: true,
            include_metadata: true
          }
        }
      });

      if (error) throw error;

      // Trigger download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = data.filename;
      link.click();

      addToast({
        type: 'success',
        title: `${option.title} exportado com sucesso.`
      });

    } catch (error) {
      console.error('Erro na exportação:', error);
      addToast({
        type: 'error',
        title: 'Não foi possível realizar a exportação.'
      });
    } finally {
      setExporting(null);
    }
  };

  // Agendar novo relatório
  const scheduleNewReport = async () => {
    try {
      if (!newReportForm.report_name.trim()) {
        addToast({
          type: 'warning',
          title: 'Digite um nome para o relatório.'
        });
        return;
      }

      const validRecipients = newReportForm.recipients.filter(email => 
        email.trim() && email.includes('@')
      );

      if (validRecipients.length === 0) {
        addToast({
          type: 'warning',
          title: 'Adicione pelo menos um email válido.'
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('export-system', {
        body: {
          action: 'schedule_report',
          report_name: newReportForm.report_name,
          report_type: newReportForm.report_type,
          recipients: validRecipients,
          frequency: newReportForm.frequency,
          report_config: {
            format: newReportForm.format,
            auto_generated: true
          }
        }
      });

      if (error) throw error;

      await loadScheduledReports();
      setShowNewReport(false);
      setNewReportForm({
        report_name: '',
        report_type: 'executive_dashboard',
        frequency: 'monthly',
        recipients: [''],
        format: 'pdf'
      });

      addToast({
        type: 'success',
        title: `Relatório "${newReportForm.report_name}" agendado com sucesso.`
      });

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Não foi possível agendar o relatório.'
      });
    }
  };

  // Gerar novos insights
  const generateNewInsights = async () => {
    try {
      setGeneratingInsights(true);

      const { data, error } = await supabase.functions.invoke('search-analytics', {
        body: {
          action: 'generate_insights',
          insight_types: selectedInsightTypes
        }
      });

      if (error) throw error;

      await loadInsights();
      addToast({
        type: 'success',
        title: `${data.insights?.length || 0} novos insights foram gerados.`
      });

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Não foi possível gerar novos insights.'
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Adicionar recipient ao formulário
  const addRecipient = () => {
    setNewReportForm(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  // Remover recipient
  const removeRecipient = (index: number) => {
    setNewReportForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  // Atualizar recipient
  const updateRecipient = (index: number, value: string) => {
    setNewReportForm(prev => ({
      ...prev,
      recipients: prev.recipients.map((email, i) => i === index ? value : email)
    }));
  };

  const renderExportTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Exportações Disponíveis</h3>
        <p className="text-gray-600 mb-6">
          Exporte dados do ecossistema em diferentes formatos para análise externa ou compartilhamento.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exportOptions.map((option) => (
            <Card key={option.id} className="p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <option.icon className="w-6 h-6 text-blue-600" />
                </div>
                <Badge variant="secondary">{option.format.toUpperCase()}</Badge>
              </div>

              <h4 className="font-semibold text-gray-900 mb-2">{option.title}</h4>
              <p className="text-sm text-gray-600 mb-4">{option.description}</p>

              <Button
                onClick={() => performExport(option)}
                disabled={exporting === option.id}
                className="w-full"
              >
                {exporting === option.id ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Histórico de Exportações</h3>
          <Button variant="secondary" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Ver histórico
          </Button>
        </div>

        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhuma exportação recente</p>
          <p className="text-sm">O histórico aparecerá aqui após a primeira exportação</p>
        </div>
      </Card>
    </div>
  );

  const renderScheduledTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Relatórios Agendados</h3>
          <Button onClick={() => setShowNewReport(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>

        {scheduledReports.length > 0 ? (
          <div className="space-y-4">
            {scheduledReports.map((report) => (
              <Card key={report.id} className="p-6 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{report.report_name}</h4>
                      <Badge variant={report.is_active ? "success" : "secondary"}>
                        {report.is_active ? "Ativo" : "Pausado"}
                      </Badge>
                      <Badge variant="info">{report.schedule_frequency}</Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      Tipo: {report.report_type} • {report.recipients.length} recipient(s)
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Próximo envio: {new Date(report.next_send_at).toLocaleDateString('pt-BR')}
                      </div>
                      {report.last_sent_at && (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Último envio: {new Date(report.last_sent_at).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm">
                      {report.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum relatório agendado</p>
            <p className="text-sm">Configure envios automáticos de relatórios</p>
          </div>
        )}
      </Card>

      {/* Modal de novo relatório */}
      {showNewReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg m-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Agendar Novo Relatório</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Relatório</label>
                <input
                  type="text"
                  value={newReportForm.report_name}
                  onChange={(e) => setNewReportForm(prev => ({ ...prev, report_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Dashboard Mensal da Diretoria"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={newReportForm.report_type}
                    onChange={(e) => setNewReportForm(prev => ({ ...prev, report_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="executive_dashboard">Dashboard Executivo</option>
                    <option value="companies_summary">Resumo de Empresas</option>
                    <option value="mentor_analytics">Analytics de Mentores</option>
                    <option value="evaluations_report">Relatório de Avaliações</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                  <select
                    value={newReportForm.frequency}
                    onChange={(e) => setNewReportForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                {newReportForm.recipients.map((email, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="email@exemplo.com"
                    />
                    {newReportForm.recipients.length > 1 && (
                      <Button variant="secondary" size="sm" onClick={() => removeRecipient(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addRecipient}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar email
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                <div className="flex gap-4">
                  {(['pdf', 'excel'] as const).map(format => (
                    <button
                      key={format}
                      onClick={() => setNewReportForm(prev => ({ ...prev, format }))}
                      className={`px-4 py-2 rounded-lg border ${
                        newReportForm.format === format
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={scheduleNewReport} className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Relatório
              </Button>
              <Button variant="secondary" onClick={() => setShowNewReport(false)}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Insights Automáticos</h3>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={generateNewInsights}
              disabled={generatingInsights}
            >
              {generatingInsights ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Gerar Insights
                </>
              )}
            </Button>
          </div>
        </div>

        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <Card key={index} className="p-6 border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="info">{insight.type}</Badge>
                      <Badge variant="secondary">
                        {Math.round(insight.confidence * 100)}% confiança
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{insight.description}</p>

                {insight.data && Object.keys(insight.data).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Dados de apoio:</p>
                    <div className="text-sm text-gray-600">
                      {Object.entries(insight.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum insight disponível</p>
            <p className="text-sm">Clique em "Gerar Insights" para análises automáticas</p>
          </div>
        )}
      </Card>
    </div>
  );

  const renderTrendsTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Previsões e Tendências</h3>
          <Badge variant="warning">IA Powered</Badge>
        </div>

        {trendPredictions.length > 0 ? (
          <div className="space-y-4">
            {trendPredictions.map((trend, index) => (
              <Card key={index} className="p-6 border-l-4 border-green-500">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge variant="success">{trend.trend_type}</Badge>
                    <h4 className="font-semibold text-gray-900 mt-2">{trend.title}</h4>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {Math.round(trend.confidence * 100)}% confiança
                    </Badge>
                    {trend.predicted_growth && (
                      <div className="mt-1">
                        <span className="text-lg font-bold text-green-600">
                          +{trend.predicted_growth}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{trend.description}</p>

                {trend.key_drivers && trend.key_drivers.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Principais drivers:</p>
                    <div className="flex flex-wrap gap-2">
                      {trend.key_drivers.map((driver, i) => (
                        <Badge key={i} variant="secondary">{driver}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Analisando tendências...</p>
            <p className="text-sm">As previsões serão exibidas conforme os dados são processados</p>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Exportação & Insights', href: '/export-insights' }
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Exportação & Insights Avançados</h1>
          <p className="text-gray-600">
            Exportações, relatórios automáticos e insights gerados por IA
          </p>
        </div>
      </div>

      {/* Navegação por abas */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Download className="w-5 h-5 inline mr-2" />
            Exportações
          </button>
          
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scheduled'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-5 h-5 inline mr-2" />
            Relatórios Agendados ({scheduledReports.length})
          </button>
          
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'insights'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Brain className="w-5 h-5 inline mr-2" />
            Insights IA
          </button>
          
          <button
            onClick={() => setActiveTab('trends')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Tendências
          </button>
        </nav>
      </div>

      {/* Conteúdo das abas */}
      {activeTab === 'export' && renderExportTab()}
      {activeTab === 'scheduled' && renderScheduledTab()}
      {activeTab === 'insights' && renderInsightsTab()}
      {activeTab === 'trends' && renderTrendsTab()}
    </div>
  );
}