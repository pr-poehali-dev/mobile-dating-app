import { useState, useEffect } from 'react';
import { useSidebarTouch } from '@/hooks/useSidebarTouch';
import PaymentsSidebar from '@/components/payments/PaymentsSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AddIntegrationDialog from '@/components/monitoring/AddIntegrationDialog';
import MonitoringHeader from '@/components/monitoring/MonitoringHeader';
import ServiceCard from '@/components/monitoring/ServiceCard';
import ServiceEditDialog from '@/components/monitoring/ServiceEditDialog';

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

const Monitoring = () => {
  const [dictionariesOpen, setDictionariesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [services, setServices] = useState<ServiceBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingService, setEditingService] = useState<ServiceBalance | null>(null);
  const [editForm, setEditForm] = useState({
    service_name: '',
    description: '',
    threshold_warning: 0,
    threshold_critical: 0,
  });
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const {
    menuOpen,
    setMenuOpen,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSidebarTouch();

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://functions.poehali.dev/ffd10ecc-7940-4a9a-92f7-e6eea426304d', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить данные мониторинга',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async (serviceId: number) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/ffd10ecc-7940-4a9a-92f7-e6eea426304d?action=refresh&serviceId=${serviceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        await loadServices();
        toast({
          title: 'Обновлено',
          description: 'Баланс успешно обновлен',
        });
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить баланс',
        variant: 'destructive',
      });
    }
  };

  const refreshAllBalances = async () => {
    setLoading(true);
    try {
      const refreshPromises = services.map(service => 
        fetch(`https://functions.poehali.dev/ffd10ecc-7940-4a9a-92f7-e6eea426304d?action=refresh&serviceId=${service.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      );
      
      await Promise.all(refreshPromises);
      await loadServices();
      
      toast({
        title: 'Обновлено',
        description: `Обновлено ${services.length} сервисов`,
      });
    } catch (error) {
      console.error('Failed to refresh all balances:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить все балансы',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (serviceId: number, serviceName: string) => {
    const confirmed = window.confirm(`Удалить "${serviceName}" из мониторинга?`);
    if (!confirmed) return;
    
    try {
      const response = await fetch(`https://functions.poehali.dev/ffd10ecc-7940-4a9a-92f7-e6eea426304d?serviceId=${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        await loadServices();
        toast({
          title: 'Удалено',
          description: `${serviceName} удалён из мониторинга`,
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось удалить сервис',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить сервис',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (service: ServiceBalance) => {
    setEditingService(service);
    setEditForm({
      service_name: service.service_name,
      description: service.description || '',
      threshold_warning: service.threshold_warning || 0,
      threshold_critical: service.threshold_critical || 0,
    });
  };

  const saveServiceSettings = async () => {
    if (!editingService) return;

    try {
      setSaving(true);
      const response = await fetch(`https://functions.poehali.dev/ffd10ecc-7940-4a9a-92f7-e6eea426304d?serviceId=${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_name: editForm.service_name,
          description: editForm.description,
          threshold_warning: editForm.threshold_warning,
          threshold_critical: editForm.threshold_critical,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Сохранено',
          description: 'Настройки сервиса обновлены',
        });
        setEditingService(null);
        await loadServices();
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось сохранить настройки',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to save service settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadServices();
    
    const interval = setInterval(() => {
      refreshAllBalances();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [token]);

  const addIntegration = async (integration: {
    service_name: string;
    description: string;
    api_endpoint: string;
    api_key_secret_name: string;
    threshold_warning: number;
    threshold_critical: number;
    credentials: Record<string, string>;
  }) => {
    try {
      const response = await fetch('https://functions.poehali.dev/ffd10ecc-7940-4a9a-92f7-e6eea426304d', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_name: integration.service_name,
          description: integration.description,
          api_endpoint: integration.api_endpoint,
          api_key_secret_name: integration.api_key_secret_name,
          threshold_warning: integration.threshold_warning,
          threshold_critical: integration.threshold_critical,
          currency: 'RUB',
          auto_refresh: true,
          refresh_interval_minutes: 60,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Интеграция добавлена',
          description: `${integration.service_name} успешно добавлен в мониторинг`,
        });
        await loadServices();
      } else {
        const error = await response.json();
        toast({
          title: response.status === 409 ? 'Сервис уже добавлен' : 'Ошибка',
          description: error.error || 'Не удалось добавить интеграцию',
          variant: 'destructive',
        });
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Failed to add integration:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить интеграцию',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return 'CheckCircle2';
      case 'warning':
        return 'AlertTriangle';
      case 'critical':
        return 'XCircle';
      default:
        return 'HelpCircle';
    }
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      <PaymentsSidebar
        menuOpen={menuOpen}
        dictionariesOpen={dictionariesOpen}
        setDictionariesOpen={setDictionariesOpen}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
      />

      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="lg:ml-[250px] p-4 md:p-6 lg:p-8 min-h-screen flex-1 overflow-x-hidden max-w-full">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 text-foreground hover:bg-muted rounded-lg transition-colors mb-4"
        >
          <Icon name="Menu" size={24} />
        </button>
        <div className="w-full space-y-6">
            <MonitoringHeader
              onAddClick={() => setShowAddDialog(true)}
              onRefreshAll={refreshAllBalances}
              loading={loading}
              servicesCount={services.length}
            />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-4 sm:p-5 animate-pulse">
                    <div className="h-20 sm:h-24 bg-muted rounded"></div>
                  </Card>
                ))}
              </div>
            ) : services.length === 0 ? (
              <Card className="p-6 sm:p-12 text-center">
                <Icon name="Wallet" className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Нет подключенных сервисов</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">Добавьте интеграции с сервисами для мониторинга балансов</p>
                <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)} className="sm:size-default">
                  <Icon name="Plus" className="mr-2 h-4 w-4" />
                  Добавить интеграцию
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onRefresh={refreshBalance}
                    onEdit={openEditDialog}
                    onDelete={deleteService}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </div>
            )}

            <ServiceEditDialog
              open={!!editingService}
              onOpenChange={(open) => !open && setEditingService(null)}
              editingService={editingService}
              editForm={editForm}
              setEditForm={setEditForm}
              onSave={saveServiceSettings}
              saving={saving}
            />

            <AddIntegrationDialog
              open={showAddDialog}
              onOpenChange={setShowAddDialog}
              onAdd={addIntegration}
            />
          </div>
        </main>
    </div>
  );
};

export default Monitoring;