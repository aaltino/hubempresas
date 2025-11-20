import React from 'react';
import { AlertTriangle, XCircle, Info, Shield } from 'lucide-react';
import { Alert } from '@/design-system/feedback/Alert';
import { Badge } from '@/design-system/feedback/Badge';
import { Button } from '@/design-system/ui/Button';
import { ConflictValidationResult, ConflictSeverity } from '../types/conflict';

interface ConflictAlertProps {
  conflictData: ConflictValidationResult;
  onDismiss?: () => void;
  onContest?: () => void;
  className?: string;
}

export function ConflictAlert({
  conflictData,
  onDismiss,
  onContest,
  className = ''
}: ConflictAlertProps) {
  // Não exibir se não houver conflito
  if (!conflictData.conflict_detected) {
    return null;
  }

  // Mapear severity para type do Alert
  const getAlertType = (severity: ConflictSeverity): 'success' | 'warning' | 'error' | 'info' => {
    switch (severity) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'warning';
    }
  };

  // Determinar severidade mais alta
  const highestSeverity = conflictData.conflict_reasons.reduce<ConflictSeverity>(
    (max, reason) => {
      const severityRank = { info: 1, warning: 2, critical: 3 };
      return severityRank[reason.severity] > severityRank[max] ? reason.severity : max;
    },
    'info'
  );

  const alertType = getAlertType(highestSeverity);

  // Ícone baseado em severidade
  const getSeverityIcon = () => {
    switch (highestSeverity) {
      case 'critical':
        return <XCircle className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      case 'info':
        return <Info className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  };

  // Badge de severidade
  const getSeverityBadge = () => {
    switch (highestSeverity) {
      case 'critical':
        return <Badge status="error">Crítico</Badge>;
      case 'warning':
        return <Badge status="warning">Aviso</Badge>;
      case 'info':
        return <Badge status="info">Informação</Badge>;
      default:
        return <Badge status="default">Baixo</Badge>;
    }
  };

  return (
    <div className={className}>
      <Alert
        type={alertType}
        variant="soft"
        closable={!!onDismiss}
        onClose={onDismiss}
        showIcon={false}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getSeverityIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold">
                  {conflictData.conflict_status === 'blocked' 
                    ? 'Conflito de Interesses Detectado - Ação Bloqueada'
                    : 'Aviso de Potencial Conflito de Interesses'
                  }
                </h3>
                {getSeverityBadge()}
              </div>

              {conflictData.message && (
                <p className="text-sm mb-3">
                  {conflictData.message}
                </p>
              )}

              {/* Detalhes da empresa e mentor */}
              {conflictData.details && (
                <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-3 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Mentor:</p>
                      <p className="text-gray-900">{conflictData.details.mentor_info.name}</p>
                      <p className="text-gray-600 text-xs">{conflictData.details.mentor_info.email}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Empresa:</p>
                      <p className="text-gray-900">{conflictData.details.company_info.name}</p>
                      <p className="text-gray-600 text-xs">{conflictData.details.company_info.program}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Motivos do conflito */}
              {conflictData.conflict_reasons.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Motivos identificados:</p>
                  <ul className="space-y-1">
                    {conflictData.conflict_reasons.map((reason, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <span className="flex-shrink-0 mt-0.5">•</span>
                        <div className="flex-1">
                          <span className="font-medium">{reason.type}:</span>{' '}
                          <span>{reason.message}</span>
                          {reason.partnership_type && (
                            <Badge variant="outline" status="info" className="ml-2">
                              {reason.partnership_type}
                            </Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Score de risco */}
              {conflictData.risk_score !== undefined && (
                <div className="mt-3 p-2 bg-white bg-opacity-50 rounded">
                  <p className="text-sm">
                    <span className="font-medium">Nível de Risco:</span>{' '}
                    <span className={`font-bold ${
                      conflictData.risk_score >= 80 ? 'text-red-700' :
                      conflictData.risk_score >= 50 ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {conflictData.risk_score}/100
                    </span>
                  </p>
                </div>
              )}

              {/* Recomendação */}
              {conflictData.recommendation && (
                <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border-l-4 border-current">
                  <p className="text-sm font-medium mb-1">Recomendação:</p>
                  <p className="text-sm">{conflictData.recommendation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          {(onContest || onDismiss) && (
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-current border-opacity-20">
              {onContest && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onContest}
                >
                  Contestar Conflito
                </Button>
              )}
              {onDismiss && conflictData.conflict_status !== 'blocked' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onDismiss}
                >
                  Aceitar e Fechar
                </Button>
              )}
            </div>
          )}
        </div>
      </Alert>
    </div>
  );
}

export default ConflictAlert;
