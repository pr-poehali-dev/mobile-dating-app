import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { CustomField } from '@/types/payment';

interface PlannedPayment {
  id: number;
  category_id: number;
  category_name: string;
  category_icon: string;
  description: string;
  amount: number;
  planned_date: string;
  legal_entity_id?: number;
  legal_entity_name?: string;
  contractor_name?: string;
  contractor_id?: number;
  department_name?: string;
  department_id?: number;
  service_id?: number;
  service_name?: string;
  service_description?: string;
  invoice_number?: string;
  invoice_date?: string;
  recurrence_type?: string;
  recurrence_end_date?: string;
  is_active?: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  converted_to_payment_id?: number;
  converted_at?: string;
  custom_fields?: CustomField[];
}

interface Category {
  id: number;
  name: string;
  icon: string;
  total_amount?: number;
  payment_count?: number;
}

interface LegalEntity {
  id: number;
  name: string;
}

interface Contractor {
  id: number;
  name: string;
}

interface CustomerDepartment {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  description?: string;
}

interface CustomFieldDefinition {
  id: number;
  name: string;
  field_type: string;
  is_required: boolean;
}

export const usePlannedPaymentsData = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PlannedPayment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [customerDepartments, setCustomerDepartments] = useState<CustomerDepartment[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState({
    categories: false,
    legalEntities: false,
    contractors: false,
    customerDepartments: false,
    customFields: false,
    services: false,
  });

  const loadPayments = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.main}?endpoint=planned-payments`, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(Array.isArray(data) ? data : []);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Failed to load planned payments:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadCategories = useCallback(async () => {
    if (dataLoaded.categories || !token) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.main}?endpoint=categories`, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
        setDataLoaded(prev => ({ ...prev, categories: true }));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  }, [dataLoaded.categories, token]);

  const loadLegalEntities = useCallback(async () => {
    if (dataLoaded.legalEntities || !token) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.main}?endpoint=legal-entities`, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLegalEntities(Array.isArray(data) ? data : []);
        setDataLoaded(prev => ({ ...prev, legalEntities: true }));
      }
    } catch (err) {
      console.error('Failed to load legal entities:', err);
      setLegalEntities([]);
    }
  }, [dataLoaded.legalEntities, token]);

  const loadContractors = useCallback(async () => {
    if (dataLoaded.contractors || !token) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.main}?endpoint=contractors`, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContractors(Array.isArray(data) ? data : []);
        setDataLoaded(prev => ({ ...prev, contractors: true }));
      }
    } catch (err) {
      console.error('Failed to load contractors:', err);
      setContractors([]);
    }
  }, [dataLoaded.contractors, token]);

  const loadCustomerDepartments = useCallback(async () => {
    if (dataLoaded.customerDepartments || !token) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.main}?endpoint=customer-departments`, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomerDepartments(Array.isArray(data) ? data : []);
        setDataLoaded(prev => ({ ...prev, customerDepartments: true }));
      }
    } catch (err) {
      console.error('Failed to load customer departments:', err);
      setCustomerDepartments([]);
    }
  }, [dataLoaded.customerDepartments, token]);

  const loadCustomFields = useCallback(async () => {
    if (dataLoaded.customFields || !token) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.main}?endpoint=custom-fields`, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomFields(Array.isArray(data) ? data : []);
        setDataLoaded(prev => ({ ...prev, customFields: true }));
      }
    } catch (err) {
      console.error('Failed to load custom fields:', err);
      setCustomFields([]);
    }
  }, [dataLoaded.customFields, token]);

  const loadServices = useCallback(async () => {
    if (dataLoaded.services || !token) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.main}?endpoint=services`, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setServices(Array.isArray(data) ? data : (data.services || []));
        setDataLoaded(prev => ({ ...prev, services: true }));
      }
    } catch (err) {
      console.error('Failed to load services:', err);
      setServices([]);
    }
  }, [dataLoaded.services, token]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return {
    payments,
    categories,
    legalEntities,
    contractors,
    customerDepartments,
    customFields,
    services,
    loading,
    loadPayments,
    loadCategories,
    loadLegalEntities,
    loadContractors,
    loadCustomerDepartments,
    loadCustomFields,
    loadServices,
  };
};