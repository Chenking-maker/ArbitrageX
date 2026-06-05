interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export function Badge({ text, variant = 'default' }: BadgeProps) {
  const variantMap = {
    success: 'bg-emerald-primary/10 text-emerald-primary border-emerald-primary/20',
    warning: 'bg-gold/10 text-gold border-gold/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    default: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantMap[variant]}`}>
      {text}
    </span>
  );
}
