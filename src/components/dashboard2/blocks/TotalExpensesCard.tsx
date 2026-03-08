import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useMemo } from 'react';
import { dashboardTypography } from '../dashboardStyles';
import { usePeriod } from '@/contexts/PeriodContext';
import { usePaymentsCache } from '@/contexts/PaymentsCacheContext';

interface PaymentRecord {
  status: string;
  payment_date: string;
  amount: number;
  [key: string]: unknown;
}

const TotalExpensesCard = () => {
  const { getDateRange, period, dateFrom, dateTo } = usePeriod();
  const { payments: allPayments, loading } = usePaymentsCache();

  const stats = useMemo(() => {
    const { from, to } = getDateRange();
    const payments: PaymentRecord[] = (Array.isArray(allPayments) ? allPayments : []).filter(
      (p: PaymentRecord) => p.status === 'approved'
    );
    const periodMs = to.getTime() - from.getTime();

    const current = payments.filter((p) => {
      const d = new Date(p.payment_date);
      return d >= from && d <= to;
    });

    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - periodMs);
    const previous = payments.filter((p) => {
      const d = new Date(p.payment_date);
      return d >= prevFrom && d <= prevTo;
    });

    const currentTotal = current.reduce((sum, p) => sum + p.amount, 0);
    const previousTotal = previous.reduce((sum, p) => sum + p.amount, 0);

    const diff = previousTotal > 0
      ? parseFloat((((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1))
      : 0;

    return {
      total: currentTotal,
      count: current.length,
      changePercent: Math.abs(diff),
      isIncrease: diff >= 0,
    };
  }, [allPayments, period, dateFrom, dateTo]);

  const formatAmount = (amount: number) =>
    amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₽';

  return (
    <Card className="h-full" style={{ background: 'hsl(var(--card))', border: '1px solid rgba(117, 81, 233, 0.4)', borderTop: '4px solid #7551e9' }}>
      <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4 sm:mb-5">
          <div>
            <div className={`${dashboardTypography.cardTitle} mb-2`}>Общие IT Расходы</div>
            <div className={dashboardTypography.cardSubtitle}>
              {loading ? 'Загрузка...' : `${stats.count} платежей`}
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(117, 81, 233, 0.1)', color: '#7551e9', border: '1px solid rgba(117, 81, 233, 0.2)' }}>
            <Icon name="Server" size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className={`${dashboardTypography.cardValue} mb-2`}>
          {loading ? '...' : formatAmount(stats.total)}
        </div>
        <div className={`${dashboardTypography.cardSecondary} mb-3`}>Общая сумма расходов</div>
        {!loading && (
          <div className={`flex items-center ${dashboardTypography.cardBadge} gap-1.5`} style={{ color: stats.isIncrease ? '#e31a1a' : '#01b574' }}>
            <Icon name={stats.isIncrease ? "ArrowUp" : "ArrowDown"} size={14} />
            {stats.isIncrease ? '+' : '-'}{stats.changePercent}% к предыдущему периоду
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TotalExpensesCard;
