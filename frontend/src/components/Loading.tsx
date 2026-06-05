export function Loading({ text = '加载中...', size = 'md' }: { text?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  }[size];

  const gapSize = {
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-3',
  }[size];

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`flex items-center ${gapSize}`}>
        <div
          className={`${dotSize} rounded-full bg-emerald-primary`}
          style={{ animation: 'loading-pulse 1.4s ease-in-out infinite' }}
        />
        <div
          className={`${dotSize} rounded-full bg-emerald-primary`}
          style={{ animation: 'loading-pulse 1.4s ease-in-out 0.2s infinite' }}
        />
        <div
          className={`${dotSize} rounded-full bg-emerald-primary`}
          style={{ animation: 'loading-pulse 1.4s ease-in-out 0.4s infinite' }}
        />
      </div>
      {text && (
        <p className={`mt-4 ${textSize} text-gray-400`}>{text}</p>
      )}
      <style>{`
        @keyframes loading-pulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
