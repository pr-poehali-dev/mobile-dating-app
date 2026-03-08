import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useEffect, useMemo } from 'react';
import { dashboardTypography } from './dashboardStyles';
import { usePeriod } from '@/contexts/PeriodContext';
import { usePaymentsCache } from '@/contexts/PaymentsCacheContext';

interface Service {
  name: string;
  amount: number;
  trend: number;
}

interface Payment {
  amount: number;
  payment_date: string;
  service_name?: string;
  status: string;
}

const BAR_COLORS = ['#3965ff', '#2CD9FF', '#01B574', '#7551e9', '#ffb547', '#ff6b6b', '#4ecdc4', '#ff9ff3'];

const fmt = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн ₽`;
  if (v >= 1_000) return `${Math.round(v / 1_000)} тыс ₽`;
  return `${v.toLocaleString('ru-RU')} ₽`;
};

const Dashboard2ServicesDynamics = () => {
  const { period, getDateRange, dateFrom, dateTo } = usePeriod();
  const { payments: allPayments, loading } = usePaymentsCache();
  const [mounted, setMounted] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const check = () => setIsLight(document.documentElement.classList.contains('light'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, [allPayments, period, dateFrom, dateTo]);

  const servicesData = useMemo(() => {
    const { from, to } = getDateRange();
    const diffMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - diffMs);

    const approved = (Array.isArray(allPayments) ? allPayments : []).filter(
      (p: Payment) => p.status === 'approved'
    );

    const current = approved.filter((p: Payment) => {
      const d = new Date(p.payment_date);
      return d >= from && d <= to;
    });

    const previous = approved.filter((p: Payment) => {
      const d = new Date(p.payment_date);
      return d >= prevFrom && d <= prevTo;
    });

    const byService = (payments: Payment[]) => {
      const map: { [key: string]: number } = {};
      payments.forEach((p) => {
        const name = p.service_name || 'Без сервиса';
        map[name] = (map[name] || 0) + p.amount;
      });
      return map;
    };

    const currentMap = byService(current);
    const previousMap = byService(previous);

    const services: Service[] = Object.keys(currentMap).map((name) => {
      const cur = currentMap[name];
      const prev = previousMap[name] || 0;
      let trend = 0;
      if (prev > 0) {
        trend = Math.round(((cur - prev) / prev) * 100);
      } else if (cur > 0) {
        trend = 100;
      }
      return { name, amount: cur, trend };
    });

    return services;
  }, [allPayments, period, dateFrom, dateTo]);

  const sortedData = [...servicesData].sort((a, b) => b.amount - a.amount);
  const maxAmount = sortedData[0]?.amount || 1;
  const total = sortedData.reduce((s, c) => s + c.amount, 0);
  const growing = sortedData.filter((s) => s.trend > 0).length;
  const falling = sortedData.filter((s) => s.trend < 0).length;

  const itemBg = isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.025)';
  const itemBorder = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
  const nameColor = isLight ? 'rgba(30,30,50,0.8)' : 'rgba(180,195,225,0.85)';
  const amountColor = 'hsl(var(--foreground))';
  const trackBg = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)';

  return (
    <Card className="w-full max-w-full" style={{
      background: 'hsl(var(--card))',
      border: '1px solid rgba(45,217,255,0.25)',
      borderTop: '4px solid #2CD9FF',
      boxShadow: isLight
        ? '0 4px 20px rgba(45,217,255,0.07)'
        : '0 4px 24px rgba(45,217,255,0.1)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Декоративный фон */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '180px', height: '180px',
        background: 'radial-gradient(circle at top right, rgba(45,217,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <CardContent className="p-4 sm:p-6" style={{ position: 'relative', zIndex: 1 }}>
        {/* Шапка */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
            background: 'rgba(45,217,255,0.12)',
            border: '1px solid rgba(45,217,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="Activity" size={16} style={{ color: '#2CD9FF' }} />
          </div>
          <div>
            <h3 className={dashboardTypography.cardTitle} style={{ fontSize: '15px', lineHeight: 1.2 }}>
              Динамика расходов по сервисам
            </h3>
            {!loading && total > 0 && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                Итого:{' '}
                <span style={{ color: '#2CD9FF', fontWeight: 700 }}>{fmt(total)}</span>
                {sortedData.length > 0 && (
                  <span style={{ marginLeft: '6px', opacity: 0.7 }}>· {sortedData.length} сервисов</span>
                )}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '12px' }}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#2CD9FF' }} />
            <span style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Загрузка данных...</span>
          </div>
        ) : sortedData.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
            <Icon name="PackageSearch" size={44} style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.35 }} />
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px' }}>Нет данных за выбранный период</p>
          </div>
        ) : (
          <>
            {/* Список сервисов */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {sortedData.map((service, index) => {
                const color = BAR_COLORS[index % BAR_COLORS.length];
                const barPct = (service.amount / maxAmount) * 100;
                const share = total > 0 ? Math.round((service.amount / total) * 100) : 0;

                return (
                  <div
                    key={service.name}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: itemBg,
                      border: `1px solid ${itemBorder}`,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isLight
                        ? `${color}12`
                        : `${color}14`;
                      e.currentTarget.style.borderColor = `${color}45`;
                      e.currentTarget.style.boxShadow = `0 3px 14px ${color}22`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = itemBg;
                      e.currentTarget.style.borderColor = itemBorder;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Имя + сумма + тренд */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: color, flexShrink: 0,
                          boxShadow: `0 0 6px ${color}80`,
                        }} />
                        <span style={{
                          fontSize: '13px', fontWeight: 500,
                          color: nameColor,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {service.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: amountColor }}>
                          {fmt(service.amount)}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: 500,
                          color: isLight ? 'rgba(30,30,50,0.45)' : 'rgba(180,190,220,0.5)',
                        }}>
                          {share < 1 && share > 0 ? '<1' : share}%
                        </span>
                        {service.trend !== 0 && (
                          <div style={{
                            padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                            color: '#fff',
                            background: service.trend > 0 ? '#01B574' : '#E31A1A',
                            boxShadow: service.trend > 0 ? '0 1px 6px rgba(1,181,116,0.4)' : '0 1px 6px rgba(227,26,26,0.4)',
                          }}>
                            {service.trend > 0 ? '+' : ''}{service.trend}%
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Прогресс-бар */}
                    <div style={{ height: '4px', borderRadius: '99px', background: trackBg, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '99px',
                        background: `linear-gradient(90deg, ${color}80, ${color})`,
                        width: mounted ? `${barPct}%` : '0%',
                        transition: 'width 0.65s cubic-bezier(.4,0,.2,1)',
                        transitionDelay: `${index * 50}ms`,
                        boxShadow: `0 0 8px ${color}60`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Итоговые плашки */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { icon: 'Layers' as const,      label: 'Всего',      value: sortedData.length, color: '#3965ff', bgD: 'rgba(57,101,255,0.1)',   bgL: 'rgba(57,101,255,0.07)'  },
                { icon: 'TrendingUp' as const,   label: 'Растущих',   value: growing,           color: '#01B574', bgD: 'rgba(1,181,116,0.1)',    bgL: 'rgba(1,181,116,0.07)'   },
                { icon: 'TrendingDown' as const, label: 'Снижается',  value: falling,           color: '#ff6b6b', bgD: 'rgba(255,107,107,0.1)',  bgL: 'rgba(255,107,107,0.07)' },
              ].map((stat) => (
                <div key={stat.label} style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: isLight ? stat.bgL : stat.bgD,
                  border: `1px solid ${stat.color}40`,
                  textAlign: 'center',
                }}>
                  <Icon name={stat.icon} size={14} style={{ color: stat.color, marginBottom: '4px' }} />
                  <div style={{ fontSize: '20px', fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginTop: '3px' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard2ServicesDynamics;
