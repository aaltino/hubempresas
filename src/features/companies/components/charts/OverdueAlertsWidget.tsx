import { AlertCircle, Clock, Filter, ArrowUpDown, Calendar, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Tooltip, HelpTooltip } from '@/design-system/feedback';

interface CompanyAlert {
  name: string;
  reason: string;
  program: string;
  daysOverdue?: number;
  severity: 'critical' | 'warning' | 'info';
  date?: string; // Data do alerta
}

interface OverdueAlertsWidgetProps {
  alerts: CompanyAlert[];
}

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';
type DateFilter = 'all' | '7days' | '30days' | '90days';
type SortOption = 'severity' | 'date' | 'name' | 'daysOverdue';

export default function OverdueAlertsWidget({ alerts }: OverdueAlertsWidgetProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('severity');
  const [showFilters, setShowFilters] = useState(false);

  // Aplicar filtros e ordenacao
  const filteredAndSortedAlerts = useMemo(() => {
    let filtered = [...alerts];

    // Filtro por gravidade
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    // Filtro por data (simples - baseado em daysOverdue)
    if (dateFilter !== 'all') {
      const days = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
      filtered = filtered.filter(alert => !alert.daysOverdue || alert.daysOverdue <= days);
    }

    // Ordenacao
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          const severityOrder = { critical: 0, warning: 1, info: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        case 'daysOverdue':
          return (b.daysOverdue || 0) - (a.daysOverdue || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return (b.daysOverdue || 0) - (a.daysOverdue || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [alerts, severityFilter, dateFilter, sortBy]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Crítico';
      case 'warning': return 'Aviso';
      case 'info': return 'Informação';
      default: return severity;
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const activeFiltersCount = (severityFilter !== 'all' ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Alertas e Empresas em Risco</h3>
          <HelpTooltip content="Lista de empresas que precisam de atencao imediata. Use os filtros para refinar a visualizacao." />
        </div>
        <div className="flex items-center space-x-2">
          {criticalCount > 0 && (
            <Tooltip content={`${criticalCount} alerta(s) critico(s)`}>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {criticalCount} crítico(s)
              </span>
            </Tooltip>
          )}
          {warningCount > 0 && (
            <Tooltip content={`${warningCount} aviso(s)`}>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                {warningCount} aviso(s)
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Barra de filtros e ordenacao */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="severity">Gravidade</option>
              <option value="daysOverdue">Dias em atraso</option>
              <option value="name">Nome (A-Z)</option>
              <option value="date">Data</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setSeverityFilter('all');
                setDateFilter('all');
              }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Limpar filtros
            </button>
          )}
        </div>

        {/* Painel de filtros expansivel com animação */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por gravidade
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'critical', 'warning', 'info'] as SeverityFilter[]).map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setSeverityFilter(severity)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      severityFilter === severity
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {severity === 'all' ? 'Todos' : getSeverityLabel(severity)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Filtrar por periodo
              </label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { value: 'all', label: 'Todos' },
                  { value: '7days', label: 'Ultimos 7 dias' },
                  { value: '30days', label: 'Ultimos 30 dias' },
                  { value: '90days', label: 'Ultimos 90 dias' }
                ] as { value: DateFilter; label: string }[]).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDateFilter(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      dateFilter === option.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredAndSortedAlerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600 font-medium">
            {alerts.length === 0 ? 'Nenhuma empresa em situacao de risco' : 'Nenhum alerta corresponde aos filtros'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {alerts.length === 0 ? 'Todas as empresas estao em dia!' : 'Tente ajustar os filtros'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAndSortedAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start space-x-3">
                <Tooltip content={`Gravidade: ${getSeverityLabel(alert.severity)}`}>
                  {getSeverityIcon(alert.severity)}
                </Tooltip>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{alert.name}</h4>
                  <p className="text-sm text-gray-700 mt-1">{alert.reason}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-600 capitalize">
                      {alert.program.replace(/_/g, ' ')}
                    </span>
                    {alert.daysOverdue && alert.daysOverdue > 0 && (
                      <Tooltip content={`Alerta gerado ha ${alert.daysOverdue} dias`}>
                        <span className="text-xs font-medium text-red-600">
                          {alert.daysOverdue} dias em atraso
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <button className="px-3 py-1 text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap hover:bg-blue-50 rounded transition-colors">
                  Ver detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredAndSortedAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {activeFiltersCount > 0 ? 'Alertas filtrados:' : 'Total de alertas:'}
            </span>
            <span className="font-bold text-gray-900">
              {filteredAndSortedAlerts.length}
              {activeFiltersCount > 0 && alerts.length !== filteredAndSortedAlerts.length && (
                <span className="text-gray-500 font-normal"> de {alerts.length}</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
