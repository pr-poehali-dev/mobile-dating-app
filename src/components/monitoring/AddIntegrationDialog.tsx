import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ServiceTemplatesList from './integration/ServiceTemplatesList';
import IntegrationConfigForm from './integration/IntegrationConfigForm';
import { SERVICE_TEMPLATES, type ServiceTemplate } from './integration/serviceTemplates';

interface AddIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (integration: {
    service_name: string;
    description: string;
    api_endpoint: string;
    api_key_secret_name: string;
    threshold_warning: number;
    threshold_critical: number;
    credentials: Record<string, string>;
  }) => Promise<void>;
}

export default function AddIntegrationDialog({
  open,
  onOpenChange,
  onAdd,
}: AddIntegrationDialogProps) {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedService, setSelectedService] = useState<ServiceTemplate | null>(null);
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    threshold_warning: 0,
    threshold_critical: 0,
    credentials: {} as Record<string, string>,
  });
  const [adding, setAdding] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleServiceSelect = (serviceId: string) => {
    const service = SERVICE_TEMPLATES.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setFormData({
        service_name: service.name,
        description: '',
        threshold_warning: service.default_warning,
        threshold_critical: service.default_critical,
        credentials: {},
      });
      setStep('configure');
    }
  };

  const handleBack = () => {
    setStep('select');
    setSelectedService(null);
    setTestResult(null);
    setFormData({
      service_name: '',
      description: '',
      threshold_warning: 0,
      threshold_critical: 0,
      credentials: {},
    });
  };

  const handleTestConnection = async () => {
    if (!selectedService) return;

    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch('https://functions.poehali.dev/ffd10ecc-7940-4a9a-92f7-e6eea426304d?action=test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_name: formData.service_name,
          api_endpoint: selectedService.api_endpoint,
        }),
      });

      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.success ? result.message : result.error,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Ошибка при тестировании подключения',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService) return;

    try {
      setAdding(true);
      
      await onAdd({
        service_name: formData.service_name,
        description: formData.description,
        api_endpoint: selectedService.api_endpoint,
        threshold_warning: formData.threshold_warning,
        threshold_critical: formData.threshold_critical,
        credentials: formData.credentials,
        api_key_secret_name: selectedService.fields[0].secret_name,
      });

      onOpenChange(false);
      handleBack();
    } catch (error) {
      console.error('Failed to add integration:', error);
    } finally {
      setAdding(false);
    }
  };

  const isFormValid = () => {
    if (!selectedService) return false;
    if (!formData.service_name.trim()) return false;
    
    for (const field of selectedService.fields) {
      if (!formData.credentials[field.name]?.trim()) return false;
    }
    
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0f1535] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {step === 'configure' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2 -ml-2"
              >
                <Icon name="ChevronLeft" size={20} />
              </Button>
            )}
            {step === 'select' ? 'Выберите сервис' : 'Настройка интеграции'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <ServiceTemplatesList onSelect={handleServiceSelect} />
        )}

        {step === 'configure' && selectedService && (
          <IntegrationConfigForm
            selectedService={selectedService}
            formData={formData}
            setFormData={setFormData}
            onBack={handleBack}
            onTest={handleTestConnection}
            onSubmit={handleSubmit}
            isFormValid={isFormValid}
            adding={adding}
            testing={testing}
            testResult={testResult}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}