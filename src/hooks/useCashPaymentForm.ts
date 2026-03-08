import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';

interface FormData {
  service_id: string;
  category_id: string;
  subcategory: string;
  contractor_name: string;
  department_id: string;
  amount: string;
  payment_date: string;
  description: string;
  comment: string;
  receipt_file_url: string;
}

const EMPTY_FORM: FormData = {
  service_id: '',
  category_id: '',
  subcategory: '',
  contractor_name: '',
  department_id: '',
  amount: '',
  payment_date: '',
  description: '',
  comment: '',
  receipt_file_url: '',
};

export const useCashPaymentForm = (onSuccess: () => void) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setReceiptFile(null);
      setReceiptPreview(null);
      setFormData(prev => ({ ...prev, receipt_file_url: '' }));
      return;
    }
    setReceiptFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview('pdf');
    }

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const response = await fetch(API_ENDPOINTS.invoiceOcr, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64, fileName: file.name, upload_only: true }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.file_url) {
          setFormData(prev => ({ ...prev, receipt_file_url: data.file_url }));
          toast({ title: 'Чек загружен', description: 'Файл успешно прикреплён' });
        }
      }
    } catch {
      toast({ title: 'Ошибка загрузки', description: 'Не удалось загрузить чек', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.service_id) {
      toast({ title: 'Ошибка', description: 'Выберите сервис', variant: 'destructive' });
      return;
    }
    if (!formData.category_id) {
      toast({ title: 'Ошибка', description: 'Выберите категорию', variant: 'destructive' });
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({ title: 'Ошибка', description: 'Укажите корректную сумму', variant: 'destructive' });
      return;
    }
    if (!formData.payment_date) {
      toast({ title: 'Ошибка', description: 'Укажите дату оплаты', variant: 'destructive' });
      return;
    }
    if (!formData.description) {
      toast({ title: 'Ошибка', description: 'Укажите назначение платежа', variant: 'destructive' });
      return;
    }

    try {
      const createResponse = await fetch(API_ENDPOINTS.paymentsApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
        body: JSON.stringify({
          category_id: parseInt(formData.category_id),
          description: formData.description,
          amount: parseFloat(formData.amount),
          payment_date: formData.payment_date,
          payment_type: 'cash',
          service_id: parseInt(formData.service_id),
          contractor_id: null,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
          comment: formData.comment || null,
          invoice_file_url: formData.receipt_file_url || null,
          subcategory: formData.subcategory || null,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        toast({ title: 'Ошибка', description: error.error || 'Не удалось добавить платёж', variant: 'destructive' });
        return;
      }

      const created = await createResponse.json();
      const paymentId = created.id;

      const submitResponse = await fetch(API_ENDPOINTS.approvalsApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
        body: JSON.stringify({ payment_id: paymentId, action: 'submit' }),
      });

      if (submitResponse.ok) {
        toast({ title: 'Успешно', description: 'Наличный платёж отправлен на согласование' });
        setDialogOpen(false);
        setFormData(EMPTY_FORM);
        setReceiptFile(null);
        setReceiptPreview(null);
        onSuccess();
      } else {
        const error = await submitResponse.json();
        toast({ title: 'Ошибка', description: error.error || 'Не удалось отправить на согласование', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка сети', description: 'Проверьте подключение к интернету', variant: 'destructive' });
    }
  };

  return {
    dialogOpen,
    setDialogOpen,
    formData,
    setFormData,
    receiptFile,
    receiptPreview,
    isUploading,
    handleFileSelect,
    handleSubmit,
  };
};
