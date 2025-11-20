// Página: QuestionnaireListPage - Lista de Questionários Disponíveis
// Mostra templates disponíveis e respostas anteriores

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionnaireService } from '../services/questionnaireService';
import { supabase } from '@/lib/supabase';
import type { QuestionnaireTemplate, QuestionnaireResponse } from '../types/questionnaire';
import { useAuth } from '@/features/auth';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/ui/Badge';
import { Alert } from '@/design-system/feedback/Alert';
import { DashboardSkeleton } from '@/design-system/feedback/Skeleton';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { FileText, Clock, CheckCircle, Play, ClipboardCheck } from 'lucide-react';
import { PROGRAM_LABELS, QUESTIONNAIRE_STATUS_LABELS } from '../types/questionnaire';

export function QuestionnaireListPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([]);
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar company_id do perfil
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    async function getCompanyId() {
      if (!profile?.id) return;
      
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      
      if (!error && data) {
        setCompanyId(data.id);
      }
    }
    
    getCompanyId();
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [templatesData, responsesData] = await Promise.all([
        QuestionnaireService.getActiveTemplates(),
        companyId ? QuestionnaireService.getCompanyResponses(companyId) : Promise.resolve([])
      ]);

      setTemplates(templatesData);
      setResponses(responsesData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar questionários');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuestionnaire = (template: QuestionnaireTemplate) => {
    navigate(`/questionarios/${template.program_key}`);
  };

  const handleViewResponse = (response: QuestionnaireResponse) => {
    if (response.status === 'completed') {
      navigate(`/questionarios/${response.program_key}/resultado/${response.id}`);
    } else {
      navigate(`/questionarios/${response.program_key}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Questionários', icon: <ClipboardCheck className="w-4 h-4" /> }
        ]} />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Questionários', icon: <ClipboardCheck className="w-4 h-4" /> }
      ]} />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Questionários</h1>
        <p className="text-gray-600 mt-2">
          Avalie o estágio de maturidade da sua startup respondendo aos questionários por etapa
        </p>
      </div>

      {error && (
        <Alert type="error" title="Erro">
          {error}
        </Alert>
      )}

      {/* Questionários em Andamento */}
      {responses.filter(r => r.status === 'in_progress').length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Em Andamento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {responses
              .filter(r => r.status === 'in_progress')
              .map(response => {
                const template = templates.find(t => t.id === response.template_id);
                if (!template) return null;

                const progressPercent = Math.round(
                  (response.current_step / response.total_steps) * 100
                );

                return (
                  <Card key={response.id} className="hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <Badge variant="warning">Em Andamento</Badge>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {PROGRAM_LABELS[response.program_key]}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4">
                        {template.title}
                      </p>

                      {/* Progresso */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progresso</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={() => handleViewResponse(response)}
                        variant="primary"
                        className="w-full"
                      >
                        Continuar
                      </Button>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Questionários Completados */}
      {responses.filter(r => r.status === 'completed').length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Completados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {responses
              .filter(r => r.status === 'completed')
              .map(response => {
                const template = templates.find(t => t.id === response.template_id);
                if (!template) return null;

                return (
                  <Card key={response.id} className="hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <Badge variant="success">Completo</Badge>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {PROGRAM_LABELS[response.program_key]}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Score Final:</span>
                          <span className="font-bold text-gray-900">
                            {response.total_score?.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Completado em:</span>
                          <span className="text-gray-900">
                            {new Date(response.completed_at || '').toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleViewResponse(response)}
                        variant="secondary"
                        className="w-full"
                      >
                        Ver Resultado
                      </Button>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Questionários Disponíveis */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Questionários Disponíveis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => {
            const hasResponse = responses.some(
              r => r.template_id === template.id && r.status === 'completed'
            );
            const inProgress = responses.some(
              r => r.template_id === template.id && r.status === 'in_progress'
            );

            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Play className="w-8 h-8 text-purple-600" />
                    {hasResponse && (
                      <Badge variant="secondary">Já Completado</Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {PROGRAM_LABELS[template.program_key]}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4">
                    {template.title}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{template.blocks.blocks?.length || 0} blocos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Threshold: {(template.pass_threshold * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleStartQuestionnaire(template)}
                    variant={inProgress ? 'primary' : 'secondary'}
                    className="w-full"
                  >
                    {inProgress ? 'Continuar' : hasResponse ? 'Refazer' : 'Iniciar'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
