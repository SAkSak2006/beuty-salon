import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface RevenueChartProps {
  labels: string[];
  data: number[];
}

export default function RevenueChart({ labels, data }: RevenueChartProps) {
  return (
    <Line
      data={{
        labels,
        datasets: [{
          label: 'Выручка',
          data,
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236,72,153,0.1)',
          fill: true,
          tension: 0.4,
        }],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${(ctx.parsed.y ?? 0).toLocaleString('ru-RU')} ₽`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => `${Number(v).toLocaleString('ru-RU')} ₽` },
          },
        },
      }}
    />
  );
}
