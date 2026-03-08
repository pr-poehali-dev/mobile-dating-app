import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';
import { API_ENDPOINTS } from '@/config/api';
import { usePeriod } from '@/contexts/PeriodContext';

interface PaymentRecord {
  status: string;
  payment_date: string;
  amount: number;
  department_name?: string;
  [key: string]: unknown;
}

const PALETTE = [
  { solid: '#01b574', light: 'rgba(1,181,116,0.18)',   mid: 'rgba(1,181,116,0.55)'   },
  { solid: '#7551e9', light: 'rgba(117,81,233,0.18)',  mid: 'rgba(117,81,233,0.55)'  },
  { solid: '#ffb547', light: 'rgba(255,181,71,0.18)',  mid: 'rgba(255,181,71,0.55)'  },
  { solid: '#38bdf8', light: 'rgba(56,189,248,0.18)',  mid: 'rgba(56,189,248,0.55)'  },
  { solid: '#fb7185', light: 'rgba(251,113,133,0.18)', mid: 'rgba(251,113,133,0.55)' },
  { solid: '#facc15', light: 'rgba(250,204,21,0.18)',  mid: 'rgba(250,204,21,0.55)'  },
  { solid: '#c084fc', light: 'rgba(192,132,252,0.18)', mid: 'rgba(192,132,252,0.55)' },
  { solid: '#34d399', light: 'rgba(52,211,153,0.18)',  mid: 'rgba(52,211,153,0.55)'  },
];

const formatAmount = (amount: number): string => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} млн ₽`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} тыс ₽`;
  return `${Math.round(amount)} ₽`;
};

interface BarChartProps {
  data: { name: string; amount: number }[];
  isMobile: boolean;
  isLight: boolean;
}

const BarChart = ({ data, isMobile, isLight }: BarChartProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const total = data.reduce((s, d) => s + d.amount, 0) || 1;
  const maxVal = Math.max(...data.map(d => d.amount), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '13px' }}>
      {data.map((item, i) => {
        const color = PALETTE[i % PALETTE.length];
        const pctMax = item.amount / maxVal;
        const pctTotal = (item.amount / total) * 100;
        const isHov = hovered === i;

        const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

        return (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: isMobile ? '10px 12px' : '13px 16px',
              borderRadius: '12px',
              background: isHov ? color.light : isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isHov ? color.solid : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'}`,
              transition: 'all 0.2s ease',
              cursor: 'default',
            }}
          >
            {/* Заголовок строки */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                {medals[i] && (
                  <span style={{ fontSize: isMobile ? '14px' : '16px', lineHeight: 1 }}>{medals[i]}</span>
                )}
                {!medals[i] && (
                  <span style={{
                    width: isMobile ? '18px' : '20px', height: isMobile ? '18px' : '20px',
                    borderRadius: '50%', background: color.light, border: `1px solid ${color.solid}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isMobile ? '9px' : '10px', fontWeight: 700, color: color.solid,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                )}
                <span style={{
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: isMobile ? '140px' : '240px',
                  transition: 'color 0.2s',
                }}>
                  {item.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{
                  fontSize: isMobile ? '10px' : '11px',
                  fontWeight: 600,
                  color: color.solid,
                  background: color.light,
                  borderRadius: '20px',
                  padding: '2px 8px',
                }}>
                  {pctTotal.toFixed(1)}%
                </span>
                <span style={{
                  fontSize: isMobile ? '13px' : '15px',
                  fontWeight: 800,
                  color: color.solid,
                  transition: 'color 0.2s',
                }}>
                  {formatAmount(item.amount)}
                </span>
              </div>
            </div>

            {/* Бар */}
            <div style={{
              height: isMobile ? '6px' : '8px',
              borderRadius: '99px',
              background: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: mounted ? `${pctMax * 100}%` : '0%',
                borderRadius: '99px',
                background: `linear-gradient(90deg, ${color.mid}, ${color.solid})`,
                boxShadow: isHov ? `0 0 8px ${color.solid}88` : 'none',
                transition: 'width 0.7s cubic-bezier(.4,0,.2,1), box-shadow 0.2s ease',
                transitionDelay: mounted ? `${i * 60}ms` : '0ms',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Dashboard2TeamPerformance = () => {
  const { period, getDateRange, dateFrom, dateTo } = usePeriod();
  const [currentData, setCurrentData] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkTheme = () => setIsLight(document.documentElement.classList.contains('light'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { from: start, to: end } = getDateRange();

    const fetchDepartmentData = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`${API_ENDPOINTS.main}?endpoint=payments`);
        if (controller.signal.aborted) return;
        const data = await response.json();

        const payments: PaymentRecord[] = Array.isArray(data) ? data : (data.payments || []);
        const filtered = payments.filter(p => {
          if (p.status !== 'approved') return false;
          const d = new Date(p.payment_date);
          return d >= start && d <= end;
        });

        const map: Record<string, number> = {};
        filtered.forEach(p => {
          const dept = p.department_name || 'Не указан';
          map[dept] = (map[dept] || 0) + Number(p.amount);
        });

        const sorted = Object.entries(map)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount);

        setCurrentData(sorted);
      } catch {
        if (!controller.signal.aborted) setCurrentData([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchDepartmentData();
    return () => controller.abort();
  }, [period, dateFrom, dateTo]);

  const total = currentData.reduce((s, d) => s + d.amount, 0);

  return (
    <Card style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.07)' }}>
      <CardContent style={{ padding: isMobile ? '16px' : '24px' }}>
        {/* Заголовок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? '16px' : '22px' }}>
          <div>
            <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 800, color: 'hsl(var(--foreground))', margin: 0 }}>
              Сравнение по Отделам-Заказчикам
            </h3>
            <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'hsl(var(--muted-foreground))', marginTop: '3px', margin: 0 }}>
              Доля расходов по подразделениям
            </p>
          </div>
          {total > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 800, color: '#01b574' }}>
                {formatAmount(total)}
              </div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>итого</div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: '13px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ height: '13px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', marginBottom: '10px', width: `${60 + i * 10}%` }} />
                <div style={{ height: '8px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', width: `${80 - i * 15}%` }} />
              </div>
            ))}
          </div>
        ) : currentData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Нет данных за выбранный период</p>
          </div>
        ) : (
          <BarChart data={currentData} isMobile={isMobile} isLight={isLight} />
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard2TeamPerformance;