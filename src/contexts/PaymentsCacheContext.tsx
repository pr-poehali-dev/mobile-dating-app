import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiFetch } from '@/utils/api';
import { API_ENDPOINTS } from '@/config/api';

export interface PaymentRecord {
  id: number;
  status: string;
  payment_date: string;
  created_at?: string;
  amount: number;
  description?: string;
  category_id?: number;
  category_name?: string;
  category_icon?: string;
  service_id?: number;
  service_name?: string;
  department_id?: number;
  department_name?: string;
  contractor_name?: string;
  legal_entity_name?: string;
  payment_type?: string;
  [key: string]: unknown;
}

interface PaymentsCacheState {
  payments: PaymentRecord[];
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

const PaymentsCacheContext = createContext<PaymentsCacheState | null>(null);

let globalFetchPromise: Promise<PaymentRecord[]> | null = null;
let globalCache: PaymentRecord[] | null = null;
let globalCacheTime = 0;
const CACHE_TTL_MS = 30_000;

export const PaymentsCacheProvider = ({ children }: { children: ReactNode }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && globalCache && now - globalCacheTime < CACHE_TTL_MS) {
      setPayments(globalCache);
      setLoading(false);
      return;
    }

    if (!globalFetchPromise) {
      globalFetchPromise = apiFetch(`${API_ENDPOINTS.paymentsApi}?scope=all`)
        .then(r => r.json())
        .then((data): PaymentRecord[] => {
          const list = Array.isArray(data) ? data : (data.payments ?? []);
          globalCache = list;
          globalCacheTime = Date.now();
          return list;
        })
        .finally(() => { globalFetchPromise = null; });
    }

    setLoading(true);
    setError(false);
    try {
      const list = await globalFetchPromise;
      setPayments(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    globalCache = null;
    load(true);
  }, [load]);

  useEffect(() => { load(); }, [load]);

  return (
    <PaymentsCacheContext.Provider value={{ payments, loading, error, refresh }}>
      {children}
    </PaymentsCacheContext.Provider>
  );
};

export const usePaymentsCache = () => {
  const ctx = useContext(PaymentsCacheContext);
  if (!ctx) throw new Error('usePaymentsCache must be used within PaymentsCacheProvider');
  return ctx;
};