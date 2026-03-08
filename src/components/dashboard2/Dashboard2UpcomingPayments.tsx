import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useMemo } from 'react';
import { dashboardTypography, dashboardColors } from './dashboardStyles';
import { usePaymentsCache, PaymentRecord } from '@/contexts/PaymentsCacheContext';

interface DayGroup {
  dateKey: string;
  label: string;
  sublabel: string;
  payments: PaymentRecord[];
  total: number;
  isToday: boolean;
  isTomorrow: boolean;
  isUrgent: boolean;
}

const formatAmount = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '— ₽';
  return new Intl.NumberFormat('ru-RU').format(num) + ' ₽';
};

const getCategoryIcon = (categoryName: string = ''): string => {
  const n = categoryName.toLowerCase();
  if (n.includes('сервер') || n.includes('хостинг')) return 'Server';
  if (n.includes('облак') || n.includes('saas')) return 'Cloud';
  if (n.includes('софт') || n.includes('програм')) return 'Code';
  if (n.includes('дизайн') || n.includes('figma')) return 'Palette';
  if (n.includes('безопасн')) return 'Shield';
  if (n.includes('база') || n.includes('данн')) return 'Database';
  return 'DollarSign';
};

const groupByDay = (payments: PaymentRecord[]): DayGroup[] => {
  const map = new Map<string, PaymentRecord[]>();
  for (const p of payments) {
    const dateKey = String(p.payment_date).slice(0, 10);
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(p);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const weekdays = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

  const groups: DayGroup[] = [];
  for (const [dateKey, items] of map.entries()) {
    const date = new Date(dateKey + 'T00:00:00');
    const isToday = date.getTime() === today.getTime();
    const isTomorrow = date.getTime() === tomorrow.getTime();

    let label = '';
    let sublabel = '';
    if (isToday) {
      label = 'Сегодня';
      sublabel = `${date.getDate()} ${months[date.getMonth()]}`;
    } else if (isTomorrow) {
      label = 'Завтра';
      sublabel = `${date.getDate()} ${months[date.getMonth()]}`;
    } else {
      label = `${date.getDate()} ${months[date.getMonth()]}`;
      sublabel = weekdays[date.getDay()];
    }

    const total = items.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
    const diffDays = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    groups.push({ dateKey, label, sublabel, payments: items, total, isToday, isTomorrow, isUrgent: diffDays <= 1 });
  }

  return groups.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
};

// ─── PaymentCard ─────────────────────────────────────────────────────────────
const PaymentCard = ({ payment, accentColor }: { payment: PaymentRecord; accentColor: string }) => {
  const icon = getCategoryIcon(payment.category_name);
  return (
    <div
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
    >
      <div style={{
        width: '30px', height: '30px', borderRadius: '8px',
        background: `${accentColor}20`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={14} style={{ color: accentColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px', fontWeight: 700, color: 'hsl(var(--foreground))',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {payment.description || payment.contractor_name || payment.service_name || 'Платёж'}
        </div>
        {(payment.category_name || payment.department_name) && (
          <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
            {payment.category_name || payment.department_name}
          </div>
        )}
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--foreground))', marginTop: '4px' }}>
          {formatAmount(payment.amount)}
        </div>
      </div>
    </div>
  );
};

// ─── DayColumn ────────────────────────────────────────────────────────────────
const DayColumn = ({ group }: { group: DayGroup }) => {
  const accentColor = group.isUrgent
    ? dashboardColors.red
    : group.isTomorrow
    ? dashboardColors.orange
    : dashboardColors.green;

  return (
    <div style={{
      background: `${accentColor}08`,
      border: `1.5px solid ${accentColor}30`,
      borderRadius: '14px',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        background: `${accentColor}15`,
        borderBottom: `1px solid ${accentColor}25`,
        padding: '12px 14px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: accentColor }}>{group.label}</div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '1px' }}>{group.sublabel}</div>
          </div>
          <div style={{
            background: accentColor, color: '#fff', borderRadius: '8px',
            padding: '3px 8px', fontSize: '11px', fontWeight: 700,
          }}>
            {group.payments.length}
          </div>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--foreground))' }}>
          {formatAmount(group.total)}
        </div>
      </div>

      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
        {group.payments.map((p) => (
          <PaymentCard key={p.id} payment={p} accentColor={accentColor} />
        ))}
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Dashboard2UpcomingPayments = () => {
  const { payments: allPayments, loading } = usePaymentsCache();
  const [activeIndex, setActiveIndex] = useState(0);

  const { upcoming, weekTotal } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    sevenDaysLater.setHours(23, 59, 59, 999);

    const filtered = (Array.isArray(allPayments) ? allPayments : []).filter((p: PaymentRecord) => {
      if (!p.payment_date) return false;
      if (p.status === 'paid' || p.status === 'cancelled' || p.status === 'rejected') return false;
      const raw = String(p.payment_date);
      const d = new Date(raw.includes('T') ? raw : raw + 'T00:00:00');
      return d >= today && d <= sevenDaysLater;
    });

    const sorted = [...filtered].sort((a, b) => {
      const da = new Date(String(a.payment_date).includes('T') ? String(a.payment_date) : String(a.payment_date) + 'T00:00:00');
      const db = new Date(String(b.payment_date).includes('T') ? String(b.payment_date) : String(b.payment_date) + 'T00:00:00');
      return da.getTime() - db.getTime();
    });

    const total = sorted.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
    return { upcoming: sorted, weekTotal: total };
  }, [allPayments]);

  const groups = useMemo(() => groupByDay(upcoming), [upcoming]);

  const count = upcoming.length;
  const countLabel = count === 1 ? 'платёж' : count < 5 ? 'платежа' : 'платежей';

  return (
    <Card style={{
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '30px',
    }}>
      <CardContent className="p-4 sm:p-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div style={{
              background: 'linear-gradient(135deg, #ffb547 0%, #ff9500 100%)',
              padding: '10px', borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(255,181,71,0.3)', flexShrink: 0,
            }}>
              <Icon name="CalendarClock" size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <h3 className={dashboardTypography.cardTitle} style={{ color: 'hsl(var(--foreground))' }}>
                Предстоящие платежи
              </h3>
              <p className={`${dashboardTypography.cardSmall} mt-0.5`} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Ближайшие 7 дней
              </p>
            </div>
          </div>

          {!loading && count > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--foreground))' }}>
                {formatAmount(weekTotal)}
              </div>
              <div style={{ fontSize: '11px', color: dashboardColors.orange, fontWeight: 600 }}>
                {count} {countLabel}
              </div>
            </div>
          )}
        </div>

        {/* Состояния */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
          </div>
        ) : count === 0 ? (
          <div className="text-center py-12">
            <Icon name="CheckCircle" size={44} style={{ color: dashboardColors.green, margin: '0 auto 14px' }} />
            <p className={dashboardTypography.cardSmall} style={{ color: 'hsl(var(--muted-foreground))' }}>
              Нет предстоящих платежей на ближайшие 7 дней
            </p>
          </div>
        ) : (
          <>
            {/* Десктоп: горизонтальный таймлайн */}
            <div className="hidden sm:block">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                {groups.map((group) => (
                  <div key={group.dateKey} style={{ flex: 1, minWidth: 0 }}>
                    <DayColumn group={group} />
                  </div>
                ))}
              </div>
            </div>

            {/* Мобилка: карусель */}
            <div className="sm:hidden">
              {groups.length > 1 && (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
                  {groups.map((group, i) => {
                    const accentColor = group.isUrgent ? dashboardColors.red : group.isTomorrow ? dashboardColors.orange : dashboardColors.green;
                    return (
                      <button
                        key={group.dateKey}
                        onClick={() => setActiveIndex(i)}
                        style={{
                          width: i === activeIndex ? '24px' : '8px',
                          height: '8px', borderRadius: '4px',
                          background: i === activeIndex ? accentColor : 'hsl(var(--border))',
                          border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              <DayColumn group={groups[activeIndex] ?? groups[0]} />

              {groups.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', gap: '8px' }}>
                  <button
                    onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                    disabled={activeIndex === 0}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                      color: activeIndex === 0 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
                      cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      fontSize: '13px', fontWeight: 600, opacity: activeIndex === 0 ? 0.4 : 1,
                    }}
                  >
                    <Icon name="ChevronLeft" size={16} />
                    Назад
                  </button>
                  <button
                    onClick={() => setActiveIndex(i => Math.min(groups.length - 1, i + 1))}
                    disabled={activeIndex === groups.length - 1}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                      color: activeIndex === groups.length - 1 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
                      cursor: activeIndex === groups.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      fontSize: '13px', fontWeight: 600, opacity: activeIndex === groups.length - 1 ? 0.4 : 1,
                    }}
                  >
                    Вперёд
                    <Icon name="ChevronRight" size={16} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard2UpcomingPayments;
