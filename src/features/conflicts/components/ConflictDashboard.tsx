import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter, Download, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/feedback/Badge';
import { Input } from '@/design-system/ui/Input';
import { Select } from '@/design-system/forms/Select';
import { ConflictAuditLog, ConflictSeverity, PartnershipType } from '../types/conflict';
import { getConflictAuditLogs } from '../services/conflictService';

interface ConflictDashboardProps {
  mentorId?: string;
  className?: string;
}

export function ConflictDashboard({
  mentorId,
  className = ''
}: ConflictDashboardProps) {
  const [logs, setLogs] = useState<ConflictAuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ConflictAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<ConflictSeverity | 'all'>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');

  // Carregar logs
  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getConflictAuditLogs(mentorId, undefined, 100);
      setLogs(data);
      setFilteredLogs(data);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar
  useEffect(() => {
    loadLogs();
  }, [mentorId]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = logs;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(log =>
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de severidade
    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    // Filtro de tipo de ação
    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionTypeFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, severityFilter, actionTypeFilter]);

  // Badges de severidade
  const getSeverityBadge = (severity: ConflictSeverity) => {
    switch (severity) {
      case 'critical':
        return <Badge status="error">Crítico</Badge>;
      case 'warning':
        return <Badge status="warning">Aviso</Badge>;
      case 'info':
        return <Badge status="info">Info</Badge>;
      default:
        return <Badge status="default">Baixo</Badge>;
    }
  };

  // Ícone de tipo de ação
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'conflict_detected':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'evaluation_attempt':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partnership_declared':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'notification_sent':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  // Labels de tipo de ação
  const getActionLabel = (actionType: string): string => {
    const labels: Record<string, string> = {
      evaluation_attempt: 'Tentativa de Avaliação',
      conflict_detected: 'Conflito Detectado',
      partnership_declared: 'Parceria Declarada',
      partnership_updated: 'Parceria Atualizada',
      notification_sent: 'Notificação Enviada'
    };
    return labels[actionType] || actionType;
  };

  // Estatísticas
  const stats = {
    total: logs.length,
    critical: logs.filter(l => l.severity === 'critical').length,
    warning: logs.filter(l => l.severity === 'warning').length,
    conflictsDetected: logs.filter(l => l.action_type === 'conflict_detected').length
  };

  // Exportar CSV
  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Severidade', 'Mentor ID', 'Empresa ID', 'Detalhes'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString('pt-BR'),
      getActionLabel(log.action_type),
      log.severity,
      log.mentor_id,
      log.company_id,
      JSON.stringify(log.details)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conflitos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Painel de Conflitos de Interesse
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Monitore e gerencie conflitos detectados
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadLogs}
              loading={loading}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Atualizar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCSV}
              disabled={filteredLogs.length === 0}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Exportar
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-700 font-medium">Total de Logs</p>
            <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium">Críticos</p>
            <p className="text-3xl font-bold text-red-900">{stats.critical}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-700 font-medium">Avisos</p>
            <p className="text-3xl font-bold text-yellow-900">{stats.warning}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700 font-medium">Conflitos Detectados</p>
            <p className="text-3xl font-bold text-green-900">{stats.conflictsDetected}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select
              value={severityFilter}
              onChange={(value) => setSeverityFilter(value as ConflictSeverity | 'all')}
              options={[
                { value: 'all', label: 'Todas Severidades' },
                { value: 'critical', label: 'Crítico' },
                { value: 'warning', label: 'Aviso' },
                { value: 'info', label: 'Info' }
              ]}
            />

            <Select
              value={actionTypeFilter}
              onChange={(value) => setActionTypeFilter(value)}
              options={[
                { value: 'all', label: 'Todos os Tipos' },
                { value: 'evaluation_attempt', label: 'Tentativa de Avaliação' },
                { value: 'conflict_detected', label: 'Conflito Detectado' },
                { value: 'partnership_declared', label: 'Parceria Declarada' },
                { value: 'notification_sent', label: 'Notificação Enviada' }
              ]}
            />
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-gray-600">Carregando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum log encontrado
              </h3>
              <p className="text-sm text-gray-600">
                {logs.length === 0 
                  ? 'Não há registros de conflitos no sistema'
                  : 'Tente ajustar os filtros de busca'
                }
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getActionIcon(log.action_type)}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {getActionLabel(log.action_type)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-2">
                      {getSeverityBadge(log.severity)}
                      <span className="text-xs text-gray-500">
                        Mentor: {log.mentor_id.substring(0, 8)}...
                      </span>
                      <span className="text-xs text-gray-500">
                        Empresa: {log.company_id.substring(0, 8)}...
                      </span>
                    </div>

                    {log.details && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <pre className="text-xs text-gray-700 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

export default ConflictDashboard;
