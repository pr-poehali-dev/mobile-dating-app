import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePendingApprovals } from '@/hooks/usePendingApprovals';
import PendingApprovalsFilters from '@/components/approvals/PendingApprovalsFilters';
import PendingApprovalsList from '@/components/approvals/PendingApprovalsList';
import PendingApprovalsModal from '@/components/approvals/PendingApprovalsModal';
import { usePendingApprovalsData } from '@/hooks/usePendingApprovalsData';
import { usePendingApprovalsFilters } from '@/hooks/usePendingApprovalsFilters';
import { Payment } from '@/types/payment';

const PendingApprovalsTab = () => {
  const { requestNotificationPermission } = usePendingApprovals();
  const { payments, loading, approveProgress, handleApprove, handleApproveAll, handleReject } = usePendingApprovalsData();
  const [approvingAll, setApprovingAll] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const {
    searchQuery,
    setSearchQuery,
    amountFrom,
    setAmountFrom,
    amountTo,
    setAmountTo,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    showFilters,
    setShowFilters,
    filteredPayments,
    activeFiltersCount,
    clearFilters,
  } = usePendingApprovalsFilters(payments);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending_ceo':
        return <span className="px-3 py-1 rounded-full text-xs bg-blue-500 text-white font-medium">Ожидает CEO</span>;
      default:
        return null;
    }
  };

  const handleModalApprove = (paymentId: number, comment?: string) => {
    if (typeof handleApprove === 'function') {
      handleApprove(paymentId, comment);
      setSelectedPayment(null);
    }
  };

  const handleModalReject = (paymentId: number, comment?: string) => {
    if (typeof handleReject === 'function') {
      handleReject(paymentId, comment);
      setSelectedPayment(null);
    }
  };

  const handleApproveAllClick = async () => {
    const ids = filteredPayments.map(p => p.id).filter(Boolean) as number[];
    setApprovingAll(true);
    await handleApproveAll(ids);
    setApprovingAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по описанию, категории, сумме..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-white/10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="relative p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
        >
          <Icon name="SlidersHorizontal" size={20} />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <PendingApprovalsFilters
          amountFrom={amountFrom}
          setAmountFrom={setAmountFrom}
          amountTo={amountTo}
          setAmountTo={setAmountTo}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          activeFiltersCount={activeFiltersCount}
          clearFilters={clearFilters}
          filteredCount={filteredPayments.length}
          totalCount={payments.length}
        />
      )}

      {filteredPayments.length > 1 && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={approvingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              <Icon name={approvingAll ? 'Loader2' : 'CheckCheck'} size={16} className={approvingAll ? 'animate-spin' : ''} />
              {approvingAll ? 'Одобряем...' : `Одобрить все (${filteredPayments.length})`}
            </button>
          </div>
          {approveProgress && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Обрабатываем платежи...</span>
                <span>{approveProgress.current} / {approveProgress.total}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((approveProgress.current / approveProgress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Одобрить все платежи?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет одобрено {filteredPayments.length} платежей. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveAllClick}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              Одобрить всё
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {notificationPermission !== 'granted' && (
        <div className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-yellow-200">
              <Icon name="Bell" size={16} />
              <span>Включите уведомления, чтобы не пропустить новые заявки</span>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="text-sm text-yellow-200 hover:text-yellow-100 font-medium whitespace-nowrap"
            >
              Включить
            </button>
          </div>
        </div>
      )}

      <PendingApprovalsList
        loading={loading}
        payments={filteredPayments}
        searchQuery={searchQuery}
        handleApprove={handleApprove}
        handleReject={handleReject}
        getStatusBadge={getStatusBadge}
        onPaymentClick={setSelectedPayment}
      />

      <PendingApprovalsModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onApprove={handleModalApprove}
        onReject={handleModalReject}
        onRevoke={() => {
          // Перезагружаем данные после отзыва
          window.location.reload();
        }}
      />
    </div>
  );
};

export default PendingApprovalsTab;