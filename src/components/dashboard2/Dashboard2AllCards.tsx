import { useState, useEffect } from 'react';
import TotalExpensesCard from './blocks/TotalExpensesCard';
import IndexationCard from './blocks/IndexationCard';
import AnnualSavingsStatCard from './blocks/AnnualSavingsStatCard';
import MonthlyDynamicsChart from './blocks/MonthlyDynamicsChart';
import CategoryExpensesChart from './blocks/CategoryExpensesChart';
import ContractorComparisonChart from './blocks/ContractorComparisonChart';
import ExpenseStructureChart from './blocks/ExpenseStructureChart';
import LegalEntityComparisonChart from './blocks/LegalEntityComparisonChart';
import Dashboard2TeamPerformance from './Dashboard2TeamPerformance';
import PaymentTypeChart from './blocks/PaymentTypeChart';
import ExpenseShareChart from './blocks/ExpenseShareChart';
import TopPaymentsCard from './blocks/TopPaymentsCard';

interface DashboardCard {
  id: string;
  title: string;
  type: 'stat' | 'chart';
}

const Dashboard2AllCards = () => {
  const [cardOrder, setCardOrder] = useState<DashboardCard[]>([]);

  const defaultCards: DashboardCard[] = [
    { id: 'total-expenses', title: 'Общие IT Расходы', type: 'stat' },
    { id: 'total-payments', title: 'Индексация', type: 'stat' },
    { id: 'annual-savings', title: 'Экономия', type: 'stat' },
    { id: 'payment-type-chart', title: 'Тип расчётов', type: 'stat' },
    { id: 'monthly-dynamics', title: 'Динамика Расходов по Месяцам', type: 'chart' },
    { id: 'category-expenses', title: 'IT Расходы по Категориям', type: 'chart' },
    { id: 'contractor-comparison', title: 'Сравнение по Сервисам', type: 'chart' },
    { id: 'expense-structure', title: 'Структура Расходов', type: 'chart' },
    { id: 'department-comparison', title: 'Сравнение по Отделам-Заказчикам', type: 'chart' },
    { id: 'legal-entity-comparison', title: 'Сравнение по Юридическим Лицам', type: 'chart' },
    { id: 'expense-share', title: 'Доля расходов', type: 'chart' },
  ];

  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard2-layout');
    if (savedLayout) {
      try {
        const parsed: DashboardCard[] = JSON.parse(savedLayout);
        const knownIds = defaultCards.map(c => c.id);
        const savedIds = parsed.map(c => c.id);
        const missingCards = defaultCards.filter(c => !savedIds.includes(c.id));
        if (missingCards.length > 0 || parsed.some(c => !knownIds.includes(c.id))) {
          const merged = [
            ...parsed
              .filter(c => knownIds.includes(c.id))
              .map(c => ({ ...c, type: defaultCards.find(d => d.id === c.id)?.type ?? c.type })),
            ...missingCards,
          ];
          setCardOrder(merged);
        } else {
          setCardOrder(
            parsed.map(c => ({ ...c, type: defaultCards.find(d => d.id === c.id)?.type ?? c.type }))
          );
        }
      } catch (e) {
        console.error('Failed to parse saved layout:', e);
        setCardOrder(defaultCards);
      }
    } else {
      setCardOrder(defaultCards);
    }
  }, []);

  const renderCard = (card: DashboardCard) => {
    switch (card.id) {
      case 'total-expenses':
        return <TotalExpensesCard />;
      case 'total-payments':
        return <IndexationCard />;
      case 'annual-savings':
        return <AnnualSavingsStatCard />;
      case 'monthly-dynamics':
        return <MonthlyDynamicsChart />;
      case 'category-expenses':
        return <CategoryExpensesChart />;
      case 'contractor-comparison':
        return <ContractorComparisonChart />;
      case 'expense-structure':
        return <ExpenseStructureChart />;
      case 'department-comparison':
        return <Dashboard2TeamPerformance />;
      case 'legal-entity-comparison':
        return <LegalEntityComparisonChart />;
      case 'payment-type-chart':
        return <PaymentTypeChart />;
      case 'expense-share':
        return <ExpenseShareChart />;
      default:
        return null;
    }
  };

  if (cardOrder.length === 0) return null;

  const statCards = cardOrder.filter(card => card.type === 'stat');
  const chartCards = cardOrder.filter(card => card.type === 'chart');

  const contractorCard = chartCards.find(c => c.id === 'contractor-comparison');
  const expenseStructureCard = chartCards.find(c => c.id === 'expense-structure');
  const legalEntityCard = chartCards.find(c => c.id === 'legal-entity-comparison');
  const departmentCard = chartCards.find(c => c.id === 'department-comparison');
  const expenseShareCard = chartCards.find(c => c.id === 'expense-share');

  const otherCharts = chartCards.filter(c =>
    c.id !== 'contractor-comparison' &&
    c.id !== 'expense-structure' &&
    c.id !== 'legal-entity-comparison' &&
    c.id !== 'department-comparison' &&
    c.id !== 'expense-share'
  );

  return (
    <div className="mb-6 sm:mb-8 max-w-full">
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-4 sm:mb-6">
        {statCards.map((card) => {
          return (
            <div 
              key={card.id} 
              className="w-full"
            >
              {renderCard(card)}
            </div>
          );
        })}
      </div>

      {/* Other Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {otherCharts.map((card) => (
          <div 
            key={card.id} 
            className="min-w-0 max-w-full"
          >
            {renderCard(card)}
          </div>
        ))}
      </div>

      {/* Department & Expense Structure Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {departmentCard && (
          <div className="min-w-0 max-w-full">
            {renderCard(departmentCard)}
          </div>
        )}
        {expenseStructureCard && (
          <div className="min-w-0 max-w-full">
            {renderCard(expenseStructureCard)}
          </div>
        )}
      </div>

      {/* Contractor & Legal Entity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {contractorCard && (
          <div className="min-w-0 max-w-full">
            {renderCard(contractorCard)}
          </div>
        )}
        {legalEntityCard && (
          <div className="min-w-0 max-w-full">
            {renderCard(legalEntityCard)}
          </div>
        )}
      </div>

      {/* Expense Share & Top Payments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
        {expenseShareCard && (
          <div className="min-w-0 max-w-full flex flex-col">
            <div className="flex-1">
              {renderCard(expenseShareCard)}
            </div>
          </div>
        )}
        <div className="min-w-0 max-w-full flex flex-col">
          <div className="flex-1">
            <TopPaymentsCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard2AllCards;