import { useMemo, useState, useEffect, useCallback } from 'react';
import { usePaymentsCache, PaymentRecord } from '@/contexts/PaymentsCacheContext';
import { usePeriod } from '@/contexts/PeriodContext';
import Icon from '@/components/ui/icon';
import { exportDrillDownToExcel } from '@/utils/exportExcel';

export interface DrillDownFilter {
  type: 'category' | 'contractor' | 'department' | 'legal_entity' | 'payment_type' | 'date' | 'service';
  value: string;
  label: string;
}

interface Props {
  filter: DrillDownFilter | null;
  onClose: () => void;
}

type SortField = 'payment_date' | 'amount';
type SortDir = 'asc' | 'desc';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  approved: { label: 'Согласован', color: '#00c951' },
  pending: { label: 'На согласовании', color: '#ffb547' },
  rejected: { label: 'Отклонён', color: '#ff4d6d' },
  paid: { label: 'Оплачен', color: '#7551e9' },
  cancelled: { label: 'Отменён', color: '#9ca3af' },
};

const fmt = (v: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(v);

const fmtDate = (s: string) => {
  const d = new Date(s.includes('T') ? s : s + 'T00:00:00');
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  cash: 'Наличные',
  legal: 'Безналичные',
  card: 'Карта',
};

const DrillDownModal = ({ filter, onClose }: Props) => {
  const { payments: allPayments } = usePaymentsCache();
  const { getDateRange } = usePeriod();
  const [sortField, setSortField] = useState<SortField>('payment_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!filter) return;
    setSearch('');
    setSortField('payment_date');
    setSortDir('asc');
  }, [filter]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const filtered = useMemo(() => {
    if (!filter) return [];
    const { from, to } = getDateRange();

    return (Array.isArray(allPayments) ? allPayments : []).filter((p: PaymentRecord) => {
      if (!p.payment_date) return false;
      const raw = String(p.payment_date);
      const d = new Date(raw.includes('T') ? raw : raw + 'T00:00:00');
      if (d < from || d > to) return false;

      switch (filter.type) {
        case 'category':
          return (p.category_name || 'Без категории') === filter.value;
        case 'contractor':
          return (p.contractor_name || 'Без контрагента') === filter.value;
        case 'service':
          return (p.service_name || 'Без сервиса') === filter.value;
        case 'department':
          return (p.department_name || 'Без отдела') === filter.value;
        case 'legal_entity':
          return (p.legal_entity_name || 'Без юр. лица') === filter.value;
        case 'payment_type': {
          if (filter.value === 'cash') return p.payment_type === 'cash';
          return p.payment_type !== 'cash';
        }
        case 'date': {
          const dateKey = raw.slice(0, 10);
          return dateKey === filter.value || raw.startsWith(filter.value);
        }
        default:
          return true;
      }
    });
  }, [filter, allPayments, getDateRange]);

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    const base = q
      ? filtered.filter(p =>
          [p.description, p.service_name, p.category_name, p.contractor_name, p.department_name]
            .some(v => v?.toLowerCase().includes(q))
        )
      : filtered;

    return [...base].sort((a, b) => {
      if (sortField === 'amount') {
        return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      const da = new Date(String(a.payment_date)).getTime();
      const db = new Date(String(b.payment_date)).getTime();
      return sortDir === 'asc' ? da - db : db - da;
    });
  }, [filtered, sortField, sortDir, search]);

  const total = useMemo(() => sorted.reduce((s, p) => s + p.amount, 0), [sorted]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleExport = () => {
    if (exporting || sorted.length === 0 || !filter) return;
    setExporting(true);
    try {
      exportDrillDownToExcel(sorted, filter.label);
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  };

  const isLight = document.documentElement.classList.contains('light');

  if (!filter) return null;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <Icon name="ChevronsUpDown" size={12} />;
    return <Icon name={sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={12} />;
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? '0' : '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: isMobile ? '20px 20px 0 0' : '20px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '900px',
        maxHeight: isMobile ? '92vh' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}>

        {/* ═══ HEADER ═══ */}
        <div style={{
          padding: isMobile ? '16px' : '20px 24px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(117,81,233,0.06)',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(117,81,233,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon name="TableProperties" size={16} style={{ color: '#7551e9' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? '14px' : '16px', fontWeight: 700,
                color: 'hsl(var(--foreground))',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                Детализация: <span style={{ color: '#7551e9' }}>{filter.label}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                {sorted.length} платежей · Итого: <span style={{ color: '#7551e9', fontWeight: 700 }}>{fmt(total)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '34px', height: '34px', borderRadius: '8px',
              border: '1px solid hsl(var(--border))', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))',
              flexShrink: 0,
            }}
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* ═══ SEARCH + SORT ═══ */}
        <div style={{
          padding: isMobile ? '12px 16px' : '14px 24px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '8px',
          flexShrink: 0,
        }}>
          {/* Search — всегда на всю ширину */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Icon name="Search" size={14} style={{
              position: 'absolute', left: '10px', top: '50%',
              transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))',
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по платежам..."
              style={{
                width: '100%', paddingLeft: '32px', paddingRight: '12px',
                height: '38px', borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontSize: '13px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Sort buttons + Export */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
            {(['payment_date', 'amount'] as SortField[]).map(f => (
              <button
                key={f}
                onClick={() => toggleSort(f)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 12px', borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  background: sortField === f ? 'rgba(117,81,233,0.12)' : 'transparent',
                  color: sortField === f ? '#7551e9' : 'hsl(var(--muted-foreground))',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  flex: isMobile ? 1 : undefined,
                  justifyContent: isMobile ? 'center' : undefined,
                }}
              >
                {f === 'payment_date' ? 'По дате' : 'По сумме'}
                <SortIcon field={f} />
              </button>
            ))}
            <button
              onClick={handleExport}
              disabled={exporting || sorted.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid rgba(0,185,100,0.3)',
                background: (exporting || sorted.length === 0) ? 'rgba(255,255,255,0.04)' : 'rgba(0,185,100,0.1)',
                color: (exporting || sorted.length === 0) ? 'hsl(var(--muted-foreground))' : '#00b964',
                fontSize: '12px', fontWeight: 600,
                cursor: (exporting || sorted.length === 0) ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s', whiteSpace: 'nowrap',
                flex: isMobile ? '1 0 100%' : undefined,
                justifyContent: isMobile ? 'center' : undefined,
              }}
              onMouseEnter={e => {
                if (!exporting && sorted.length > 0)
                  (e.currentTarget as HTMLElement).style.background = 'rgba(0,185,100,0.18)';
              }}
              onMouseLeave={e => {
                if (!exporting && sorted.length > 0)
                  (e.currentTarget as HTMLElement).style.background = 'rgba(0,185,100,0.1)';
              }}
            >
              {exporting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2" style={{ borderColor: '#00b964' }} />
              ) : (
                <Icon name="FileSpreadsheet" size={13} />
              )}
              {exporting ? 'Формирую...' : 'Выгрузить Excel'}
            </button>
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {sorted.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
              <Icon name="SearchX" size={40} style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '12px' }} />
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px' }}>Платежи не найдены</p>
            </div>
          ) : isMobile ? (
            /* ═══ MOBILE: карточки ═══ */
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sorted.map((p, i) => {
                const st = STATUS_LABEL[p.status || ''] ?? { label: p.status || '—', color: '#9ca3af' };
                return (
                  <div
                    key={p.id ?? i}
                    style={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      padding: '14px',
                    }}
                  >
                    {/* Строка 1: описание + сумма */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.3 }}>
                          {p.description || p.service_name || p.contractor_name || '—'}
                        </div>
                        {p.service_name && p.description && (
                          <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>{p.service_name}</div>
                        )}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#7551e9', flexShrink: 0 }}>
                        {fmt(p.amount)}
                      </div>
                    </div>

                    {/* Строка 2: категория + отдел */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {p.category_name && (
                        <span style={{
                          fontSize: '11px', padding: '3px 8px', borderRadius: '6px',
                          background: 'rgba(117,81,233,0.1)', color: '#7551e9', fontWeight: 600,
                        }}>
                          {p.category_name}
                        </span>
                      )}
                      {p.department_name && (
                        <span style={{
                          fontSize: '11px', padding: '3px 8px', borderRadius: '6px',
                          background: 'hsl(var(--border))', color: 'hsl(var(--foreground))', fontWeight: 500,
                        }}>
                          {p.department_name}
                        </span>
                      )}
                    </div>

                    {/* Строка 3: дата + тип + статус */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                          {p.payment_date ? fmtDate(String(p.payment_date)) : '—'}
                        </span>
                        {p.payment_type && (
                          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                            · {PAYMENT_TYPE_LABEL[p.payment_type] || p.payment_type}
                          </span>
                        )}
                      </div>
                      <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: '6px',
                        fontSize: '11px', fontWeight: 600,
                        background: `${st.color}20`, color: st.color,
                      }}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ═══ DESKTOP: таблица ═══ */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))', position: 'sticky', top: 0, background: 'hsl(var(--card))', zIndex: 1 }}>
                    {['Описание / Сервис', 'Категория', 'Отдел', 'Тип расчёта', 'Дата', 'Сумма', 'Статус'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: '11px', fontWeight: 600,
                        color: 'hsl(var(--muted-foreground))',
                        textTransform: 'uppercase', letterSpacing: '0.4px',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, i) => {
                    const st = STATUS_LABEL[p.status || ''] ?? { label: p.status || '—', color: '#9ca3af' };
                    return (
                      <tr
                        key={p.id ?? i}
                        style={{ borderBottom: '1px solid hsl(var(--border))', transition: 'background 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '12px 14px', maxWidth: '200px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description || p.service_name || p.contractor_name || '—'}
                          </div>
                          {p.service_name && p.description && (
                            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>{p.service_name}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: 'hsl(var(--foreground))', whiteSpace: 'nowrap' }}>
                          {p.category_name || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: 'hsl(var(--foreground))', whiteSpace: 'nowrap' }}>
                          {p.department_name || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: 'hsl(var(--foreground))', whiteSpace: 'nowrap' }}>
                          {PAYMENT_TYPE_LABEL[p.payment_type || ''] || p.payment_type || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: 'hsl(var(--foreground))', whiteSpace: 'nowrap' }}>
                          {p.payment_date ? fmtDate(String(p.payment_date)) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: '#7551e9', whiteSpace: 'nowrap' }}>
                          {fmt(p.amount)}
                        </td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 8px', borderRadius: '6px',
                            fontSize: '11px', fontWeight: 600,
                            background: `${st.color}20`, color: st.color,
                          }}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        {sorted.length > 0 && (
          <div style={{
            padding: isMobile ? '12px 16px' : '14px 24px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0,
            background: 'rgba(117,81,233,0.04)',
          }}>
            <span style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
              {sorted.length} платежей
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Итого:</span>
              <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: '#7551e9' }}>{fmt(total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrillDownModal;