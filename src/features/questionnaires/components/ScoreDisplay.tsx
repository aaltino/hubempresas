// Componente: ScoreDisplay - Exibição de Scores de Questionário
// Mostra scores por bloco, score final e plano de ação

import React from 'react';
import type { QuestionnaireResponse, ActionPlan } from '../../questionnaires/types/questionnaire';
import { Card } from '@/design-system/ui/Card';
import { Badge } from '@/design-system/ui/Badge';
import { Alert } from '@/design-system/feedback/Alert';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface ScoreDisplayProps {
  response: QuestionnaireResponse;
  actionPlans?: ActionPlan[];
  showActionPlan?: boolean;
}

export function ScoreDisplay({ 
  response, 
  actionPlans = [],
  showActionPlan = true 
}: ScoreDisplayProps) {
  const blockScores = response.block_scores || {};
  const totalScore = response.total_score || 0;
  
  // Determinar status baseado no score
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: 'green', icon: CheckCircle };
    if (score >= 70) return { label: 'Bom', color: 'blue', icon: CheckCircle };
    if (score >= 50) return { label: 'Precisa Melhorar', color: 'yellow', icon: AlertTriangle };
    return { label: 'Crítico', color: 'red', icon: XCircle };
  };

  const overallStatus = getScoreStatus(totalScore);
  const StatusIcon = overallStatus.icon;

  return (
    <div className="space-y-6">
      {/* Score Geral */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Score Final</h3>
              <p className="text-sm text-gray-600 mt-1">
                Completado em {new Date(response.completed_at || '').toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Badge variant={overallStatus.color as any}>
              {overallStatus.label}
            </Badge>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              {/* Círculo de progresso */}
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - totalScore / 100)}`}
                  className={`text-${overallStatus.color}-600`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-bold text-gray-900">
                  {totalScore.toFixed(0)}
                </span>
                <span className="text-sm text-gray-600">de 100</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm">
            <StatusIcon className={`w-5 h-5 text-${overallStatus.color}-600`} />
            <span className="font-medium text-gray-900">{overallStatus.label}</span>
          </div>
        </div>
      </Card>

      {/* Scores por Bloco */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Scores por Bloco
          </h3>

          <div className="space-y-4">
            {Object.entries(blockScores).map(([blockName, score]) => {
              const status = getScoreStatus(score);
              const BlockIcon = status.icon;

              return (
                <div key={blockName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BlockIcon className={`w-4 h-4 text-${status.color}-600`} />
                      <span className="text-sm font-medium text-gray-900">
                        {blockName}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {score.toFixed(0)}%
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-${status.color}-600 h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Plano de Ação */}
      {showActionPlan && actionPlans.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Plano de Ação
              </h3>
            </div>

            <Alert type="info" title="Recomendações" className="mb-4">
              Com base no seu score, identificamos {actionPlans.length} ações recomendadas
              para melhorar seu desempenho.
            </Alert>

            <div className="space-y-3">
              {actionPlans
                .sort((a, b) => {
                  const priorityOrder = { high: 0, medium: 1, low: 2 };
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .map(action => (
                  <div
                    key={action.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              action.priority === 'high' ? 'error' :
                              action.priority === 'medium' ? 'warning' :
                              'secondary'
                            }

                          >
                            {action.priority === 'high' && 'Alta'}
                            {action.priority === 'medium' && 'Média'}
                            {action.priority === 'low' && 'Baixa'}
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {action.category === 'question' && 'Questão'}
                            {action.category === 'deliverable' && 'Entregável'}
                            {action.category === 'mentorship' && 'Mentoria'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">
                          {action.action_description}
                        </p>
                      </div>
                    </div>

                    {action.estimated_effort_hours && (
                      <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                        <span>Esforço estimado: {action.estimated_effort_hours}h</span>
                        {action.due_date && (
                          <span>
                            Prazo: {new Date(action.due_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
