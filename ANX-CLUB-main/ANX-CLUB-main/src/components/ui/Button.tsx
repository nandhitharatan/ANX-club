import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white border-none shadow-[0_0_15px_rgba(217,70,239,0.4)] active:scale-[0.98]',
        secondary:
          'bg-white/5 text-white border border-white/10 hover:bg-white/10 shadow-xs active:scale-[0.98]',
        ghost:
          'text-gray-400 hover:text-white hover:bg-white/5 active:scale-[0.98]',
        outline:
          'border border-white/20 text-white hover:bg-white/5 hover:border-fuchsia-500/50 active:scale-[0.98]',
        destructive:
          'bg-red-600/80 text-white hover:bg-red-500/90 shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-500/50 active:scale-[0.98]',
        link:
          'text-fuchsia-400 underline-offset-4 hover:underline p-0 h-auto',
        premium:
          'bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold hover:opacity-90 shadow-[0_0_20px_rgba(34,211,238,0.6)] active:scale-[0.98]',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-9 px-4 text-sm rounded-lg',
        lg: 'h-10 px-5 text-sm rounded-lg',
        xl: 'h-11 px-6 text-base rounded-xl',
        icon: 'h-9 w-9 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-xs': 'h-7 w-7 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  className,
  variant,
  size,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
