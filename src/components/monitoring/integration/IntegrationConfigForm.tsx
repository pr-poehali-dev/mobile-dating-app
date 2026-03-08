import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import type { ServiceTemplate } from './serviceTemplates';

interface IntegrationConfigFormProps {
  selectedService: ServiceTemplate;
  formData: {
    service_name: string;
    description: string;
    threshold_warning: number;
    threshold_critical: number;
    credentials: Record<string, string>;
  };
  setFormData: (data: IntegrationConfigFormProps['formData']) => void;
  onBack: () => void;
  onTest: () => void;
  onSubmit: () => void;
  isFormValid: () => boolean;
  adding: boolean;
  testing: boolean;
  testResult: {
    success: boolean;
    message: string;
  } | null;
}

const IntegrationConfigForm = ({
  selectedService,
  formData,
  setFormData,
  onBack,
  onTest,
  onSubmit,
  isFormValid,
  adding,
  testing,
  testResult,
}: IntegrationConfigFormProps) => {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="service_name" className="text-white">
          Название в системе
        </Label>
        <Input
          id="service_name"
          value={formData.service_name}
          onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
          placeholder="Например: Timeweb Cloud (основной)"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">
          Описание (необязательно)
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Краткое описание"
          className="bg-white/5 border-white/10 text-white min-h-[60px]"
        />
      </div>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <h4 className="text-sm font-medium text-white">Данные для подключения</h4>
        
        {selectedService.fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-white">
              {field.label}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              value={formData.credentials[field.name] || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    [field.name]: e.target.value,
                  },
                })
              }
              placeholder={field.placeholder}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
        <div className="space-y-2">
          <Label htmlFor="threshold_warning" className="text-white">
            Порог предупреждения
          </Label>
          <Input
            id="threshold_warning"
            type="number"
            value={formData.threshold_warning}
            onChange={(e) =>
              setFormData({ ...formData, threshold_warning: parseFloat(e.target.value) || 0 })
            }
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="threshold_critical" className="text-white">
            Критический порог
          </Label>
          <Input
            id="threshold_critical"
            type="number"
            value={formData.threshold_critical}
            onChange={(e) =>
              setFormData({ ...formData, threshold_critical: parseFloat(e.target.value) || 0 })
            }
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      {testResult && (
        <div className={`p-3 rounded-lg border ${testResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <div className="flex items-start gap-2">
            <Icon name={testResult.success ? 'CheckCircle2' : 'XCircle'} size={16} className="mt-0.5 shrink-0" />
            <span className="text-sm">{testResult.message}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={adding || testing}
          className="border-white/10 text-white hover:bg-white/5"
        >
          Назад
        </Button>
        <Button
          variant="outline"
          onClick={onTest}
          disabled={!isFormValid() || testing || adding}
          className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
        >
          {testing ? (
            <>
              <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
              Проверка...
            </>
          ) : (
            <>
              <Icon name="Zap" className="mr-2 h-4 w-4" />
              Тест
            </>
          )}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!isFormValid() || adding || testing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {adding ? (
            <>
              <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
              Добавление...
            </>
          ) : (
            'Добавить'
          )}
        </Button>
      </div>
    </div>
  );
};

export default IntegrationConfigForm;