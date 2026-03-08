import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICardData } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface KPICardProps {
  data: KPICardData;
  onClick?: () => void;
}

const KPICard = ({ data, onClick }: KPICardProps) => {
  if (data.loading) {
    return (
      <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </Card>
    );
  }

  if (data.error) {
    return (
      <Card className="p-4 sm:p-6 border-destructive/50 bg-destructive/5">
        <div className="flex items-start gap-3">
          <Icon name="AlertCircle" className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive mb-1">{data.title}</p>
            <p className="text-xs text-muted-foreground">{data.error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const trendColor = data.trend.direction === 'up' 
    ? 'text-green-600' 
    : data.trend.direction === 'down' 
    ? 'text-red-600' 
    : 'text-muted-foreground';

  const trendIcon = data.trend.direction === 'up' 
    ? 'TrendingUp' 
    : data.trend.direction === 'down' 
    ? 'TrendingDown' 
    : 'Minus';

  return (
    <Card 
      className={cn(
        "p-4 sm:p-6 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm font-medium text-muted-foreground">{data.title}</p>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon name={data.icon} className="h-5 w-5 text-primary" />
        </div>
      </div>
      
      <p className="text-2xl sm:text-3xl font-bold mb-2">{data.value}</p>
      
      <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
        <Icon name={trendIcon} className="h-4 w-4" />
        <span className="font-medium">{Math.abs(data.trend.value)}%</span>
        <span className="text-muted-foreground text-xs">vs прошлый период</span>
      </div>
    </Card>
  );
};

export default KPICard;
