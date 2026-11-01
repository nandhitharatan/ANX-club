'use client'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Search, Plus, Trash2, 
  MapPin, Eye, Users, AlertCircle, RefreshCw,
  Globe, EyeOff, Ban, FileText, X, Pencil
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { getAuthToken } from '@/lib/auth-helpers'
import { getNormalizedLifecycleStatus, EventLifecycleStatus } from '@/lib/events/lifecycle'

export default function ManageEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<'All' | 'Published' | 'Draft' | 'Cancelled' | 'Deleted'>('All')

  // Modals state
  const [selectedEventRegs, setSelectedEventRegs] = useState<{ id: string, title: string, list: any[], error?: string } | null>(null)
  const [loadingRegs, setLoadingRegs] = useState(false)

  const [cancelModalEvent, setCancelModalEvent] = useState<any | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [submittingCancel, setSubmittingCancel] = useState(false)

  const [deleteModalEvent, setDeleteModalEvent] = useState<any | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const [viewReasonEvent, setViewReasonEvent] = useState<any | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getAuthToken(user)
      const res = await fetch('/api/v1/events?all=true', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const rawList = data.data || (Array.isArray(data) ? data : [])
        // Attach normalized lifecycle status to every event
        const normalized = rawList.map((e: any) => ({
          ...e,
          lifecycleStatus: getNormalizedLifecycleStatus(e),
        }))
        setEvents(normalized)
      } else {
        setError(data.error || data.message || 'Failed to load events from the database.')
      }
    } catch (err: any) {
      console.error('Failed to load events:', err)
      setError('Network or database connection error. Unable to load events.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch =
        (e.title || '').toLowerCase().includes(search.toLowerCase()) || 
        (e.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.collegeName && e.collegeName.toLowerCase().includes(search.toLowerCase())) ||
        (e.speaker && e.speaker.toLowerCase().includes(search.toLowerCase()))

      const matchesTab =
        statusTab === 'All'
          ? true
          : statusTab === 'Deleted'
          ? e.lifecycleStatus === 'Deleted'
          : e.lifecycleStatus === statusTab

      return matchesSearch && matchesTab
    })
  }, [search, statusTab, events])

  // Lifecycle Action: Publish
  const handlePublish = async (evt: any) => {
    setActionLoadingId(evt.id)
    try {
      const token = await getAuthToken(user)
      const res = await fetch(`/api/v1/events/${evt.id}/lifecycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'publish' }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast.success(`"${evt.title}" is now published and live for students! 🚀`)
        setEvents(prev =>
          prev.map(e =>
            e.id === evt.id
              ? { ...e, status: 'Published', isPublished: true, lifecycleStatus: 'Published' }
              : e
          )
        )
      } else {
        toast.error(data.message || 'Failed to publish event.')
      }
    } catch (err: any) {
      toast.error('Network error during event publication.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Lifecycle Action: Unpublish
  const handleUnpublish = async (evt: any) => {
    setActionLoadingId(evt.id)
    try {
      const token = await getAuthToken(user)
      const res = await fetch(`/api/v1/events/${evt.id}/lifecycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'unpublish' }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast.success(`"${evt.title}" unpublished. It is now hidden from students. 🔒`)
        setEvents(prev =>
          prev.map(e =>
            e.id === evt.id
              ? { ...e, status: 'Draft', isPublished: false, lifecycleStatus: 'Draft' }
              : e
          )
        )
      } else {
        toast.error(data.message || 'Failed to unpublish event.')
      }
    } catch (err: any) {
      toast.error('Network error during event unpublication.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Lifecycle Action: Confirm Cancel
  const handleConfirmCancel = async () => {
    if (!cancelModalEvent) return
    const reason = cancelReason.trim()
    if (!reason || reason.length < 3) {
      toast.error('Please enter a cancellation reason (at least 3 characters).')
      return
    }

    setSubmittingCancel(true)
    try {
      const token = await getAuthToken(user)
      const res = await fetch(`/api/v1/events/${cancelModalEvent.id}/lifecycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'cancel', reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast.success(`Event "${cancelModalEvent.title}" has been cancelled. Registrations are closed. 🚫`)
        setEvents(prev =>
          prev.map(e =>
            e.id === cancelModalEvent.id
              ? {
                  ...e,
                  status: 'Cancelled',
                  isPublished: false,
                  cancellationReason: reason,
                  cancelledAt: new Date().toISOString(),
                  lifecycleStatus: 'Cancelled',
                }
              : e
          )
        )
        setCancelModalEvent(null)
        setCancelReason('')
      } else {
        toast.error(data.message || 'Failed to cancel event.')
      }
    } catch (err) {
      toast.error('Network error while cancelling event.')
    } finally {
      setSubmittingCancel(false)
    }
  }

  // Lifecycle Action: Confirm Delete (Soft Delete / Archive)
  const handleConfirmDelete = async () => {
    if (!deleteModalEvent) return
    setSubmittingDelete(true)
    try {
      const token = await getAuthToken(user)
      const res = await fetch(`/api/v1/events/${deleteModalEvent.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast.success(`Event "${deleteModalEvent.title}" archived. History and payments preserved! 📦`)
        setEvents(prev =>
          prev.map(e =>
            e.id === deleteModalEvent.id
              ? {
                  ...e,
                  isActive: false,
                  status: 'Deleted',
                  isPublished: false,
                  lifecycleStatus: 'Deleted',
                }
              : e
          )
        )
        setDeleteModalEvent(null)
      } else {
        toast.error(data.message || 'Failed to archive event.')
      }
    } catch (err) {
      toast.error('Network error during event archival.')
    } finally {
      setSubmittingDelete(false)
    }
  }

  const handleViewRegistrations = async (evt: any) => {
    setLoadingRegs(true)
    setSelectedEventRegs({ id: evt.id, title: evt.title, list: [] })
    try {
      const token = await getAuthToken(user)
      const res = await fetch(`/api/v1/admin/events/${evt.id}/registrations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && (data.success || Array.isArray(data))) {
        setSelectedEventRegs({
          id: evt.id,
          title: evt.title,
          list: data.data || (Array.isArray(data) ? data : [])
        })
      } else {
        setSelectedEventRegs({
          id: evt.id,
          title: evt.title,
          list: [],
          error: data.error || 'Failed to retrieve registrations from database.'
        })
        toast.error(data.error || 'Could not fetch registration list.')
      }
    } catch (err) {
      console.error(err)
      setSelectedEventRegs({
        id: evt.id,
        title: evt.title,
        list: [],
        error: 'Network error communicating with registrations service.'
      })
      toast.error('Error fetching registrations.')
    } finally {
      setLoadingRegs(false)
    }
  }

  const renderStatusBadge = (status: EventLifecycleStatus) => {
    switch (status) {
      case 'Published':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Published
          </span>
        )
      case 'Draft':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Draft / Unpublished
          </span>
        )
      case 'Cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Cancelled
          </span>
        )
      case 'Deleted':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Archived
          </span>
        )
    }
  }

  return (
    <div className="space-y-8 select-none">
      {/* Header section */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Event Administration</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage global cohorts, inspect attendee rosters, and control event lifecycle states.
          </p>
        </div>

        <Link
          href="/admin/events/create"
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow shadow-amber-500/15"
        >
          <Plus className="w-4 h-4" /> Create New Event
        </Link>
      </section>

      {/* Search and Lifecycle Status Filter Tabs */}
      <section className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events by title, college, category, or speaker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-foreground font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="p-2 rounded-xl border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1.5 transition-all"
              title="Refresh database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider bg-muted/40 px-3 py-1.5 rounded-xl border border-border/40">
              {events.length} Database Records
            </div>
          </div>
        </div>

        {/* Lifecycle Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3">
          {(['All', 'Published', 'Draft', 'Cancelled', 'Deleted'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? events.length
                : events.filter(e => e.lifecycleStatus === tab).length
            const isActive = statusTab === tab
            return (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{tab === 'Draft' ? 'Drafts' : tab === 'Deleted' ? 'Archived' : tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-zinc-950/20 text-zinc-950' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-card border border-border/50 rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Querying Firestore events collection...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-500">Database Connection Error</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-foreground">No Events in Database</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              There are currently zero events stored in Firestore. Schedule your first ecosystem event to populate the student catalog.
            </p>
          </div>
          <Link
            href="/admin/events/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Schedule First Event
          </Link>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-12 text-center space-y-2">
          <p className="text-xs font-semibold text-foreground">No events match the selected criteria</p>
          <p className="text-[11px] text-muted-foreground">Try selecting a different status filter or clearing your search query.</p>
        </div>
      ) : (
        <section className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-[10px] uppercase text-muted-foreground tracking-wider font-bold bg-muted/20">
                  <th className="py-4.5 px-6">Event details</th>
                  <th className="py-4.5 px-4">Status</th>
                  <th className="py-4.5 px-4">Campus / College</th>
                  <th className="py-4.5 px-4">Led by Speaker</th>
                  <th className="py-4.5 px-4">Date & Time</th>
                  <th className="py-4.5 px-4">Registrations</th>
                  <th className="py-4.5 px-4">Pricing</th>
                  <th className="py-4.5 px-6 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 font-medium">
                <AnimatePresence>
                  {filteredEvents.map((evt) => {
                    const status = evt.lifecycleStatus as EventLifecycleStatus
                    const isBusy = actionLoadingId === evt.id

                    return (
                      <motion.tr 
                        key={evt.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                        className="hover:bg-muted/10 transition-colors"
                      >
                        {/* Title & category */}
                        <td className="py-4 px-6 max-w-[200px]">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
                              {evt.category || evt.eventType || 'Event'}
                            </span>
                            <h4 className="font-bold text-foreground line-clamp-1 leading-snug">
                              {evt.title}
                            </h4>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {renderStatusBadge(status)}
                        </td>

                        {/* Campus / College */}
                        <td className="py-4 px-4 text-foreground truncate max-w-[140px]">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{evt.collegeName || "All Campuses"}</span>
                          </span>
                        </td>

                        {/* Speaker */}
                        <td className="py-4 px-4 text-foreground truncate max-w-[150px]">
                          {evt.speaker ? (
                            <div className="flex items-center gap-2">
                              {evt.speakerImage && (
                                <img
                                  src={evt.speakerImage}
                                  alt={evt.speaker}
                                  className="w-6.5 h-6.5 rounded-full object-cover"
                                />
                              )}
                              <span className="truncate">{evt.speaker}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">No speaker</span>
                          )}
                        </td>

                        {/* Date / Time */}
                        <td className="py-4 px-4 text-muted-foreground font-semibold whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-primary shrink-0" /> {formatDate(evt.date)} • {evt.time || 'TBD'}
                          </span>
                        </td>

                        {/* Registrations */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>{evt.registeredCount || 0} / {evt.capacity || evt.seats || 100} filled</span>
                            </div>
                            <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${Math.min(100, Math.round(((evt.registeredCount || 0) / (evt.capacity || evt.seats || 100)) * 100))}%` }} 
                              />
                            </div>
                          </div>
                        </td>

                        {/* Pricing */}
                        <td className="py-4 px-4 text-foreground font-bold whitespace-nowrap">
                          {evt.price === 0 || !evt.price ? (
                            <span className="text-emerald-500 font-extrabold text-[10px]">FREE</span>
                          ) : (
                            formatCurrency(evt.price)
                          )}
                          {evt.premiumOnly && (
                            <span className="block text-[8px] bg-amber-500/10 text-amber-500 font-bold px-1 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest mt-1 w-max">
                              Premium Only
                            </span>
                          )}
                        </td>

                        {/* Lifecycle Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Draft Actions: Publish or Delete */}
                            {status === 'Draft' && (
                              <button
                                onClick={() => handlePublish(evt)}
                                disabled={isBusy}
                                className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                                title="Publish event to student catalog"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>{isBusy ? 'Publishing...' : 'Publish'}</span>
                              </button>
                            )}

                            {/* Published Actions: Unpublish or Cancel */}
                            {status === 'Published' && (
                              <>
                                <button
                                  onClick={() => handleUnpublish(evt)}
                                  disabled={isBusy}
                                  className="px-2 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                                  title="Unpublish event (hide from student catalog)"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>{isBusy ? '...' : 'Unpublish'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setCancelModalEvent(evt)
                                    setCancelReason('')
                                  }}
                                  disabled={isBusy}
                                  className="px-2 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                                  title="Cancel event with official reason"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Cancel</span>
                                </button>
                              </>
                            )}

                            {/* Cancelled Actions: View Reason */}
                            {status === 'Cancelled' && (
                              <button
                                onClick={() => setViewReasonEvent(evt)}
                                className="px-2 py-1.5 rounded-lg border border-border/40 hover:bg-muted text-zinc-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                                title="Inspect cancellation reason and audit trail"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-400" />
                                <span>Reason</span>
                              </button>
                            )}

                            {/* Inspect Attendee Roster (Always Available) */}
                            <button
                              onClick={() => handleViewRegistrations(evt)}
                              className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-all shrink-0"
                              title="View Registrations"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>

                            {/* View Detail Link (Always Available unless deleted) */}
                            {status !== 'Deleted' && (
                              <Link
                                href={`/events/${evt.id}`}
                                className="p-1.5 rounded-lg border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
                                title="Preview Event"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Edit Event Link (Available unless deleted) */}
                            {status !== 'Deleted' && (
                              <Link
                                href={`/admin/events/${evt.id}/edit`}
                                className="p-1.5 rounded-lg border border-border/40 hover:bg-amber-500/10 text-amber-500 hover:text-amber-400 transition-all shrink-0"
                                title="Edit Event Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Delete / Archive (Available if not already deleted) */}
                            {status !== 'Deleted' ? (
                              <button
                                onClick={() => setDeleteModalEvent(evt)}
                                className="p-1.5 rounded-lg border border-border/40 hover:bg-rose-500/5 text-rose-500 hover:text-rose-600 transition-all shrink-0"
                                title="Safely Archive Event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-500 italic px-2">Archived</span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Cancellation Confirmation Dialog (Modal) */}
      <AnimatePresence>
        {cancelModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => !submittingCancel && setCancelModalEvent(null)}
              className="fixed inset-0 bg-black backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex items-start justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2 text-rose-500">
                  <Ban className="w-5 h-5 shrink-0" />
                  <h3 className="font-display text-base font-bold text-foreground">
                    Cancel Event: {cancelModalEvent.title}
                  </h3>
                </div>
                <button
                  onClick={() => !submittingCancel && setCancelModalEvent(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300 space-y-1">
                <p className="font-bold">⚠️ Important Cancellation Notice</p>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  Cancelling will immediately freeze registrations and display an official cancellation notice to attendees. Existing registrations and payment records will be preserved safely.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Official Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Explain why this event is being cancelled (e.g., Guest instructor unavailable, venue emergency maintenance, scheduling conflict)..."
                  className="w-full p-3 bg-muted/40 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-foreground"
                />
                <p className="text-[10px] text-muted-foreground">
                  This explanation will be visible to students and platform administrators.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  disabled={submittingCancel}
                  onClick={() => setCancelModalEvent(null)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs transition-colors"
                >
                  Keep Event
                </button>
                <button
                  type="button"
                  disabled={submittingCancel || cancelReason.trim().length < 3}
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5"
                >
                  {submittingCancel ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cancelling Event...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete / Archival Confirmation Dialog (Modal) */}
      <AnimatePresence>
        {deleteModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => !submittingDelete && setDeleteModalEvent(null)}
              className="fixed inset-0 bg-black backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex items-start justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2 text-rose-500">
                  <Trash2 className="w-5 h-5 shrink-0" />
                  <h3 className="font-display text-base font-bold text-foreground">
                    Archive Event: {deleteModalEvent.title}
                  </h3>
                </div>
                <button
                  onClick={() => !submittingDelete && setDeleteModalEvent(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p>
                  Are you sure you want to archive this event?
                </p>
                <div className="bg-muted/40 border border-border/40 rounded-xl p-3 space-y-1">
                  <p className="font-semibold text-foreground">Data Preservation Guarantee:</p>
                  <p className="text-[11px] text-muted-foreground">
                    This action performs a <span className="font-bold text-amber-400">safe soft deletion</span>. The event will no longer appear in student discovery feeds, but all attendee registration history and payment transaction records remain intact.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  disabled={submittingDelete}
                  onClick={() => setDeleteModalEvent(null)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingDelete}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5"
                >
                  {submittingDelete ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    'Archive Event'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Reason Viewer Modal */}
      <AnimatePresence>
        {viewReasonEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewReasonEvent(null)}
              className="fixed inset-0 bg-black backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex items-start justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2 text-amber-500">
                  <FileText className="w-5 h-5 shrink-0" />
                  <h3 className="font-display text-base font-bold text-foreground">
                    Cancellation Audit Record
                  </h3>
                </div>
                <button
                  onClick={() => setViewReasonEvent(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Event Title</span>
                  <p className="text-xs font-bold text-foreground">{viewReasonEvent.title}</p>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Official Cancellation Reason</span>
                  <p className="text-xs text-foreground italic font-medium leading-relaxed">
                    "{viewReasonEvent.cancellationReason || 'No explicit reason provided.'}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-1">
                  <div>
                    <span className="font-semibold block text-foreground">Cancelled Date:</span>
                    <span>{viewReasonEvent.cancelledAt ? formatDate(viewReasonEvent.cancelledAt) : 'Recorded in database'}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-foreground">Cancelled By:</span>
                    <span className="truncate block">{viewReasonEvent.cancelledBy || 'Platform Administrator'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setViewReasonEvent(null)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs transition-colors"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Registrations Modal */}
      <AnimatePresence>
        {selectedEventRegs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEventRegs(null)}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Registrations: {selectedEventRegs.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedEventRegs.list.length} attendees enrolled
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEventRegs(null)}
                  className="px-3 py-1 bg-muted text-xs font-semibold rounded-lg hover:bg-muted/80 text-foreground"
                >
                  Close
                </button>
              </div>

              {loadingRegs ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  <span>Loading attendee roster from database...</span>
                </div>
              ) : selectedEventRegs.error ? (
                <div className="py-8 text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                  <p className="text-xs text-rose-500">{selectedEventRegs.error}</p>
                </div>
              ) : selectedEventRegs.list.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No registrations recorded yet for this event in the database.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-border/30 text-xs">
                  {selectedEventRegs.list.map((r: any, idx: number) => (
                    <div key={r.id || idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{r.name || r.userName || 'Attendee'}</p>
                        <p className="text-[10px] text-muted-foreground">{r.email || 'N/A'} • {r.phone || 'N/A'}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                        {r.paymentStatus === 'paid' ? `Paid (₹${r.amount || 0})` : 'Confirmed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
