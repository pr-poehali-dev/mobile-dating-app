import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import PaymentAuditLog from '@/components/approvals/PaymentAuditLog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_ENDPOINTS } from '@/config/api';
import { apiFetch } from '@/utils/api';

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
  payment_date?: string;
  planned_date?: string;
  legal_entity_id?: number;
  legal_entity_name?: string;
  status?: string;
  created_by?: number;
  created_by_name?: string;
  service_id?: number;
  service_name?: string;
  service_description?: string;
  contractor_name?: string;
  contractor_id?: number;
  department_name?: string;
  department_id?: number;
  invoice_number?: string;
  invoice_date?: string;
  created_at?: string;
  submitted_at?: string;
  rejection_comment?: string;
  rejected_at?: string;
  custom_fields?: CustomField[];
}

interface PaymentDetailsModalProps {
  payment: Payment | null;
  onClose: () => void;
  onSubmitForApproval?: (paymentId: number) => void;
  onApprove?: (paymentId: number) => void;
  onReject?: (paymentId: number) => void;
  onEdit?: (payment: Payment) => void;
  isPlannedPayment?: boolean;
}

interface PaymentView {
  user_id: number;
  full_name: string;
  viewed_at: string;
}

const PaymentDetailsModal = ({ payment, onClose, onSubmitForApproval, onApprove, onReject, onEdit, isPlannedPayment }: PaymentDetailsModalProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [views, setViews] = useState<PaymentView[]>([]);

  useEffect(() => {
    if (!payment) return;
    const viewsUrl = `${API_ENDPOINTS.main}?endpoint=payment-views&payment_id=${payment.id}`;
    apiFetch(viewsUrl, { method: 'POST' })
      .then(() => apiFetch(viewsUrl))
      .then(r => r.json())
      .then(data => setViews(data.views ?? []))
      .catch(() => {});
  }, [payment?.id]);

  if (!payment) return null;

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'draft') {
      return <span className="px-3 py-1 rounded-full text-sm bg-gray-500/20" style={{ color: '#000000' }}>Черновик</span>;
    }
    if (status === 'pending_ceo') {
      return <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20" style={{ color: '#000000' }}>Ожидает CEO</span>;
    }
    if (status === 'approved') {
      return <span className="px-3 py-1 rounded-full text-sm bg-green-500/20" style={{ color: '#000000' }}>Одобрен</span>;
    }
    if (status === 'rejected') {
      return <span className="px-3 py-1 rounded-full text-sm bg-red-500/20" style={{ color: '#000000' }}>Отклонен</span>;
    }
    if (status === 'revoked') {
      return <span className="px-3 py-1 rounded-full text-sm bg-orange-500/20" style={{ color: '#000000' }}>⚠ Отозван</span>;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-card border border-white/10 rounded-xl w-full max-w-[1200px] max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="bg-card border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Детали платежа #{payment.id}</h2>
            {getStatusBadge(payment.status)}
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

            {views.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-1.5 w-full mb-1">
                  <Icon name="Eye" size={14} className="text-primary" />
                  <span className="text-xs font-medium text-primary">Просмотрено</span>
                </div>
                {views.map((v) => (
                  <div
                    key={v.user_id}
                    className="flex items-center gap-1.5 bg-primary/15 rounded-full px-2.5 py-1"
                    title={new Date(v.viewed_at).toLocaleString('ru-RU')}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                      {v.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-foreground">{v.full_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(v.viewed_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {payment.rejection_comment && payment.status === 'rejected' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Icon name="AlertCircle" size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-300 mb-1">Причина отклонения</p>
                    <p className="text-sm text-red-200">{payment.rejection_comment}</p>
                    {payment.rejected_at && (
                      <p className="text-xs text-red-300/70 mt-2">
                        {new Date(payment.rejected_at).toLocaleString('ru-RU')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

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

            {(isPlannedPayment || payment.is_planned) && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Запланированный платеж</p>
                <div className="flex items-center gap-2 font-medium text-blue-300">
                  <Icon name="CalendarClock" size={18} />
                  {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  }) : 'Дата не указана'}
                </div>
              </div>
            )}

            {payment.service_name && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Сервис</p>
                <p className="font-medium">{payment.service_name}</p>
                {payment.service_description && (
                  <p className="text-sm text-muted-foreground mt-1">{payment.service_description}</p>
                )}
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
          </div>

          <div className="w-full lg:w-1/2 flex flex-col border-t lg:border-t-0 border-white/10 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{(isPlannedPayment || payment.is_planned) ? 'Дата планирования:' : 'Дата платежа:'}</span>
                  <span className="font-medium">
                    {payment.planned_date 
                      ? new Date(payment.planned_date).toLocaleDateString('ru-RU')
                      : payment.payment_date 
                        ? new Date(payment.payment_date).toLocaleDateString('ru-RU')
                        : 'Invalid Date'}
                  </span>
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
                {payment.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Создана:</span>
                    <span className="font-medium">{new Date(payment.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                )}
              </div>
            </div>

            {!isPlannedPayment && (
              <Tabs defaultValue="history" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="px-4 sm:px-6 pt-4 grid w-auto grid-cols-1">
                  <TabsTrigger value="history">История согласований</TabsTrigger>
                </TabsList>
                
                <TabsContent value="history" className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
                  <PaymentAuditLog paymentId={payment.id} />
                </TabsContent>
              </Tabs>
            )}
            
            {isPlannedPayment && (
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                <div className="text-center text-muted-foreground py-8">
                  <Icon name="Clock" size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Запланированный платёж</p>
                  <p className="text-xs mt-2">История согласований появится после создания платежа</p>
                </div>
              </div>
            )}
            
            {((!payment.status || payment.status === 'draft' || payment.status === 'rejected') && onSubmitForApproval) || (onApprove || onReject) ? (
              <div className="p-4 sm:p-6 border-t border-white/10 space-y-3">
                {payment.status === 'rejected' && onEdit && (
                  <button
                    onClick={() => {
                      onEdit(payment);
                      onClose();
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 text-white hover:bg-white/10 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon name="Edit" size={18} />
                    Редактировать платёж
                  </button>
                )}
                
                {(!payment.status || payment.status === 'draft' || payment.status === 'rejected') && onSubmitForApproval && !showConfirmation && (
                  <button
                    onClick={() => setShowConfirmation(true)}
                    className="w-full px-4 py-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 font-medium transition-colors"
                    style={{ color: '#000000' }}
                  >
                    {payment.status === 'rejected' ? 'Отправить на повторное согласование' : 'Отправить на согласование'}
                  </button>
                )}
                
                {(!payment.status || payment.status === 'draft' || payment.status === 'rejected') && onSubmitForApproval && showConfirmation && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      Отправить платёж на согласование?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowConfirmation(false)}
                        className="flex-1 px-4 py-3 rounded-lg bg-white/5 text-white hover:bg-white/10 font-medium transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={() => {
                          onSubmitForApproval(payment.id);
                          onClose();
                        }}
                        className="flex-1 px-4 py-3 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 font-medium transition-colors"
                      >
                        Отправить
                      </button>
                    </div>
                  </div>
                )}

                {(onApprove || onReject) && (
                  <div className="flex gap-3">
                    {onApprove && (
                      <button
                        onClick={() => {
                          onApprove(payment.id);
                          onClose();
                        }}
                        className="flex-1 px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-colors"
                      >
                        Одобрить
                      </button>
                    )}
                    {onReject && (
                      <button
                        onClick={() => {
                          onReject(payment.id);
                          onClose();
                        }}
                        className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
                      >
                        Отклонить
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;