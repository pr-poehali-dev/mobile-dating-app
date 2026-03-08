import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiFetch } from '@/utils/api';
import { API_ENDPOINTS } from '@/config/api';
import { Payment } from '@/types/payment';

interface AllPaymentsCacheState {
  payments: Payment[];
  loading: boolean;
  error: boolean;
  refresh: () => void;
  removePayment: (id: number) => void;
}

const AllPaymentsCacheContext = createContext<AllPaymentsCacheState | null>(null);

let globalFetchPromise: Promise<Payment[]> | null = null;
let globalCache: Payment[] | null = null;
let globalCacheTime = 0;
const CACHE_TTL_MS = 30_000;

export const AllPaymentsCacheProvider = ({ children }: { children: ReactNode }) => {
  const [payments, setPayments] = useState<Payment[]>(globalCache ?? []);
  const [loading, setLoading] = useState(!globalCache);
  const [error, setError] = useState(false);

  const load = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && globalCache && now - globalCacheTime < CACHE_TTL_MS) {
      setPayments(globalCache);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    if (!globalFetchPromise) {
      globalFetchPromise = apiFetch(`${API_ENDPOINTS.paymentsApi}?scope=all`)
        .then(r => r.json())
        .then((data): Payment[] => {
          const list: Payment[] = Array.isArray(data) ? data : [];
          list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          globalCache = list;
          globalCacheTime = Date.now();
          return list;
        })
        .catch(err => {
          globalFetchPromise = null;
          throw err;
        })
        .finally(() => { globalFetchPromise = null; });
    }

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

  const removePayment = useCallback((id: number) => {
    setPayments(prev => {
      const next = prev.filter(p => p.id !== id);
      globalCache = next;
      return next;
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AllPaymentsCacheContext.Provider value={{ payments, loading, error, refresh, removePayment }}>
      {children}
    </AllPaymentsCacheContext.Provider>
  );
};

export const useAllPaymentsCache = () => {
  const ctx = useContext(AllPaymentsCacheContext);
  if (!ctx) throw new Error('useAllPaymentsCache must be used within AllPaymentsCacheProvider');
  return ctx;
};