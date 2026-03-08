import { Card, CardContent } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
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
  contractor_name?: string;
  [key: string]: unknown;
}

const LINE_COLORS = [
  { line: 'rgba(117, 81, 233, 1)', fill: 'rgba(117, 81, 233, 0.12)' },
  { line: 'rgba(57, 101, 255, 1)', fill: 'rgba(57, 101, 255, 0.10)' },
  { line: 'rgba(1, 181, 116, 1)', fill: 'rgba(1, 181, 116, 0.10)' },
  { line: 'rgba(255, 181, 71, 1)', fill: 'rgba(255, 181, 71, 0.10)' },
  { line: 'rgba(255, 107, 107, 1)', fill: 'rgba(255, 107, 107, 0.10)' },
];

const fmt = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн ₽`;
  if (v >= 1_000) return `${Math.round(v / 1_000)} тыс ₽`;
  return new Intl.NumberFormat('ru-RU').format(v) + ' ₽';
};

const ContractorComparisonChart = () => {
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

  // Сбрасываем showAll при смене периода
  useEffect(() => {
    setShowAll(false);
  }, [period, dateFrom, dateTo]);

  const contractorData = useMemo(() => {
    const { from, to } = getDateRange();

    const contractorMap: { [key: string]: number } = {};

    (Array.isArray(allPayments) ? allPayments : []).forEach((p: PaymentRecord) => {
      if (p.status !== 'approved') return;
      const d = new Date(p.payment_date);
      if (d < from || d > to) return;
      const name = p.contractor_name || 'Без контрагента';
      contractorMap[name] = (contractorMap[name] || 0) + p.amount;
    });

    return Object.entries(contractorMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [allPayments, period, dateFrom, dateTo]);

  const total = useMemo(
    () => contractorData.reduce((s, c) => s + c.amount, 0),
    [contractorData]
  );

  const displayData = useMemo(
    () => (showAll ? contractorData : contractorData.slice(0, 5)),
    [contractorData, showAll]
  );

  const chartKey = useMemo(
    () => `${period}-${dateFrom}-${dateTo}-${showAll}-${displayData.length}`,
    [period, dateFrom, dateTo, showAll, displayData.length]
  );

  const tickColor = isLight ? 'rgba(30,30,50,0.6)' : 'rgba(180,190,220,0.65)';
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';

  const areaData = useMemo(() => ({
    labels: displayData.map(d => d.name),
    datasets: [{
      label: 'Расходы',
      data: displayData.map(d => d.amount),
      backgroundColor: (ctx: { dataIndex: number; chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
        const { ctx: c, chartArea } = ctx.chart;
        const col = LINE_COLORS[ctx.dataIndex % LINE_COLORS.length];
        if (!chartArea) return col.line.replace('1)', '0.75)');
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, col.line.replace('1)', '0.85)'));
        gradient.addColorStop(1, col.line.replace('1)', '0.45)'));
        return gradient;
      },
      borderColor: displayData.map((_, i) => LINE_COLORS[i % LINE_COLORS.length].line),
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: displayData.map((_, i) => LINE_COLORS[i % LINE_COLORS.length].line),
    }],
  }), [displayData, isLight, isMobile]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    interaction: { mode: 'nearest' as const, intersect: true },
    onClick: (_event: unknown, elements: { index: number }[]) => {
      if (!elements.length) return;
      const name = displayData[elements[0].index]?.name;
      if (name) openDrill({ type: 'contractor', value: name, label: name });
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: !isMobile,
        backgroundColor: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(18,20,45,0.96)',
        titleColor: isLight ? 'rgba(30,30,50,0.9)' : 'rgba(200,210,235,0.95)',
        bodyColor: isLight ? 'rgba(30,30,50,0.72)' : 'rgba(170,185,215,0.85)',
        borderColor: isLight ? 'rgba(117,81,233,0.2)' : 'rgba(117,81,233,0.3)',
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
  }), [displayData, isLight, isMobile, tickColor, gridColor]);

  return (
    <>
    <Card style={{
      background: 'hsl(var(--card))',
      border: '1px solid rgba(117,81,233,0.22)',
      borderTop: '4px solid #7551e9',
      boxShadow: isLight ? '0 4px 24px rgba(117,81,233,0.07)' : '0 4px 28px rgba(117,81,233,0.13)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '220px', height: '220px',
        background: 'radial-gradient(circle at top right, rgba(117,81,233,0.07) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      <CardContent className="p-4 sm:p-6" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(117,81,233,0.12)',
                border: '1px solid rgba(117,81,233,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="Users" size={16} style={{ color: '#7551e9' }} />
              </div>
              <h3 className={dashboardTypography.cardTitle} style={{ fontSize: '15px' }}>
                Сравнение по Сервисам
              </h3>
            </div>
            {!loading && total > 0 && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginLeft: '44px' }}>
                Итого: <span style={{ color: '#7551e9', fontWeight: 700 }}>{fmt(total)}</span>
                <span style={{ marginLeft: '6px', opacity: 0.7 }}>· {contractorData.length} контрагентов</span>
              </div>
            )}
          </div>

          {contractorData.length > 5 && (
            <div style={{ display: 'flex', gap: '3px', background: isLight ? 'rgba(0,0,0,0.05)' : 'hsl(var(--muted))', padding: '3px', borderRadius: '10px' }}>
              {[{ label: 'Топ-5', val: false }, { label: 'Все', val: true }].map(({ label, val }) => (
                <button
                  key={label}
                  onClick={() => setShowAll(val)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    background: showAll === val ? '#7551e9' : 'transparent',
                    color: showAll === val ? '#fff' : 'hsl(var(--muted-foreground))',
                    fontWeight: '600',
                    transition: 'all 0.18s',
                    boxShadow: showAll === val ? '0 2px 10px rgba(117,81,233,0.4)' : 'none',
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
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#7551e9' }} />
            <span style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Загрузка данных...</span>
          </div>
        ) : displayData.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '12px' }}>
            <Icon name="PackageSearch" size={44} style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.35 }} />
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px' }}>Нет данных за выбранный период</p>
          </div>
        ) : (
          <>
            {!isMobile && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                {displayData.map((item, i) => {
                  const col = LINE_COLORS[i % LINE_COLORS.length];
                  return (
                    <div key={`${item.name}-${i}`} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '3px 10px 3px 7px', borderRadius: '99px',
                      background: isLight ? `${col.line.replace('1)', '0.08)')}` : `${col.line.replace('1)', '0.12)')}`,
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
              <Bar key={chartKey} data={areaData} options={chartOptions} />
            </div>

            {isMobile && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {displayData.map((item, i) => {
                  const col = LINE_COLORS[i % LINE_COLORS.length];
                  const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={`${item.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

export default ContractorComparisonChart;