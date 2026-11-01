'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { isOfficialAdminEmail } from '@/lib/admin-auth-config'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const email = (user?.email || profile?.email || '').toLowerCase().trim()
    const isAdmin = profile?.role === 'Admin' || isOfficialAdminEmail(email) || email === 'admin@anxclub.dev' || email === 'admin@algorithmaliens.com' || email === 'admin@anx.club'

    if (isAdmin) {
      router.replace('/admin')
    }
  }, [loading, user, profile, router])

  const email = (user?.email || profile?.email || '').toLowerCase().trim()
  const isAdmin = profile?.role === 'Admin' || isOfficialAdminEmail(email) || email === 'admin@anxclub.dev' || email === 'admin@algorithmaliens.com' || email === 'admin@anx.club'

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 text-sm gap-3">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <span>Redirecting to Admin Portal...</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-72 h-full shrink-0 hidden lg:block">
        <DashboardSidebar />
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-card shadow-2xl lg:hidden"
            >
              <DashboardSidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Primary Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-background/50 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
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
