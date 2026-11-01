'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Users, Calendar, Clock, FileText, Plus,
  ExternalLink, AlertCircle, RefreshCw, ArrowRight,
  GraduationCap, CheckCircle2, ChevronRight, Radio
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { getAuthToken } from '@/lib/auth-helpers'

export interface ChapterEvent {
  id: string
  title: string
  description?: string
  date?: string
  time?: string
  format?: 'online' | 'offline' | 'hybrid' | string
  venue?: string
  meetingUrl?: string
  registrationType?: 'internal' | 'external' | string
  registrationUrl?: string
  capacity?: number
  seatsBooked?: number
  registeredCount?: number
  normalizedStatus?: string
}

export interface ChapterAnnouncement {
  id: string
  title: string
  content: string
  createdAt?: string
  targetCohort?: string
}

export interface DashboardResponse {
  success: boolean
  college?: {
    id: string
    name: string
  }
  stats?: {
    totalEvents: number
    publishedEvents: number
    draftEvents: number
    cancelledEvents: number
    upcomingEventsCount: number
    chapterMembersCount: number
    activeAnnouncementsCount: number
    pendingReportsCount: number
  }
  upcomingEvents?: ChapterEvent[]
  recentAnnouncements?: ChapterAnnouncement[]
  message?: string
}

