'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, AlertCircle, Calendar, Users, 
  CheckCircle2, Flame, RefreshCw, Info 
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const categories = ['all', 'opportunity', 'news', 'maintenance', 'celebration']

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/v1/announcements')
        if (res.ok) {
          const data = await res.json()
          setAnnouncements(data)
        }
      } catch (err) {
        console.error('Failed to load announcements:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncements()
  }, [])

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      return filterCategory === 'all' || ann.category.toLowerCase() === filterCategory.toLowerCase()
    })
  }, [filterCategory, announcements])

  return (
    <div className="space-y-8 select-none">
      {/* Header section */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Announcements Feed</h1>
        <p className="text-xs text-muted-foreground mt-1">Keep updated with opportunities, system notifications, and community milestones.</p>
      </div>

      {/* Filter Tabs */}
      <section className="glass border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-2 overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const isSelected = filterCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 capitalize ${
                isSelected ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="annCategoryIndicator"
                  className="absolute inset-0 bg-primary/10 border border-primary/25 rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.15)]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              <span className="relative z-10">{cat === 'all' ? 'All Alerts' : cat}</span>
            </button>
          )
        })}
      </section>

      {/* Feeds Container */}
      <AnimatePresence mode="wait">
        {filteredAnnouncements.length > 0 ? (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 max-w-4xl"
          >
            {filteredAnnouncements.map((ann, idx) => {
              const isHigh = ann.priority === 'high'
              const isMedium = ann.priority === 'medium'
              
              const priorityStyles = isHigh 
                ? 'border-l-4 border-l-rose-500 bg-rose-500/5' 
                : isMedium 
                  ? 'border-l-4 border-l-amber-500 bg-amber-500/5' 
                  : 'border-l-4 border-l-blue-500 bg-blue-500/5'

              const iconColors = isHigh 
                ? 'text-rose-500 bg-rose-500/10' 
                : isMedium 
                  ? 'text-amber-500 bg-amber-500/10' 
                  : 'text-blue-500 bg-blue-500/10'

              return (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`glass border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start gap-4 transition-all hover:border-white/20 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] ${priorityStyles}`}
                >
                  {/* Alert Icon Block */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconColors}`}>
                    {isHigh ? (
                      <Flame className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{ann.author}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-border" />
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{ann.category}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(ann.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-sm md:text-base text-foreground leading-snug">
                      {ann.title}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </motion.section>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-white/10 rounded-2xl p-12 text-center shadow-xl space-y-3 max-w-sm mx-auto"
          >
            <Bell className="w-10 h-10 text-muted-foreground/80 mx-auto" />
            <h3 className="font-display text-sm font-bold text-foreground">No recent notices</h3>
            <p className="text-xs text-muted-foreground">Select another category or check back later for ecosystem updates.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
