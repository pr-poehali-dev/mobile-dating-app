import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarTouch } from '@/hooks/useSidebarTouch';
import { useCrudPage } from '@/hooks/useCrudPage';
import PaymentsSidebar from '@/components/payments/PaymentsSidebar';
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

interface SavingReason {
  id: number;
  name: string;
  icon: string;
  created_at?: string;
}

const availableIcons = [
  'TrendingDown', 'Zap', 'Target', 'Award', 'ThumbsUp', 'CheckCircle', 
  'DollarSign', 'Percent', 'ArrowDown', 'PiggyBank', 'Sparkles', 'Star'
];

const SavingReasons = () => {
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
    items: reasons,
    loading,
    dialogOpen,
    setDialogOpen,
    editingItem: editingReason,
    formData,
    setFormData,
    loadData: loadReasons,
    handleEdit,
    handleSubmit,
    handleDelete: handleDeleteBase,
    openDialog,
  } = useCrudPage<SavingReason>({
    endpoint: 'saving-reasons',
    initialFormData: { name: '', icon: 'Target' },
  });

  useEffect(() => {
    loadReasons();
  }, [loadReasons]);

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту причину экономии?')) return;

    try {
      await handleDeleteBase(id);
    } catch (err) {
      alert('Не удалось удалить причину экономии');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setFormData({ name: '', icon: 'Target' });
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
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Причины экономии</h1>
            <p className="text-sm md:text-base text-muted-foreground">Управление причинами для классификации сэкономленных средств</p>
          </div>
          {hasPermission('saving_reasons', 'create') && (
            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
                  <Icon name="Plus" size={18} />
                  <span className="sm:inline">Добавить причину</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingReason ? 'Редактировать причину' : 'Новая причина экономии'}
                </DialogTitle>
                <DialogDescription>
                  {editingReason 
                    ? 'Измените данные причины экономии' 
                    : 'Добавьте новую причину экономии'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Название причины"
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
                      {availableIcons.map(icon => (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            <Icon name={icon} size={16} />
                            <span>{icon}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingReason ? 'Сохранить' : 'Добавить'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Загрузка...
              </div>
            ) : reasons.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Нет причин экономии. Добавьте первую причину.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 md:p-6">
                {reasons.map(reason => (
                  <div
                    key={reason.id}
                    className="p-4 md:p-5 rounded-[15px] bg-card border border-white/10 hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-[12px] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <Icon name={reason.icon} size={20} className="text-primary" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(reason)}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Icon name="Pencil" size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reason.id)}
                          className="h-8 w-8 p-0 hover:bg-red-500/10 text-red-500"
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-base md:text-lg mb-1">{reason.name}</h3>
                    {reason.created_at && (
                      <p className="text-xs text-muted-foreground">
                        Создано: {new Date(reason.created_at).toLocaleDateString('ru-RU')}
                      </p>
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

export default SavingReasons;