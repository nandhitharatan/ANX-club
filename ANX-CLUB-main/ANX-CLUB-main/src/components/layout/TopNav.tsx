'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Moon, Sun, LogOut, User, Bot, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/providers/AuthProvider';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import NotificationBell from '@/components/NotificationBell';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function getBreadcrumb(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  const parts = pathname.split('/').filter(Boolean);
  return parts[parts.length - 1]
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function TopNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, profile, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const breadcrumb = getBreadcrumb(pathname);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-[#0a0b10]/90 backdrop-blur-xl sticky top-0 z-30">
      {/* Left — Search Bar */}
      <div className="flex-1 flex items-center max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input 
            type="text" 
            placeholder="Search events, mentors, projects, roadmaps..." 
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border/50 bg-[#161825] text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-4">
        {/* XP Counter */}
        {user && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
            <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-bold text-yellow-500 tracking-wide">{profile?.xpTotal ?? 0} XP</span>
          </div>
        )}

        {/* Assistant / Robot */}
        <Button onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))} variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30" aria-label="AI Assistant">
          <Bot className="h-5 w-5" />
        </Button>

        {/* Real-time Notifications */}
        <NotificationBell />

        {/* User Menu */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 ml-2 pl-2 border-l border-border hover:bg-surface-hover/50 p-1.5 rounded-xl transition-colors text-left"
            >
              <div className="flex flex-col hidden sm:block">
                <span className="text-sm font-bold text-foreground block leading-tight">{profile?.fullName || user.displayName || 'User'}</span>
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase">{profile?.membershipType || 'Member'}</span>
              </div>
              <Avatar
                name={user.displayName || user.email || 'User'}
                src={user.photoURL}
                size="md"
                className="ring-2 ring-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-surface border border-border rounded-xl shadow-lg overflow-hidden animate-fade-in-scale z-50">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-foreground-muted truncate">
                    {user.email || user.phoneNumber || ''}
                  </p>
                </div>
                <div className="p-1">
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-foreground-secondary hover:bg-surface-hover hover:text-foreground transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!user && (
          <Link href="/login">
            <Button variant="primary" size="sm">Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
