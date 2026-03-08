import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarTouch } from '@/hooks/useSidebarTouch';
import { useCrudPage } from '@/hooks/useCrudPage';
import PaymentsSidebar from '@/components/payments/PaymentsSidebar';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: number;
  name: string;
  icon: string;
  created_at?: string;
}

const availableIcons = [
  'Server', 'MessageSquare', 'Globe', 'Shield', 'Tag', 'Briefcase', 
  'DollarSign', 'TrendingUp', 'ShoppingCart', 'Zap', 'Coffee', 'Wifi'
];

const Categories = () => {
  const { hasPermission } = useAuth();
  const [dictionariesOpen, setDictionariesOpen] = useState(true);

  const {
    menuOpen,
    setMenuOpen,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSidebarTouch();

  const {
    items: categories,
    loading,
    dialogOpen,
    setDialogOpen,
    editingItem: editingCategory,
    formData,
    setFormData,
    loadData: loadCategories,
    handleEdit,
    handleSubmit,
    handleDelete: handleDeleteBase,
    openDialog,
  } = useCrudPage<Category>({
    endpoint: 'categories',
    initialFormData: { name: '', icon: 'Tag' },
  });

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;

    try {
      await handleDeleteBase(id);
    } catch (err) {
      alert('Не удалось удалить категорию');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setFormData({ name: '', icon: 'Tag' });
    }
  };

  return (
    <div className="flex min-h-screen">
      <PaymentsSidebar
        menuOpen={menuOpen}
        dictionariesOpen={dictionariesOpen}
        setDictionariesOpen={setDictionariesOpen}
        settingsOpen={false}
        setSettingsOpen={() => {}}
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
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 text-foreground hover:bg-muted rounded-lg transition-colors mb-4"
        >
          <Icon name="Menu" size={24} />
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Категории платежей</h1>
            <p className="text-sm md:text-base text-muted-foreground">Управление категориями для классификации расходов</p>
          </div>
          {hasPermission('categories', 'create') && (
            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
                  <Icon name="Plus" size={18} />
                  <span className="sm:inline">Добавить категорию</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? 'Измените данные категории' 
                    : 'Добавьте новую категорию платежей'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Название категории"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Иконка</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIcons.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            <Icon name={icon} size={16} />
                            {icon}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingCategory ? 'Сохранить' : 'Добавить'}
                </Button>
              </form>
            </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="border-white/5 bg-card shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Загрузка...</div>
            ) : categories.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Нет категорий. Добавьте первую категорию для начала работы.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon name={category.icon} size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                        </div>
                      </div>
                    </div>
                    {(hasPermission('categories', 'update') || hasPermission('categories', 'delete')) && (
                      <div className="flex gap-2">
                        {hasPermission('categories', 'update') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            className="flex-1"
                          >
                            <Icon name="Edit" size={14} className="mr-1" />
                            Редактировать
                          </Button>
                        )}
                        {hasPermission('categories', 'delete') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Categories;