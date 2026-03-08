import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';
import { API_ENDPOINTS } from '@/config/api';

interface PaymentRecord {
  id: number;
  status: string;
  payment_date: string;
  amount: number;
  [key: string]: unknown;
}

const AttentionRequiredCard = () => {
  const [overdue, setOverdue] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await apiFetch(`${API_ENDPOINTS.main}?endpoint=payments`);
        if (controller.signal.aborted) return;
        const data = await res.json();
        const all: PaymentRecord[] = Array.isArray(data) ? data : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        setOverdue(all.filter(p => p.status === 'pending' && new Date(p.payment_date) < today).length);
        setRejected(all.filter(p => p.status === 'rejected').length);
      } catch {
        // silent
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const items = [
    {
      icon: 'Clock3',
      text: loading ? '...' : overdue > 0
        ? `Просрочено ${overdue} ${overdue === 1 ? 'платёж' : overdue < 5 ? 'платежа' : 'платежей'}`
        : 'Просроченных платежей нет',
      color: overdue > 0 ? '#ff6b6b' : '#01b574',
    },
    {
      icon: 'XCircle',
      text: loading ? '...' : rejected > 0
        ? `${rejected} ${rejected === 1 ? 'отклонённый запрос' : rejected < 5 ? 'отклонённых запроса' : 'отклонённых запросов'}`
        : 'Отклонённых запросов нет',
      color: rejected > 0 ? '#ffb547' : '#01b574',
    },
  ];

  return (
    <Card style={{
      background: 'linear-gradient(135deg, #1a1f37 0%, #111c44 100%)',
      border: '1px solid rgba(255, 107, 107, 0.3)',
      boxShadow: '0 0 30px rgba(255, 107, 107, 0.15)',
      position: 'relative',
      overflow: 'hidden',
      height: '300px'
    }}>
      <CardContent className="p-4 sm:p-6" style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }} className="sm:mb-5">
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: '#fff' }} className="sm:text-lg sm:mb-2">Требуют внимания</div>
            <div style={{ color: 'rgba(200, 210, 230, 0.85)', fontSize: '12px', fontWeight: '500' }} className="sm:text-sm">Критические задачи</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.2)' }} className="sm:w-12 sm:h-12">
            <Icon name="AlertTriangle" size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }} className="sm:gap-3">
          {items.map((item, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 107, 107, 0.05)', padding: '10px', borderRadius: '8px',
              border: '1px solid rgba(255, 107, 107, 0.2)',
              display: 'flex', alignItems: 'center', gap: '10px'
            }} className="sm:p-3 sm:gap-3">
              <Icon name={item.icon} size={14} style={{ color: item.color, flexShrink: 0 }} className="sm:w-4 sm:h-4" />
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }} className="sm:text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttentionRequiredCard;