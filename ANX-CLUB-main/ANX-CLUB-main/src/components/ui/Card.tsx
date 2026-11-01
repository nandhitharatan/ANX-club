import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ className, hover = false, padding = 'md', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-black/40 backdrop-blur-xl',
        'border-white/10',
        hover && 'transition-all duration-300 hover:border-fuchsia-500/50 hover:bg-black/60 hover:shadow-[0_0_20px_rgba(217,70,239,0.15)] cursor-pointer',
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-0.5 pb-4 border-b border-white/10', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-white', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-gray-400', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pt-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center pt-4 border-t border-white/10 mt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Stat Card (used in dashboard)
interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  iconColor?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  delta,
  deltaType = 'neutral',
  icon,
  iconColor = 'text-primary',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        {icon && (
          <div className={cn('p-1.5 rounded-md bg-surface-hover', iconColor)}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold text-foreground tracking-tight">
          {value}
        </p>
        {delta && (
          <span
            className={cn(
              'text-xs font-medium mb-0.5',
              deltaType === 'up' && 'text-success',
              deltaType === 'down' && 'text-danger',
              deltaType === 'neutral' && 'text-foreground-muted'
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </Card>
  );
}
