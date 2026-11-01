'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Search, Bell, Sun, Moon, LogOut, User, Settings, Check, Sparkles, Award, Zap, Bot } from 'lucide-react'
import { MOCK_USER, MOCK_ANNOUNCEMENTS } from '@/lib/constants'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/modules/module3/components/AuthContext'
import toast from 'react-hot-toast'

interface HeaderProps {
  onMenuClick: () => void
  sidebarOpen: boolean
}

export function DashboardHeader({ onMenuClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { user, profile, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-white/5 bg-[#0b0c1b]/80 backdrop-blur-md select-none shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      {/* Search / Collapsible Trigger */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="relative max-w-md w-full hidden md:block group" onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
          <input
            readOnly
            type="text"
            placeholder="Search events, mentors, projects, roadmaps..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 focus:bg-white/10 transition-all text-white shadow-inner cursor-pointer"
          />
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* XP Badge (Only for signed in user) */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Zap className="w-4 h-4 fill-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            <span className="text-xs font-bold">{(profile as any)?.xp || 1280} XP</span>
          </div>
        )}

        {/* Bot Icon */}
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))} className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/30 text-purple-400 transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <Bot className="w-5 h-5 relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowProfileMenu(false)
            }}
            className="relative p-2 rounded-full border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-rose-400 transition-all"
          >
            <Bell className="w-5 h-5 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-[#0b0c1b]" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 glass-card rounded-2xl z-20 py-2 overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Recent Activity</span>
                    <button onClick={() => toast.success('All notifications marked as read!')} className="text-[10px] text-purple-400 font-semibold hover:underline flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
                    {MOCK_ANNOUNCEMENTS.slice(0, 3).map((ann) => (
                      <div key={ann.id} className="p-3.5 hover:bg-white/5 transition-colors flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        <div>
                          <p className="text-xs font-semibold text-white line-clamp-1">{ann.title}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{ann.content}</p>
                          <span className="text-[9px] text-muted-foreground mt-2 block font-medium">Just now</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/announcements"
                    onClick={() => setShowNotifications(false)}
                    className="block text-center text-xs font-semibold text-purple-400 py-2.5 border-t border-white/10 bg-black/20 hover:bg-black/40 transition-colors"
                  >
                    View All Announcements
                  </Link>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown or Guest Login Buttons */}
        {user ? (
          <div className="relative ml-1 sm:ml-2">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu)
                setShowNotifications(false)
              }}
              className="flex items-center gap-3 text-left group"
            >
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold text-white leading-tight group-hover:text-purple-400 transition-colors">{profile?.fullName || user?.displayName || 'Member'}</p>
                <span className="text-[10px] text-purple-400 font-medium truncate">{profile?.role || 'Member'}</span>
              </div>
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user?.displayName || user?.email || 'User')}&background=8b5cf6&color=fff`}
                alt={profile?.fullName || user?.displayName || 'Avatar'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 glass-card rounded-2xl z-20 p-1.5 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs text-muted-foreground font-medium">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate mt-0.5">{profile?.fullName || user?.displayName || user?.email}</p>
                      {profile?.role === 'Premium Member' && (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-md font-semibold tracking-wider uppercase mt-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                          <Award className="w-2.5 h-2.5" /> Premium Member
                        </span>
                      )}
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      href="/membership"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                      <Award className="w-4 h-4" />
                      <span>Membership Status</span>
                    </Link>

                    <div className="border-t border-white/10 my-1" />

                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-2 ml-1 sm:ml-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all"
            >
              Join Club
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
