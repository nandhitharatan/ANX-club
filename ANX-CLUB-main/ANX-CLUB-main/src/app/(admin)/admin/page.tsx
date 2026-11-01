'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Users, Calendar, Award, IndianRupee, ArrowUpRight, 
  ArrowDownRight, ShieldCheck, Sparkles, Plus, Clock, 
  ExternalLink, ArrowRight, Activity, AlertCircle, RefreshCw 
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function AdminPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { getToken } = await import('@/lib/api')
      const token = getToken()
      const res = await fetch('/api/v1/admin/analytics', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
        // Derive recent activities from real members roster and top events
        if (data.membersRoster && Array.isArray(data.membersRoster)) {
          const realActivities = data.membersRoster.slice(0, 6).map((m: any, idx: number) => ({
            id: `act-${m.id || idx}`,
            type: m.membershipType === 'premium' ? 'payment' : 'signup',
            user: m.name || 'Member',
            text: m.membershipType === 'premium' ? 'active Premium Tier member' : 'joined ANX Club ecosystem',
            time: m.joinedDate || 'Recently'
          }))
          setActivities(realActivities)
        } else {
          setActivities([])
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.error || 'Failed to fetch real-time analytics data.')
      }
    } catch (err: any) {
      console.error('Failed to load admin analytics:', err)
      setError(err?.message || 'Network error fetching analytics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const totalUsersCount = analytics?.totalUsers ?? 0
  const premiumUsersCount = analytics?.premiumUsers ?? 0
  const totalEventsCount = analytics?.totalEvents ?? 0
  const totalRevenue = analytics?.mrr ?? 0

  return (
    <div className="space-y-8 select-none">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-8 text-white shadow-xl shadow-amber-500/5">
        <div className="absolute inset-0 bg-grid-white/[0.04] bg-[size:30px_30px]" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              ANX Control Hub
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              Ecosystem Control Center
            </h1>
            <p className="text-zinc-400 max-w-xl text-xs md:text-sm leading-relaxed font-medium">
              Manage member cohorts, edit events, monitor global transaction analytics, and configure system gates.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/admin/submissions"
              className="px-4 py-2.5 bg-muted/80 hover:bg-muted text-foreground font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-border"
            >
              <Activity className="w-4 h-4 text-amber-500" /> Review Submissions & Bookings
            </Link>
            <Link
              href="/admin/events/create"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow shadow-amber-500/15"
            >
              <Plus className="w-4 h-4" /> Create New Event
            </Link>
          </div>
        </div>
      </section>

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-400">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <div className="text-xs">
              <span className="font-bold">Database telemetry error: </span>
              <span>{error}</span>
            </div>
          </div>
          <button
            onClick={fetchStats}
            className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Students</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-foreground">
              {loading ? <span className="inline-block w-12 h-6 bg-muted/60 animate-pulse rounded" /> : totalUsersCount}
            </h3>
            <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Active members
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Premium Elites</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Award className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-foreground">
              {loading ? <span className="inline-block w-12 h-6 bg-muted/60 animate-pulse rounded" /> : premiumUsersCount}
            </h3>
            <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Subscribed cohort
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Published Events</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-foreground">
              {loading ? <span className="inline-block w-12 h-6 bg-muted/60 animate-pulse rounded" /> : totalEventsCount}
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium">Platform schedule</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estimated Yield</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <IndianRupee className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-foreground">
              {loading ? <span className="inline-block w-16 h-6 bg-muted/60 animate-pulse rounded" /> : formatCurrency(totalRevenue)}
            </h3>
            <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Verified subscriptions
            </p>
          </div>
        </div>
      </section>

      {/* Grid: Charts + Activities */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Growth Chart (Left 2 Columns) */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-display text-base font-bold text-foreground">User Growth Metrics</h3>
              <p className="text-[10px] text-muted-foreground">Month-on-month cohort subscription trends</p>
            </div>
            <Link href="/admin/analytics" className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1">
              Deep Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Premium custom animated line chart */}
          <div className="h-64 relative flex items-end justify-between border-b border-border/40 pb-2">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-border/20 w-full" />
              <div className="border-t border-border/20 w-full" />
              <div className="border-t border-border/20 w-full" />
              <div className="border-t border-border/20 w-full" />
            </div>

            {/* Custom SVG Line Chart */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Fill Gradient Area */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Path area */}
              <path
                d="M 0 90 Q 20 60 40 70 T 80 30 T 100 20 L 100 100 L 0 100 Z"
                fill="url(#chartGradient)"
              />
              {/* Main Line */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                d="M 0 90 Q 20 60 40 70 T 80 30 T 100 20"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            {/* Labels */}
            <div className="text-[10px] font-bold text-muted-foreground w-full flex justify-between pt-4 select-none relative z-10 -bottom-8">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>

        {/* Activity Feed (Right 1 Column) */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
              <h3 className="font-display text-base font-bold text-foreground">Ecosystem Ticker</h3>
            </div>
          </div>

          <div className="space-y-4 max-h-72 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                <RefreshCw className="w-5 h-5 mx-auto mb-2 text-muted-foreground/40 animate-spin" />
                Syncing ecosystem telemetry...
              </div>
            ) : activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="flex gap-2.5 border-b border-border/30 pb-3 last:border-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-foreground block">{act.user}</span>
                    <span className="text-muted-foreground">{act.text}</span>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">{act.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground">
                <Activity className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
                No recent ecosystem activity logged.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cohort Stats Distribution */}
      <section className="bg-muted/10 border border-border/40 rounded-2xl p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-foreground">Cohort Segment Breakdown</h3>
        {totalUsersCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-medium">
            {/* Item 1 */}
            <div className="bg-card border border-border/40 p-4.5 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Premium Membership Share</span>
                <span>{Math.round((premiumUsersCount / totalUsersCount) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round((premiumUsersCount / totalUsersCount) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Item 2 */}
            <div className="bg-card border border-border/40 p-4.5 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Free Cohort Members</span>
                <span>{Math.round(((totalUsersCount - premiumUsersCount) / totalUsersCount) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round(((totalUsersCount - premiumUsersCount) / totalUsersCount) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Item 3 */}
            <div className="bg-card border border-border/40 p-4.5 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Monthly Active Members</span>
                <span>{analytics?.mam ?? 0}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card/40 rounded-xl border border-dashed border-border/60">
            Real-time cohort telemetry will populate automatically as students register and join ANX campus hubs.
          </div>
        )}
      </section>
    </div>
  )
}
