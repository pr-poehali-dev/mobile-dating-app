import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useMemo } from 'react';
import { usePaymentsCache } from '@/contexts/PaymentsCacheContext';
import { usePeriod } from '@/contexts/PeriodContext';

interface Payment {
  amount: number;
  payment_date: string;
  category_name?: string;
  status: string;
}

const Dashboard2StatsCards = () => {
  const { payments: allPayments, loading } = usePaymentsCache();
  const { period, getDateRange, dateFrom, dateTo } = usePeriod();

  const stats = useMemo(() => {
    const { from, to } = getDateRange();
    const periodMs = to.getTime() - from.getTime();

    const prevFrom = new Date(from.getTime() - periodMs - 1);
    const prevTo = new Date(from.getTime() - 1);

    const all: Payment[] = Array.isArray(allPayments) ? allPayments : [];
    const approved = all.filter(p => p.status === 'approved');

    const current = approved.filter(p => {
      const d = new Date(p.payment_date);
      return d >= from && d <= to;
    });
    const prev = approved.filter(p => {
      const d = new Date(p.payment_date);
      return d >= prevFrom && d <= prevTo;
    });

    const total = current.reduce((s, p) => s + (p.amount || 0), 0);
    const prevTotal = prev.reduce((s, p) => s + (p.amount || 0), 0);

    const serverTotal = current
      .filter(p => ['Инфраструктура', 'Серверы', 'Хостинг'].includes(p.category_name || ''))
      .reduce((s, p) => s + (p.amount || 0), 0);

    const commTotal = current
      .filter(p => ['Телефония', 'Мессенджеры', 'Коммуникации'].includes(p.category_name || ''))
      .reduce((s, p) => s + (p.amount || 0), 0);

    return {
      total,
      prevTotal,
      serverTotal,
      commTotal,
      count: current.length,
      prevCount: prev.length,
    };
  }, [allPayments, period, dateFrom, dateTo]);

  const fmt = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v)) + ' ₽';

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const ChangeTag = ({ value, label }: { value: number | null; label?: string }) => {
    if (value === null) return (
      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', gap: '6px', color: 'rgba(200, 210, 230, 0.75)' }}>
        <Icon name="Minus" size={14} /> Нет данных
      </div>
    );
    const up = value >= 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', gap: '6px', color: up ? '#e31a1a' : '#01b574' }}>
        <Icon name={up ? 'ArrowUp' : 'ArrowDown'} size={14} />
        {up ? '+' : ''}{value}% {label || 'к предыдущему периоду'}
      </div>
    );
  };

  const cardStyle = (accent: string) => ({
    background: 'hsl(var(--card))',
    border: `1px solid ${accent}40`,
    borderTop: `4px solid ${accent}`,
    boxShadow: `0 0 20px ${accent}20`,
  });

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '30px' }}>
        {[0,1,2,3].map(i => (
          <Card key={i} style={cardStyle('#7551e9')}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-8 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalChange = pctChange(stats.total, stats.prevTotal);
  const countChange = pctChange(stats.count, stats.prevCount);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '30px' }}>

      <Card style={cardStyle('#7551e9')}>
        <CardContent className="p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>Общие IT Расходы</div>
              <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px' }}>Утверждённые платежи</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(117,81,233,0.1)', color: '#7551e9', border: '1px solid rgba(117,81,233,0.2)' }}>
              <Icon name="Server" size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
            {stats.total === 0 ? '—' : fmt(stats.total)}
          </div>
          <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', marginBottom: '12px' }}>Сумма за выбранный период</div>
          <ChangeTag value={totalChange} />
        </CardContent>
      </Card>

      <Card style={cardStyle('#01b574')}>
        <CardContent className="p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>Серверная Инфраструктура</div>
              <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px' }}>Расходы на серверы</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(1,181,116,0.1)', color: '#01b574', border: '1px solid rgba(1,181,116,0.2)' }}>
              <Icon name="Database" size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
            {stats.serverTotal === 0 ? '—' : fmt(stats.serverTotal)}
          </div>
          <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', marginBottom: '12px' }}>
            {stats.total > 0 ? Math.round((stats.serverTotal / stats.total) * 100) : 0}% от расходов периода
          </div>
          <ChangeTag value={null} label="данные по категории" />
        </CardContent>
      </Card>

      <Card style={cardStyle('#3965ff')}>
        <CardContent className="p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>Коммуникационные Сервисы</div>
              <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px' }}>Телефония и мессенджеры</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(57,101,255,0.1)', color: '#3965ff', border: '1px solid rgba(57,101,255,0.2)' }}>
              <Icon name="MessageCircle" size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
            {stats.commTotal === 0 ? '—' : fmt(stats.commTotal)}
          </div>
          <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', marginBottom: '12px' }}>
            {stats.total > 0 ? Math.round((stats.commTotal / stats.total) * 100) : 0}% от расходов периода
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', gap: '6px', color: 'hsl(var(--muted-foreground))' }}>
            <Icon name="Minus" size={14} /> Без изменений
          </div>
        </CardContent>
      </Card>

      <Card style={cardStyle('#ffb547')}>
        <CardContent className="p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>Всего Платежей</div>
              <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px' }}>История операций</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,181,71,0.1)', color: '#ffb547', border: '1px solid rgba(255,181,71,0.2)' }}>
              <Icon name="Box" size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
            {stats.count}
          </div>
          <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', marginBottom: '12px' }}>платежей за выбранный период</div>
          <ChangeTag value={countChange} label="к предыдущему периоду" />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard2StatsCards;
