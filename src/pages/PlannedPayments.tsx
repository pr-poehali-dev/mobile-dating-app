import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePlannedPaymentsData } from '@/hooks/usePlannedPaymentsData';
import { usePlannedPaymentForm } from '@/hooks/usePlannedPaymentForm';
import { useSidebarTouch } from '@/hooks/useSidebarTouch';
import PaymentsSidebar from '@/components/payments/PaymentsSidebar';
import PlannedPaymentForm from '@/components/payments/PlannedPaymentForm';
import PaymentsList from '@/components/payments/PaymentsList';
import PaymentDetailsModal from '@/components/payments/PaymentDetailsModal';
import Icon from '@/components/ui/icon';
import { Payment, CustomField } from '@/types/payment';

const PlannedPayments = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [dictionariesOpen, setDictionariesOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const {
    payments,
    categories,
    legalEntities,
    contractors,
    customerDepartments,
    customFields,
    services,
    loading,
    loadPayments,
    loadCategories,
    loadLegalEntities,
    loadContractors,
    loadCustomerDepartments,
    loadCustomFields,
    loadServices,
  } = usePlannedPaymentsData();

  const handleFormOpen = () => {
    loadCategories();
    loadLegalEntities();
    loadContractors();
    loadCustomerDepartments();
    loadCustomFields();
    loadServices();
  };

  const {
    dialogOpen,
    setDialogOpen,
    formData,
    setFormData,
    handleSubmit,
  } = usePlannedPaymentForm(customFields, loadPayments);

  const {
    menuOpen,
    setMenuOpen,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSidebarTouch();

  const handleConvertToPayment = async (paymentId: number) => {
    try {
      const response = await fetch('https://functions.poehali.dev/a0000b1e-3d3e-4094-b08e-2893df500d3f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || '',
        },
        body: JSON.stringify({ action: 'convert', payment_id: paymentId }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Платёж создан из запланированного',
        });
        loadPayments();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось конвертировать платёж',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Failed to convert payment:', err);
      toast({
        title: 'Ошибка сети',
        description: 'Проверьте подключение к интернету',
        variant: 'destructive',
      });
    }
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
        <div className="mb-6">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 -ml-2 text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Icon name="Menu" size={24} />
          </button>
        </div>

        <PlannedPaymentForm
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          legalEntities={legalEntities}
          contractors={contractors}
          customerDepartments={customerDepartments}
          customFields={customFields}
          services={services}
          handleSubmit={handleSubmit}
          onDialogOpen={handleFormOpen}
        />

        <PaymentsList 
          payments={payments} 
          loading={loading} 
          onSubmitForApproval={handleConvertToPayment}
          onPaymentClick={setSelectedPayment}
          isPlannedPayments
        />

        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          isPlannedPayment={true}
        />
      </main>
    </div>
  );
};

export default PlannedPayments;