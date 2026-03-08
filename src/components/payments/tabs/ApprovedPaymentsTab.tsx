import { useMemo, useState } from 'react';
import { apiFetch } from '@/utils/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import ApprovedPaymentDetailsModal from '@/components/payments/ApprovedPaymentDetailsModal';
import { API_ENDPOINTS } from '@/config/api';
import { Payment } from '@/types/payment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAllPaymentsCache } from '@/contexts/AllPaymentsCacheContext';

interface ExtendedPayment extends Payment {
  ceo_approved_at?: string;
  tech_director_approved_at?: string;
}

const ApprovedPaymentsTab = () => {
  const { payments: allPayments, loading, refresh } = useAllPaymentsCache();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<ExtendedPayment | null>(null);
  const [revokePaymentId, setRevokePaymentId] = useState<number | null>(null);
  const [revokeComment, setRevokeComment] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const { toast } = useToast();

  const payments = useMemo(() =>
    (allPayments as ExtendedPayment[]).filter(p => p.status === 'approved'),
    [allPayments]
  );

  const fetchApprovedPayments = () => refresh();

  const handleRevokeClick = (e: React.MouseEvent, paymentId: number) => {
    e.stopPropagation();
    setRevokePaymentId(paymentId);
    setRevokeComment('');
  };

  const handleRevokeConfirm = async () => {
    if (!revokeComment.trim()) {
      toast({ title: 'Ошибка', description: 'Укажите причину отзыва', variant: 'destructive' });
      return;
    }
    if (!revokePaymentId) return;
    setIsRevoking(true);
    try {
      const response = await apiFetch(API_ENDPOINTS.approvalsApi, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: revokePaymentId, action: 'revoke', comment: revokeComment.trim() })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось отозвать платёж');
      }
      toast({ title: 'Успешно', description: 'Платёж отозван и возвращён в черновики' });
      setRevokePaymentId(null);
      setRevokeComment('');
      fetchApprovedPayments();
    } catch (error) {
      console.error('Failed to revoke payment:', error);
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось отозвать платёж', variant: 'destructive' });
    } finally {
      setIsRevoking(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      payment.description.toLowerCase().includes(query) ||
      payment.category_name.toLowerCase().includes(query) ||
      payment.amount.toString().includes(query) ||
      payment.contractor_name?.toLowerCase().includes(query) ||
      payment.legal_entity_name?.toLowerCase().includes(query)
    );
  });

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск по описанию, категории, сумме..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background border-white/10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold mb-2">Нет согласованных платежей</h3>
          <p className="text-muted-foreground">
            {payments.length === 0 
              ? 'Когда платежи будут одобрены CEO, они отобразятся здесь'
              : 'Попробуйте изменить поисковый запрос'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Найдено платежей: {filteredPayments.length} • Общая сумма: {formatAmount(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
          </div>
          
          {filteredPayments.map((payment) => (
            <Card 
              key={payment.id} 
              className="border-white/5 bg-card shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:border-white/10 transition-all cursor-pointer"
              onClick={() => setSelectedPayment(payment)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Icon name={payment.category_icon} size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold">{payment.category_name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-xs flex-shrink-0" style={{ backgroundColor: '#00FF66', color: '#000000' }}>
                            ✓ Одобрено CEO
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">{payment.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          {payment.service_name && (
                            <div className="flex items-center gap-1">
                              <Icon name="Briefcase" size={14} />
                              <span>{payment.service_name}</span>
                            </div>
                          )}
                          {payment.contractor_name && (
                            <div className="flex items-center gap-1">
                              <Icon name="Building2" size={14} />
                              <span>{payment.contractor_name}</span>
                            </div>
                          )}
                          {payment.department_name && (
                            <div className="flex items-center gap-1">
                              <Icon name="Users" size={14} />
                              <span>{payment.department_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Icon name="Calendar" size={14} />
                            <span>{formatDate(payment.payment_date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center lg:text-right lg:border-l lg:border-white/10 lg:pl-6 space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Сумма платежа</div>
                      <div className="text-2xl font-bold">{formatAmount(payment.amount)}</div>
                    </div>
                    <button
                      onClick={(e) => handleRevokeClick(e, payment.id)}
                      className="px-4 py-2 text-sm rounded bg-orange-600 text-white hover:bg-orange-700 font-medium w-full lg:w-auto"
                    >
                      Отозвать согласование
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ApprovedPaymentDetailsModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onRevoked={fetchApprovedPayments}
      />

      <Dialog open={revokePaymentId !== null} onOpenChange={(open) => !open && setRevokePaymentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отозвать согласование</DialogTitle>
            <DialogDescription>Платёж будет возвращён в черновики. Укажите причину.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Причина отзыва..."
            value={revokeComment}
            onChange={(e) => setRevokeComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setRevokePaymentId(null)} disabled={isRevoking}>
              Отмена
            </Button>
            <Button
              onClick={handleRevokeConfirm}
              disabled={isRevoking || !revokeComment.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isRevoking ? 'Отзываем...' : 'Отозвать'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovedPaymentsTab;