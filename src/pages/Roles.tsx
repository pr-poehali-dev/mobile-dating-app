import { useEffect, useState } from 'react';
import { apiFetch } from '@/utils/api';
import { useSidebarTouch } from '@/hooks/useSidebarTouch';
import { useCrudPage } from '@/hooks/useCrudPage';
import PaymentsSidebar from '@/components/payments/PaymentsSidebar';
import RolesHeader from '@/components/roles/RolesHeader';
import RoleFormDialog from '@/components/roles/RoleFormDialog';
import RoleCard from '@/components/roles/RoleCard';
import { API_ENDPOINTS } from '@/config/api';

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

const Roles = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [dictionariesOpen, setDictionariesOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const {
    menuOpen,
    setMenuOpen,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSidebarTouch();

  const {
    items: roles,
    loading,
    dialogOpen,
    setDialogOpen,
    editingItem: editingRole,
    formData,
    setFormData,
    loadData: loadRoles,
    handleEdit: handleEditBase,
    handleSubmit,
    handleDelete: handleDeleteBase,
  } = useCrudPage<Role>({
    endpoint: 'roles',
    initialFormData: {
      name: '',
      description: '',
      permission_ids: [] as number[],
      user_count: 0,
    },
  });

  const loadPermissions = () => {
    apiFetch(`${API_ENDPOINTS.main}?endpoint=permissions`)
      .then(res => res.json())
      .then(data => setPermissions(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load permissions:', err);
        setPermissions([]);
      });
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [loadRoles]);

  const handleEdit = (role: Role) => {
    handleEditBase(role);
    // Override formData to include permission_ids from the role
    setFormData({
      name: role.name,
      description: role.description,
      permission_ids: role.permissions?.map(p => p.id) || [],
      user_count: role.user_count,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту роль?')) return;
    
    try {
      await handleDeleteBase(id);
    } catch (err) {
      console.error('Failed to delete role:', err);
      alert('Ошибка при удалении роли');
    }
  };

  const togglePermission = (permId: number) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter(id => id !== permId)
        : [...prev.permission_ids, permId]
    }));
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'payments':
        return 'CreditCard';
      case 'users':
        return 'Users';
      case 'roles':
        return 'Shield';
      case 'categories':
        return 'Tag';
      case 'legal_entities':
        return 'Building2';
      case 'contractors':
        return 'Briefcase';
      case 'custom_fields':
        return 'Settings';
      case 'customer_departments':
        return 'Building';
      case 'services':
        return 'Package';
      case 'savings':
        return 'TrendingDown';
      case 'saving_reasons':
        return 'Target';
      case 'approvals':
        return 'CheckCircle';
      case 'planned_payments':
        return 'Calendar';
      case 'audit_logs':
        return 'FileText';
      case 'dashboard':
        return 'LayoutDashboard';
      case 'stats':
        return 'BarChart3';
      case 'monitoring':
        return 'Activity';
      default:
        return 'Circle';
    }
  };

  const getResourceColor = (resource: string) => {
    switch (resource) {
      case 'payments':
        return 'text-blue-500 bg-blue-500/10';
      case 'users':
        return 'text-green-500 bg-green-500/10';
      case 'roles':
        return 'text-purple-500 bg-purple-500/10';
      case 'categories':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'legal_entities':
        return 'text-orange-500 bg-orange-500/10';
      case 'contractors':
        return 'text-cyan-500 bg-cyan-500/10';
      case 'custom_fields':
        return 'text-pink-500 bg-pink-500/10';
      case 'customer_departments':
        return 'text-indigo-500 bg-indigo-500/10';
      case 'services':
        return 'text-violet-500 bg-violet-500/10';
      case 'savings':
        return 'text-emerald-500 bg-emerald-500/10';
      case 'saving_reasons':
        return 'text-teal-500 bg-teal-500/10';
      case 'approvals':
        return 'text-lime-500 bg-lime-500/10';
      case 'planned_payments':
        return 'text-sky-500 bg-sky-500/10';
      case 'audit_logs':
        return 'text-slate-500 bg-slate-500/10';
      case 'dashboard':
        return 'text-fuchsia-500 bg-fuchsia-500/10';
      case 'stats':
        return 'text-rose-500 bg-rose-500/10';
      case 'monitoring':
        return 'text-amber-500 bg-amber-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getResourceName = (resource: string) => {
    switch (resource) {
      case 'payments':
        return 'Платежи';
      case 'users':
        return 'Пользователи';
      case 'roles':
        return 'Роли';
      case 'categories':
        return 'Категории';
      case 'legal_entities':
        return 'Юридические лица';
      case 'contractors':
        return 'Контрагенты';
      case 'custom_fields':
        return 'Дополнительные поля';
      case 'customer_departments':
        return 'Отделы-заказчики';
      case 'services':
        return 'Услуги';
      case 'savings':
        return 'Экономии';
      case 'saving_reasons':
        return 'Причины экономии';
      case 'approvals':
        return 'Согласования';
      case 'planned_payments':
        return 'Запланированные платежи';
      case 'audit_logs':
        return 'Журнал аудита';
      case 'dashboard':
        return 'Дашборд';
      case 'stats':
        return 'Статистика';
      case 'monitoring':
        return 'Мониторинг';
      default:
        return resource;
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setFormData({
        name: '',
        description: '',
        permission_ids: [],
        user_count: 0,
      });
    }
  };

  const handleAddClick = () => {
    setDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen">
      <PaymentsSidebar
        menuOpen={menuOpen}
        dictionariesOpen={dictionariesOpen}
        setDictionariesOpen={setDictionariesOpen}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
      />

      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="lg:ml-[250px] p-4 md:p-6 lg:p-[30px] min-h-screen flex-1 overflow-x-hidden max-w-full">
        <RolesHeader
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onAddClick={handleAddClick}
        />

        <RoleFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
          editingRole={editingRole}
          formData={formData}
          setFormData={setFormData}
          permissions={permissions}
          onSubmit={handleSubmit}
          togglePermission={togglePermission}
          getResourceIcon={getResourceIcon}
          getResourceColor={getResourceColor}
          getResourceName={getResourceName}
        />

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Загрузка...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={handleEdit}
                onDelete={handleDelete}
                getResourceColor={getResourceColor}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Roles;