import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Line } from 'react-chartjs-2';
import { ActivityDataPoint } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface ActivityChartProps {
  data: ActivityDataPoint[];
  title: string;
}

const ActivityChart = ({ data, title }: ActivityChartProps) => {
  const [period, setPeriod] = useState<7 | 30>(7);

  const filteredData = data.slice(-period);

  const chartData = {
    labels: filteredData.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
    }),
    datasets: [
      {
        label: 'Операции',
        data: filteredData.map(d => d.value),
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(var(--card))',
        titleColor: 'hsl(var(--card-foreground))',
        bodyColor: 'hsl(var(--card-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: { parsed: { y: number } }) => `Операций: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(var(--border) / 0.3)',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
    },
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={period === 7 ? 'default' : 'outline'}
            onClick={() => setPeriod(7)}
            className="text-xs"
          >
            7 дней
          </Button>
          <Button
            size="sm"
            variant={period === 30 ? 'default' : 'outline'}
            onClick={() => setPeriod(30)}
            className="text-xs"
          >
            30 дней
          </Button>
        </div>
      </div>
      <div className="h-[250px]">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
};

export default ActivityChart;