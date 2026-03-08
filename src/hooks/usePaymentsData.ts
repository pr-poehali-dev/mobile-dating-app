import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/utils/api';
import { API_ENDPOINTS } from '@/config/api';
import { Payment } from '@/types/payment';
import { useDictionaryContext } from '@/contexts/DictionaryContext';

// Module-level cache for personal payments (draft/my)
let myPaymentsCache: Payment[] | null = null;
let myPaymentsCacheTime = 0;
const MY_CACHE_TTL = 30_000;

export const invalidateMyPaymentsCache = () => {
  myPaymentsCache = null;
  myPaymentsCacheTime = 0;
};

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface LegalEntity {
  id: number;
  name: string;
  inn: string;
  kpp: string;
  address: string;
}

interface Contractor {
  id: number;
  name: string;
  inn: string;
}

interface CustomerDepartment {
  id: number;
  name: string;
  description: string;
}

interface CustomFieldDefinition {
  id: number;
  name: string;
  field_type: string;
  options: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  intermediate_approver_id: number;
  final_approver_id: number;
  category_id?: number;
  customer_department_id?: number;
  legal_entity_id?: number;
  contractor_id?: number;
  category_name?: string;
  category_icon?: string;
  legal_entity_name?: string;
  contractor_name?: string;
  department_name?: string;
}

export const usePaymentsData = () => {
  const dictionary = useDictionaryContext();
  const [payments, setPayments] = useState<Payment[]>(myPaymentsCache ?? []);
  const [loading, setLoading] = useState(!myPaymentsCache);

  const loadPayments = useCallback((force = false) => {
    const now = Date.now();
    if (!force && myPaymentsCache && now - myPaymentsCacheTime < MY_CACHE_TTL) {
      setPayments(myPaymentsCache);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch(API_ENDPOINTS.paymentsApi)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        myPaymentsCache = list;
        myPaymentsCacheTime = Date.now();
        setPayments(list);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load payments:', err);
        setPayments([]);
        setLoading(false);
      });
  }, []);

  const loadContractors = useCallback(async () => {
    await dictionary.refresh('contractors');
    return dictionary.contractors;
  }, [dictionary]);

  const loadLegalEntities = useCallback(async () => {
    await dictionary.refresh('legalEntities');
    return dictionary.legalEntities;
  }, [dictionary]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const forceLoadPayments = useCallback(() => {
    myPaymentsCache = null;
    loadPayments(true);
  }, [loadPayments]);

  return {
    payments,
    categories: dictionary.categories,
    legalEntities: dictionary.legalEntities,
    contractors: dictionary.contractors,
    customerDepartments: dictionary.departments,
    customFields: dictionary.customFields,
    services: dictionary.services,
    loading: loading || dictionary.loading.categories || dictionary.loading.services,
    loadPayments: forceLoadPayments,
    loadContractors,
    loadLegalEntities,
  };
};