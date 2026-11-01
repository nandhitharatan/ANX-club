'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Sparkles, LayoutDashboard, Calendar, Users, 
  Award, Bell, BookOpen, User, ShieldAlert, LogOut, X, MessageSquare,
  Briefcase, Target, Trophy
} from 'lucide-react'
import { MOCK_USER } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuth } from '@/modules/module3/components/AuthContext'

interface SidebarProps {
  onClose?: () => void
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Mentors', href: '/mentors', icon: Users },
  { label: 'Resources', href: '/resources', icon: BookOpen },
  { label: 'Community', href: '/community', icon: MessageSquare },
  { label: 'Incubator', href: '/incubator', icon: Sparkles },
  { label: 'Internships', href: '/internships', icon: Briefcase },
  { label: 'Career Prep', href: '/career', icon: Target },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'Announcements', href: '/announcements', icon: Bell },
  { label: 'Membership', href: '/membership', icon: Award },
  { label: 'My Profile', href: '/profile', icon: User },
]

export function DashboardSidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, profile, logout } = useAuth()

  return (
    <div className="h-full flex flex-col justify-between bg-background text-foreground border-r border-border/10 select-none z-10 relative">
      {/* Decorative light glow for sidebar */}
      <div className="absolute top-0 left-[-50%] w-full h-96 bg-fuchsia-600/5 blur-[120px] rounded-full pointer-events-none" />
      {/* Top Brand Block */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-[1px] shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full bg-[#0b0c1b] rounded-[11px] flex items-center justify-center">
                <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-purple-400">A</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-foreground tracking-tight leading-none">A.N.X</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] mt-1 text-cyan-400/70">Platform</span>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground lg:hidden">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group z-10 overflow-hidden",
                isActive 
                  ? "text-white border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent pointer-events-none" />
              )}
              {isActive && (
                <motion.div 
                  layoutId="activeSidebarIndicator"
                  className="absolute left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-600 shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-105 relative z-10", isActive ? "text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Membership & Profile Card */}
      <div className="p-4 z-10 mt-2">
        {user ? (
          <>
            {profile?.role === 'Premium Member' && (
              <div className="mb-4 bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-purple-500/20 rounded-2xl p-4 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Membership</h5>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Premium Member</div>
                    <div className="text-xs text-muted-foreground">{profile?.membershipExpiry ? `Valid till ${profile.membershipExpiry}` : 'Active Membership'}</div>
                  </div>
                </div>
                <Link href="/membership" className="block text-center w-full mt-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all">
                  Manage Membership
                </Link>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0b0c1b]/80 border border-white/5 backdrop-blur-md">
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user?.displayName || user?.email || 'User')}&background=8b5cf6&color=fff`}
                alt={profile?.fullName || user?.displayName || 'Avatar'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">{profile?.fullName || user?.displayName || 'Member'}</h4>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button 
                onClick={logout} 
                title="Sign Out"
                className="p-2 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-br from-purple-950/40 to-indigo-950/40 border border-purple-500/20 rounded-2xl p-4 shadow-[0_0_20px_rgba(168,85,247,0.1)] space-y-3">
            <div>
              <p className="text-xs font-bold text-white">Unlock Full Access</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Sign in to register for events, book top mentors, and access resources.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/login"
                onClick={onClose}
                className="block text-center py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block text-center py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all"
              >
                Join Free
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
