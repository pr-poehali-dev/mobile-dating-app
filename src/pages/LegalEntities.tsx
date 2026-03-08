import { useEffect, useState } from 'react';
import { useSidebarTouch } from '@/hooks/useSidebarTouch';
import { useCrudPage } from '@/hooks/useCrudPage';
import PaymentsSidebar from '@/components/payments/PaymentsSidebar';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface LegalEntity {
  id: number;
  name: string;
  inn: string;
  kpp: string;
  address: string;
  postal_code?: string;
  city?: string;
  created_at?: string;
}

const LegalEntities = () => {
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
    items: entities,
    loading,
    dialogOpen,
    setDialogOpen,
    editingItem: editingEntity,
    formData,
    setFormData,
    loadData: loadEntities,
    handleEdit,
    handleSubmit,
    handleDelete: handleDeleteBase,
    openDialog,
  } = useCrudPage<LegalEntity>({
    endpoint: 'legal-entities',
    initialFormData: { 
      name: '', 
      inn: '', 
      kpp: '', 
      address: '', 
      postal_code: '',
      city: '' 
    },
  });

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить это юридическое лицо?')) return;

    try {
      await handleDeleteBase(id);
    } catch (err) {
      alert('Ошибка при удалении юридического лица');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setFormData({ name: '', inn: '', kpp: '', address: '', postal_code: '', city: '' });
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
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Юридические лица</h1>
            <p className="text-sm md:text-base text-muted-foreground">Управление юридическими лицами и их данными</p>
          </div>
          {hasPermission('legal_entities', 'create') && (
            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
                  <Icon name="Plus" size={18} />
                  <span className="sm:inline">Добавить юридическое лицо</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingEntity ? 'Редактировать юридическое лицо' : 'Новое юридическое лицо'}
                </DialogTitle>
                <DialogDescription>
                  {editingEntity 
                    ? 'Измените данные юридического лица' 
                    : 'Добавьте новое юридическое лицо'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ООО &quot;Название&quot;"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inn">ИНН</Label>
                  <Input
                    id="inn"
                    value={formData.inn}
                    onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                    placeholder="1234567890"
                    maxLength={12}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kpp">КПП</Label>
                  <Input
                    id="kpp"
                    value={formData.kpp}
                    onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Индекс</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="123456"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Адрес</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Юридический адрес"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingEntity ? 'Сохранить' : 'Добавить'}
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
            ) : entities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Нет юридических лиц. Добавьте первое юридическое лицо для начала работы.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.map((entity) => (
                  <div
                    key={entity.id}
                    className="border border-primary/25 rounded-lg p-4 hover:border-primary/50 hover:bg-primary/[0.03] transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon name="Building2" size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{entity.name}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground mb-4">
                      {entity.inn && <div>ИНН: {entity.inn}</div>}
                      {entity.kpp && <div>КПП: {entity.kpp}</div>}
                      {entity.postal_code && <div>Индекс: {entity.postal_code}</div>}
                      {entity.address && <div className="line-clamp-2">{entity.address}</div>}
                    </div>
                    {(hasPermission('legal_entities', 'update') || hasPermission('legal_entities', 'delete')) && (
                      <div className="flex gap-2">
                        {hasPermission('legal_entities', 'update') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(entity)}
                            className="flex-1"
                          >
                            <Icon name="Pencil" size={16} />
                            <span className="ml-2">Изменить</span>
                          </Button>
                        )}
                        {hasPermission('legal_entities', 'delete') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(entity.id)}
                            className="flex-1 text-red-400 hover:text-red-300"
                          >
                            <Icon name="Trash2" size={16} />
                            <span className="ml-2">Удалить</span>
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

export default LegalEntities;