import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { SystemStatus } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface SystemStatusBlockProps {
  status: SystemStatus;
}

const SystemStatusBlock = ({ status }: SystemStatusBlockProps) => {
  const statusConfig = {
    healthy: {
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-900',
      icon: 'CheckCircle2',
      label: 'Всё работает',
    },
    warning: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-900',
      icon: 'AlertTriangle',
      label: 'Требует внимания',
    },
    critical: {
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-900',
      icon: 'AlertCircle',
      label: 'Критические ошибки',
    },
  };

  const config = statusConfig[status.status];

  return (
    <Card className={cn("p-4 sm:p-6", config.borderColor, config.bgColor)}>
      <div className="flex items-start gap-3 mb-4">
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", config.bgColor)}>
          <Icon name={config.icon} className={cn("h-6 w-6", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-1">Состояние системы</h3>
          <p className={cn("text-sm font-medium", config.color)}>{config.label}</p>
          {status.message && (
            <p className="text-sm text-muted-foreground mt-1">{status.message}</p>
          )}
        </div>
      </div>

      {status.alerts.length > 0 && (
        <div className="space-y-3">
          <div className="h-px bg-border" />
          
          {status.alerts.map((alert) => {
            const alertConfig = {
              error: { icon: 'XCircle', color: 'text-red-600' },
              warning: { icon: 'AlertTriangle', color: 'text-yellow-600' },
              info: { icon: 'Info', color: 'text-blue-600' },
            };
            
            const aConfig = alertConfig[alert.type];
            
            return (
              <div key={alert.id} className="flex items-start gap-3">
                <Icon name={aConfig.icon} className={cn("h-5 w-5 shrink-0 mt-0.5", aConfig.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  {alert.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                  )}
                  {alert.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={alert.action.onClick}
                    >
                      {alert.action.label}
                    </Button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(alert.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default SystemStatusBlock;