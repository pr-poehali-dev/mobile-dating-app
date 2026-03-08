import { useMemo, useState } from 'react';
import { apiFetch } from '@/utils/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import PaymentDetailsModal from '@/components/payments/PaymentDetailsModal';
import EditPaymentModal from '@/components/payments/EditPaymentModal';
import { API_ENDPOINTS } from '@/config/api';
import { Payment } from '@/types/payment';
import { useAllPaymentsCache } from '@/contexts/AllPaymentsCacheContext';
import { invalidateMyPaymentsCache } from '@/hooks/usePaymentsData';

interface ExtendedPayment extends Payment {
  rejected_at?: string;
  rejection_comment?: string;
}

const RejectedPaymentsTab = () => {
  const { payments: allPayments, loading, refresh } = useAllPaymentsCache();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<ExtendedPayment | null>(null);
  const [editingPayment, setEditingPayment] = useState<ExtendedPayment | null>(null);

  const payments = useMemo(() =>
    (allPayments as ExtendedPayment[]).filter(p => p.status === 'rejected'),
    [allPayments]
  );

  const fetchRejectedPayments = () => refresh();

  const handleResubmit = async (paymentId: number) => {
    try {
      const res = await apiFetch(`${API_ENDPOINTS.approvalsApi}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, action: 'submit' })
      });
      if (res.ok) {
        fetchRejectedPayments();
      } else {
        const err = await res.json();
        console.error('Failed to resubmit payment:', err);
      }
    } catch (error) {
      console.error('Failed to resubmit payment:', error);
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
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold mb-2">Нет отклонённых платежей</h3>
          <p className="text-muted-foreground">
            {payments.length === 0 
              ? 'Когда платежи будут отклонены, они отобразятся здесь'
              : 'Попробуйте изменить поисковый запрос'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0">
                        <Icon name={payment.category_icon} size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold">{payment.category_name}</h3>
                          <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400">✗ Отклонено</span>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResubmit(payment.id);
                      }}
                      className="px-4 py-2 text-sm rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium w-full lg:w-auto"
                    >
                      Отправить на повторное согласование
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PaymentDetailsModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onSubmitForApproval={handleResubmit}
        onEdit={(payment) => {
          setEditingPayment(payment as ExtendedPayment);
          setSelectedPayment(null);
        }}
      />

      <EditPaymentModal
        payment={editingPayment}
        onClose={() => setEditingPayment(null)}
        onSuccess={() => {
          setEditingPayment(null);
          invalidateMyPaymentsCache();
          fetchRejectedPayments();
        }}
      />
    </div>
  );
};

export default RejectedPaymentsTab;