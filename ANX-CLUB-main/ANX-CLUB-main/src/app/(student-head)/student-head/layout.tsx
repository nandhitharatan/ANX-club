'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, Calendar, Users, Bell, 
  Sparkles, LogOut, Menu, X, ArrowLeft,
  ChevronRight, User, GraduationCap, ShieldAlert
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { isOfficialAdminEmail } from '@/lib/admin-auth-config'

const navItems = [
  { label: 'Chapter Overview', href: '/student-head', icon: LayoutDashboard },
  { label: 'Manage Events', href: '/admin/events', icon: Calendar },
  { label: 'Announcements', href: '/announcements', icon: Bell },
  { label: 'Student Catalog', href: '/events', icon: Sparkles },
  { label: 'Student Portal', href: '/dashboard', icon: ArrowLeft },
  { label: 'My Profile', href: '/profile', icon: User },
]

export default function StudentHeadLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading, logout } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return

    const email = (user?.email || profile?.email || '').toLowerCase().trim()
    const rawRole = (profile?.role || '').toLowerCase().trim()
    const isStudentHead = 
      rawRole === 'student head' || 
      rawRole === 'studenthead' || 
      rawRole === 'student_head'
    const isAdmin = isOfficialAdminEmail(email) || rawRole === 'admin'

    if (user && (isStudentHead || isAdmin)) {
      setIsAuthorized(true)
      return
    }

    // Check localStorage saved profile fallback for dev / persistent sessions
    try {
      if (typeof window !== 'undefined') {
        const savedProfileStr = localStorage.getItem('anx_auth_profile')
        const savedUserStr = localStorage.getItem('anx_auth_user')
        if (savedProfileStr || savedUserStr) {
          const p = savedProfileStr ? JSON.parse(savedProfileStr) : null
          const u = savedUserStr ? JSON.parse(savedUserStr) : null
          const uEmail = (u?.email || p?.email || '').toLowerCase().trim()
          const pRole = (p?.role || '').toLowerCase().trim()
          if (
            pRole === 'student head' ||
            pRole === 'studenthead' ||
            pRole === 'student_head' ||
            pRole === 'admin' ||
            isOfficialAdminEmail(uEmail)
          ) {
            setIsAuthorized(true)
            return
          }
        }
      }
    } catch (e) {
      console.warn('Error reading stored session for Student Head layout:', e)
    }

    setIsAuthorized(false)
  }, [loading, profile, user])

  // 1. Loading state
  if (loading || isAuthorized === null) {
    return (
      <div 
        data-testid="student-head-loading-screen" 
        className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 text-sm gap-3"
      >
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <span>Authenticating chapter credentials...</span>
      </div>
    )
  }

  // 2. Unauthorized state
  if (isAuthorized === false) {
    return (
      <div 
        data-testid="student-head-unauthorized-screen"
        className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          Student Chapter Lead permissions are required to access this dashboard.
          If you have been appointed as a Student Head, please ensure your account is assigned to your college chapter.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
          >
            Go to Student Portal
          </Link>
          <button
            onClick={async () => {
              await logout()
              router.push('/login')
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
          >
            Sign In with Another Account
          </button>
        </div>
      </div>
    )
  }

  const collegeName = profile?.collegeName || (profile as any)?.college || 'Campus Chapter'

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-zinc-950 text-zinc-100 border-r border-zinc-800/80 select-none">
      {/* Brand Header */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <Link href="/student-head" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-white tracking-tight leading-none">ANX Chapter</span>
              <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider mt-0.5">Student Lead</span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assigned College Badge */}
        <div className="mt-4 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-cyan-400/80 tracking-wider block">Assigned Chapter</span>
            <span className="text-xs font-semibold text-zinc-200 truncate block">{collegeName}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/student-head' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive 
                  ? "text-cyan-400 bg-cyan-500/10 font-semibold" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeStudentHeadIndicator"
                  className="absolute left-0 w-1 h-6 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? "text-cyan-400" : "text-zinc-400 group-hover:text-white"}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Card & Sign Out */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-900/40">
        <div className="flex items-center gap-3 p-2 rounded-xl">
          <img
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user?.displayName || 'Student Head')}&background=06b6d4&color=fff`}
            alt={profile?.fullName || user?.displayName || 'Student Head'}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-cyan-500/20"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{profile?.fullName || user?.displayName || 'Student Head'}</h4>
            <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={async () => {
            await logout()
            router.push('/login')
          }}
          className="flex items-center justify-center gap-2 w-full mt-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-semibold rounded-xl text-xs transition-colors border border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside className="w-72 h-full shrink-0 hidden lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black lg:hidden"
            />
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-zinc-950 shadow-2xl lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-border/40 bg-background/80 backdrop-blur-xl select-none">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md tracking-wider uppercase">
                Student Head
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline" />
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                {collegeName} Chapter Operations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2.5 p-1.5 pr-3 bg-muted/40 border border-border/40 rounded-xl">
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user?.displayName || 'Student Head')}&background=06b6d4&color=fff`}
                alt="Avatar"
                className="w-7 h-7 rounded-lg object-cover"
              />
              <span className="text-xs font-bold text-foreground hidden sm:inline">
                {profile?.fullName || user?.displayName || 'Student Head'}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Container */}
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-background/30 relative">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-16"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
