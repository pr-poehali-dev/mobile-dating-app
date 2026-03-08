import { useState, useCallback } from 'react';
import { apiFetch } from '@/utils/api';
import { API_ENDPOINTS } from '@/config/api';

interface UseCrudPageOptions<T> {
  endpoint: string;
  baseApi?: keyof typeof API_ENDPOINTS;
  initialFormData: Omit<T, 'id'>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useCrudPage = <T extends { id: number }>({
  endpoint,
  baseApi = 'main',
  initialFormData,
  onSuccess,
  onError,
}: UseCrudPageOptions<T>) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Omit<T, 'id'>>(initialFormData);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`${API_ENDPOINTS[baseApi]}?endpoint=${endpoint}`);
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(`Failed to load ${endpoint}:`, error);
      setItems([]);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, baseApi, onError]);

  const handleEdit = useCallback((item: T) => {
    setEditingItem(item);
    const { id, ...rest } = item;
    setFormData(rest as Omit<T, 'id'>);
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    try {
      const url = `${API_ENDPOINTS[baseApi]}?endpoint=${endpoint}`;
      const method = editingItem ? 'PUT' : 'POST';
      const rawBody = editingItem 
        ? { id: editingItem.id, ...formData }
        : formData;
      const body = JSON.stringify(rawBody, (_key, value) => {
        if (value === undefined || value === '') return null;
        return value;
      });

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (response.ok) {
        setDialogOpen(false);
        setEditingItem(null);
        setFormData(initialFormData);
        await loadData();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }
    } catch (error) {
      console.error(`Failed to save ${endpoint}:`, error);
      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }, [editingItem, formData, endpoint, baseApi, initialFormData, loadData, onSuccess, onError]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      const response = await apiFetch(`${API_ENDPOINTS[baseApi]}?endpoint=${endpoint}&id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const text = await response.text();
        let errorMsg = 'Failed to delete';
        if (text) {
          try { errorMsg = JSON.parse(text)?.error || errorMsg; } catch { /* ignore */ }
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`Failed to delete ${endpoint}:`, error);
      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }, [endpoint, baseApi, setItems, onSuccess, onError]);

  const resetForm = useCallback(() => {
    setEditingItem(null);
    setFormData(initialFormData);
    setDialogOpen(false);
  }, [initialFormData]);

  const openDialog = useCallback(() => {
    setEditingItem(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  }, [initialFormData]);

  return {
    items,
    setItems,
    loading,
    dialogOpen,
    setDialogOpen,
    editingItem,
    formData,
    setFormData,
    loadData,
    handleEdit,
    handleSubmit,
    handleDelete,
    resetForm,
    openDialog,
  };
};