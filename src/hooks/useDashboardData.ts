import { useState, useEffect } from 'react';
import { DashboardData, DashboardDataState } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FUNC_URLS from '@/../backend/func2url.json';

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    state: 'loading' as DashboardDataState,
    kpis: [],
    systemStatus: { status: 'healthy', message: '', alerts: [] },
    activity: [],
    recentEvents: [],
    quickActions: [],
  });
  
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(FUNC_URLS['dashboard-api']);
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const apiData = await response.json();
        
        const recentEvents = apiData.recentEvents.map((event: { timestamp: string; [key: string]: unknown }) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));
        
        const systemStatus = {
          ...apiData.systemStatus,
          alerts: apiData.systemStatus.alerts.map((alert: { timestamp: string; action?: { label: string; link?: string }; [key: string]: unknown }) => ({
            ...alert,
            timestamp: new Date(alert.timestamp),
            action: alert.action ? {
              label: alert.action.label,
              onClick: () => navigate(alert.action.link || '/pending-approvals'),
            } : undefined,
          })),
        };
        
        const dashboardData: DashboardData = {
          state: 'ready',
          kpis: apiData.kpis,
          systemStatus,
          activity: apiData.activity,
          recentEvents,
          quickActions: [
            {
              id: 'create-payment',
              label: 'Создать счёт',
              icon: 'Plus',
              onClick: () => navigate('/payments'),
              disabled: !hasPermission('payments', 'create'),
              disabledReason: !hasPermission('payments', 'create') ? 'Нет прав доступа' : undefined,
            },
            {
              id: 'add-source',
              label: 'Добавить источник',
              icon: 'Database',
              onClick: () => navigate('/dictionaries'),
              disabled: !hasPermission('categories', 'create'),
              disabledReason: !hasPermission('categories', 'create') ? 'Нет прав доступа' : undefined,
            },
            {
              id: 'monitoring',
              label: 'Мониторинг',
              icon: 'BarChart3',
              onClick: () => navigate('/monitoring'),
            },
            {
              id: 'settings',
              label: 'Настройки',
              icon: 'Settings',
              onClick: () => navigate('/settings'),
            },
          ],
          lastUpdate: new Date(apiData.lastUpdate),
        };

        setData(dashboardData);
      } catch (error) {
        setData({
          state: 'error',
          kpis: [],
          systemStatus: { status: 'critical', message: '', alerts: [] },
          activity: [],
          recentEvents: [],
          quickActions: [],
          errorMessage: 'Не удалось загрузить данные дашборда',
        });
      }
    };

    loadData();
  }, [hasPermission, navigate]);

  const retry = () => {
    setData(prev => ({ ...prev, state: 'loading' }));
    window.location.reload();
  };

  return { data, retry };
};