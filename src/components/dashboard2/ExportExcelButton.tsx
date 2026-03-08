import { useState } from 'react';
import { usePaymentsCache, PaymentRecord } from '@/contexts/PaymentsCacheContext';
import { usePeriod } from '@/contexts/PeriodContext';
import Icon from '@/components/ui/icon';
import { exportPaymentsToExcel } from '@/utils/exportExcel';

const PERIOD_LABEL: Record<string, string> = {
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
  custom: 'Период',
};

const ExportExcelButton = () => {
  const { payments: allPayments, loading } = usePaymentsCache();
  const { period, getDateRange } = usePeriod();
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (loading || exporting) return;
    setExporting(true);

    try {
      const { from, to } = getDateRange();

      const filtered = (Array.isArray(allPayments) ? allPayments : []).filter((p: PaymentRecord) => {
        if (!p.payment_date) return false;
        const raw = String(p.payment_date);
        const d = new Date(raw.includes('T') ? raw : raw + 'T00:00:00');
        return d >= from && d <= to;
      });

      const label = PERIOD_LABEL[period] || period;
      exportPaymentsToExcel(filtered, label);
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  };

  const isDisabled = loading || exporting;
  const isLight = document.documentElement.classList.contains('light');

  return (
    <button
      onClick={handleExport}
      disabled={isDisabled}
      title="Экспорт в Excel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '10px',
        border: '1px solid rgba(0,185,100,0.3)',
        background: isDisabled
          ? isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'
          : 'rgba(0,185,100,0.1)',
        color: isDisabled ? 'hsl(var(--muted-foreground))' : '#00b964',
        fontSize: '13px',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.18s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!isDisabled) (e.currentTarget as HTMLElement).style.background = 'rgba(0,185,100,0.18)';
      }}
      onMouseLeave={e => {
        if (!isDisabled) (e.currentTarget as HTMLElement).style.background = 'rgba(0,185,100,0.1)';
      }}
    >
      {exporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#00b964' }} />
          <span className="hidden sm:inline">Формирую...</span>
        </>
      ) : (
        <>
          <Icon name="FileSpreadsheet" size={16} />
          <span className="hidden sm:inline">Экспорт в Excel</span>
        </>
      )}
    </button>
  );
};

export default ExportExcelButton;
