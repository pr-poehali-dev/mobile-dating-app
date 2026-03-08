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
  service_id?: number;
  service_name?: string;
  [key: string]: unknown;
}

interface ServiceIndexation {
  serviceKey: string;
  serviceName: string;
  avgCurrent: number;
  avgPrevious: number;
  percent: number;
}

const IndexationCard = () => {
  const { getDateRange, period, dateFrom, dateTo } = usePeriod();
  const { payments: allPayments, loading } = usePaymentsCache();

  const indexationData = useMemo(() => {
    const { from, to } = getDateRange();

    const approvedPayments = (Array.isArray(allPayments) ? allPayments : []).filter(
      (p: PaymentRecord) => p.status === 'approved'
    );

    const periodMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - periodMs);

    const currentPayments = approvedPayments.filter((p: PaymentRecord) => {
      const d = new Date(p.payment_date);
      return d >= from && d <= to;
    });

    const previousPayments = approvedPayments.filter((p: PaymentRecord) => {
      const d = new Date(p.payment_date);
      return d >= prevFrom && d <= prevTo;
    });

    // Группируем по сервису: считаем сумму и количество для средней цены
    const buildServiceMap = (payments: PaymentRecord[]) => {
      const map: { [key: string]: { totalAmount: number; count: number; name: string } } = {};
      payments.forEach((p) => {
        const key = p.service_id ? `service_${p.service_id}` : `no_service`;
        const name = p.service_name || (p.service_id ? `Сервис ${p.service_id}` : 'Без сервиса');
        if (!map[key]) map[key] = { totalAmount: 0, count: 0, name };
        map[key].totalAmount += p.amount;
        map[key].count += 1;
      });
      return map;
    };

    const currentMap = buildServiceMap(currentPayments);
    const previousMap = buildServiceMap(previousPayments);

    // Сравниваем только услуги, присутствующие в ОБОИХ периодах
    const commonKeys = Object.keys(currentMap).filter((key) => key in previousMap);

    const hasPreviousData = previousPayments.length > 0;

    if (commonKeys.length === 0) {
      return { indexationPercent: 0, serviceDetails: [], hasPreviousData };
    }

    const details: ServiceIndexation[] = [];
    let totalAvgCurrent = 0;
    let totalAvgPrevious = 0;

    commonKeys.forEach((key) => {
      const cur = currentMap[key];
      const prev = previousMap[key];
      const avgCurrent = cur.totalAmount / cur.count;
      const avgPrevious = prev.totalAmount / prev.count;
      const percent = parseFloat((((avgCurrent - avgPrevious) / avgPrevious) * 100).toFixed(1));

      totalAvgCurrent += avgCurrent;
      totalAvgPrevious += avgPrevious;

      details.push({
        serviceKey: key,
        serviceName: cur.name,
        avgCurrent,
        avgPrevious,
        percent,
      });
    });

    details.sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent));

    // Общий процент — через средние по всем общим сервисам
    const overallPercent = parseFloat(
      (((totalAvgCurrent - totalAvgPrevious) / totalAvgPrevious) * 100).toFixed(1)
    );

    return { indexationPercent: overallPercent, serviceDetails: details, hasPreviousData };
  }, [allPayments, period, dateFrom, dateTo]);

  const { indexationPercent, serviceDetails, hasPreviousData } = indexationData;

  return (
    <Card className="h-full" style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255, 181, 71, 0.4)', borderTop: '4px solid #ffb547' }}>
      <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4 sm:mb-5">
          <div>
            <div className={`${dashboardTypography.cardTitle} mb-2`}>Индексация</div>
            <div className={dashboardTypography.cardSubtitle}>Корректировка цен</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 181, 71, 0.1)', color: '#ffb547', border: '1px solid rgba(255, 181, 71, 0.2)' }}>
            <Icon name="TrendingUp" size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center" style={{ height: '60px' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            <div
              className={`${dashboardTypography.cardValue} mb-1`}
              style={{ color: serviceDetails.length === 0 ? undefined : indexationPercent > 0 ? '#01b574' : indexationPercent < 0 ? '#ff6b6b' : undefined }}
            >
              {serviceDetails.length > 0
                ? `${indexationPercent > 0 ? '+' : ''}${indexationPercent}%`
                : '—'}
            </div>
            <div className={`${dashboardTypography.cardSecondary} mb-2`}>за выбранный период</div>

            {hasPreviousData && serviceDetails.length > 0 ? (
              <div
                className={`flex items-center ${dashboardTypography.cardBadge} gap-1.5 mb-4`}
                style={{ color: indexationPercent >= 0 ? '#01b574' : '#ff6b6b' }}
              >
                <Icon name={indexationPercent >= 0 ? 'ArrowUp' : 'ArrowDown'} size={14} />
                {indexationPercent >= 0 ? '+' : ''}{indexationPercent}% к предыдущему периоду
              </div>
            ) : (
              <div className={`flex items-center ${dashboardTypography.cardBadge} gap-1.5 mb-4`} style={{ color: 'hsl(var(--muted-foreground))' }}>
                +0% к предыдущему периоду
              </div>
            )}

            {serviceDetails.length > 0 && (
              <div className="border-t border-border pt-3 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Расшифровка по сервисам</div>
                {serviceDetails.slice(0, 5).map((item) => (
                  <div key={item.serviceKey} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: item.percent >= 0 ? '#01b574' : '#ff6b6b' }}
                      />
                      <span className="text-xs text-muted-foreground truncate">{item.serviceName}</span>
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: item.percent >= 0 ? '#01b574' : '#ff6b6b' }}>
                      {item.percent >= 0 ? '+' : ''}{item.percent}%
                    </span>
                  </div>
                ))}
                {serviceDetails.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    +{serviceDetails.length - 5} сервисов
                  </div>
                )}
              </div>
            )}

            {!hasPreviousData && (
              <div className="border-t border-border pt-3">
                <div className="text-xs text-muted-foreground text-center">Нет данных для сравнения с предыдущим периодом</div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default IndexationCard;
