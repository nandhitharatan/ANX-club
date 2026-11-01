'use client';

import { usePathname } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import type { ReactNode } from 'react';

const AUTH_PATHS = ['/login', '/signup', '/reset-password'];

export function ConditionalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuth) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}
