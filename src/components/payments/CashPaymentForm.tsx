import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import SearchableSelect from '@/components/ui/searchable-select';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useCashPaymentForm } from '@/hooks/useCashPaymentForm';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface CustomerDepartment {
  id: number;
  name: string;
  description: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
}

interface CashPaymentFormProps {
  categories: Category[];
  customerDepartments: CustomerDepartment[];
  services: Service[];
  onSuccess: () => void;
}

const CashPaymentForm = ({ categories, customerDepartments, services, onSuccess }: CashPaymentFormProps) => {
  const { hasPermission } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    dialogOpen,
    setDialogOpen,
    formData,
    setFormData,
    receiptPreview,
    isUploading,
    handleFileSelect,
    handleSubmit,
  } = useCashPaymentForm(onSuccess);

  const serviceOptions = services.map(s => ({
    value: s.id.toString(),
    label: s.name,
    sublabel: s.description || undefined,
  }));

  const categoryOptions = categories.map(c => ({
    value: c.id.toString(),
    label: c.name,
    icon: c.icon || undefined,
  }));

  const departmentOptions = customerDepartments.map(d => ({
    value: d.id.toString(),
    label: d.name,
    sublabel: d.description || undefined,
  }));

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFileSelect(file);
    e.target.value = '';
  };

  if (!hasPermission('payments', 'create')) return null;

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className="gap-2 w-full sm:w-auto"
        style={{ background: '#01b574', color: '#fff' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#00a066')}
        onMouseLeave={e => (e.currentTarget.style.background = '#01b574')}
      >
        <Icon name="Banknote" size={18} />
        <span>Наличный платёж</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(1,181,116,0.15)' }}>
                <Icon name="Banknote" size={16} style={{ color: '#01b574' }} />
              </div>
              Наличный платёж
            </DialogTitle>
            <DialogDescription>
              Тип оплаты: Наличные — платёж будет отправлен на согласование директору
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Тип операции — readonly */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(1,181,116,0.08)', border: '1px solid rgba(1,181,116,0.25)' }}>
              <Icon name="Banknote" size={15} style={{ color: '#01b574' }} />
              <span className="text-sm font-medium" style={{ color: '#01b574' }}>Тип операции: Наличные</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Сервис */}
              <div className="space-y-2 sm:col-span-2">
                <Label>Сервис *</Label>
                <SearchableSelect
                  options={serviceOptions}
                  value={formData.service_id}
                  onValueChange={v => setFormData({ ...formData, service_id: v ?? '' })}
                  placeholder="Выберите сервис"
                  searchPlaceholder="Поиск сервиса..."
                  emptyText="Сервис не найден"
                />
              </div>

              {/* Категория */}
              <div className="space-y-2">
                <Label>Категория *</Label>
                <SearchableSelect
                  options={categoryOptions}
                  value={formData.category_id}
                  onValueChange={v => setFormData({ ...formData, category_id: v ?? '' })}
                  placeholder="Выберите категорию"
                  searchPlaceholder="Поиск категории..."
                  emptyText="Категория не найдена"
                />
              </div>

              {/* Подкатегория */}
              <div className="space-y-2">
                <Label>Подкатегория</Label>
                <Input
                  value={formData.subcategory}
                  onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="Уточните категорию"
                />
              </div>

              {/* Контрагент */}
              <div className="space-y-2">
                <Label>Контрагент</Label>
                <Input
                  value={formData.contractor_name}
                  onChange={e => setFormData({ ...formData, contractor_name: e.target.value })}
                  placeholder="Название или ФИО"
                />
              </div>

              {/* Отдел-заказчик */}
              <div className="space-y-2">
                <Label>Отдел-заказчик</Label>
                <SearchableSelect
                  options={departmentOptions}
                  value={formData.department_id}
                  onValueChange={v => setFormData({ ...formData, department_id: v ?? '' })}
                  placeholder="Выберите отдел"
                  searchPlaceholder="Поиск отдела..."
                  emptyText="Отдел не найден"
                />
              </div>

              {/* Сумма */}
              <div className="space-y-2">
                <Label>Сумма * (₽)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Дата оплаты */}
              <div className="space-y-2">
                <Label>Дата оплаты *</Label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Назначение */}
            <div className="space-y-2">
              <Label>Основание / Назначение *</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="За что произведена оплата"
                required
              />
            </div>

            {/* Комментарий */}
            <div className="space-y-2">
              <Label>Комментарий</Label>
              <Input
                value={formData.comment}
                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Дополнительные сведения"
              />
            </div>

            {/* Прикрепить чек */}
            <div className="space-y-2">
              <Label>Чек / Документ</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={handleFilePick}
              />
              {receiptPreview ? (
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ border: '1px solid rgba(1,181,116,0.3)', background: 'rgba(1,181,116,0.06)' }}>
                  {receiptPreview === 'pdf' ? (
                    <Icon name="FileText" size={28} style={{ color: '#01b574' }} />
                  ) : (
                    <img src={receiptPreview} alt="чек" className="w-10 h-10 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#01b574' }}>
                      {isUploading ? 'Загружаю...' : 'Чек прикреплён'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFileSelect(null)}
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm transition-colors"
                  style={{ border: '1px dashed rgba(255,255,255,0.15)', color: 'hsl(var(--muted-foreground))' }}
                >
                  <Icon name="Upload" size={16} />
                  Прикрепить чек (JPG, PNG, PDF)
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                style={{ background: '#01b574', color: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#00a066')}
                onMouseLeave={e => (e.currentTarget.style.background = '#01b574')}
              >
                <Icon name="Send" size={16} className="mr-2" />
                Отправить на согласование
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CashPaymentForm;
