import { Card, CardContent } from '@/components/ui/card';
import { Line } from 'react-chartjs-2';
import { useState, useEffect, useMemo } from 'react';
import { usePeriod } from '@/contexts/PeriodContext';
import Icon from '@/components/ui/icon';
import { dashboardTypography } from '../dashboardStyles';
import { usePaymentsCache } from '@/contexts/PaymentsCacheContext';
import { useDrillDown } from '../useDrillDown';
import DrillDownModal from '../DrillDownModal';

interface PaymentRecord {
  status: string;
  payment_date: string;
  amount: number;
  legal_entity_name?: string;
  [key: string]: unknown;
}

const LINE_COLORS = [
  { line: 'rgba(57, 101, 255, 1)',   fill: 'rgba(57, 101, 255, 0.12)'  },
  { line: 'rgba(117, 81, 233, 1)',   fill: 'rgba(117, 81, 233, 0.10)'  },
  { line: 'rgba(1, 181, 116, 1)',    fill: 'rgba(1, 181, 116, 0.10)'   },
  { line: 'rgba(255, 181, 71, 1)',   fill: 'rgba(255, 181, 71, 0.10)'  },
  { line: 'rgba(255, 107, 107, 1)',  fill: 'rgba(255, 107, 107, 0.10)' },
  { line: 'rgba(78, 205, 196, 1)',   fill: 'rgba(78, 205, 196, 0.10)'  },
  { line: 'rgba(227, 26, 26, 1)',    fill: 'rgba(227, 26, 26, 0.10)'   },
  { line: 'rgba(255, 159, 243, 1)',  fill: 'rgba(255, 159, 243, 0.10)' },
];

const ACCENT = 'rgba(57,101,255,';

