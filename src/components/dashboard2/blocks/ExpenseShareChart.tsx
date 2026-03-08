import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { usePeriod } from '@/contexts/PeriodContext';
import { usePaymentsCache, PaymentRecord } from '@/contexts/PaymentsCacheContext';
import { useDrillDown } from '../useDrillDown';
import DrillDownModal from '../DrillDownModal';
import Icon from '@/components/ui/icon';
import { exportPaymentsToExcel } from '@/utils/exportExcel';

// ─── Palette ────────────────────────────────────────────────────────────────
const PALETTE = [
  ['#7551e9', '#a47bf5'],
  ['#ff7a00', '#ffb347'],
  ['#00c951', '#34eba0'],
  ['#0099ff', '#38e0ff'],
  ['#ff2d55', '#ff8c42'],
  ['#f5c400', '#ffe94d'],
  ['#00b4a0', '#00f0d0'],
  ['#e8005a', '#ff44aa'],
];
const OTHER_COLOR = ['#6b7280', '#9ca3af'];

// ─── Types ───────────────────────────────────────────────────────────────────
type GroupKey = 'service' | 'department' | 'category';

interface SliceData {
  name: string;
  amount: number;
  pct: number;
  color: string;
  colorEnd: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' млн ₽';
  if (v >= 1_000) return Math.round(v / 1_000) + ' тыс ₽';
  return new Intl.NumberFormat('ru-RU').format(v) + ' ₽';
};

const toRad = (d: number) => (d * Math.PI) / 180;

function segPath(cx: number, cy: number, rOut: number, rIn: number, startA: number, endA: number) {
  const pt = (r: number, a: number) => ({ x: cx + r * Math.cos(toRad(a)), y: cy + r * Math.sin(toRad(a)) });
  const s1 = pt(rOut, startA), e1 = pt(rOut, endA);
  const s2 = pt(rIn, endA), e2 = pt(rIn, startA);
  const large = endA - startA > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
}

// ─── Donut ────────────────────────────────────────────────────────────────────
interface DonutProps {
  slices: SliceData[];
  total: number;
  size: number;
  onSegmentClick?: (name: string) => void;
}

const Donut = ({ slices, total, size, onSegmentClick }: DonutProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [slices]);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.29;
  const GAP = 1.2;

  const segments = useMemo(() => {
    let angle = -90;
    return slices.map((s, i) => {
      const startA = angle + GAP;
      const endA = angle + (s.pct / 100) * 360 - GAP;
      angle += (s.pct / 100) * 360;
      return { ...s, i, startA, endA };
    });
  }, [slices]);

  const hovSlice = hovered !== null ? slices[hovered] : null;
  const isLight = document.documentElement.classList.contains('light');

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHovered(null); setTooltip(null); }}
      >
        <defs>
          {segments.map(({ i, color, colorEnd }) => (
            <linearGradient key={i} id={`es2-lg-${i}`} gradientUnits="userSpaceOnUse"
              x1={cx - outerR} y1={cy} x2={cx + outerR} y2={cy}>
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={colorEnd} />
            </linearGradient>
          ))}
          <filter id="es2-shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Background ring */}
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2}
          fill="none"
          stroke={isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)'}
          strokeWidth={outerR - innerR}
        />

        {/* Segments */}
        {segments.map(({ i, startA, endA }) => {
          const isHov = hovered === i;
          const rOut = isHov ? outerR + 7 : outerR;
          const rIn = isHov ? innerR - 3 : innerR;
          return (
            <path
              key={i}
              d={mounted ? segPath(cx, cy, rOut, rIn, startA, endA) : segPath(cx, cy, outerR, innerR, startA, startA + 0.01)}
              fill={`url(#es2-lg-${i})`}
              filter={isHov ? 'url(#es2-shadow)' : undefined}
              opacity={hovered !== null && !isHov ? 0.2 : 1}
              style={{ transition: 'all 0.22s cubic-bezier(.4,0,.2,1)', cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onClick={() => onSegmentClick?.(slices[i]?.name)}
            />
          );
        })}

        {/* Center */}
        <circle cx={cx} cy={cy} r={innerR - 3}
          fill="hsl(var(--card))"
          stroke={isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'}
          strokeWidth={1.5}
        />

        {hovSlice ? (
          <>
            <text x={cx} y={cy - 14} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: '10px', fontWeight: 600, fill: hovSlice.color }}>
              {hovSlice.name.length > 13 ? hovSlice.name.slice(0, 12) + '…' : hovSlice.name}
            </text>
            <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: '18px', fontWeight: 900, fill: isLight ? '#1a1a2e' : '#fff' }}>
              {hovSlice.pct}%
            </text>
            <text x={cx} y={cy + 22} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: '10px', fontWeight: 500, fill: isLight ? 'rgba(20,20,40,0.5)' : 'rgba(255,255,255,0.4)' }}>
              {fmt(hovSlice.amount)}
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 12} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: '10px', fontWeight: 600, fill: isLight ? 'rgba(20,20,40,0.4)' : 'rgba(255,255,255,0.3)', letterSpacing: '0.8px' }}>
              ИТОГО
            </text>
            <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: '14px', fontWeight: 900, fill: isLight ? '#1a1a2e' : '#fff' }}>
              {fmt(total)}
            </text>
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hovSlice && tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x + 12,
          top: tooltip.y - 40,
          background: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(30,20,60,0.97)',
          border: `1px solid ${hovSlice.color}44`,
          borderRadius: '10px',
          padding: '8px 14px',
          pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          zIndex: 20,
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: hovSlice.color, marginBottom: '2px' }}>
            {hovSlice.name}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: isLight ? '#1a1a2e' : '#fff' }}>
            {hovSlice.pct}% · {fmt(hovSlice.amount)}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Legend ───────────────────────────────────────────────────────────────────
interface LegendProps {
  slices: SliceData[];
  onItemClick?: (name: string) => void;
}

const Legend = ({ slices, onItemClick }: LegendProps) => {
  const isLight = document.documentElement.classList.contains('light');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {slices.map((s) => (
        <div
          key={s.name}
          onClick={() => onItemClick?.(s.name)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', transition: 'background 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
              {s.name}
            </span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.pct}%</span>
          <span style={{ fontSize: '12px', color: isLight ? 'rgba(20,20,40,0.5)' : 'rgba(255,255,255,0.4)', flexShrink: 0, minWidth: '80px', textAlign: 'right' }}>
            {fmt(s.amount)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TAB_LABELS: Record<GroupKey, string> = {
  service: 'Сервисы',
  department: 'Отделы',
  category: 'Категории',
};

const TABS: GroupKey[] = ['service', 'department', 'category'];

const tabActiveStyle: React.CSSProperties = {
  background: '#7551e9',
  border: 'none',
  color: 'white',
  padding: '7px 14px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
  boxShadow: '0 2px 8px rgba(117,81,233,0.3)',
  transition: 'all 0.18s',
};
const tabInactiveStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'hsl(var(--muted-foreground))',
  padding: '7px 14px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
  transition: 'all 0.18s',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PERIOD_LABEL: Record<string, string> = {
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
  custom: 'Период',
};

const GROUP_LABEL: Record<GroupKey, string> = {
  service: 'Сервисы',
  department: 'Отделы',
  category: 'Категории',
};

const ExpenseShareChart = () => {
  const { period, getDateRange, dateFrom, dateTo } = usePeriod();
  const { payments: allPayments, loading } = usePaymentsCache();
  const { drillFilter, openDrill, closeDrill } = useDrillDown();
  const [groupBy, setGroupBy] = useState<GroupKey>('service');
  const [exporting, setExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const drillTypeMap: Record<GroupKey, 'service' | 'department' | 'category'> = {
    service: 'service',
    department: 'department',
    category: 'category',
  };

  const handleSegmentClick = (name: string) => {
    if (name === 'Прочие') return;
    openDrill({ type: drillTypeMap[groupBy], value: name, label: name });
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { slices, total, filteredPayments } = useMemo(() => {
    const { from, to } = getDateRange();

    const filtered = (Array.isArray(allPayments) ? allPayments : []).filter((p: PaymentRecord) => {
      if (p.status !== 'approved') return false;
      const raw = String(p.payment_date);
      const d = new Date(raw.includes('T') ? raw : raw + 'T00:00:00');
      return d >= from && d <= to;
    });

    const fieldMap: Record<GroupKey, keyof PaymentRecord> = {
      service: 'service_name',
      department: 'department_name',
      category: 'category_name',
    };
    const field = fieldMap[groupBy];

    const map: Record<string, number> = {};
    let totalAmt = 0;
    filtered.forEach((p: PaymentRecord) => {
      const key = (p[field] as string | undefined) || 'Прочее';
      map[key] = (map[key] || 0) + p.amount;
      totalAmt += p.amount;
    });

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const TOP = 7;

    const top = sorted.slice(0, TOP);
    const rest = sorted.slice(TOP);
    const restTotal = rest.reduce((s, [, v]) => s + v, 0);

    const all = restTotal > 0 ? [...top, ['Прочие', restTotal]] : top;

    const result: SliceData[] = all.map(([name, amount], i) => {
      const isOther = name === 'Прочие';
      const [color, colorEnd] = isOther ? OTHER_COLOR : (PALETTE[i % PALETTE.length]);
      return {
        name,
        amount,
        pct: totalAmt > 0 ? Math.round((amount / totalAmt) * 100) : 0,
        color,
        colorEnd,
      };
    });

    return { slices: result, total: totalAmt, filteredPayments: filtered };
  }, [allPayments, groupBy, period, dateFrom, dateTo]);

  const handleExport = () => {
    if (loading || exporting || filteredPayments.length === 0) return;
    setExporting(true);
    try {
      const label = `ДоляРасходов_${GROUP_LABEL[groupBy]}_${PERIOD_LABEL[period] || period}`;
      exportPaymentsToExcel(filteredPayments, label);
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  };

  const size = isMobile ? 200 : 240;

  return (
    <>
    <Card style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <CardContent className="p-6">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Доля расходов</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'hsl(var(--muted))', padding: '4px', borderRadius: '10px' }}>
              {TABS.map((tab) => (
                <button key={tab} style={groupBy === tab ? tabActiveStyle : tabInactiveStyle} onClick={() => setGroupBy(tab)}>
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : slices.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Нет данных за выбранный период</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: isMobile ? '24px' : '32px',
          }}>
            <div style={{ flexShrink: 0 }}>
              <Donut slices={slices} total={total} size={size} onSegmentClick={handleSegmentClick} />
            </div>
            <div style={{ flex: 1, minWidth: 0, alignSelf: 'center' }}>
              <Legend slices={slices} onItemClick={handleSegmentClick} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    <DrillDownModal filter={drillFilter} onClose={closeDrill} />
    </>
  );
};

export default ExpenseShareChart;