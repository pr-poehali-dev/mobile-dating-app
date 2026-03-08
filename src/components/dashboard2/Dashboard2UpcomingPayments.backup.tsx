// BACKUP — оригинальная версия Dashboard2UpcomingPayments
// Чтобы откатить — скопируй содержимое этого файла в Dashboard2UpcomingPayments.tsx

import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useEffect, useState } from 'react';
import { dashboardTypography } from './dashboardStyles';
import { apiFetch } from '@/utils/api';
import { API_ENDPOINTS } from '@/config/api';
import { Payment } from '@/types/payment';

const Dashboard2UpcomingPayments = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const [paymentsRes, plannedRes] = await Promise.all([
          apiFetch(`${API_ENDPOINTS.main}?endpoint=payments`),
          apiFetch(`${API_ENDPOINTS.main}?endpoint=planned-payments`),
        ]);
        const paymentsData = await paymentsRes.json();
        const plannedData = await plannedRes.json();

        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const isUpcoming = (date: string | undefined) => {
          if (!date) return false;
          const d = new Date(date);
          return d >= now && d <= sevenDaysFromNow;
        };

        const fromPayments = (Array.isArray(paymentsData) ? paymentsData : [])
          .filter((p: Payment) => {
            if (p.status === 'paid' || p.status === 'cancelled') return false;
            return isUpcoming(p.payment_date) || isUpcoming(p.planned_date);
          })
          .map((p: Payment) => ({
            ...p,
            planned_date: p.planned_date || p.payment_date,
          }));

        const fromPlanned = (Array.isArray(plannedData) ? plannedData : [])
          .filter((p: Payment) => {
            if (p.is_active === false) return false;
            return isUpcoming(p.planned_date);
          });

        const combined = [...fromPayments, ...fromPlanned].sort((a: Payment, b: Payment) => {
          const dateA = new Date(a.planned_date!);
          const dateB = new Date(b.planned_date!);
          return dateA.getTime() - dateB.getTime();
        });

        setPayments(combined);
      } catch (error) {
        console.error('Failed to fetch upcoming payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const getTimeUntil = (targetDate: string) => {
    const target = new Date(targetDate);
    const diff = target.getTime() - currentTime.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours: hrs, minutes: mins, seconds: secs, total: diff };
  };

  const getPaymentColor = (plannedDate: string) => {
    const diff = new Date(plannedDate).getTime() - currentTime.getTime();
    const daysUntil = diff / (1000 * 60 * 60 * 24);
    
    if (daysUntil <= 1) return '#ff6b6b';
    if (daysUntil <= 3) return '#ffb547';
    return '#01b574';
  };

  const getCategoryIcon = (categoryName: string): string => {
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('сервер') || lowerName.includes('хостинг')) return 'Server';
    if (lowerName.includes('облак') || lowerName.includes('saas')) return 'Cloud';
    if (lowerName.includes('софт') || lowerName.includes('програм')) return 'Code';
    if (lowerName.includes('дизайн') || lowerName.includes('figma')) return 'Palette';
    if (lowerName.includes('безопасн')) return 'Shield';
    if (lowerName.includes('база') || lowerName.includes('данн')) return 'Database';
    return 'DollarSign';
  };

  return (
    <Card style={{ 
      background: 'hsl(var(--card))', 
      border: '1px solid hsl(var(--border))',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '30px'
    }}>
      <CardContent className="p-4 sm:p-6" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }} className="sm:flex-row sm:justify-between sm:items-center sm:mb-8">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="sm:gap-3">
            <div style={{ 
              background: 'linear-gradient(135deg, #ffb547 0%, #ff9500 100%)',
              padding: '10px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(255, 181, 71, 0.3)'
            }} className="sm:p-3.5">
              <Icon name="Clock" size={20} style={{ color: '#fff' }} className="sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className={`${dashboardTypography.cardTitle}`} style={{ color: 'hsl(var(--foreground))' }}>Предстоящие Платежи</h3>
              <p className={`${dashboardTypography.cardSmall} mt-1`} style={{ color: 'hsl(var(--muted-foreground))' }}>Ближайшие 7 дней • Следите за дедлайнами</p>
            </div>
          </div>
          <div style={{ 
            background: 'rgba(255, 181, 71, 0.15)',
            padding: '8px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 181, 71, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }} className="sm:px-6 sm:py-3">
            <Icon name="AlertCircle" size={16} style={{ color: '#ffb547' }} className="sm:w-[18px] sm:h-[18px]" />
            <span className={`${dashboardTypography.cardBadge} text-[#ffb547]`}>{payments.length} платежей</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="CheckCircle" size={48} style={{ color: '#01b574', margin: '0 auto 16px' }} />
            <p className={`${dashboardTypography.cardSmall} text-gray-400`}>
              Нет предстоящих платежей на ближайшие 7 дней
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {payments.map((payment) => {
              const countdown = getTimeUntil(payment.planned_date!);
              const isExpiringSoon = countdown.days === 0;
              const color = getPaymentColor(payment.planned_date!);
              const icon = getCategoryIcon(payment.category_name);
              const urgent = countdown.days <= 1;
            
            return (
              <div key={payment.id} style={{ 
                background: urgent 
                  ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 107, 107, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                padding: '18px',
                borderRadius: '14px',
                border: urgent 
                  ? '1px solid rgba(255, 107, 107, 0.4)' 
                  : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: urgent ? '0 0 20px rgba(255, 107, 107, 0.2)' : 'none',
                animation: urgent ? 'glow 2s infinite' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(8px)';
                e.currentTarget.style.boxShadow = `0 10px 40px ${color}40`;
                e.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = urgent ? '0 0 20px rgba(255, 107, 107, 0.2)' : 'none';
                e.currentTarget.style.borderColor = urgent 
                  ? 'rgba(255, 107, 107, 0.4)' 
                  : 'rgba(255, 255, 255, 0.08)';
              }}>
                {urgent && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '4px',
                    height: '100%',
                    background: 'linear-gradient(180deg, #ff6b6b 0%, #ee5a52 100%)',
                    boxShadow: '0 0 15px #ff6b6b',
                    animation: 'pulse 1.5s infinite'
                  }} />
                )}
                
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div style={{ 
                      background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                      padding: '12px',
                      borderRadius: '12px',
                      boxShadow: `0 0 20px ${color}60`,
                      flexShrink: 0
                    }}>
                      <Icon name={icon} size={20} style={{ color: '#fff' }} className="sm:w-6 sm:h-6" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 mb-1 overflow-hidden">
                        <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis' }} className="sm:text-base whitespace-nowrap flex-1">
                          {payment.description || payment.contractor_name || 'Платёж без описания'}
                        </h4>
                        {urgent && (
                          <div style={{
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: '800',
                            color: '#fff',
                            textTransform: 'uppercase',
                            boxShadow: '0 0 10px rgba(255, 107, 107, 0.5)',
                            animation: 'pulse 1.5s infinite',
                            flexShrink: 0
                          }} className="sm:text-[10px] sm:px-2">
                            Срочно
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ 
                          color: color,
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 7px',
                          background: `${color}20`,
                          borderRadius: '6px',
                          border: `1px solid ${color}40`
                        }} className="sm:text-xs">
                          {payment.category_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 sm:gap-3">
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '900', 
                      color: '#fff',
                      textShadow: `0 0 10px ${color}80`
                    }} className="sm:text-xl">
                      {new Intl.NumberFormat('ru-RU').format(payment.amount)} ₽
                    </div>

                    <div style={{ 
                      background: isExpiringSoon 
                        ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 107, 107, 0.1) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: isExpiringSoon 
                        ? '1px solid rgba(255, 107, 107, 0.4)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: '110px'
                    }} className="sm:min-w-[130px]">
                      <Icon 
                        name="Clock" 
                        size={14} 
                        style={{ 
                          color: isExpiringSoon ? '#ff6b6b' : '#a3aed0',
                          flexShrink: 0
                        }} 
                        className="sm:w-4 sm:h-4"
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                        {countdown.days > 0 ? (
                          <>
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: '800', 
                              color: isExpiringSoon ? '#ff6b6b' : '#fff'
                            }} className="sm:text-sm">
                              {countdown.days}д {countdown.hours}ч
                            </span>
                            <span style={{ fontSize: '9px', color: '#a3aed0', fontWeight: '600' }} className="sm:text-[10px]">
                              {countdown.minutes}м {countdown.seconds}с
                            </span>
                          </>
                        ) : (
                          <>
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: '800', 
                              color: '#ff6b6b'
                            }} className="sm:text-sm">
                              {countdown.hours}:{countdown.minutes.toString().padStart(2, '0')}
                            </span>
                            <span style={{ fontSize: '9px', color: '#ff6b6b', fontWeight: '600' }} className="sm:text-[10px]">
                              осталось
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard2UpcomingPayments;
