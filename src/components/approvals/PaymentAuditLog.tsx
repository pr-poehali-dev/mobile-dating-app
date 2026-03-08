import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/icon';
import { API_ENDPOINTS } from '@/config/api';

interface AuditLog {
  id: number;
  payment_id: number;
  approver_id: number;
  approver_role: string;
  action: string;
  comment: string;
  created_at: string;
  username?: string;
  full_name?: string;
}

interface PaymentAuditLogProps {
  paymentId: number;
}

const PaymentAuditLog = ({ paymentId }: PaymentAuditLogProps) => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const loadLogs = async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINTS.approvalsApi}?payment_id=${paymentId}&history=true`,
          {
            headers: { 'X-Auth-Token': token },
          }
        );

        const data = await response.json();
        setLogs(Array.isArray(data.history) ? data.history : []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [token, paymentId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return 'Plus';
      case 'updated': return 'Edit';
      case 'approve': return 'Check';
      case 'reject': return 'X';
      case 'submit': return 'Send';
      case 'revoke': return 'RotateCcw';
      default: return 'Activity';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-green-400';
      case 'updated': return 'text-blue-400';
      case 'approve': return 'text-green-500';
      case 'reject': return 'text-red-500';
      case 'submit': return 'text-yellow-400';
      case 'revoke': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: 'Создан',
      updated: 'Изменён',
      approve: 'Согласован',
      reject: 'Отклонён',
      submit: 'Отправлен на согласование',
      revoke: 'Отозван',
    };
    return labels[action] || action;
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      amount: 'Сумма',
      description: 'Описание',
      category_id: 'Категория',
      status: 'Статус',
      legal_entity_id: 'Юр. лицо',
      contractor_id: 'Контрагент',
      department_id: 'Отдел',
      service_id: 'Сервис',
      payment_date: 'Дата платежа',
    };
    return labels[field] || field;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-2 text-sm text-muted-foreground">Загрузка истории...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon name="FileText" size={32} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">История изменений пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="border border-white/10 rounded-lg p-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${getActionColor(log.action)}`}>
              <Icon name={getActionIcon(log.action)} size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="text-sm font-medium">{getActionLabel(log.action)}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.full_name || log.username || 'Система'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {log.comment && (
                <div className="mt-2 text-xs text-muted-foreground italic border-l-2 border-white/20 pl-2">
                  {log.comment}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentAuditLog;