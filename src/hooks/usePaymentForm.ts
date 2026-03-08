import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import * as pdfjsLib from 'pdfjs-dist';
import FUNC2URL from '@/../backend/func2url.json';
import { API_ENDPOINTS } from '@/config/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface CustomFieldDefinition {
  id: number;
  name: string;
  field_type: string;
  options: string;
}

export const usePaymentForm = (customFields: CustomFieldDefinition[], onSuccess: () => void, loadContractors?: () => Promise<unknown>, loadLegalEntities?: () => Promise<unknown>) => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | undefined>>({
    category_id: '',
    description: '',
    amount: '',
    legal_entity_id: '',
    contractor_id: '',
    department_id: '',
    service_id: '',
    invoice_number: '',
    invoice_date: '',
    invoice_file_url: '',
  });

  useEffect(() => {
    const initialData: Record<string, string | undefined> = {
      category_id: '',
      description: '',
      amount: '',
      legal_entity_id: '',
      contractor_id: '',
      department_id: '',
      service_id: '',
      invoice_number: '',
      invoice_date: '',
      invoice_file_url: '',
    };
    customFields.forEach((field) => {
      initialData[`custom_field_${field.id}`] = '';
    });
    setFormData(initialData);
  }, [customFields]);

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setInvoiceFile(null);
      setInvoicePreview(null);
      return;
    }

    setInvoiceFile(file);
    
    if (file.type === 'application/pdf') {
      setInvoicePreview('preview.pdf');
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoicePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Автоматически запускаем распознавание после загрузки
    toast({
      title: 'Файл загружен',
      description: 'Начинаю автоматическое распознавание данных...',
    });
    
    // Небольшая задержка чтобы пользователь увидел превью
    setTimeout(() => {
      handleExtractDataFromFile(file);
    }, 500);
  };

  const convertPdfToImage = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Canvas context not available');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    
    return canvas.toDataURL('image/png');
  };

  const handleExtractDataFromFile = async (file: File) => {
    setIsProcessingInvoice(true);

    try {
      const isPdf = file.type === 'application/pdf';

      if (!isPdf && !file.type.startsWith('image/')) {
        toast({
          title: 'Неверный формат',
          description: 'Поддерживаются PDF и изображения (JPG, PNG)',
          variant: 'destructive',
        });
        setIsProcessingInvoice(false);
        return;
      }

      toast({
        title: 'Шаг 1: Загрузка файла',
        description: 'Сохраняю документ на сервер...',
      });

      let base64: string;
      if (isPdf) {
        base64 = await convertPdfToImage(file);
      } else {
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      toast({
        title: 'Шаг 2: Анализ документа',
        description: 'Отправляю в Yandex GPT для распознавания...',
      });

      const ocrResponse = await fetch(FUNC2URL['invoice-ocr'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          user_id: user?.id || null,
        }),
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка при обработке документа');
      }

      const ocrData = await ocrResponse.json();
      const fileUrl = ocrData.file_url || '';
      const extracted = ocrData.extracted_data || {};
      console.log('GPT result:', { extracted, gpt_raw: ocrData.gpt_raw, warning: ocrData.warning });

      const updates: Record<string, string | undefined> = {};

      if (fileUrl) {
        updates.invoice_file_url = fileUrl;
      }

      if (ocrData.warning && !ocrData.extracted_data) {
        toast({
          title: 'Файл загружен',
          description: ocrData.warning,
          variant: 'destructive',
        });
        setFormData(prev => ({ ...prev, ...updates }));
        return;
      }

      if (extracted.amount) {
        const cleaned = extracted.amount.toString().replace(/\s/g, '').replace(',', '.');
        updates.amount = cleaned;
      }

      if (extracted.invoice_number) {
        updates.invoice_number = extracted.invoice_number;
      }

      if (extracted.invoice_date) {
        updates.invoice_date = extracted.invoice_date;
      }

      if (extracted.description) updates.description = extracted.description;
      if (extracted.service_id) updates.service_id = extracted.service_id.toString();
      if (extracted.category_id) updates.category_id = extracted.category_id.toString();
      if (extracted.department_id) updates.department_id = extracted.department_id.toString();
      if (extracted.legal_entity_id) {
        updates.legal_entity_id = extracted.legal_entity_id.toString();
      }

      if (extracted.contractor_id) {
        updates.contractor_id = extracted.contractor_id.toString();
      } else if (extracted.contractor_name) {
        try {
          const res = await fetch(`${FUNC2URL['main']}?endpoint=contractors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
            body: JSON.stringify({ name: extracted.contractor_name, inn: extracted.contractor_inn || '' }),
          });
          if (res.ok) {
            const nc = await res.json();
            updates.contractor_id = nc.id?.toString();
            if (loadContractors) await loadContractors();
          }
        } catch (err) {
          console.error('Auto-create contractor failed:', err);
        }
      }

      if (!extracted.legal_entity_id && extracted.legal_entity_name) {
        try {
          const res = await fetch(`${FUNC2URL['main']}?endpoint=legal-entities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
            body: JSON.stringify({ name: extracted.legal_entity_name, inn: extracted.legal_entity_inn || '' }),
          });
          if (res.ok) {
            const nle = await res.json();
            updates.legal_entity_id = nle.id?.toString();
            if (loadLegalEntities) await loadLegalEntities();
          }
        } catch (err) {
          console.error('Auto-create legal entity failed:', err);
        }
      }

      setFormData(prev => ({ ...prev, ...updates }));

      toast({
        title: 'Шаг 3: Данные сохранены',
        description: 'Все поля автоматически заполнены из счёта',
      });
    } catch (err) {
      console.error('Failed to process invoice:', err);
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось распознать счёт',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingInvoice(false);
    }
  };

  const handleExtractData = async () => {
    if (!invoiceFile) return;
    await handleExtractDataFromFile(invoiceFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_id) {
      toast({
        title: 'Ошибка',
        description: 'Выберите сервис из списка',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.category_id) {
      toast({
        title: 'Ошибка',
        description: 'Выберите категорию из списка',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Укажите корректную сумму',
        variant: 'destructive',
      });
      return;
    }

    if (formData.invoice_date) {
      const year = new Date(formData.invoice_date).getFullYear();
      if (year < 2000 || year > 2099) {
        toast({
          title: 'Ошибка',
          description: 'Дата должна быть между 2000 и 2099 годом',
          variant: 'destructive',
        });
        return;
      }
    }
    
    try {
      const customFieldsData: Record<string, string> = {};
      customFields.forEach(field => {
        const value = formData[`custom_field_${field.id}`];
        if (value) {
          customFieldsData[field.id.toString()] = value;
        }
      });

      const response = await fetch(API_ENDPOINTS.paymentsApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || '',
        },
        body: JSON.stringify({
          category_id: formData.category_id ? parseInt(formData.category_id) : 0,
          description: formData.description || '',
          amount: formData.amount ? parseFloat(formData.amount) : 0,
          legal_entity_id: formData.legal_entity_id ? parseInt(formData.legal_entity_id) : null,
          contractor_id: formData.contractor_id ? parseInt(formData.contractor_id) : null,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
          service_id: formData.service_id ? parseInt(formData.service_id) : null,
          invoice_number: formData.invoice_number || null,
          invoice_date: formData.invoice_date || null,
          invoice_file_url: formData.invoice_file_url || null,
          custom_fields: customFieldsData,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Платёж добавлен',
        });
        setDialogOpen(false);
        const resetData: Record<string, string | undefined> = {
          category_id: '',
          description: '',
          amount: '',
          legal_entity_id: '',
          contractor_id: '',
          department_id: '',
          service_id: '',
          invoice_number: '',
          invoice_date: '',
          invoice_file_url: '',
        };
        customFields.forEach(field => {
          resetData[`custom_field_${field.id}`] = '';
        });
        setFormData(resetData);
        setInvoiceFile(null);
        setInvoicePreview(null);
        onSuccess();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось добавить платёж',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Failed to add payment:', err);
      toast({
        title: 'Ошибка сети',
        description: 'Проверьте подключение к интернету',
        variant: 'destructive',
      });
    }
  };

  return {
    dialogOpen,
    setDialogOpen,
    formData,
    setFormData,
    handleSubmit,
    invoiceFile,
    invoicePreview,
    isProcessingInvoice,
    handleFileSelect,
    handleExtractData,
    fileName: invoiceFile?.name,
    fileType: invoiceFile?.type,
  };
};