import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Icon from '@/components/ui/icon';

export const LoadingState = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-6">
          <div className="flex justify-between items-start mb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </Card>
      ))}
    </div>
    
    <Card className="p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-24 w-full" />
    </Card>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </Card>
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    </div>
  </div>
);

export const EmptyState = ({ onGetStarted }: { onGetStarted?: () => void }) => (
  <Card className="p-8 sm:p-12 text-center max-w-2xl mx-auto">
    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
      <Icon name="Rocket" className="h-8 w-8 text-primary" />
    </div>
    <h2 className="text-2xl font-bold mb-2">Добро пожаловать!</h2>
    <p className="text-muted-foreground mb-6">
      Это ваш дашборд — здесь будет вся важная информация о системе.
      <br />
      Начните с добавления первых данных.
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button onClick={onGetStarted}>
        <Icon name="Plus" className="h-4 w-4 mr-2" />
        Начать работу
      </Button>
      <Button variant="outline">
        <Icon name="HelpCircle" className="h-4 w-4 mr-2" />
        Документация
      </Button>
    </div>
  </Card>
);

export const ErrorState = ({ message, onRetry }: { message?: string; onRetry?: () => void }) => (
  <Card className="p-8 sm:p-12 text-center max-w-2xl mx-auto border-destructive/50">
    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 mb-4">
      <Icon name="AlertCircle" className="h-8 w-8 text-destructive" />
    </div>
    <h2 className="text-2xl font-bold mb-2">Ошибка загрузки</h2>
    <p className="text-muted-foreground mb-6">
      {message || 'Не удалось загрузить данные дашборда. Попробуйте обновить страницу.'}
    </p>
    {onRetry && (
      <Button onClick={onRetry}>
        <Icon name="RefreshCw" className="h-4 w-4 mr-2" />
        Попробовать снова
      </Button>
    )}
  </Card>
);

export const PartialState = ({ message }: { message: string }) => (
  <Card className="p-4 sm:p-6 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20 mb-6">
    <div className="flex items-start gap-3">
      <Icon name="AlertTriangle" className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Частичная загрузка данных</p>
        <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
      </div>
    </div>
  </Card>
);
