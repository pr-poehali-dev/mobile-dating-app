import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSidebarTouch } from '@/hooks/useSidebarTouch';
import PaymentsSidebar from '@/components/payments/PaymentsSidebar';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/config/api';

interface Approval {
  id: number;
  payment_id: number;
  approver_id: number;
  approver_name: string;
  approver_role: string;
  action: string;
  comment: string;
  created_at: string;
  amount?: number;
  description?: string;
}

const ApprovalsHistory = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [dictionariesOpen, setDictionariesOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    menuOpen,
    setMenuOpen,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSidebarTouch();

  const loadApprovals = () => {
    if (!token) return;

    fetch(`${API_ENDPOINTS.main}?endpoint=approvals`, {
      headers: {
        'X-Auth-Token': token,
      },
    })
      .then(res => res.json())
      .then(data => {
        setApprovals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load approvals:', err);
        setApprovals([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadApprovals();
  }, [token]);

  const handleDeleteApproval = async (approvalId: number) => {
    if (!confirm('Удалить эту запись из истории согласований?')) return;
    
    setDeletingId(approvalId);
    try {
      const response = await fetch(`${API_ENDPOINTS.main}?endpoint=approvals&id=${approvalId}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': token || '' },
      });

      if (!response.ok) throw new Error('Failed to delete approval');

      setApprovals(approvals.filter(a => a.id !== approvalId));
      toast({
        title: 'Успешно',
        description: 'Запись удалена из истории согласований',
      });
    } catch (err) {
      console.error('Failed to delete approval:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить запись',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'submitted':
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">Отправлен</span>;
      case 'approve':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300">Одобрен</span>;
      case 'reject':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300">Отклонен</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-300">{action}</span>;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'tech_director':
        return 'Технический директор';
      case 'ceo':
        return 'CEO';
      case 'creator':
        return 'Создатель';
      default:
        return role;
    }
  };

  return (
    <div className="flex min-h-screen">
      <PaymentsSidebar
        menuOpen={menuOpen}
        dictionariesOpen={dictionariesOpen}
        setDictionariesOpen={setDictionariesOpen}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
      />

      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="lg:ml-[250px] p-4 md:p-6 lg:p-[30px] min-h-screen flex-1 overflow-x-hidden max-w-full">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 text-foreground hover:bg-muted rounded-lg transition-colors mb-4"
        >
          <Icon name="Menu" size={24} />
        </button>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">История согласований</h1>
          <p className="text-sm md:text-base text-muted-foreground">Все действия по согласованию платежей</p>
        </div>

        <Card className="border-white/5 bg-card shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Загрузка...</div>
            ) : approvals.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Пока нет истории согласований
              </div>
            ) : (
              <div className="space-y-4">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Icon name="FileCheck" size={20} />
                          </div>
                          <div>
                            <div className="font-semibold">
                              Платеж #{approval.payment_id}
                              {approval.amount && ` — ${approval.amount.toLocaleString('ru-RU')} ₽`}
                            </div>
                            {approval.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {approval.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Icon name="User" size={14} className="text-muted-foreground" />
                            <span className="text-muted-foreground">{approval.approver_name}</span>
                            <span className="text-muted-foreground/70">({getRoleName(approval.approver_role)})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Clock" size={14} className="text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {new Date(approval.created_at).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        {approval.comment && (
                          <div className="mt-2 p-2 bg-white/5 rounded text-sm">
                            <span className="text-muted-foreground/70">Комментарий: </span>
                            <span>{approval.comment}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getActionBadge(approval.action)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteApproval(approval.id)}
                          disabled={deletingId === approval.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                        >
                          {deletingId === approval.id ? (
                            <Icon name="Loader2" size={16} className="animate-spin" />
                          ) : (
                            <Icon name="Trash2" size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ApprovalsHistory;