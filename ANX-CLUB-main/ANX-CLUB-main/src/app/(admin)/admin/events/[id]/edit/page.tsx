'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, RefreshCw, Calendar, Loader2 } from 'lucide-react'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { getAuthToken } from '@/lib/auth-helpers'
import EventForm from '@/components/admin/EventForm'

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const eventId = params.id as string

  const [event, setEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvent = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    setError(null)

    try {
      const token = await getAuthToken(user)
      const res = await fetch(`/api/v1/events/${eventId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 404) {
          setError('Event not found or has been archived.')
        } else if (res.status === 503) {
          setError('Database service unavailable. Please retry shortly.')
        } else {
          setError(data.message || data.error || 'Failed to fetch event details.')
        }
        return
      }

      const eventData = data.data || data
      setEvent(eventData)
    } catch (err: any) {
      console.error(`[EditEventPage] Error fetching event ${eventId}:`, err)
      setError('Network error occurred while loading event details.')
    } finally {
      setLoading(false)
    }
  }, [eventId, user])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  if (loading) {
    return (
      <div className="max-w-4xl space-y-8 select-none pb-16">
        <div>
          <button 
            onClick={() => router.push('/admin/events')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Event Catalog
          </button>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-16 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-foreground">Loading Event Details...</h3>
            <p className="text-xs text-muted-foreground">
              Retrieving curriculum, delivery logistics, and registration settings from Cloud Firestore.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl space-y-8 select-none pb-16">
        <div>
          <button 
            onClick={() => router.push('/admin/events')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Event Catalog
          </button>
        </div>

        <div className="bg-card border border-rose-500/20 bg-rose-500/5 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-rose-400">Unable to Load Event</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {error || 'The requested event could not be found or has been removed.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={fetchEvent}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
            </button>
            <Link
              href="/admin/events"
              className="px-4 py-2 border border-border/50 hover:bg-muted text-foreground rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
            >
              View Catalog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <EventForm 
      mode="edit" 
      initialData={event} 
      eventId={eventId} 
      onSuccess={() => router.push('/admin/events')}
    />
  )
}
