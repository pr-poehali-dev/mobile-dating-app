import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';
import { API_ENDPOINTS } from '@/config/api';

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  service_name?: string;
  category_name?: string;
  status: string;
}

const Dashboard2PaymentCalendar = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());

  useEffect(() => {
    const controller = new AbortController();
    const loadPayments = async () => {
      try {
        const response = await apiFetch(`${API_ENDPOINTS.main}?endpoint=payments`);
        if (controller.signal.aborted) return;
        const data = await response.json();
        const approvedPayments = (Array.isArray(data) ? data : []).filter((p: Payment) =>
          p.status === 'approved'
        );
        setPayments(approvedPayments);
      } catch {
        // silent
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadPayments();
    return () => controller.abort();
  }, []);

  const getPaymentsByDay = () => {
    const paymentsByDay: { [key: number]: { amount: number; payments: string[] } } = {};
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    payments.forEach((payment) => {
      const paymentDate = new Date(payment.payment_date);
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        const day = paymentDate.getDate();
        if (!paymentsByDay[day]) {
          paymentsByDay[day] = { amount: 0, payments: [] };
        }
        paymentsByDay[day].amount += payment.amount;
        const paymentLabel = `${payment.service_name || payment.category_name || 'Платеж'}: ${(payment.amount / 1000).toFixed(1)}K ₽`;
        paymentsByDay[day].payments.push(paymentLabel);
      }
    });

    return paymentsByDay;
  };

  const getCategoryByAmount = (amount: number): string => {
    if (amount < 20000) return 'small';
    if (amount < 50000) return 'medium';
    return 'large';
  };

  const getDaysInMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Преобразуем к понедельник = 0
  };

  const totalPayments = Object.keys(getPaymentsByDay()).length;

  if (loading) {
    return (
      <Card style={{ 
        background: 'linear-gradient(135deg, #1a1f37 0%, #111c44 100%)', 
        border: '1px solid rgba(117, 81, 233, 0.3)',
        marginBottom: '30px'
      }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center" style={{ height: '400px' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ 
      background: 'linear-gradient(135deg, #1a1f37 0%, #111c44 100%)', 
      border: '1px solid rgba(117, 81, 233, 0.3)',
      boxShadow: '0 0 40px rgba(117, 81, 233, 0.2), inset 0 0 30px rgba(117, 81, 233, 0.08)',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '30px'
    }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 20% 50%, rgba(117, 81, 233, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      <CardContent className="p-4 sm:p-6" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }} className="sm:flex-row sm:justify-between sm:items-center sm:mb-8">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="sm:gap-3">
            <div style={{ 
              background: 'linear-gradient(135deg, #7551e9 0%, #5a3ec5 100%)',
              padding: '10px',
              borderRadius: '12px',
              boxShadow: '0 0 25px rgba(117, 81, 233, 0.6)'
            }} className="sm:p-3.5">
              <Icon name="Calendar" size={20} style={{ color: '#fff' }} className="sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }} className="sm:text-xl md:text-2xl">Календарь Платежей</h3>
              <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }} className="sm:text-sm sm:mt-1">
                {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })} • Распределение по дням
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }} className="sm:flex-row sm:gap-4 sm:items-center">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} className="sm:gap-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(135deg, #01b574 0%, #018c5a 100%)', boxShadow: '0 0 10px #01b574' }} />
                <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px' }} className="sm:text-xs">Малые</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(135deg, #ffb547 0%, #ff9500 100%)', boxShadow: '0 0 10px #ffb547' }} />
                <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px' }} className="sm:text-xs">Средние</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)', boxShadow: '0 0 10px #ff6b6b' }} />
                <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px' }} className="sm:text-xs">Крупные</span>
              </div>
            </div>
            <div style={{ 
              background: 'rgba(117, 81, 233, 0.15)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(117, 81, 233, 0.3)'
            }} className="sm:px-4 sm:py-2">
              <span style={{ color: '#7551e9', fontSize: '12px', fontWeight: '700' }} className="sm:text-sm">{totalPayments} платежей</span>
            </div>
          </div>
        </div>

        {/* Days of week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }} className="sm:gap-3 sm:mb-3">
          {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((day, idx) => (
            <div key={idx} style={{ 
              textAlign: 'center', 
              color: '#7551e9', 
              fontSize: '9px', 
              fontWeight: '700',
              padding: '2px'
            }} className="sm:text-xs sm:p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }} className="sm:gap-3">
          {(() => {
            const days = [];
            const paymentsData = getPaymentsByDay();
            const daysInMonth = getDaysInMonth();
            const firstDay = getFirstDayOfMonth();
            const today = new Date().getDate();
            const isCurrentMonth = new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

            // Пустые ячейки до первого дня месяца
            for (let i = 0; i < firstDay; i++) {
              days.push(<div key={`empty-${i}`} />);
            }

            // Дни месяца
            for (let i = 1; i <= daysInMonth; i++) {
              const dayData = paymentsData[i];
              const isToday = isCurrentMonth && i === today;
              
              let bgColor = 'rgba(255, 255, 255, 0.02)';
              let borderColor = 'rgba(255, 255, 255, 0.05)';
              let glowColor = 'transparent';
              let textColor = 'rgba(180, 195, 225, 0.85)';
              
              if (isToday) {
                bgColor = 'rgba(117, 81, 233, 0.2)';
                borderColor = '#7551e9';
                glowColor = 'rgba(117, 81, 233, 0.4)';
                textColor = '#fff';
              } else if (dayData) {
                const category = getCategoryByAmount(dayData.amount);
                if (category === 'small') {
                  bgColor = 'rgba(1, 181, 116, 0.15)';
                  borderColor = 'rgba(1, 181, 116, 0.4)';
                  glowColor = 'rgba(1, 181, 116, 0.3)';
                  textColor = '#01b574';
                } else if (category === 'medium') {
                  bgColor = 'rgba(255, 181, 71, 0.15)';
                  borderColor = 'rgba(255, 181, 71, 0.4)';
                  glowColor = 'rgba(255, 181, 71, 0.3)';
                  textColor = '#ffb547';
                } else if (category === 'large') {
                  bgColor = 'rgba(255, 107, 107, 0.15)';
                  borderColor = 'rgba(255, 107, 107, 0.4)';
                  glowColor = 'rgba(255, 107, 107, 0.3)';
                  textColor = '#ff6b6b';
                }
              }

              const hasIndicator = dayData && dayData.payments.length > 0;

              days.push(
                <div
                  key={i}
                  style={{
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '6px',
                    padding: '4px',
                    minHeight: '50px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    cursor: dayData ? 'pointer' : 'default',
                    boxShadow: isToday ? `0 0 20px ${glowColor}, inset 0 0 20px ${glowColor}` : 'none',
                    animation: isToday ? 'pulse 2s infinite' : 'none'
                  }}
                  className="sm:p-2.5 sm:min-h-[70px] sm:rounded-lg"
                  onMouseEnter={(e) => {
                    if (dayData) {
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                      e.currentTarget.style.boxShadow = `0 10px 30px ${glowColor}, 0 0 20px ${glowColor}`;
                      e.currentTarget.style.zIndex = '10';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = isToday ? `0 0 20px ${glowColor}, inset 0 0 20px ${glowColor}` : 'none';
                    e.currentTarget.style.zIndex = '1';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: dayData ? '4px' : '0'
                  }}>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: '700',
                      color: textColor
                    }} className="sm:text-xs">
                      {i}
                    </span>
                    {hasIndicator && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: textColor,
                        boxShadow: `0 0 6px ${textColor}`
                      }} className="sm:w-2 sm:h-2" />
                    )}
                  </div>
                  {dayData && (
                    <>
                      <div style={{ 
                        fontSize: '10px', 
                        fontWeight: '800',
                        color: textColor,
                        marginBottom: '2px'
                      }} className="sm:text-xs">
                        {new Intl.NumberFormat('ru-RU').format(dayData.amount)} ₽
                      </div>
                      <div style={{ 
                        fontSize: '8px',
                        color: 'rgba(200, 215, 240, 0.7)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} className="sm:text-[9px]">
                        {dayData.payments.map(p => p.split(':')[0]).join(', ')}
                      </div>
                    </>
                  )}
                </div>
              );
            }

            return days;
          })()}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.85;
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
};

export default Dashboard2PaymentCalendar;