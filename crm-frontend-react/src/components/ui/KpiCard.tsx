interface KpiCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  change?: number;
}

export default function KpiCard({ title, value, icon, color, change }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <i className={`${icon} text-white`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {change !== undefined && (
        <div className={`text-sm mt-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          <i className={`fas fa-arrow-${change >= 0 ? 'up' : 'down'} mr-1`} />
          {Math.abs(change)}% к пред. периоду
        </div>
      )}
    </div>
  );
}
