import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import InvoiceUpload from './InvoiceUpload';
import SearchableSelect from '@/components/ui/searchable-select';
import FUNC2URL from '@/../backend/func2url.json';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface LegalEntity {
  id: number;
  name: string;
  inn: string;
  kpp: string;
  address: string;
}

interface CustomField {
  id: number;
  name: string;
  field_type: string;
  options: string;
}

interface Contractor {
  id: number;
  name: string;
  inn: string;
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
  intermediate_approver_id: number;
  final_approver_id: number;
  category_id?: number;
  category_name?: string;
  category_icon?: string;
  legal_entity_id?: number;
  contractor_id?: number;
  customer_department_id?: number;
}

interface PaymentFormProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  formData: Record<string, string | undefined>;
  setFormData: (data: Record<string, string | undefined>) => void;
  categories: Category[];
  legalEntities: LegalEntity[];
  contractors: Contractor[];
  customerDepartments: CustomerDepartment[];
  customFields: CustomField[];
  services: Service[];
  handleSubmit: (e: React.FormEvent) => void;
  invoicePreview: string | null;
  isProcessingInvoice: boolean;
  handleFileSelect: (file: File | null) => void;
  handleExtractData: () => void;
  fileName?: string;
  fileType?: string;
}

const PaymentForm = ({
  dialogOpen,
  setDialogOpen,
  formData,
  setFormData,
  categories,
  legalEntities,
  contractors,
  customerDepartments,
  customFields,
  services,
  handleSubmit,
  invoicePreview,
  isProcessingInvoice,
  handleFileSelect,
  handleExtractData,
  fileName,
  fileType,
}: PaymentFormProps) => {
  const { hasPermission } = useAuth();

  const serviceOptions = services.map((s) => ({
    value: s.id.toString(),
    label: s.name,
    sublabel: s.description || undefined,
  }));

  const categoryOptions = categories.map((c) => ({
    value: c.id.toString(),
    label: c.name,
    icon: c.icon || undefined,
  }));

  const legalEntityOptions = legalEntities.map((e) => ({
    value: e.id.toString(),
    label: e.name,
    sublabel: e.inn ? `ИНН: ${e.inn}` : undefined,
  }));

  const contractorOptions = contractors.map((c) => ({
    value: c.id.toString(),
    label: c.name,
    sublabel: c.inn ? `ИНН: ${c.inn}` : undefined,
  }));

  const departmentOptions = customerDepartments.map((d) => ({
    value: d.id.toString(),
    label: d.name,
    sublabel: d.description || undefined,
  }));

  const resolveServiceDescription = (id?: string) => {
    if (!id) return '';
    const s = services.find(x => x.id.toString() === id);
    return s?.description || '';
  };

  const handleServiceChange = (value: string | undefined) => {
    if (!value) {
      setFormData({ ...formData, service_id: '', service_description: '' });
      return;
    }
    const service = services.find((s) => s.id.toString() === value);
    const updates: Record<string, string | undefined> = {
      ...formData,
      service_id: value || '',
      service_description: service?.description || '',
      description: service?.description || formData.description || '', // Дублируем в назначение платежа
    };
    
    // Автозаполнение связанных полей
    if (service?.category_id) {
      updates.category_id = service.category_id.toString();
    }
    if (service?.legal_entity_id) {
      updates.legal_entity_id = service.legal_entity_id.toString();
    }
    if (service?.contractor_id) {
      updates.contractor_id = service.contractor_id.toString();
    }
    if (service?.customer_department_id) {
      updates.department_id = service.customer_department_id.toString();
    }
    
    setFormData(updates);
  };

  return (
    <>
      {hasPermission('payments', 'create') && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
              <Icon name="Plus" size={18} />
              <span>Добавить платёж</span>
            </Button>
          </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новый платёж</DialogTitle>
            <DialogDescription>
              Загрузите счёт для автозаполнения или выберите данные вручную
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="col-span-2">
              <InvoiceUpload
                onFileSelect={handleFileSelect}
                onExtractData={handleExtractData}
                isProcessing={isProcessingInvoice}
                previewUrl={invoicePreview}
                fileName={fileName}
                fileType={fileType}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Сервис *</Label>
                <SearchableSelect
                  options={serviceOptions}
                  value={formData.service_id || ''}
                  onValueChange={handleServiceChange}
                  placeholder="Выберите сервис"
                  searchPlaceholder="Поиск сервиса..."
                  emptyText="Сервис не найден"
                />
              </div>
              <div className="space-y-2">
                <Label>Категория *</Label>
                <SearchableSelect
                  options={categoryOptions}
                  value={formData.category_id || ''}
                  onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                  placeholder="Выберите категорию"
                  searchPlaceholder="Поиск категории..."
                  emptyText="Категория не найдена"
                />
              </div>
              <div className="space-y-2">
                <Label>Юридическое лицо</Label>
                <SearchableSelect
                  options={legalEntityOptions}
                  value={formData.legal_entity_id || ''}
                  onValueChange={(v) => setFormData({ ...formData, legal_entity_id: v })}
                  placeholder="Выберите юрлицо"
                  searchPlaceholder="Поиск по названию или ИНН..."
                  emptyText="Юрлицо не найдено"
                />
              </div>
              <div className="space-y-2">
                <Label>Контрагент</Label>
                <SearchableSelect
                  options={contractorOptions}
                  value={formData.contractor_id || ''}
                  onValueChange={(v) => setFormData({ ...formData, contractor_id: v })}
                  placeholder="Выберите контрагента"
                  searchPlaceholder="Поиск по названию или ИНН..."
                  emptyText="Контрагент не найден"
                />
              </div>
              <div className="space-y-2">
                <Label>Отдел-заказчик</Label>
                <SearchableSelect
                  options={departmentOptions}
                  value={formData.department_id || ''}
                  onValueChange={(v) => setFormData({ ...formData, department_id: v })}
                  placeholder="Выберите отдел"
                  searchPlaceholder="Поиск отдела..."
                  emptyText="Отдел не найден"
                />
              </div>
              {formData.service_id && (
                <div className="space-y-2">
                  <Label>Описание сервиса</Label>
                  <Input
                    value={resolveServiceDescription(formData.service_id)}
                    readOnly
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                    placeholder="Описание сервиса"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="amount">Сумма *</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="pr-12"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    руб.
                  </span>
                </div>
                {formData.amount && parseFloat(formData.amount) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {parseFloat(formData.amount).toLocaleString('ru-RU', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} руб.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Номер счёта</Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number || ''}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  placeholder="Введите номер счёта"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_date">Дата счёта</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date || ''}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  min="2000-01-01"
                  max="2099-12-31"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Назначение платежа *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание платежа"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Комментарий</Label>
                <Input
                  id="comment"
                  value={formData.comment || ''}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Дополнительная информация"
                />
              </div>
            </div>
            
            {customFields.length > 0 && (
              <div className="border-t border-white/10 pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">Дополнительные поля</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                    <Label htmlFor={`custom_field_${field.id}`}>{field.name}</Label>
                    {field.field_type === 'text' && (
                      <Input
                        id={`custom_field_${field.id}`}
                        value={formData[`custom_field_${field.id}`] || ''}
                        onChange={(e) => setFormData({ ...formData, [`custom_field_${field.id}`]: e.target.value })}
                        placeholder={`Введите ${field.name.toLowerCase()}`}
                      />
                    )}
                    {(field.field_type === 'select' || field.field_type === 'toggle') && (
                      <Input
                        id={`custom_field_${field.id}`}
                        value={formData[`custom_field_${field.id}`] || ''}
                        readOnly
                        className="bg-muted/50 cursor-default"
                        placeholder="Заполнится автоматически"
                      />
                    )}
                    {field.field_type === 'file' && (
                      <div>
                        <Input
                          id={`custom_field_${field.id}`}
                          type="file"
                          accept={field.options ? field.options.split(',').map(ext => `.${ext.trim()}`).join(',') : '*'}
                          className="cursor-pointer file:mr-4 file:py-2.5 file:px-5 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer file:shadow-sm"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            const allowedExtensions = field.options?.split(',').map(ext => ext.trim().toLowerCase()) || [];
                            const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
                            
                            if (allowedExtensions.length > 0 && !allowedExtensions.includes(fileExtension)) {
                              alert(`Недопустимый формат файла. Разрешены: ${field.options}`);
                              e.target.value = '';
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const base64 = (reader.result as string).split(',')[1];
                              
                              try {
                                const response = await fetch(FUNC2URL['invoice-ocr'], {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    file: base64,
                                    fileName: file.name,
                                    contentType: file.type
                                  })
                                });
                                
                                const data = await response.json();
                                if (data.url) {
                                  setFormData({ ...formData, [`custom_field_${field.id}`]: data.url });
                                }
                              } catch (err) {
                                console.error('Upload failed:', err);
                                alert('Ошибка загрузки файла');
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        {formData[`custom_field_${field.id}`] && (
                          <p className="text-xs text-green-500 mt-1">Файл загружен</p>
                        )}
                      </div>
                    )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button type="submit" className="w-full">
              Добавить
            </Button>
          </form>
        </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PaymentForm;