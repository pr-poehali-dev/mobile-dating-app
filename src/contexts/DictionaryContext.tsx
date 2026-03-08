import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { apiFetch } from '@/utils/api';
import { useAuth } from './AuthContext';

interface Category {
  id: number;
  name: string;
  icon: string;
  parent_id?: number;
  description?: string;
}

interface Contractor {
  id: number;
  name: string;
  inn?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

interface LegalEntity {
  id: number;
  name: string;
  inn?: string;
  kpp?: string;
  address?: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  intermediate_approver_id?: number;
  final_approver_id?: number;
  customer_department_id?: number;
  legal_entity_id?: number;
  contractor_id?: number;
  category_name?: string;
  category_icon?: string;
  legal_entity_name?: string;
  contractor_name?: string;
  customer_department_name?: string;
  department_name?: string;
}

interface CustomField {
  id: number;
  name: string;
  field_type: string;
  options?: string;
  is_required?: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

interface DictionaryData {
  categories: Category[];
  contractors: Contractor[];
  legalEntities: LegalEntity[];
  departments: Department[];
  services: Service[];
  customFields: CustomField[];
  users: User[];
}

interface DictionaryContextType extends DictionaryData {
  loading: {
    categories: boolean;
    contractors: boolean;
    legalEntities: boolean;
    departments: boolean;
    services: boolean;
    customFields: boolean;
    users: boolean;
  };
  refresh: (key: keyof DictionaryData) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined);

export const useDictionaryContext = () => {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error('useDictionaryContext must be used within DictionaryProvider');
  }
  return context;
};

interface DictionaryProviderProps {
  children: ReactNode;
}

const DICT_ENDPOINTS_MAP: Record<string, string> = {
  categories: 'categories',
  contractors: 'contractors',
  legalEntities: 'legal-entities',
  departments: 'customer-departments',
  services: 'services',
  customFields: 'custom-fields',
};

export const DictionaryProvider = ({ children }: DictionaryProviderProps) => {
  const { token } = useAuth();

  const [data, setData] = useState<DictionaryData>({
    categories: [],
    contractors: [],
    legalEntities: [],
    departments: [],
    services: [],
    customFields: [],
    users: [],
  });

  const [loading, setLoading] = useState({
    categories: false,
    contractors: false,
    legalEntities: false,
    departments: false,
    services: false,
    customFields: false,
    users: false,
  });

  const fetchDictionary = useCallback(async <K extends keyof DictionaryData>(
    key: K,
    endpoint: string,
  ): Promise<void> => {
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const url = `${API_ENDPOINTS.dictionariesApi}?endpoint=${endpoint}`;
      const response = await apiFetch(url);
      if (!response.ok) {
        console.error(`[Dict] HTTP ${response.status} for ${key}`);
        return;
      }
      const result = await response.json();
      const list = Array.isArray(result) ? result : (result[key] ?? result[Object.keys(result)[0]] ?? []);
      setData(prev => ({ ...prev, [key]: Array.isArray(list) ? list : [] }));
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const response = await apiFetch(`${API_ENDPOINTS.usersApi}`);
      if (response.ok) {
        const result = await response.json();
        setData(prev => ({ ...prev, users: Array.isArray(result) ? result : [] }));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, []);

  const refresh = useCallback(async (key: keyof DictionaryData) => {
    if (key === 'users') {
      await fetchUsers();
      return;
    }
    await fetchDictionary(key, DICT_ENDPOINTS_MAP[key]);
  }, [fetchDictionary, fetchUsers]);

  const refreshAll = useCallback(async () => {
    const dictKeys = Object.keys(DICT_ENDPOINTS_MAP);
    await Promise.all([
      ...dictKeys.map(key => fetchDictionary(key as keyof DictionaryData, DICT_ENDPOINTS_MAP[key])),
      fetchUsers(),
    ]);
  }, [fetchDictionary, fetchUsers]);

  useEffect(() => {
    if (token) {
      refreshAll();
    }
  }, [token, refreshAll]);

  return (
    <DictionaryContext.Provider
      value={{
        ...data,
        loading,
        refresh,
        refreshAll,
      }}
    >
      {children}
    </DictionaryContext.Provider>
  );
};