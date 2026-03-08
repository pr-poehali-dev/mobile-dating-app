export interface KPICardData {
  id: string;
  title: string;
  value: string | number;
  trend: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: string;
  loading?: boolean;
  error?: string;
}

export interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
}

export interface ActivityDataPoint {
  date: string;
  value: number;
}

export interface Event {
  id: string;
  type: 'payment' | 'approval' | 'user' | 'system' | 'error';
  title: string;
  description?: string;
  timestamp: Date;
  detailsLink?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export type DashboardDataState = 'loading' | 'empty' | 'error' | 'partial' | 'ready';

export interface DashboardData {
  state: DashboardDataState;
  kpis: KPICardData[];
  systemStatus: SystemStatus;
  activity: ActivityDataPoint[];
  recentEvents: Event[];
  quickActions: QuickAction[];
  lastUpdate?: Date;
  errorMessage?: string;
}
