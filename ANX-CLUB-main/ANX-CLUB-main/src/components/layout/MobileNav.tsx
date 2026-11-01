'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Users2, MessageSquare, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_NAV = [
  { icon: LayoutDashboard, label: 'Home', href: '/' },
  { icon: Calendar, label: 'Events', href: '/events' },
  { icon: Users2, label: 'Mentors', href: '/mentors' },
  { icon: MessageSquare, label: 'Community', href: '/community' },
  { icon: UserCircle, label: 'Profile', href: '/profile' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
        {MOBILE_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
