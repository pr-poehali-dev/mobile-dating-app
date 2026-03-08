import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ServiceBalance {
  id: number;
  service_name: string;
  balance: number;
  currency: string;
  status: 'ok' | 'warning' | 'critical';
  last_updated: string;
  api_endpoint?: string;
  threshold_warning?: number;
  threshold_critical?: number;
  description?: string;
}

interface ServiceCardProps {
  service: ServiceBalance;
  onRefresh: (id: number) => void;
  onEdit: (service: ServiceBalance) => void;
  onDelete: (id: number, name: string) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => string;
}

const ServiceCard = ({ 
  service, 
  onRefresh, 
  onEdit, 
  onDelete, 
  getStatusColor, 
  getStatusIcon 
}: ServiceCardProps) => {
  return (
    <Card className="p-4 sm:p-5 lg:p-5 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className={`p-1.5 sm:p-2 rounded-lg border-2 ${getStatusColor(service.status)} shrink-0`}>
            <Icon name={getStatusIcon(service.status)} className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{service.service_name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Обновлено: {new Date(service.last_updated).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: window.innerWidth >= 1024 ? 'numeric' : '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-0.5 sm:gap-1 shrink-0">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onRefresh(service.id)}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <Icon name="RefreshCw" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onEdit(service)}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <Icon name="Settings" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(service.id, service.service_name)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-9 sm:w-9"
          >
            <Icon name="Trash2" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {service.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{service.description}</p>
        )}
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-foreground">
            {service.balance.toLocaleString('ru-RU')}
          </span>
          <span className="text-sm sm:text-base text-muted-foreground font-medium">{service.currency}</span>
        </div>

        {service.threshold_warning && service.threshold_critical && (
          <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
            <div className="flex items-center gap-1 text-yellow-500 font-medium">
              <Icon name="AlertTriangle" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>&lt; {service.threshold_warning.toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex items-center gap-1 text-red-500 font-medium">
              <Icon name="XCircle" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>&lt; {service.threshold_critical.toLocaleString('ru-RU')}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ServiceCard;