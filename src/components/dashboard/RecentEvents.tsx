import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Event } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface RecentEventsProps {
  events: Event[];
}

const RecentEvents = ({ events }: RecentEventsProps) => {
  const navigate = useNavigate();

  const eventConfig = {
    payment: { icon: 'DollarSign', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    approval: { icon: 'CheckCircle2', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' },
    user: { icon: 'User', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/20' },
    system: { icon: 'Settings', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/20' },
    error: { icon: 'AlertCircle', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20' },
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  };

  if (events.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Icon name="Inbox" className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Пока нет событий</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Последние события</h3>
      <div className="space-y-3">
        {events.slice(0, 5).map((event) => {
          const config = eventConfig[event.type];
          
          return (
            <div
              key={event.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                event.detailsLink && "hover:bg-accent cursor-pointer"
              )}
              onClick={() => event.detailsLink && navigate(event.detailsLink)}
            >
              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", config.bg)}>
                <Icon name={config.icon} className={cn("h-5 w-5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{formatTime(event.timestamp)}</span>
            </div>
          );
        })}
      </div>
      {events.length > 5 && (
        <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('/audit-logs')}>
          Показать все события
        </Button>
      )}
    </Card>
  );
};

export default RecentEvents;
