import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useMemo } from 'react';
import { usePeriod } from '@/contexts/PeriodContext';
import { usePaymentsCache } from '@/contexts/PaymentsCacheContext';

interface PaymentRecord {
  status: string;
  payment_date: string;
  amount: number;
  created_at?: string;
  [key: string]: unknown;
}

const LiveMetricsCard = () => {
  const { period, getDateRange, dateFrom, dateTo } = usePeriod();
  const { payments: allPayments, loading } = usePaymentsCache();

  const metrics = useMemo(() => {
    const { from, to } = getDateRange();
    const all: PaymentRecord[] = Array.isArray(allPayments) ? allPayments : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPayments = all.filter(p => {
      if (p.status === 'cancelled') return false;
      const d = new Date(p.payment_date || p.created_at || '');
      return d >= today && d < tomorrow;
    });

    const periodPayments = all.filter(p => {
      const d = new Date(p.payment_date);
      return d >= from && d <= to;
    });
    const approved = periodPayments.filter(p => p.status === 'approved');
    const rate = periodPayments.length > 0 ? Math.round((approved.length / periodPayments.length) * 100) : 0;

    const totalAmount = approved.reduce((s, p) => s + Number(p.amount), 0);
    const avg = approved.length > 0 ? Math.round(totalAmount / approved.length) : 0;

    const pendingInPeriod = periodPayments.filter(p => p.status === 'pending_approval');

    return {
      todayCount: todayPayments.length,
      pendingCount: pendingInPeriod.length,
      periodTotal: periodPayments.length,
      approvedRate: rate,
      avgAmount: avg,
    };
  }, [allPayments, period, dateFrom, dateTo]);

  const { todayCount, pendingCount, periodTotal, approvedRate, avgAmount } = metrics;

  const fmtAmount = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}м ₽`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}к ₽`;
    return `${v} ₽`;
  };

  return (
    <Card style={{
      background: 'hsl(var(--card))',
      border: '1px solid rgba(1, 181, 116, 0.3)',
      borderTop: '4px solid rgba(1, 181, 116, 1)',
      boxShadow: '0 4px 28px rgba(1, 181, 116, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', bottom: '-50%', left: '-50%',
        width: '200%', height: '200%',
        background: 'radial-gradient(circle, rgba(1, 181, 116, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <CardContent className="p-4 sm:p-6" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }} className="sm:gap-3 sm:mb-6">
          <div style={{
            background: 'linear-gradient(135deg, #01b574 0%, #018c5a 100%)',
            padding: '8px', borderRadius: '10px',
            boxShadow: '0 0 20px rgba(1, 181, 116, 0.5)'
          }} className="sm:p-3">
            <Icon name="Activity" size={18} style={{ color: '#fff' }} className="sm:w-6 sm:h-6" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'hsl(var(--card-foreground))' }} className="sm:text-lg">Live Метрики</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="sm:gap-5">
          {/* Сегодня */}
          <div style={{
            background: 'rgba(1, 181, 116, 0.1)', padding: '14px', borderRadius: '12px',
            border: '1px solid rgba(1, 181, 116, 0.2)', textAlign: 'center'
          }}>
            <div style={{ color: '#01b574', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }} className="sm:text-sm sm:mb-2">
              Платежей сегодня
            </div>
            <div style={{
              color: 'hsl(var(--card-foreground))', fontSize: '28px', fontWeight: '800',
              textShadow: '0 0 20px rgba(1, 181, 116, 0.5)'
            }} className="sm:text-4xl">
              {loading ? '—' : todayCount}
            </div>
            <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px', marginTop: '4px' }} className="sm:text-xs">
              {loading ? '...' : `${pendingCount} на согласовании`}
            </div>
          </div>

          {/* Средний + Одобрено */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }} className="sm:gap-3">
            <div style={{
              background: 'rgba(255, 181, 71, 0.1)', padding: '12px', borderRadius: '10px',
              border: '1px solid rgba(255, 181, 71, 0.2)', textAlign: 'center'
            }}>
              <Icon name="Banknote" size={16} style={{ color: '#ffb547', marginBottom: '6px' }} className="sm:w-5 sm:h-5" />
              <div style={{ color: '#ffb547', fontSize: '15px', fontWeight: '700' }} className="sm:text-xl">
                {loading ? '—' : fmtAmount(avgAmount)}
              </div>
              <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px', marginTop: '2px' }} className="sm:text-xs sm:mt-1">Ср. платёж</div>
            </div>
            <div style={{
              background: 'rgba(117, 81, 233, 0.1)', padding: '12px', borderRadius: '10px',
              border: '1px solid rgba(117, 81, 233, 0.2)', textAlign: 'center'
            }}>
              <Icon name="CheckCircle2" size={16} style={{ color: '#7551e9', marginBottom: '6px' }} className="sm:w-5 sm:h-5" />
              <div style={{ color: '#7551e9', fontSize: '18px', fontWeight: '700' }} className="sm:text-2xl">
                {loading ? '—' : `${approvedRate}%`}
              </div>
              <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px', marginTop: '2px' }} className="sm:text-xs sm:mt-1">Согласовано</div>
            </div>
          </div>

          {/* На согласовании — прогресс */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)', padding: '10px',
            borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }} className="sm:mb-2">
              <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px' }} className="sm:text-xs">На согласовании</span>
              <span style={{ color: 'hsl(var(--card-foreground))', fontSize: '12px', fontWeight: '600' }} className="sm:text-sm">{loading ? '—' : pendingCount}</span>
            </div>
            <div style={{
              width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px', overflow: 'hidden'
            }}>
              <div style={{
                width: loading ? '0%' : `${Math.min(periodTotal > 0 ? Math.round((pendingCount / periodTotal) * 100) : 0, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #01b574 0%, #01b574aa 100%)',
                borderRadius: '10px',
                boxShadow: '0 0 10px #01b574',
                transition: 'width 0.8s ease'
              }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMetricsCard;
