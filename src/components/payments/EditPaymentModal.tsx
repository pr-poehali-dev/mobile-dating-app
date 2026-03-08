import { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';
import { API_ENDPOINTS } from '@/config/api';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';

interface Payment {
  id: number;
  category_id: number;
  category_name: string;
  category_icon: string;
  description: string;
  amount: number;
  payment_date: string;
  legal_entity_id?: number;
  legal_entity_name?: string;
  status?: string;
  service_id?: number;
  service_name?: string;
  contractor_id?: number;
  contractor_name?: string;
  department_id?: number;
  department_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  custom_fields?: Array<{
    id: number;
    name: string;
    field_type: string;
    value: string;
  }>;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface LegalEntity {
  id: number;
  name: string;
}

interface Contractor {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  category_id?: number;
}

interface CustomField {
  id: number;
  name: string;
  field_type: string;
  options: string;
}

interface EditPaymentModalProps {
  payment: Payment | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditPaymentModal = ({ payment, onClose, onSuccess }: EditPaymentModalProps) => {
  const [formData, setFormData] = useState<Record<string, string | undefined>>({
    category_id: '',
    description: '',
    amount: '',
    payment_date: '',
    legal_entity_id: '',
    service_id: '',
    contractor_id: '',
    department_id: '',
    invoice_number: '',
    invoice_date: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      loadDictionaries();
      populateFormData();
    }
  }, [payment]);

  const populateFormData = () => {
    if (!payment) return;
    
    const data: Record<string, string | undefined> = {
      category_id: payment.category_id?.toString() || '',
      description: payment.description || '',
      amount: payment.amount?.toString() || '',
      payment_date: payment.payment_date || '',
      legal_entity_id: payment.legal_entity_id?.toString() || '',
      service_id: payment.service_id?.toString() || '',
      contractor_id: payment.contractor_id?.toString() || '',
      department_id: payment.department_id?.toString() || '',
      invoice_number: payment.invoice_number || '',
      invoice_date: payment.invoice_date || '',
    };

    if (payment.custom_fields) {
      payment.custom_fields.forEach(field => {
        data[`custom_field_${field.id}`] = field.value || '';
      });
    }

    setFormData(data);
  };

  const loadDictionaries = async () => {
    try {
      const [categoriesRes, legalEntitiesRes, contractorsRes, departmentsRes, servicesRes, customFieldsRes] = await Promise.all([
        apiFetch(`${API_ENDPOINTS.dictionariesApi}?endpoint=categories`),
        apiFetch(`${API_ENDPOINTS.dictionariesApi}?endpoint=legal-entities`),
        apiFetch(`${API_ENDPOINTS.dictionariesApi}?endpoint=contractors`),
        apiFetch(`${API_ENDPOINTS.dictionariesApi}?endpoint=customer-departments`),
        apiFetch(`${API_ENDPOINTS.dictionariesApi}?endpoint=services`),
        apiFetch(`${API_ENDPOINTS.dictionariesApi}?endpoint=custom-fields`),
      ]);

      const categoriesData = await categoriesRes.json();
      const legalEntitiesData = await legalEntitiesRes.json();
      const contractorsData = await contractorsRes.json();
      const departmentsData = await departmentsRes.json();
      const servicesData = await servicesRes.json();
      const customFieldsData = await customFieldsRes.json();

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setLegalEntities(Array.isArray(legalEntitiesData) ? legalEntitiesData : []);
      setContractors(Array.isArray(contractorsData) ? contractorsData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setCustomFields(Array.isArray(customFieldsData) ? customFieldsData : []);
    } catch (error) {
      console.error('Failed to load dictionaries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;

    setLoading(true);
    try {
      const customFieldsData: Record<string, string> = {};
      Object.keys(formData).forEach(key => {
        if (key.startsWith('custom_field_')) {
          const fieldId = key.replace('custom_field_', '');
          customFieldsData[fieldId] = formData[key] || '';
        }
      });

      await apiFetch(`${API_ENDPOINTS.paymentsApi}`, {
        method: 'PUT',
        body: JSON.stringify({
          payment_id: payment.id,
          category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
          description: formData.description,
          amount: formData.amount ? parseFloat(formData.amount) : undefined,
          payment_date: formData.payment_date,
          legal_entity_id: formData.legal_entity_id ? parseInt(formData.legal_entity_id) : undefined,
          service_id: formData.service_id ? parseInt(formData.service_id) : undefined,
          contractor_id: formData.contractor_id ? parseInt(formData.contractor_id) : undefined,
          department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          custom_fields: customFieldsData,
        }),
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to update payment:', error);
      alert('Не удалось обновить платёж');
    } finally {
      setLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="Edit" size={24} />
            <h2 className="text-xl font-semibold">Редактировать платёж #{payment.id}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_id">Сервис *</Label>
              <SearchableSelect
                options={services.map(s => ({ value: s.id.toString(), label: s.name }))}
                value={formData.service_id || ''}
                onChange={(value) => {
                  const service = services.find(s => s.id.toString() === value);
                  setFormData(prev => ({
                    ...prev,
                    service_id: value,
                    category_id: service?.category_id?.toString() || prev.category_id,
                  }));
                }}
                placeholder="Выберите сервис"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Категория *</Label>
              <SearchableSelect
                options={categories.map(c => ({ value: c.id.toString(), label: c.name }))}
                value={formData.category_id || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                placeholder="Выберите категорию"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_entity_id">Юридическое лицо</Label>
              <SearchableSelect
                options={legalEntities.map(le => ({ value: le.id.toString(), label: le.name }))}
                value={formData.legal_entity_id || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, legal_entity_id: value }))}
                placeholder="Выберите юр. лицо"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractor_id">Контрагент</Label>
              <SearchableSelect
                options={contractors.map(c => ({ value: c.id.toString(), label: c.name }))}
                value={formData.contractor_id || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, contractor_id: value }))}
                placeholder="Выберите контрагента"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department_id">Отдел-заказчик</Label>
              <SearchableSelect
                options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
                value={formData.department_id || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
                placeholder="Выберите отдел"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Сумма *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_number">Номер счёта</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                placeholder="Введите номер"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_date">Дата счёта</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="payment_date">Дата платежа *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание (назначение платежа) *</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Введите описание"
              required
            />
          </div>

          {customFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Дополнительные поля</h3>
              {customFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`custom_field_${field.id}`}>{field.name}</Label>
                  <Input
                    id={`custom_field_${field.id}`}
                    value={formData[`custom_field_${field.id}`] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [`custom_field_${field.id}`]: e.target.value }))}
                    placeholder={`Введите ${field.name.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 text-white hover:bg-white/10 font-medium transition-colors"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 font-medium transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPaymentModal;