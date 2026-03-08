import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { usePeriod } from '@/contexts/PeriodContext';
import { dashboardTypography } from '../dashboardStyles';
import { usePaymentsCache } from '@/contexts/PaymentsCacheContext';
import { useDrillDown } from '../useDrillDown';
import DrillDownModal from '../DrillDownModal';

interface PaymentRecord {
  status: string;
  payment_date: string;
  amount: number;
  payment_type?: string;
  legal_entity_id?: number;
  legal_entity_name?: string;
  [key: string]: unknown;
}

const fmt = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' млн ₽';
  if (v >= 1_000) return Math.round(v / 1_000) + ' тыс ₽';
  return new Intl.NumberFormat('ru-RU').format(v) + ' ₽';
};

const PaymentTypeChart = () => {
  const { period, getDateRange, dateFrom, dateTo } = usePeriod();
  const { payments: allPayments, loading } = usePaymentsCache();
  const { drillFilter, openDrill, closeDrill } = useDrillDown();
  const [hovered, setHovered] = useState<'cash' | 'legal' | null>(null);

  const { cashAmount, cashCount, legalAmount, legalCount } = useMemo(() => {
    const { from, to } = getDateRange();

    const filtered = (Array.isArray(allPayments) ? allPayments : []).filter((p: PaymentRecord) => {
      if (p.status !== 'approved') return false;
      const d = new Date(p.payment_date);
      return d >= from && d <= to;
    });

    let cash = 0, cashCnt = 0, legal = 0, legalCnt = 0;

    filtered.forEach((p: PaymentRecord) => {
      if (p.payment_type === 'cash') {
        cash += p.amount;
        cashCnt++;
      } else {
        legal += p.amount;
        legalCnt++;
      }
    });

    return { cashAmount: cash, cashCount: cashCnt, legalAmount: legal, legalCount: legalCnt };
  }, [allPayments, period, dateFrom, dateTo]);

  const total = cashAmount + legalAmount;
  const legalPct = total > 0 ? (legalAmount / total) * 100 : 0;
  const cashPct = total > 0 ? (cashAmount / total) * 100 : 0;

  return (
    <>
    <Card
      className="h-full"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderTop: '4px solid #3965ff',
      }}
    >
      <CardContent className="p-4 sm:p-6 h-full flex flex-col">
        <div className="mb-4">
          <h3 className={`${dashboardTypography.cardTitle} mb-1`}>Тип расчётов</h3>
          <p className={dashboardTypography.cardSubtitle}>Наличные vs Безналичные</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1 min-h-[160px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : total === 0 ? (
          <div className="flex items-center justify-center flex-1 min-h-[160px]">
            <p className={dashboardTypography.cardSubtitle}>Нет данных за выбранный период</p>
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-3 flex-1">
            {/* Cards */}
            <div className="flex flex-col gap-3 w-full">
              {/* Legal */}
              <div
                className="rounded-xl p-3 cursor-pointer transition-all"
                style={{
                  background: hovered === 'legal' ? 'rgba(57, 101, 255, 0.12)' : 'rgba(57, 101, 255, 0.06)',
                  border: `1px solid ${hovered === 'legal' ? 'rgba(57, 101, 255, 0.4)' : 'rgba(57, 101, 255, 0.15)'}`,
                  opacity: hovered === 'cash' ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={() => setHovered('legal')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => openDrill({ type: 'payment_type', value: 'legal', label: 'Безналичные' })}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3965ff, #7551e9)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Безналичные</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#3965ff' }}>{legalPct.toFixed(1)}%</span>
                </div>
                <div className="text-base font-extrabold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                  {fmt(legalAmount)}
                </div>
                <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{legalCount} платежей</div>
                <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(57,101,255,0.15)' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${legalPct}%`, background: 'linear-gradient(90deg, #3965ff, #7551e9)', transition: 'width 0.5s' }}
                  />
                </div>
              </div>

              {/* Cash */}
              <div
                className="rounded-xl p-3 cursor-pointer transition-all"
                style={{
                  background: hovered === 'cash' ? 'rgba(1, 181, 116, 0.12)' : 'rgba(1, 181, 116, 0.06)',
                  border: `1px solid ${hovered === 'cash' ? 'rgba(1, 181, 116, 0.4)' : 'rgba(1, 181, 116, 0.15)'}`,
                  opacity: hovered === 'legal' ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={() => setHovered('cash')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => openDrill({ type: 'payment_type', value: 'cash', label: 'Наличные' })}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #01b574, #38d399)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Наличные</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#01b574' }}>{cashPct.toFixed(1)}%</span>
                </div>
                <div className="text-base font-extrabold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                  {fmt(cashAmount)}
                </div>
                <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{cashCount} платежей</div>
                <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(1,181,116,0.15)' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${cashPct}%`, background: 'linear-gradient(90deg, #01b574, #38d399)', transition: 'width 0.5s' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}


      </CardContent>
    </Card>
    <DrillDownModal filter={drillFilter} onClose={closeDrill} />
    </>
  );
};

export default PaymentTypeChart;