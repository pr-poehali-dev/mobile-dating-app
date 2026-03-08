import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarTouch } from '@/hooks/useSidebarTouch';
import { useCrudPage } from '@/hooks/useCrudPage';
import PaymentsSidebar from '@/components/payments/PaymentsSidebar';
import { useToast } from '@/hooks/use-toast';
import ServicesHeader from '@/components/services/ServicesHeader';
import ServiceFormDialog from '@/components/services/ServiceFormDialog';
import ServicesTable from '@/components/services/ServicesTable';
import { useDictionaryContext } from '@/contexts/DictionaryContext';

interface Service {
  id: number;
  name: string;
  description: string;
  intermediate_approver_id: number;
  final_approver_id: number;
  intermediate_approver_name?: string;
  final_approver_name?: string;
  customer_department_id?: number;
  customer_department_name?: string;
  category_id?: number;
  category_name?: string;
  category_icon?: string;
  legal_entity_id?: number;
  legal_entity_name?: string;
  contractor_id?: number;
  contractor_name?: string;
  created_at: string;
}

const Services = () => {
  const { hasPermission } = useAuth();
  const {
    categories,
    departments,
    legalEntities,
    contractors,
    users,
    refresh: refreshDictionary,
  } = useDictionaryContext();

  const [dictionariesOpen, setDictionariesOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const { toast } = useToast();

  const {
    menuOpen,
    setMenuOpen,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSidebarTouch();

  const {
    items: services,
    loading,
    dialogOpen,
    setDialogOpen,
    editingItem: editingService,
    formData,
    setFormData,
    loadData: loadServices,
    handleEdit: handleEditBase,
    handleSubmit: handleSubmitBase,
    handleDelete: handleDeleteBase,
  } = useCrudPage<Service>({
    endpoint: 'services',
    baseApi: 'dictionariesApi',
    initialFormData: {
      name: '',
      description: '',
      intermediate_approver_id: '',
      final_approver_id: '',
      customer_department_id: '',
      category_id: '',
      legal_entity_id: '',
      contractor_id: '',
    },
  });

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      await handleSubmitBase(e);
      await refreshDictionary('services');
      toast({
        title: 'Успешно',
        description: editingService ? 'Сервис обновлён' : 'Сервис создан',
      });
    } catch (error) {
      console.error('Failed to save service:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить сервис',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (service: Service) => {
    handleEditBase(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      intermediate_approver_id: service.intermediate_approver_id?.toString() || '',
      final_approver_id: service.final_approver_id?.toString() || '',
      customer_department_id: service.customer_department_id?.toString() || '',
      category_id: service.category_id?.toString() || '',
      legal_entity_id: service.legal_entity_id?.toString() || '',
      contractor_id: service.contractor_id?.toString() || '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот сервис?')) return;
    try {
      await handleDeleteBase(id);
      toast({
        title: 'Успешно',
        description: 'Сервис удалён',
      });
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить сервис',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      intermediate_approver_id: '',
      final_approver_id: '',
      customer_department_id: '',
      category_id: '',
      legal_entity_id: '',
      contractor_id: '',
    });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleCreateClick = () => {
    setDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen">
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

      <main className="lg:ml-[250px] p-4 md:p-6 lg:p-[30px] min-h-screen flex-1 overflow-x-hidden max-w-full">
        <ServicesHeader
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onCreateClick={handleCreateClick}
        />

        <ServiceFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          editingService={editingService}
          formData={formData}
          setFormData={setFormData}
          users={users}
          departments={departments}
          categories={categories}
          legalEntities={legalEntities}
          contractors={contractors}
          onSubmit={handleSubmit}
        />

        <ServicesTable
          services={[...services].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
};

export default Services;