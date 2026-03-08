import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';

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

interface ServicesTableProps {
  services: Service[];
  loading: boolean;
  onEdit: (service: Service) => void;
  onDelete: (id: number) => void;
}

const ServicesTable = ({ services, loading, onEdit, onDelete }: ServicesTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Все сервисы</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Нет созданных сервисов
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Отдел-заказчик</TableHead>
                  <TableHead>Юридическое лицо</TableHead>
                  <TableHead>Контрагент</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      {service.category_name ? (
                        <div className="flex items-center gap-2">
                          <Icon name={service.category_icon || 'Tag'} size={16} />
                          {service.category_name}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{service.customer_department_name || '—'}</TableCell>
                    <TableCell>{service.legal_entity_name || '—'}</TableCell>
                    <TableCell>{service.contractor_name || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(service)}
                          className="gap-2"
                        >
                          <Icon name="Pencil" size={16} />
                          Редактировать
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(service.id)}
                          className="gap-2 text-red-500 hover:text-red-600"
                        >
                          <Icon name="Trash2" size={16} />
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServicesTable;