import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface RoleCardProps {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (id: number) => void;
  getResourceColor: (resource: string) => string;
}

const RoleCard = ({ role, onEdit, onDelete, getResourceColor }: RoleCardProps) => {
  return (
    <Card className="border-white/5 bg-card shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{role.name}</h3>
            <p className="text-sm text-muted-foreground">{role.description}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Icon name="Shield" size={24} />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
          <Icon name="Users" size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {role.user_count} {role.user_count === 1 ? 'пользователь' : 'пользователей'}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            Разрешения ({role.permissions?.length || 0})
          </h4>
          <div className="flex flex-wrap gap-2">
            {role.permissions?.slice(0, 6).map((perm) => (
              <div
                key={perm.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getResourceColor(perm.resource)}`}
              >
                {perm.name}
              </div>
            ))}
            {role.permissions && role.permissions.length > 6 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 bg-gray-500/10">
                +{role.permissions.length - 6} ещё
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(role)}
            className="flex-1 gap-2"
          >
            <Icon name="Pencil" size={16} />
            Изменить
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(role.id)}
            className="flex-1 gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <Icon name="Trash2" size={16} />
            Удалить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleCard;
