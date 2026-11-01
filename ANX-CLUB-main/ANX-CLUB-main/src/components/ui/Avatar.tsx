import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
};

const sizeNumbers = {
  xs: 24,
  sm: 32,
  md: 36,
  lg: 44,
  xl: 56,
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name || '');
  const colorClass = name ? getAvatarColor(name) : 'bg-primary';
  const sizeClass = sizeMap[size];
  const px = sizeNumbers[size];

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden shrink-0', sizeClass, className)}>
        <Image
          src={src}
          alt={name || 'Avatar'}
          width={px}
          height={px}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full shrink-0 text-white font-semibold select-none',
        sizeClass,
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}

// Avatar Group
interface AvatarGroupProps {
  items: Array<{ src?: string | null; name?: string | null }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function AvatarGroup({ items, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const visible = items.slice(0, max);
  const remaining = items.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visible.map((item, i) => (
        <div key={i} className="ring-2 ring-surface rounded-full">
          <Avatar src={item.src} name={item.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-surface-hover border-2 border-surface text-xs font-medium text-foreground-secondary',
            sizeMap[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
