'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users2,
  MessageSquare,
  FolderGit2,
  Map,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { Avatar } from '../ui/Avatar';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Calendar, label: 'Events', href: '/events' },
  { icon: Users2, label: 'Mentors', href: '/mentors' },
  { icon: MessageSquare, label: 'Community', href: '/community' },
  { icon: FolderGit2, label: 'Projects', href: '#' },
  { icon: Map, label: 'Roadmaps', href: '#' },
  { icon: CreditCard, label: 'Membership', href: '/membership' },
  { icon: MessageSquare, label: 'Messages', href: '#' },
];

const BOTTOM_ITEMS = [
  { icon: UserCircle, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '#' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 border-r border-border bg-[#0a0b10]/95 backdrop-blur-xl',
        'transition-all duration-300 ease-smooth shrink-0',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-border shrink-0">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-primary flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">A.N.X</span>
              <span className="text-[9px] uppercase tracking-widest text-primary font-bold">Platform</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && item.href !== '#' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (item.href === '#') {
                  e.preventDefault();
                  toast.success(`${item.label} coming soon!`);
                }
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                'group relative',
                isActive
                  ? 'bg-gradient-to-r from-primary/80 to-purple-800 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] font-semibold border border-primary/50'
                  : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground border border-transparent',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-white' : 'text-foreground-muted group-hover:text-foreground')} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-l-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Membership Card */}
      {!collapsed && user && (
        <div className="px-4 py-4 mb-2 mx-2 rounded-2xl bg-gradient-to-b from-[#1a1c29] to-[#0d0e15] border border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 tracking-wider">
              MEMBERSHIP
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                <Shield className="h-4 w-4 text-white fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white">Premium Member</span>
                <span className="text-xs text-primary font-medium">Valid till 15 Aug 2025</span>
              </div>
            </div>
            <Link href="/membership" className="block w-full">
              <button className="w-full py-2 mt-2 rounded-lg bg-surface border border-primary/30 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-[inset_0_0_10px_rgba(139,92,246,0.2)]">
                Manage Membership
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Admin link */}
      {user && (
        <div className="px-3 py-1 mb-2">
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
              'text-foreground-secondary hover:bg-surface-hover hover:text-foreground border border-transparent',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Admin' : undefined}
          >
            <Shield className="h-5 w-5 shrink-0 text-foreground-muted" />
            {!collapsed && <span>Admin</span>}
          </Link>
        </div>
      )}

      {/* Bottom Items */}
      <div className="px-2 py-2 border-t border-border space-y-0.5">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (item.href === '#') {
                  e.preventDefault();
                  toast.success(`${item.label} coming soon!`);
                }
              }}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* User Avatar */}
        {user && (
          <div
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 mt-1',
              collapsed && 'justify-center px-2'
            )}
          >
            <Avatar name={user.displayName || user.email || 'User'} src={user.photoURL} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-[10px] text-foreground-muted truncate">
                  {user.email || user.phoneNumber || ''}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