const fmt = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн ₽`;
  if (v >= 1_000) return `${Math.round(v / 1_000)} тыс ₽`;
  return new Intl.NumberFormat('ru-RU').format(v) + ' ₽';
};

const LegalEntityComparisonChart = () => {
  const { period, getDateRange, dateFrom, dateTo } = usePeriod();
  const { payments: allPayments, loading } = usePaymentsCache();
  const { drillFilter, openDrill, closeDrill } = useDrillDown();
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const check = () => setIsLight(document.documentElement.classList.contains('light'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const legalEntityData = useMemo(() => {
    const { from, to } = getDateRange();

    const filtered = (Array.isArray(allPayments) ? allPayments : []).filter((p: PaymentRecord) => {
      if (p.status !== 'approved') return false;
      const d = new Date(p.payment_date);
      return d >= from && d <= to;
    });

    const entityMap: { [key: string]: number } = {};
    filtered.forEach((payment: PaymentRecord) => {
      const entity = payment.legal_entity_name || 'Без юр. лица';
      entityMap[entity] = (entityMap[entity] || 0) + payment.amount;
    });

    return Object.entries(entityMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [allPayments, period, dateFrom, dateTo]);

  const displayData = showAll ? legalEntityData : legalEntityData.slice(0, 5);
  const total = legalEntityData.reduce((s, c) => s + c.amount, 0);

  const tickColor = isLight ? 'rgba(30,30,50,0.6)' : 'rgba(180,190,220,0.65)';
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';

  const areaData = {
    labels: displayData.map((_, i) => `#${i + 1}`),
    datasets: [{
      label: 'Расходы',
      data: displayData.map(d => d.amount),
      borderColor: `${ACCENT}0.9)`,
      backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
        const { ctx: c, chartArea } = ctx.chart;
        if (!chartArea) return `${ACCENT}0.1)`;
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, isLight ? `${ACCENT}0.18)` : `${ACCENT}0.22)`);
        gradient.addColorStop(1, `${ACCENT}0.0)`);
        return gradient;
      },
      pointBackgroundColor: displayData.map((_, i) => LINE_COLORS[i % LINE_COLORS.length].line),
      pointBorderColor: isLight ? '#ffffff' : '#1a1a2e',
      pointBorderWidth: 2,
      pointRadius: isMobile ? 5 : 7,
      pointHoverRadius: isMobile ? 8 : 10,
      fill: true,
      tension: 0.38,
      borderWidth: 2.5,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    onClick: (_event: unknown, elements: { index: number }[]) => {
      if (!elements.length) return;
      const name = displayData[elements[0].index]?.name;
      if (name) openDrill({ type: 'legal_entity', value: name, label: name });
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: !isMobile,
        backgroundColor: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(18,20,45,0.96)',
        titleColor: isLight ? 'rgba(30,30,50,0.9)' : 'rgba(200,210,235,0.95)',
        bodyColor: isLight ? 'rgba(30,30,50,0.72)' : 'rgba(170,185,215,0.85)',
        borderColor: isLight ? 'rgba(57,101,255,0.2)' : 'rgba(57,101,255,0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        caretSize: 6,
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            return displayData[idx]?.name ?? '';
          },
          label: (context: { raw: unknown }) => `  ${fmt(context.raw as number)}`,
          footer: () => 'Нажмите для детализации',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: tickColor,
          font: { size: isMobile ? 10 : 11, family: 'Plus Jakarta Sans, sans-serif' as const },
          padding: 6,
          callback: (_val: unknown, index: number) => {
            const name = displayData[index]?.name ?? '';
            if (isMobile) return name.length > 8 ? name.slice(0, 7) + '…' : name;
            return name.length > 14 ? name.slice(0, 13) + '…' : name;
          },
        },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: tickColor,
          font: { size: isMobile ? 10 : 11, family: 'Plus Jakarta Sans, sans-serif' as const },
          maxTicksLimit: isMobile ? 4 : 6,
          padding: 8,
          callback: (value: unknown) => {
            const v = value as number;
            if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' млн';
            if (v >= 1_000) return Math.round(v / 1_000) + 'k';
            return String(v);
          },
        },
        grid: { color: gridColor, lineWidth: 1 },
        border: { dash: [4, 4], display: false },
      },
    },
  };

  return (
    <>
    <Card style={{
      background: 'hsl(var(--card))',
      border: '1px solid rgba(57,101,255,0.22)',
      borderTop: '4px solid rgba(57,101,255,1)',
      boxShadow: isLight ? '0 4px 24px rgba(57,101,255,0.07)' : '0 4px 28px rgba(57,101,255,0.13)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '220px', height: '220px',
        background: 'radial-gradient(circle at top right, rgba(57,101,255,0.07) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      <CardContent className="p-4 sm:p-6" style={{ position: 'relative', zIndex: 1 }}>
        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(57,101,255,0.12)',
                border: '1px solid rgba(57,101,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="Building2" size={16} style={{ color: 'rgba(57,101,255,1)' }} />
              </div>
              <h3 className={dashboardTypography.cardTitle} style={{ fontSize: '15px' }}>
                Сравнение по Юридическим Лицам
              </h3>
            </div>
            {!loading && total > 0 && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginLeft: '44px' }}>
                Итого: <span style={{ color: 'rgba(57,101,255,1)', fontWeight: 700 }}>{fmt(total)}</span>
                <span style={{ marginLeft: '6px', opacity: 0.7 }}>· {legalEntityData.length} юр. лиц</span>
              </div>
            )}
          </div>

          {legalEntityData.length > 5 && (
            <div style={{ display: 'flex', gap: '3px', background: isLight ? 'rgba(0,0,0,0.05)' : 'hsl(var(--muted))', padding: '3px', borderRadius: '10px' }}>
              {[{ label: 'Топ-5', val: false }, { label: 'Все', val: true }].map(({ label, val }) => (
                <button
                  key={label}
                  onClick={() => setShowAll(val)}
                  style={{
                    background: showAll === val ? 'rgba(57,101,255,1)' : 'transparent',
                    border: 'none',
                    color: showAll === val ? 'white' : 'hsl(var(--muted-foreground))',
                    padding: isMobile ? '5px 10px' : '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '11px' : '12px',
                    fontWeight: '600',
                    transition: 'all 0.18s',
                    boxShadow: showAll === val ? '0 2px 10px rgba(57,101,255,0.4)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', flexDirection: 'column', gap: '12px' }}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'rgba(57,101,255,1)' }} />
            <span style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Загрузка данных...</span>
          </div>
        ) : displayData.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '12px' }}>
            <Icon name="PackageSearch" size={44} style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.35 }} />
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px' }}>Нет данных за выбранный период</p>
          </div>
        ) : (
          <>
            {/* Цветные точки-легенда */}
            {!isMobile && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                {displayData.map((item, i) => {
                  const col = LINE_COLORS[i % LINE_COLORS.length];
                  return (
                    <div key={item.name} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '3px 10px 3px 7px', borderRadius: '99px',
                      background: isLight ? col.line.replace('1)', '0.08)') : col.line.replace('1)', '0.12)'),
                      border: `1px solid ${col.line.replace('1)', '0.25)')}`,
                    }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: col.line, flexShrink: 0,
                        boxShadow: `0 0 5px ${col.line.replace('1)', '0.6)')}`,
                      }} />
                      <span style={{
                        fontSize: '11px', fontWeight: 600,
                        color: isLight ? 'rgba(25,25,45,0.82)' : 'rgba(210,220,240,0.88)',
                        whiteSpace: 'nowrap', maxWidth: '130px',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="h-[220px] sm:h-[300px]" style={{ position: 'relative', cursor: 'pointer' }}>
              <Line data={areaData} options={chartOptions} />
            </div>

            {/* Мобильный список */}
            {isMobile && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {displayData.map((item, i) => {
                  const col = LINE_COLORS[i % LINE_COLORS.length];
                  const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.line, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '12px', color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: col.line, flexShrink: 0 }}>{pct}%</span>
                      <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>{fmt(item.amount)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
    <DrillDownModal filter={drillFilter} onClose={closeDrill} />
    </>
  );
};

export default LegalEntityComparisonChart;