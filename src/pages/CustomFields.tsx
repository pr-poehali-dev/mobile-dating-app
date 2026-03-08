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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CustomField {
  id: number;
  name: string;
  field_type: string;
  options: string;
  created_at?: string;
}

const fieldTypes = [
  { value: 'text', label: 'Текст', icon: 'Type' },
  { value: 'select', label: 'Выбор', icon: 'List' },
  { value: 'file', label: 'Загрузка файла', icon: 'Upload' },
  { value: 'toggle', label: 'Переключатель да/нет', icon: 'ToggleLeft' },
];

const CustomFields = () => {
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
    items: fields,
    loading,
    dialogOpen,
    setDialogOpen,
    editingItem: editingField,
    formData,
    setFormData,
    loadData: loadFields,
    handleEdit,
    handleSubmit,
    handleDelete: handleDeleteBase,
  } = useCrudPage<CustomField>({
    endpoint: 'custom-fields',
    initialFormData: {
      name: '',
      field_type: 'text',
      options: '',
    },
  });

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить это дополнительное поле?')) return;

    try {
      await handleDeleteBase(id);
    } catch (err) {
      console.error('Failed to delete custom field:', err);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setFormData({ name: '', field_type: 'text', options: '' });
    }
  };

  const getFieldTypeLabel = (type: string) => {
    return fieldTypes.find(ft => ft.value === type)?.label || type;
  };

  const getFieldTypeIcon = (type: string) => {
    return fieldTypes.find(ft => ft.value === type)?.icon || 'HelpCircle';
  };

  const needsOptions = formData.field_type === 'select' || formData.field_type === 'toggle';
  const needsFileExtensions = formData.field_type === 'file';

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
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Дополнительные поля</h1>
            <p className="text-sm md:text-base text-muted-foreground">Настройка дополнительных полей для платежей</p>
          </div>
          {hasPermission('custom_fields', 'create') && (
            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
                  <Icon name="Plus" size={18} />
                  <span className="sm:inline">Добавить поле</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingField ? 'Редактировать поле' : 'Новое дополнительное поле'}
                </DialogTitle>
                <DialogDescription>
                  {editingField 
                    ? 'Измените параметры дополнительного поля' 
                    : 'Добавьте новое поле для формы платежа'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название поля *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Например: Номер договора"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_type">Тип поля *</Label>
                  <Select
                    value={formData.field_type}
                    onValueChange={(value) => setFormData({ ...formData, field_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon name={type.icon} size={16} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {needsOptions && (
                  <div className="space-y-2">
                    <Label htmlFor="options">
                      {formData.field_type === 'select' ? 'Варианты выбора' : 'Варианты переключения'}
                    </Label>
                    <Textarea
                      id="options"
                      value={formData.options}
                      onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                      placeholder={
                        formData.field_type === 'select' 
                          ? 'Каждый вариант с новой строки:\nВариант 1\nВариант 2\nВариант 3'
                          : 'Введите два значения через новую строку:\nДа\nНет'
                      }
                      rows={formData.field_type === 'select' ? 5 : 3}
                      required={needsOptions}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.field_type === 'select' 
                        ? 'Введите каждый вариант с новой строки' 
                        : 'Введите два значения (например: Да и Нет)'}
                    </p>
                  </div>
                )}
                {needsFileExtensions && (
                  <div className="space-y-2">
                    <Label htmlFor="file_extensions">Разрешённые форматы файлов</Label>
                    <Input
                      id="file_extensions"
                      value={formData.options}
                      onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                      placeholder="pdf, jpg, png, doc, docx"
                    />
                    <p className="text-xs text-muted-foreground">
                      Введите расширения файлов через запятую (например: pdf, jpg, png)
                    </p>
                  </div>
                )}
                <Button type="submit" className="w-full">
                  {editingField ? 'Сохранить' : 'Добавить'}
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
            ) : fields.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Нет дополнительных полей. Добавьте первое поле для начала работы.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon name={getFieldTypeIcon(field.field_type)} size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{field.name}</h3>
                          <p className="text-xs text-muted-foreground">{getFieldTypeLabel(field.field_type)}</p>
                        </div>
                      </div>
                    </div>
                    {field.options && field.field_type !== 'file' && (
                      <div className="mb-3 text-sm text-muted-foreground">
                        <div className="font-medium mb-1">Варианты:</div>
                        <div className="text-xs space-y-1">
                          {field.options.split('\n').filter(opt => opt.trim()).map((opt, idx) => (
                            <div key={idx} className="truncate">• {opt}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {field.options && field.field_type === 'file' && (
                      <div className="mb-3 text-sm text-muted-foreground">
                        <div className="font-medium mb-1">Разрешённые форматы:</div>
                        <div className="text-xs">
                          {field.options}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(field)}
                        className="flex-1"
                      >
                        <Icon name="Pencil" size={16} />
                        <span className="ml-2">Изменить</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(field.id)}
                        className="flex-1 text-red-400 hover:text-red-300"
                      >
                        <Icon name="Trash2" size={16} />
                        <span className="ml-2">Удалить</span>
                      </Button>
                    </div>
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

export default CustomFields;