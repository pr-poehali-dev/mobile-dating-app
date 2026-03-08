import { CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export interface DashboardCard {
  id: string;
  title: string;
  component: React.ReactNode;
}

export const dashboardCards: DashboardCard[] = [
  {
    id: 'total-expenses',
    title: 'Общие IT Расходы',
    component: (
      <CardContent className="p-6 h-full">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>Общие IT Расходы</div>
            <div style={{ color: '#a3aed0', fontSize: '14px', fontWeight: '500' }}>Все время</div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(117, 81, 233, 0.1)', color: '#7551e9', border: '1px solid rgba(117, 81, 233, 0.2)' }}>
            <Icon name="Server" size={20} />
          </div>
        </div>
        <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>184,200 ₽</div>
        <div style={{ color: '#a3aed0', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Общая сумма расходов</div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', gap: '6px', color: '#e31a1a' }}>
          <Icon name="ArrowUp" size={14} /> +12.5% с прошлого месяца
        </div>
      </CardContent>
    ),
  },
  {
    id: 'total-payments',
    title: 'Индексация',
    component: (
      <CardContent className="p-6 h-full">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>Индексация</div>
            <div style={{ color: '#a3aed0', fontSize: '14px', fontWeight: '500' }}>Корректировка цен</div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 181, 71, 0.1)', color: '#ffb547', border: '1px solid rgba(255, 181, 71, 0.2)' }}>
            <Icon name="TrendingUp" size={20} />
          </div>
        </div>
        <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>45,780 ₽</div>
        <div style={{ color: '#a3aed0', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>за текущий период</div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', gap: '6px', color: '#01b574' }}>
          <Icon name="ArrowUp" size={14} /> +15.3% к предыдущему периоду
        </div>
      </CardContent>
    ),
  },
];