export default function StudentHeadDashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<{ status: number; message: string } | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null)

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const token = await getAuthToken(user)
      const res = await fetch('/api/v1/student-head/dashboard', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      })

      const data: DashboardResponse = await res.json()

      if (!res.ok || !data.success) {
        setError({
          status: res.status,
          message: data.message || `Failed to fetch chapter dashboard (${res.status})`,
        })
        setDashboardData(null)
      } else {
        setDashboardData(data)
        setError(null)
      }
    } catch (err: any) {
      console.error('[StudentHeadDashboard] Error fetching dashboard data:', err)
      setError({
        status: 500,
        message: err?.message || 'Unable to connect to the chapter dashboard API. Please check your network.',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData()
    }
  }, [authLoading, fetchDashboardData])

  // =========================================================
  // Loading State
  // =========================================================
  if (authLoading || (loading && !refreshing)) {
    return (
      <div data-testid="student-head-page-loading" className="space-y-8 animate-fade-in">
        {/* Welcome Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* 4 Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>

        {/* Events Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================
  // Specific Error State: No Assigned College (403)
  // =========================================================
  if (error && error.status === 403 && error.message.toLowerCase().includes('no assigned college')) {
    return (
      <div data-testid="student-head-unassigned-college-error" className="py-12 px-4 max-w-xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">College Chapter Assignment Required</h2>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          Your account has been granted Student Head privileges, but an administrator has not yet assigned you to a specific college chapter.
          Chapter metrics and event authorizations require a verified college affiliation.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => fetchDashboardData()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-check Status
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
          >
            Return to Student Portal
          </Link>
        </div>
      </div>
    )
  }

  // =========================================================
  // General Error / Service Unavailable State (500 / 503 / 401)
  // =========================================================
  if (error || !dashboardData) {
    return (
      <div data-testid="student-head-error-screen" className="py-8 max-w-2xl mx-auto">
        <ErrorState
          title={error?.status === 401 ? "Authentication Required" : "Chapter Dashboard Error"}
          description={error?.message || "Unable to load chapter metrics. Please try again or contact support."}
          onRetry={() => fetchDashboardData()}
        />
        {error?.status === 401 && (
          <div className="text-center mt-4">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all inline-block"
            >
              Sign In to ANX
            </Link>
          </div>
        )}
      </div>
    )
  }

  const { college, stats, upcomingEvents = [], recentAnnouncements = [] } = dashboardData
  const chapterName = college?.name || profile?.collegeName || 'Chapter Operations'

  return (
    <div data-testid="student-head-dashboard-content" className="space-y-8 animate-fade-in">
      {/* =====================================================
          1. Header Banner & Quick Actions
      ====================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-900 border border-cyan-500/20 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <GraduationCap className="w-3.5 h-3.5" />
                {chapterName}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Chapter Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Welcome back, {profile?.fullName || user?.displayName || 'Chapter Lead'}!
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Oversee chapter registrations, coordinate workshops, and monitor campus engagement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all disabled:opacity-50"
              title="Refresh chapter data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <Link
              href="/admin/events/create"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Event</span>
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          2. Pending Reports Alert (Conditional)
      ====================================================== */}
      {stats && stats.pendingReportsCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="flex-1 text-xs">
            <span className="font-semibold block text-amber-200">
              {stats.pendingReportsCount} Post-Event Report{stats.pendingReportsCount > 1 ? 's' : ''} Pending Submission
            </span>
            <span>
              Please ensure event completion summaries, attendance logs, and photographic documentation are submitted for recent chapter sessions.
            </span>
          </div>
        </div>
      )}

      {/* =====================================================
          3. Key Chapter Metric Cards
      ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Chapter Members */}
        <Card className="border-cyan-500/20 bg-zinc-950/60 hover:border-cyan-500/40 transition-colors">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Chapter Members</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats?.chapterMembersCount ?? 0}
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">Enrolled students in {chapterName}</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Chapter Events */}
        <Card className="border-purple-500/20 bg-zinc-950/60 hover:border-purple-500/40 transition-colors">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Total Events</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats?.totalEvents ?? 0}
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">
                {stats?.publishedEvents ?? 0} published · {stats?.draftEvents ?? 0} drafts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Upcoming Sessions */}
        <Card className="border-emerald-500/20 bg-zinc-950/60 hover:border-emerald-500/40 transition-colors">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Upcoming Sessions</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats?.upcomingEventsCount ?? 0}
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">Scheduled future activities</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Pending Reports */}
        <Card className="border-amber-500/20 bg-zinc-950/60 hover:border-amber-500/40 transition-colors">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Event Reports</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats?.pendingReportsCount ?? 0}
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">
                {(stats?.pendingReportsCount ?? 0) > 0 ? 'Pending report submissions' : 'All reports completed'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =====================================================
          4. Main Content: Upcoming Events & Chapter Announcements
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upcoming Events (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Upcoming Chapter Events</h2>
              <Badge variant="default" className="text-[10px]">
                {upcomingEvents.length} Active
              </Badge>
            </div>
            <Link
              href="/admin/events"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>View All Events</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-zinc-800 bg-zinc-950/40">
              <EmptyState
                title="No Upcoming Events Scheduled"
                description="Your chapter has no upcoming events on the calendar. Schedule a workshop, hackathon or tech talk to engage students."
                action={{
                  label: "Schedule Event",
                  onClick: () => router.push('/admin/events/create'),
                }}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((evt) => {
                const isExternal =
                  evt.registrationType === 'external' ||
                  (evt.registrationUrl && evt.registrationUrl.trim().length > 0)
                const booked = evt.seatsBooked ?? evt.registeredCount ?? 0
                const cap = evt.capacity ?? 0

                return (
                  <div
                    key={evt.id}
                    data-testid={`chapter-event-item-${evt.id}`}
                    className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate block">
                          {evt.title}
                        </span>
                        <Badge
                          variant={
                            evt.format === 'online'
                              ? 'blue'
                              : evt.format === 'offline'
                              ? 'purple'
                              : 'primary'
                          }
                          className="capitalize text-[10px]"
                        >
                          {evt.format || 'Hybrid'}
                        </Badge>
                        {isExternal ? (
                          <Badge variant="warning" className="text-[10px] gap-1">
                            <ExternalLink className="w-2.5 h-2.5" />
                            External Form
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            ANX Registration
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                        {evt.date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {evt.date} {evt.time ? `at ${evt.time}` : ''}
                          </span>
                        )}
                        {cap > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-zinc-500" />
                            {booked} / {cap} Seats Booked
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isExternal && evt.registrationUrl && (
                        <a
                          href={evt.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1"
                          title="Open external registration URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Form</span>
                        </a>
                      )}
                      <Link
                        href={`/admin/events/${evt.id}/edit`}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Announcements & Chapter Noticeboard (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Chapter Announcements</h2>
            <Link
              href="/announcements"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              All Alerts
            </Link>
          </div>

          {recentAnnouncements.length === 0 ? (
            <Card className="p-6 text-center border-dashed border-zinc-800 bg-zinc-950/40">
              <p className="text-xs text-zinc-400">No active chapter announcements.</p>
              <Link
                href="/announcements"
                className="mt-3 inline-block text-xs text-cyan-400 hover:underline font-medium"
              >
                Post an announcement
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white line-clamp-1">
                      {ann.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {ann.createdAt ? String(ann.createdAt).split('T')[0] : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Quick Action Box */}
          <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 p-4 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              Quick Shortcuts
            </span>
            <div className="space-y-1.5">
              <Link
                href="/admin/events/create"
                className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-all"
              >
                <span>Create New Chapter Workshop</span>
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
              <Link
                href="/admin/events"
                className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-all"
              >
                <span>Manage Chapter Calendar</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
              <Link
                href="/events"
                className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-all"
              >
                <span>Browse Student Catalog</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
