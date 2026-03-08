import { useEffect, useState } from 'react';
import { useSidebarTouch } from '@/hooks/useSidebarTouch';
import { useCrudPage } from '@/hooks/useCrudPage';
import PaymentsSidebar from '@/components/payments/PaymentsSidebar';
import ContractorForm from '@/components/contractors/ContractorForm';
import ContractorsList from '@/components/contractors/ContractorsList';

interface Contractor {
  id: number;
  name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legal_address: string;
  actual_address: string;
  phone: string;
  email: string;
  contact_person: string;
  bank_name: string;
  bank_bik: string;
  bank_account: string;
  correspondent_account: string;
  notes: string;
  is_active: boolean;
  created_at: string;
}

const Contractors = () => {
  const [dictionariesOpen, setDictionariesOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    menuOpen,
    setMenuOpen,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSidebarTouch();

  const {
    items: contractors,
    loading,
    dialogOpen,
    setDialogOpen,
    editingItem: editingContractor,
    formData,
    setFormData,
    loadData: loadContractors,
    handleEdit,
    handleSubmit: handleSubmitBase,
    handleDelete: handleDeleteBase,
  } = useCrudPage<Contractor>({
    endpoint: 'contractors',
    baseApi: 'dictionariesApi',
    initialFormData: {
      name: '',
      inn: '',
      kpp: '',
      ogrn: '',
      legal_address: '',
      actual_address: '',
      phone: '',
      email: '',
      contact_person: '',
      bank_name: '',
      bank_bik: '',
      bank_account: '',
      correspondent_account: '',
      notes: '',
      is_active: true,
    },
  });

  useEffect(() => {
    loadContractors();
  }, [loadContractors]);

  const handleSubmit = async (e: React.FormEvent) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await handleSubmitBase(e);
    } catch (err) {
      console.error('Failed to save contractor:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого контрагента?')) return;
    
    try {
      await handleDeleteBase(id);
    } catch (err) {
      console.error('Failed to delete contractor:', err);
      alert('Ошибка при удалении контрагента');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setFormData({
        name: '',
        inn: '',
        kpp: '',
        ogrn: '',
        legal_address: '',
        actual_address: '',
        phone: '',
        email: '',
        contact_person: '',
        bank_name: '',
        bank_bik: '',
        bank_account: '',
        correspondent_account: '',
        notes: '',
        is_active: true,
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
        <ContractorForm
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          editingContractor={editingContractor}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          handleDialogClose={handleDialogClose}
          isSubmitting={isSubmitting}
        />

        <ContractorsList
          contractors={contractors}
          loading={loading}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      </main>
    </div>
  );
};

export default Contractors;