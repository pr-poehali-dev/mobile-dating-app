import { createContext, useContext, ReactNode, useCallback } from 'react';

export type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface PeriodRange {
  from: Date;
  to: Date;
}

interface PeriodContextValue {
  period: PeriodType;
  dateFrom?: Date;
  dateTo?: Date;
  getDateRange: () => PeriodRange;
}

export const PeriodContext = createContext<PeriodContextValue | null>(null);

export const usePeriod = () => {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriod must be used within PeriodContext.Provider');
  return ctx;
};

export const getPeriodRange = (period: PeriodType, dateFrom?: Date, dateTo?: Date): PeriodRange => {
  const now = new Date();

  switch (period) {
    case 'today': {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { from, to };
    }
    case 'week': {
      const day = now.getDay();
      const diff = (day === 0 ? -6 : 1 - day);
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0, 0);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
      return { from: monday, to: sunday };
    }
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from, to };
    }
    case 'year': {
      const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { from, to };
    }
    case 'custom': {
      const from = dateFrom
        ? new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate(), 0, 0, 0, 0)
        : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const to = dateTo
        ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from, to };
    }
  }
};

interface PeriodProviderProps {
  children: ReactNode;
  period: PeriodType;
  dateFrom?: Date;
  dateTo?: Date;
}

export const PeriodProvider = ({ children, period, dateFrom, dateTo }: PeriodProviderProps) => {
  const getDateRange = useCallback(() => getPeriodRange(period, dateFrom, dateTo), [period, dateFrom, dateTo]);

  return (
    <PeriodContext.Provider value={{ period, dateFrom, dateTo, getDateRange }}>
      {children}
    </PeriodContext.Provider>
  );
};