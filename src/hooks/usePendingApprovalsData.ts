import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { Payment } from '@/types/payment';
import { useAllPaymentsCache } from '@/contexts/AllPaymentsCacheContext';

export const usePendingApprovalsData = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const { payments: allPayments, loading, removePayment, refresh } = useAllPaymentsCache();
  const [approveProgress, setApproveProgress] = useState<{ current: number; total: number } | null>(null);

  const payments = useMemo(() => {
    if (!user) return [];
    return allPayments.filter((payment: Payment) => {
      if (!payment.status) return false;
      return ['pending_ib', 'pending_ceo', 'pending_cfo'].includes(payment.status);
    });
  }, [allPayments, user]);

  const handleApprove = useCallback(async (paymentId: number, approveComment?: string) => {
    console.log('[handleApprove] Called with paymentId:', paymentId, 'comment:', approveComment);
    try {
      const response = await fetch(`${API_ENDPOINTS.approvalsApi}`, {
        method: 'PUT',
        headers: {
          'X-Auth-Token': token!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
          action: 'approve',
          comment: approveComment || '',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Платёж согласован',
        });
        removePayment(paymentId);
        refresh();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Ошибка',
          description: errorData.error || 'Не удалось согласовать платёж',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Approve error:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось согласовать платёж',
        variant: 'destructive',
      });
    }
  }, [token, toast, removePayment, refresh]);

  const handleApproveAll = useCallback(async (paymentIds: number[]) => {
    if (paymentIds.length === 0) return;

    const BATCH_SIZE = 5;
    const DELAY_MS = 300;
    let succeeded = 0;
    let failed = 0;

    setApproveProgress({ current: 0, total: paymentIds.length });

    for (let i = 0; i < paymentIds.length; i += BATCH_SIZE) {
      const batch = paymentIds.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(id =>
          fetch(`${API_ENDPOINTS.approvalsApi}`, {
            method: 'PUT',
            headers: { 'X-Auth-Token': token!, 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_id: id, action: 'approve', comment: '' }),
          })
        )
      );
      succeeded += results.filter(r => r.status === 'fulfilled' && (r.value as Response).ok).length;
      failed += results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !(r.value as Response).ok)).length;
      setApproveProgress({ current: Math.min(i + BATCH_SIZE, paymentIds.length), total: paymentIds.length });

      if (i + BATCH_SIZE < paymentIds.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    setApproveProgress(null);
    paymentIds.forEach(id => removePayment(id));
    refresh();
    toast({
      title: succeeded > 0 ? 'Успешно' : 'Ошибка',
      description: failed > 0
        ? `Одобрено: ${succeeded}, не удалось: ${failed}`
        : `Одобрено ${succeeded} платежей`,
      variant: failed > 0 ? 'destructive' : 'default',
    });
  }, [token, toast, removePayment, refresh]);

  const handleReject = useCallback(async (paymentId: number, rejectComment?: string) => {
    console.log('[handleReject] Called with paymentId:', paymentId, 'comment:', rejectComment);
    try {
      const response = await fetch(`${API_ENDPOINTS.approvalsApi}`, {
        method: 'PUT',
        headers: {
          'X-Auth-Token': token!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
          action: 'reject',
          comment: rejectComment || '',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Платёж отклонён',
        });
        removePayment(paymentId);
        refresh();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Ошибка',
          description: errorData.error || 'Не удалось отклонить платёж',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Reject error:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отклонить платёж',
        variant: 'destructive',
      });
    }
  }, [token, toast, removePayment, refresh]);

  return {
    payments,
    loading,
    approveProgress,
    handleApprove,
    handleApproveAll,
    handleReject,
  };
};