import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-white/5 border border-white/10 text-gray-300',
        primary: 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30',
        success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        warning: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
        danger: 'bg-red-500/10 text-red-400 border border-red-500/30',
        premium: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
        purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
        blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
        muted: 'bg-white/5 text-gray-500 border border-white/5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'warning' && 'bg-orange-500',
            variant === 'premium' && 'bg-cyan-500',
            variant === 'primary' && 'bg-fuchsia-500',
            !variant || variant === 'default' || variant === 'muted'
              ? 'bg-gray-500'
              : ''
          )}
        />
      )}
      {children}
    </span>
  );
}
