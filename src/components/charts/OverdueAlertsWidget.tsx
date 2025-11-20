import { AlertCircle, Clock } from 'lucide-react';

interface CompanyAlert {
  name: string;
  reason: string;
  program: string;
  daysOverdue?: number;
  severity: 'critical' | 'warning' | 'info';
}

interface OverdueAlertsWidgetProps {
  alerts: CompanyAlert[];
}

export default function OverdueAlertsWidget({ alerts }: OverdueAlertsWidgetProps) {
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

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Alertas e Empresas em Risco</h3>
          <p className="text-sm text-gray-600 mt-1">
            Empresas que precisam de atenção imediata
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {criticalCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {criticalCount} crítico(s)
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              {warningCount} aviso(s)
            </span>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600 font-medium">Nenhuma empresa em situação de risco</p>
          <p className="text-sm text-gray-500 mt-1">Todas as empresas estão em dia!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start space-x-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{alert.name}</h4>
                  <p className="text-sm text-gray-700 mt-1">{alert.reason}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-600 capitalize">
                      {alert.program.replace(/_/g, ' ')}
                    </span>
                    {alert.daysOverdue && alert.daysOverdue > 0 && (
                      <span className="text-xs font-medium text-red-600">
                        {alert.daysOverdue} dias em atraso
                      </span>
                    )}
                  </div>
                </div>
                <button className="px-3 py-1 text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap">
                  Ver detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total de alertas:</span>
            <span className="font-bold text-gray-900">{alerts.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
