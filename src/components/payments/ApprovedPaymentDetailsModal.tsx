import { useState } from 'react';
import Icon from '@/components/ui/icon';
import PaymentAuditLog from '@/components/approvals/PaymentAuditLog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

interface CustomField {
  id: number;
  name: string;
  field_type: string;
  value: string;
}

interface Payment {
  id: number;
  category_id: number;
  category_name: string;
  category_icon: string;
  description: string;
  amount: number;
  payment_date: string;
  legal_entity_id?: number;
  legal_entity_name?: string;
  status?: string;
  created_by?: number;
  created_by_name?: string;
  service_id?: number;
  service_name?: string;
  contractor_name?: string;
  contractor_id?: number;
  department_name?: string;
  department_id?: number;
  invoice_number?: string;
  invoice_date?: string;
  created_at?: string;
  submitted_at?: string;
  ceo_approved_at?: string;
  tech_director_approved_at?: string;
  custom_fields?: CustomField[];
}

interface ApprovedPaymentDetailsModalProps {
  payment: Payment | null;
  onClose: () => void;
  onRevoked?: () => void;
}

const ApprovedPaymentDetailsModal = ({ payment, onClose, onRevoked }: ApprovedPaymentDetailsModalProps) => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeComment, setRevokeComment] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  if (!payment) return null;

  const isCreator = user?.id === payment.created_by;
  const isAdmin = user?.roles?.some(role => role.name === 'Администратор' || role.name === 'Admin');
  const isCEO = user?.roles?.some(role => role.name === 'CEO' || role.name === 'Генеральный директор');
  const canRevoke = isCreator || isAdmin || isCEO;

  const handleRevokeClick = () => {
    setShowRevokeDialog(true);
  };

  const handleRevokeConfirm = async () => {
    if (!revokeComment.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите причину отзыва',
        variant: 'destructive',
      });
      return;
    }

    setIsRevoking(true);
    try {
      const response = await fetch(API_ENDPOINTS.approvalsApi, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || '',
        },
        body: JSON.stringify({
          payment_id: payment.id,
          action: 'revoke',
          comment: revokeComment.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось отозвать платёж');
      }

      toast({
        title: 'Успешно',
        description: 'Платёж отозван и возвращён в черновики',
      });

      setShowRevokeDialog(false);
      setRevokeComment('');
      if (onRevoked) onRevoked();
      onClose();
    } catch (error) {
      console.error('Ошибка отзыва платежа:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отозвать платеж',
        variant: 'destructive',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-card border border-white/10 rounded-xl w-full max-w-[1200px] max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="bg-card border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Детали платежа #{payment.id}</h2>
            <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-300">✓ Одобрено CEO</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="w-full lg:w-1/2 lg:border-r border-white/10 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="bg-primary/20 p-2 sm:p-3 rounded-lg">
                <Icon name={payment.category_icon} size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium mb-1">{payment.category_name}</h3>
                <p className="text-2xl sm:text-3xl font-bold text-primary">{payment.amount.toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>

            {payment.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Описание</p>
                <p className="font-medium">{payment.description}</p>
              </div>
            )}

            {payment.category_name && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Категория</p>
                <div className="flex items-center gap-2 font-medium">
                  <Icon name={payment.category_icon || 'Tag'} size={18} />
                  {payment.category_name}
                </div>
              </div>
            )}

            {payment.legal_entity_name && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Юридическое лицо</p>
                <p className="font-medium">{payment.legal_entity_name}</p>
              </div>
            )}

            {payment.contractor_name && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Контрагент</p>
                <p className="font-medium">{payment.contractor_name}</p>
              </div>
            )}

            {payment.department_name && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Отдел-заказчик</p>
                <p className="font-medium">{payment.department_name}</p>
              </div>
            )}

            {payment.service_name && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Сервис</p>
                <p className="font-medium">{payment.service_name}</p>
              </div>
            )}

            {payment.invoice_number && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Номер счёта</p>
                <p className="font-medium">{payment.invoice_number}</p>
              </div>
            )}

            {payment.created_by_name && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Создал заявку</p>
                <p className="font-medium">{payment.created_by_name}</p>
              </div>
            )}

            {payment.custom_fields && payment.custom_fields.length > 0 && (
              <>
                {payment.custom_fields.map((field) => (
                  <div key={field.id}>
                    <p className="text-sm text-muted-foreground mb-1">{field.name}</p>
                    {field.field_type === 'file' && field.value ? (
                      <a 
                        href={field.value} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-2"
                      >
                        <Icon name="Download" size={16} />
                        Скачать файл
                      </a>
                    ) : (
                      <p className="font-medium">{field.value}</p>
                    )}
                  </div>
                ))}
              </>
            )}

            {canRevoke && (
              <div className="pt-4 border-t border-white/10">
                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={handleRevokeClick}
                >
                  <Icon name="XCircle" size={18} />
                  Отозвать платеж
                </Button>
              </div>
            )}
          </div>

          <div className="w-full lg:w-1/2 flex flex-col border-t lg:border-t-0 border-white/10 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Дата платежа:</span>
                  <span className="font-medium">{new Date(payment.payment_date).toLocaleDateString('ru-RU')}</span>
                </div>
                {payment.submitted_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Дата отправки:</span>
                    <span className="font-medium">{new Date(payment.submitted_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                )}
                {payment.invoice_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Дата счёта:</span>
                    <span className="font-medium">{new Date(payment.invoice_date).toLocaleDateString('ru-RU')}</span>
                  </div>
                )}
                {payment.ceo_approved_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Одобрено CEO:</span>
                    <span className="font-medium">{new Date(payment.ceo_approved_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date(payment.ceo_approved_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                {payment.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Создана:</span>
                    <span className="font-medium">{new Date(payment.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date(payment.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
            </div>

            <Tabs defaultValue="history" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-4 mt-2">
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <Icon name="History" size={16} />
                  История согласования
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="history" className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
                <PaymentAuditLog paymentId={payment.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отзыв платежа</DialogTitle>
            <DialogDescription>
              Платёж будет возвращён в черновики. Укажите причину отзыва.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Причина отзыва <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={revokeComment}
                onChange={(e) => setRevokeComment(e.target.value)}
                placeholder="Укажите причину отзыва платежа..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowRevokeDialog(false);
                setRevokeComment('');
              }}
              variant="outline"
              className="flex-1"
              disabled={isRevoking}
            >
              Отмена
            </Button>
            <Button
              onClick={handleRevokeConfirm}
              variant="destructive"
              className="flex-1"
              disabled={isRevoking || !revokeComment.trim()}
            >
              {isRevoking ? 'Отзываем...' : 'Отозвать'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovedPaymentDetailsModal;