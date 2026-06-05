interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  change?: number;
  changeLabel?: string;
  color?: 'green' | 'gold' | 'blue' | 'red';
}

export function StatCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  color = 'green',
}: StatCardProps) {
  const colorMap = {
    green: {
      bg: 'bg-[#10B981]/10',
      text: 'text-[#10B981]',
      border: 'border-[#10B981]/20',
    },
    gold: {
      bg: 'bg-[#F59E0B]/10',
      text: 'text-[#F59E0B]',
      border: 'border-[#F59E0B]/20',
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
    },
    red: {
      bg: 'bg-[#EF4444]/10',
      text: 'text-[#EF4444]',
      border: 'border-[#EF4444]/20',
    },
  };

  const colors = colorMap[color];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-black/10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400 font-medium">{title}</span>
        <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-bold ${colors.text}`}>{value}</div>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {change >= 0 ? (
            <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          <span className={`text-xs font-medium ${change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span className="text-xs text-gray-500 ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
