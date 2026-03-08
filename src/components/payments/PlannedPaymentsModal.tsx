import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePlannedPaymentsData } from '@/hooks/usePlannedPaymentsData';
import { usePlannedPaymentForm } from '@/hooks/usePlannedPaymentForm';
import PlannedPaymentForm from '@/components/payments/PlannedPaymentForm';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';

interface PlannedPayment {
  id: number;
  category_id: number;
  category_name: string;
  category_icon: string;
  description: string;
  amount: number;
  planned_date: string;
  legal_entity_id?: number;
  legal_entity_name?: string;
  contractor_id?: number;
  department_id?: number;
  service_id?: number;
  invoice_number?: string;
  invoice_date?: string;
  recurrence_type?: string;
  recurrence_end_date?: string;
}

const recurrenceLabel: Record<string, string> = {
  once: 'Однократно',
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  monthly: 'Ежемесячно',
  yearly: 'Ежегодно',
};

const PlannedPaymentsModal = () => {
  const { hasPermission, token } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlannedPayment | null>(null);
  const [editTarget, setEditTarget] = useState<PlannedPayment | null>(null);

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

  const {
    dialogOpen: createOpen,
    setDialogOpen: setCreateOpen,
    formData,
    setFormData,
    handleSubmit,
  } = usePlannedPaymentForm(customFields, loadPayments);

  const loadDicts = () => {
    loadCategories();
    loadLegalEntities();
    loadContractors();
    loadCustomerDepartments();
    loadCustomFields();
    loadServices();
  };

  const handleOpen = () => {
    loadDicts();
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`${API_ENDPOINTS.main}?endpoint=planned-payments&id=${deleteTarget.id}`, {
      method: 'DELETE',
      headers: { 'X-Auth-Token': token! },
    });
    if (res.ok) {
      toast({ title: 'Удалено', description: 'Запланированный платёж удалён' });
      loadPayments();
    } else {
      const err = await res.json();
      toast({ title: 'Ошибка', description: err.error || 'Не удалось удалить', variant: 'destructive' });
    }
    setDeleteTarget(null);
  };

  const handleEditOpen = (p: PlannedPayment) => {
    loadDicts();
    setEditTarget(p);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    const body = {
      category_id: editTarget.category_id,
      amount: editTarget.amount,
      description: editTarget.description,
      planned_date: editTarget.planned_date,
      legal_entity_id: editTarget.legal_entity_id || null,
      contractor_id: editTarget.contractor_id || null,
      department_id: editTarget.department_id || null,
      service_id: editTarget.service_id || null,
      invoice_number: editTarget.invoice_number || null,
      invoice_date: editTarget.invoice_date || null,
      recurrence_type: editTarget.recurrence_type || 'once',
      recurrence_end_date: editTarget.recurrence_end_date || null,
    };

    const res = await fetch(`${API_ENDPOINTS.main}?endpoint=planned-payments&id=${editTarget.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token! },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast({ title: 'Сохранено', description: 'Платёж обновлён' });
      loadPayments();
      setEditTarget(null);
    } else {
      const err = await res.json();
      toast({ title: 'Ошибка', description: err.error || 'Не удалось сохранить', variant: 'destructive' });
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (!hasPermission('payments', 'create')) return null;

  return (
    <>
      <Button
        onClick={handleOpen}
        className="bg-blue-500 hover:bg-blue-600 gap-2 w-full sm:w-auto"
      >
        <Icon name="CalendarClock" size={18} />
        <span>Запланированные платежи</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2">
                <Icon name="CalendarClock" size={22} />
                Запланированные платежи
              </DialogTitle>
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 gap-1.5 shrink-0"
                onClick={() => { loadDicts(); setCreateOpen(true); }}
              >
                <Icon name="Plus" size={15} />
                Создать
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                Загрузка...
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <Icon name="CalendarOff" size={40} className="opacity-30" />
                <p className="text-sm">Нет запланированных платежей</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 mt-1"
                  onClick={() => { loadDicts(); setCreateOpen(true); }}
                >
                  <Icon name="Plus" size={15} />
                  Создать первый
                </Button>
              </div>
            ) : (
              payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-3 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Icon name={p.category_icon || 'Calendar'} size={16} className="text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{p.category_name}</span>
                        {p.recurrence_type && p.recurrence_type !== 'once' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                            {recurrenceLabel[p.recurrence_type] ?? p.recurrence_type}
                          </span>
                        )}
                        {p.legal_entity_name && (
                          <span className="text-xs text-muted-foreground truncate">{p.legal_entity_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="text-right mr-2">
                      <p className="text-sm font-semibold text-white">{formatAmount(p.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(p.planned_date)}</p>
                    </div>
                    <button
                      onClick={() => handleEditOpen(p as PlannedPayment)}
                      className="p-1.5 rounded hover:bg-blue-500/20 text-muted-foreground hover:text-blue-400 transition-colors"
                      title="Редактировать"
                    >
                      <Icon name="Pencil" size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p as PlannedPayment)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Удалить"
                    >
                      <Icon name="Trash2" size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="Pencil" size={20} />
                Редактировать платёж
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Категория *</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editTarget.category_id}
                    onChange={(e) => setEditTarget({ ...editTarget, category_id: Number(e.target.value) })}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Сумма (₽) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editTarget.amount}
                    onChange={(e) => setEditTarget({ ...editTarget, amount: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Назначение *</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editTarget.description}
                  onChange={(e) => setEditTarget({ ...editTarget, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Дата платежа *</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editTarget.planned_date?.slice(0, 10) || ''}
                    onChange={(e) => setEditTarget({ ...editTarget, planned_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Юридическое лицо</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editTarget.legal_entity_id || ''}
                    onChange={(e) => setEditTarget({ ...editTarget, legal_entity_id: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">Не выбрано</option>
                    {legalEntities.map((le) => (
                      <option key={le.id} value={le.id}>{le.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-4">
                <div className="flex items-center gap-2">
                  <Icon name="Repeat" size={16} className="text-blue-400" />
                  <span className="text-sm text-blue-200 font-medium">Настройки повторения</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Тип повторения</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editTarget.recurrence_type || 'once'}
                      onChange={(e) => setEditTarget({ ...editTarget, recurrence_type: e.target.value })}
                    >
                      <option value="once">Однократно</option>
                      <option value="daily">Ежедневно</option>
                      <option value="weekly">Еженедельно</option>
                      <option value="monthly">Ежемесячно</option>
                      <option value="yearly">Ежегодно</option>
                    </select>
                  </div>
                  {editTarget.recurrence_type && editTarget.recurrence_type !== 'once' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Дата окончания</label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editTarget.recurrence_end_date?.slice(0, 10) || ''}
                        onChange={(e) => setEditTarget({ ...editTarget, recurrence_end_date: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                  Отмена
                </Button>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                  Сохранить
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить платёж?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.description}» будет удалён безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlannedPaymentForm
        dialogOpen={createOpen}
        setDialogOpen={setCreateOpen}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        legalEntities={legalEntities}
        contractors={contractors}
        customerDepartments={customerDepartments}
        customFields={customFields}
        services={services}
        handleSubmit={handleSubmit}
      />
    </>
  );
};

export default PlannedPaymentsModal;
