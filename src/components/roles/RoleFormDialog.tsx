import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions?: Permission[];
  user_count: number;
}

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole: Role | null;
  formData: {
    name: string;
    description: string;
    permission_ids: number[];
  };
  setFormData: (data: RoleFormDialogProps['formData']) => void;
  permissions: Permission[];
  onSubmit: (e: React.FormEvent) => void;
  togglePermission: (permId: number) => void;
  getResourceIcon: (resource: string) => string;
  getResourceColor: (resource: string) => string;
  getResourceName: (resource: string) => string;
}

const RoleFormDialog = ({
  open,
  onOpenChange,
  editingRole,
  formData,
  setFormData,
  permissions,
  onSubmit,
  togglePermission,
  getResourceIcon,
  getResourceColor,
  getResourceName,
}: RoleFormDialogProps) => {
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRole ? 'Редактировать роль' : 'Новая роль'}</DialogTitle>
          <DialogDescription>
            {editingRole ? 'Измените настройки роли и права доступа' : 'Создайте новую роль и назначьте права доступа'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название роли *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Администратор"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Полный доступ ко всем функциям"
            />
          </div>

          <div className="space-y-3 border-t border-white/10 pt-4">
            <h4 className="text-sm font-semibold">Права доступа</h4>
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${getResourceColor(resource)}`}>
                    <Icon name={getResourceIcon(resource)} size={14} />
                  </div>
                  <h5 className="text-sm font-medium">{getResourceName(resource)}</h5>
                </div>
                <div className="ml-8 space-y-2">
                  {perms.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`perm-${perm.id}`}
                        checked={formData.permission_ids.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <Label htmlFor={`perm-${perm.id}`} className="text-sm cursor-pointer">
                        {perm.description}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full">
            {editingRole ? 'Сохранить изменения' : 'Создать роль'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleFormDialog;