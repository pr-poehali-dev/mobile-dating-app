import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { usePeriod } from '@/contexts/PeriodContext';
import { usePaymentsCache } from '@/contexts/PaymentsCacheContext';
import { useDrillDown } from '../useDrillDown';
import DrillDownModal from '../DrillDownModal';

interface PaymentRecord {
  status: string;
  payment_date: string;
  amount: number;
  category_name?: string;
  [key: string]: unknown;
}

interface CategoryData {
  name: string;
  value: number;
  amount: number;
  color: string;
}

const ARC_PALETTE = [
  ['#ff7a00', '#ff9f1c', '#ffbf47'],
  ['#ff2d55', '#ff5e3a', '#ff8c42'],
  ['#5b21ff', '#7c3aed', '#a855f7'],
  ['#00c951', '#10d97c', '#34eba0'],
  ['#0099ff', '#00c6ff', '#38e0ff'],
  ['#f5c400', '#ffd600', '#ffe94d'],
  ['#e8005a', '#ff0080', '#ff44aa'],
  ['#00b4a0', '#00d4b8', '#00f0d0'],
];

const activeStyle = {
  background: '#7551e9',
  border: 'none',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600' as const,
  boxShadow: '0 2px 8px rgba(117, 81, 233, 0.3)',
};

const getInactiveStyle = () => ({
  background: 'transparent',
  border: 'none',
  color: 'hsl(var(--muted-foreground))',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600' as const,
});

interface RingChartProps {
  categories: CategoryData[];
  totalAmount: number;
  isMobile: boolean;
  isLight: boolean;
  onSegmentClick?: (name: string) => void;
}

const fmt = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' млн ₽';
  if (v >= 1_000) return Math.round(v / 1_000) + ' тыс ₽';
  return new Intl.NumberFormat('ru-RU').format(v) + ' ₽';
};

const RingChart = ({ categories, totalAmount, isMobile, isLight, onSegmentClick }: RingChartProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const size   = isMobile ? 200 : 260;
  const cx     = size / 2;
  const cy     = size / 2;
  const outerR = isMobile ? 84 : 108;
  const innerR = isMobile ? 58 : 74;
  const GAP    = 1.5;

  const total = categories.reduce((s, c) => s + c.amount, 0) || 1;

  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (r: number, a: number) => ({
    x: cx + r * Math.cos(toRad(a)),
    y: cy + r * Math.sin(toRad(a)),
  });

  const segPath = (startA: number, endA: number, rOut: number, rIn: number) => {
    const s1 = pt(rOut, startA), e1 = pt(rOut, endA);
    const s2 = pt(rIn, endA),   e2 = pt(rIn, startA);
    const large = (endA - startA) > 180 ? 1 : 0;
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${rOut} ${rOut} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${rIn} ${rIn} 0 ${large} 0 ${e2.x} ${e2.y}`,
      'Z',
    ].join(' ');
  };

  const segments = (() => {
    let angle = -90;
    return categories.slice(0, 8).map((cat, i) => {
      const pct    = cat.amount / total;
      const startA = angle + GAP;
      const endA   = angle + pct * 360 - GAP;
      angle += pct * 360;
      const palette = ARC_PALETTE[i % ARC_PALETTE.length];
      return { cat, i, startA, endA, palette, pct };
    });
  })();

  const hovCat = hovered !== null ? categories[hovered] : null;

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? '20px' : '28px' }}>
      {/* Пончик */}
      <div style={{ flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            {segments.map(({ i, palette }) => (
              <linearGradient key={i} id={`es-lg-${i}`} gradientUnits="userSpaceOnUse"
                x1={cx - outerR} y1={cy} x2={cx + outerR} y2={cy}>
                <stop offset="0%" stopColor={palette[0]} />
                <stop offset="100%" stopColor={palette[1]} />
              </linearGradient>
            ))}
            <filter id="es-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="5" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Фоновое кольцо */}
          <circle cx={cx} cy={cy} r={(outerR + innerR) / 2}
            fill="none" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'}
            strokeWidth={outerR - innerR}
          />

          {/* Сегменты */}
          {segments.map(({ i, startA, endA, palette }) => {
            const isHov = hovered === i;
            const rOut  = isHov ? outerR + 6 : outerR;
            const rIn   = isHov ? innerR - 2 : innerR;
            return (
              <path
                key={i}
                d={mounted ? segPath(startA, endA, rOut, rIn) : segPath(startA, startA + 0.01, outerR, innerR)}
                fill={`url(#es-lg-${i})`}
                filter={isHov ? 'url(#es-shadow)' : undefined}
                opacity={hovered !== null && !isHov ? 0.22 : 1}
                style={{ transition: 'all 0.22s cubic-bezier(.4,0,.2,1)', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSegmentClick?.(categories[i]?.name)}
              />
            );
          })}

          {/* Центральный круг */}
          <circle cx={cx} cy={cy} r={innerR - 3}
            fill="hsl(var(--card))"
            stroke={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'}
            strokeWidth={1.5}
          />

          {/* Текст центра */}
          {hovCat ? (
            <>
              <text x={cx} y={cy - (isMobile ? 10 : 14)} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: `${isMobile ? 8 : 10}px`, fontWeight: 600, fill: ARC_PALETTE[hovered! % ARC_PALETTE.length][1] }}>
                {hovCat.name.length > 14 ? hovCat.name.slice(0, 13) + '…' : hovCat.name}
              </text>
              <text x={cx} y={cy + (isMobile ? 3 : 4)} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: `${isMobile ? 13 : 16}px`, fontWeight: 800, fill: isLight ? 'rgba(20,20,40,0.9)' : '#fff' }}>
                {hovCat.value}%
              </text>
              <text x={cx} y={cy + (isMobile ? 17 : 21)} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: `${isMobile ? 8 : 10}px`, fontWeight: 500, fill: isLight ? 'rgba(20,20,40,0.5)' : 'rgba(255,255,255,0.4)' }}>
                {fmt(hovCat.amount)}
              </text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - (isMobile ? 12 : 16)} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: `${isMobile ? 8 : 10}px`, fontWeight: 600, fill: isLight ? 'rgba(20,20,40,0.45)' : 'rgba(255,255,255,0.35)', letterSpacing: '0.8px' }}>
                ИТОГО
              </text>
              <text x={cx} y={cy + (isMobile ? 2 : 2)} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: `${isMobile ? 12 : 15}px`, fontWeight: 900, fill: isLight ? 'rgba(20,20,40,0.9)' : '#fff' }}>
                {fmt(totalAmount)}
              </text>
              <text x={cx} y={cy + (isMobile ? 17 : 21)} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: `${isMobile ? 8 : 9}px`, fontWeight: 500, fill: isLight ? 'rgba(20,20,40,0.35)' : 'rgba(255,255,255,0.28)' }}>
                {categories.length} {categories.length === 1 ? 'категория' : categories.length < 5 ? 'категории' : 'категорий'}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Легенда */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '6px' : '8px', width: isMobile ? '100%' : undefined }}>
        {segments.map(({ cat, i, pct, palette }) => {
          const isHov = hovered === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSegmentClick?.(cat.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: isMobile ? '7px 10px' : '9px 12px',
                borderRadius: '10px',
                background: isHov ? `${palette[1]}18` : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${isHov ? `${palette[1]}45` : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                opacity: hovered !== null && !isHov ? 0.35 : 1,
              }}
            >
              {/* Цветная вертикальная линия */}
              <div style={{
                width: isMobile ? '3px' : '4px',
                height: isMobile ? '28px' : '34px',
                borderRadius: '99px',
                background: `linear-gradient(180deg, ${palette[0]}, ${palette[1]})`,
                flexShrink: 0,
              }} />

              {/* Название + мини-бар */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  transition: 'color 0.18s',
                  marginBottom: '4px',
                }}>
                  {cat.name}
                </div>
                <div style={{ height: '3px', borderRadius: '99px', background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '99px',
                    background: `linear-gradient(90deg, ${palette[0]}, ${palette[1]})`,
                    width: mounted ? `${pct * 100}%` : '0%',
                    transition: 'width 0.7s cubic-bezier(.4,0,.2,1)',
                    transitionDelay: `${i * 50}ms`,
                  }} />
                </div>
              </div>

              {/* % и сумма */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 800, color: palette[1] }}>
                  {cat.value}%
                </div>
                <div style={{ fontSize: isMobile ? '9px' : '10px', color: isLight ? 'rgba(20,20,40,0.45)' : 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
                  {fmt(cat.amount)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ExpenseStructureChart = () => {
  const { period, getDateRange, dateFrom, dateTo } = usePeriod();
  const { payments: allPayments, loading } = usePaymentsCache();
  const { drillFilter, openDrill, closeDrill } = useDrillDown();
  const [activeTab, setActiveTab] = useState<'general' | 'details'>('general');
  const [isMobile, setIsMobile] = useState(false);
  const [isLight, setIsLight] = useState(false);

  const handleCategoryClick = (name: string) => {
    openDrill({ type: 'category', value: name, label: name });
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const checkTheme = () => setIsLight(document.documentElement.classList.contains('light'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const { categories, totalAmount } = useMemo(() => {
    const { from, to } = getDateRange();

    const filtered = (Array.isArray(allPayments) ? allPayments : []).filter((p: PaymentRecord) => {
      if (p.status !== 'approved') return false;
      const raw = String(p.payment_date);
      const d = new Date(raw.includes('T') ? raw : raw + 'T00:00:00');
      return d >= from && d <= to;
    });

    const categoryMap: Record<string, number> = {};
    let total = 0;
    filtered.forEach((payment: PaymentRecord) => {
      const name = payment.category_name || 'Прочее';
      categoryMap[name] = (categoryMap[name] || 0) + payment.amount;
      total += payment.amount;
    });

    const categoriesData = Object.entries(categoryMap)
      .map(([name, amount], index) => ({
        name,
        amount,
        value: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: ARC_PALETTE[index % ARC_PALETTE.length][1],
      }))
      .sort((a, b) => b.amount - a.amount);

    return { categories: categoriesData, totalAmount: total };
  }, [allPayments, period, dateFrom, dateTo]);

  return (
    <>
    <Card style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
      <CardContent className="p-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--foreground))' }}>Структура Расходов</h3>
          <div style={{ display: 'flex', gap: '8px', background: 'hsl(var(--muted))', padding: '4px', borderRadius: '10px' }}>
            <button style={activeTab === 'general' ? activeStyle : getInactiveStyle()} onClick={() => setActiveTab('general')}>
              Общие
            </button>
            <button style={activeTab === 'details' ? activeStyle : getInactiveStyle()} onClick={() => setActiveTab('details')}>
              Детали
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Нет данных за выбранный период</p>
          </div>
        ) : activeTab === 'general' ? (
          <RingChart categories={categories} totalAmount={totalAmount} isMobile={isMobile} isLight={isLight} onSegmentClick={handleCategoryClick} />
        ) : (
          <div className="h-[300px] sm:h-[450px]" style={{ overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: 'hsl(var(--muted-foreground))', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Категория</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'hsl(var(--muted-foreground))', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Доля</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'hsl(var(--muted-foreground))', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr
                    key={cat.name}
                    onClick={() => handleCategoryClick(cat.name)}
                    style={{ borderBottom: '1px solid hsl(var(--border))', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(117,81,233,0.06)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                        <span style={{ color: 'hsl(var(--foreground))', fontSize: '14px', fontWeight: '500' }}>{cat.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', padding: '14px 12px' }}>
                      <span style={{ color: 'hsl(var(--foreground))', fontSize: '14px', fontWeight: '600' }}>{cat.value}%</span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '14px 12px' }}>
                      <span style={{ color: 'hsl(var(--foreground))', fontSize: '14px' }}>{new Intl.NumberFormat('ru-RU').format(cat.amount)} ₽</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '16px', padding: '14px 12px', background: 'rgba(117, 81, 233, 0.1)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', fontWeight: '500' }}>Итого</span>
              <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: '700' }}>
                {new Intl.NumberFormat('ru-RU').format(totalAmount)} ₽
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    <DrillDownModal filter={drillFilter} onClose={closeDrill} />
    </>
  );
};

export default ExpenseStructureChart;