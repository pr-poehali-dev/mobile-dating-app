import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ServiceBalance {
  id: number;
  service_name: string;
  balance: number;
  currency: string;
  status: 'ok' | 'warning' | 'critical';
  last_updated: string;
  api_endpoint?: string;
  threshold_warning?: number;
  threshold_critical?: number;
  description?: string;
}

interface EditForm {
  service_name: string;
  description: string;
  threshold_warning: number;
  threshold_critical: number;
}

interface ServiceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingService: ServiceBalance | null;
  editForm: EditForm;
  setEditForm: (form: EditForm) => void;
  onSave: () => void;
  saving: boolean;
}

const ServiceEditDialog = ({
  open,
  onOpenChange,
  editingService,
  editForm,
  setEditForm,
  onSave,
  saving,
}: ServiceEditDialogProps) => {
  if (!editingService) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1535] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Настройки сервиса</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="service_name">Название</Label>
            <Input
              id="service_name"
              value={editForm.service_name}
              onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Добавьте описание для этого сервиса..."
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="threshold_warning">Порог предупреждения</Label>
              <Input
                id="threshold_warning"
                type="number"
                value={editForm.threshold_warning}
                onChange={(e) => setEditForm({ ...editForm, threshold_warning: Number(e.target.value) })}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-yellow-500 mt-1">Покажет предупреждение</p>
            </div>

            <div>
              <Label htmlFor="threshold_critical">Критический порог</Label>
              <Input
                id="threshold_critical"
                type="number"
                value={editForm.threshold_critical}
                onChange={(e) => setEditForm({ ...editForm, threshold_critical: Number(e.target.value) })}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-red-500 mt-1">Покажет критическую ошибку</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              onClick={onSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" className="mr-2 h-4 w-4" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceEditDialog;
