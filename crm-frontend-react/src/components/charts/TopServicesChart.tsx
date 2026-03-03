import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TopServicesChartProps {
  labels: string[];
  data: number[];
}

export default function TopServicesChart({ labels, data }: TopServicesChartProps) {
  return (
    <Bar
      data={{
        labels,
        datasets: [{
          label: 'Количество',
          data,
          backgroundColor: [
            '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6',
          ],
          borderRadius: 6,
        }],
      }}
      options={{
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true },
        },
      }}
    />
  );
}
