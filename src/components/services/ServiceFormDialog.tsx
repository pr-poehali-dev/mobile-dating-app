import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  full_name: string;
  role: string;
}

interface CustomerDepartment {
  id: number;
  name: string;
  description?: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface LegalEntity {
  id: number;
  name: string;
  inn?: string;
}

interface Contractor {
  id: number;
  name: string;
  inn?: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  intermediate_approver_id: number;
  final_approver_id: number;
  intermediate_approver_name?: string;
  final_approver_name?: string;
  customer_department_id?: number;
  customer_department_name?: string;
  category_id?: number;
  category_name?: string;
  category_icon?: string;
  legal_entity_id?: number;
  legal_entity_name?: string;
  contractor_id?: number;
  contractor_name?: string;
  created_at: string;
}

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingService: Service | null;
  formData: {
    name: string;
    description: string;
    intermediate_approver_id?: string;
    final_approver_id: string;
    customer_department_id: string;
    category_id: string;
    legal_entity_id: string;
    contractor_id: string;
    [key: string]: string | undefined;
  };
  setFormData: (data: ServiceFormDialogProps['formData']) => void;
  users: User[];
  departments: CustomerDepartment[];
  categories: Category[];
  legalEntities: LegalEntity[];
  contractors: Contractor[];
  onSubmit: (e: React.FormEvent) => void;
}

const ServiceFormDialog = ({
  open,
  onOpenChange,
  editingService,
  formData,
  setFormData,
  users,
  departments,
  categories,
  legalEntities,
  contractors,
  onSubmit,
}: ServiceFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingService ? 'Редактировать сервис' : 'Создать сервис'}
          </DialogTitle>
          <DialogDescription>
            Укажите название сервиса и согласующих лиц
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: AWS Cloud Services"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Краткое описание сервиса"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Категория сервиса</Label>
            <Select
              value={formData.category_id || ''}
              onValueChange={(value) =>
                setFormData({ ...formData, category_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Icon name={cat.icon} size={16} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="department">Отдел-заказчик</Label>
            <Select
              value={formData.customer_department_id || ''}
              onValueChange={(value) =>
                setFormData({ ...formData, customer_department_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите отдел" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="final">Согласующее лицо (CEO)</Label>
            <Select
              value={formData.final_approver_id || ''}
              onValueChange={(value) =>
                setFormData({ ...formData, final_approver_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите пользователя" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="legal_entity">Юридическое лицо</Label>
            <Select
              value={formData.legal_entity_id || ''}
              onValueChange={(value) =>
                setFormData({ ...formData, legal_entity_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите юридическое лицо" />
              </SelectTrigger>
              <SelectContent>
                {legalEntities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id.toString()}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contractor">Контрагент</Label>
            <Select
              value={formData.contractor_id || ''}
              onValueChange={(value) =>
                setFormData({ ...formData, contractor_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите контрагента" />
              </SelectTrigger>
              <SelectContent>
                {contractors.map((contractor) => (
                  <SelectItem key={contractor.id} value={contractor.id.toString()}>
                    {contractor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">
              {editingService ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceFormDialog;