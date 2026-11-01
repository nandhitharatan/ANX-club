'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, MapPin, Video, Calendar, 
  Clock, Users, Award, Building, ExternalLink,
  Image as ImageIcon, Trash2, Plus, Sparkles, AlertCircle,
  CheckCircle2, User, Link2, Info, Globe, EyeOff, Ban
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { getAuthToken } from '@/lib/auth-helpers'
import { COLLEGES_BY_STATE } from '@/lib/data/colleges'

// Sample curated tech banners for quick selection
const BANNER_PRESETS = [
  { label: 'Web Dev & React', url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=600&fit=crop' },
  { label: 'AI & Machine Learning', url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop' },
  { label: 'Cloud & DevOps', url: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200&h=600&fit=crop' },
  { label: 'Hackathon & Sprint', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop' },
  { label: 'Tech Summit', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop' },
]

function toDateInputValue(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
    const d = new Date(val)
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0]
    }
    return val.split('T')[0] || ''
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0]
  }
  return ''
}

export interface EventFormProps {
  mode: 'create' | 'edit'
  initialData?: Record<string, any>
  eventId?: string
  onSuccess?: (event: any) => void
}

export default function EventForm({ mode, initialData, eventId, onSuccess }: EventFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [bannerPreviewError, setBannerPreviewError] = useState(false)
  const [newAgendaSlot, setNewAgendaSlot] = useState('')

  // Flatten colleges list for easy selection
  const allColleges = useMemo(() => {
    const list: { state: string; name: string }[] = []
    Object.entries(COLLEGES_BY_STATE).forEach(([state, colleges]) => {
      colleges.forEach(name => {
        if (name !== 'Other') {
          list.push({ state, name })
        }
      })
    })
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const seatsBooked = Number(initialData?.seatsBooked ?? initialData?.registeredCount ?? 0)

  // Form state initialized with initialData (in edit mode) or defaults (in create mode)
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || initialData?.eventType || 'workshop',
    posterUrl: initialData?.posterUrl || '',
    date: toDateInputValue(initialData?.date),
    endDate: toDateInputValue(initialData?.endDate),
    time: initialData?.time || '10:00 AM',
    endTime: initialData?.endTime || '',
    duration: Number(initialData?.duration) || 120,
    registrationDeadline: toDateInputValue(initialData?.registrationDeadline),
    collegeName: initialData?.collegeName || 'All Campuses (Global Ecosystem)',
    collegeId: initialData?.collegeId || '',
    registrationType: (initialData?.registrationType === 'external' ? 'external' : 'internal') as 'internal' | 'external',
    externalRegistrationUrl: initialData?.externalRegistrationUrl || '',
    isOnline: Boolean(initialData?.isOnline || (initialData?.venue && initialData.venue.toLowerCase().includes('online'))),
    venue: initialData?.venue || '',
    address: initialData?.address || '',
    meetingLink: initialData?.meetingLink || initialData?.onlineLink || '',
    meetingPlatform: initialData?.meetingPlatform || 'Google Meet',
    meetingId: initialData?.meetingId || '',
    meetingPasscode: initialData?.meetingPasscode || '',
    meetingInstructions: initialData?.meetingInstructions || '',
    speaker: initialData?.speaker || initialData?.speakerName || '',
    speakerRole: initialData?.speakerRole || '',
    speakerCompany: initialData?.speakerCompany || '',
    speakerBio: initialData?.speakerBio || '',
    speakerImage: initialData?.speakerImage || '',
    capacity: Number(initialData?.capacity || initialData?.seats || 100),
    price: Number(initialData?.price ?? 0),
    premiumOnly: Boolean(initialData?.premiumOnly),
    premiumPrice: Number(initialData?.premiumPrice ?? 0),
    agenda: Array.isArray(initialData?.agenda) ? initialData.agenda : [] as string[],
  })

  // Sync state if initialData changes later
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setForm(prev => ({
        ...prev,
        title: initialData.title ?? prev.title,
        description: initialData.description ?? prev.description,
        category: initialData.category ?? initialData.eventType ?? prev.category,
        posterUrl: initialData.posterUrl ?? prev.posterUrl,
        date: toDateInputValue(initialData.date) || prev.date,
        endDate: toDateInputValue(initialData.endDate) || prev.endDate,
        time: initialData.time ?? prev.time,
        endTime: initialData.endTime ?? prev.endTime,
        duration: Number(initialData.duration) || prev.duration,
        registrationDeadline: toDateInputValue(initialData.registrationDeadline) || prev.registrationDeadline,
        collegeName: initialData.collegeName ?? prev.collegeName,
        collegeId: initialData.collegeId ?? prev.collegeId,
        registrationType: (initialData.registrationType === 'external' ? 'external' : 'internal') as 'internal' | 'external',
        externalRegistrationUrl: initialData.externalRegistrationUrl ?? prev.externalRegistrationUrl,
        isOnline: Boolean(initialData.isOnline ?? (initialData.venue && initialData.venue.toLowerCase().includes('online'))),
        venue: initialData.venue ?? prev.venue,
        address: initialData.address ?? prev.address,
        meetingLink: initialData.meetingLink ?? initialData.onlineLink ?? prev.meetingLink,
        meetingPlatform: initialData.meetingPlatform ?? prev.meetingPlatform,
        meetingId: initialData.meetingId ?? prev.meetingId,
        meetingPasscode: initialData.meetingPasscode ?? prev.meetingPasscode,
        meetingInstructions: initialData.meetingInstructions ?? prev.meetingInstructions,
        speaker: initialData.speaker ?? initialData.speakerName ?? prev.speaker,
        speakerRole: initialData.speakerRole ?? prev.speakerRole,
        speakerCompany: initialData.speakerCompany ?? prev.speakerCompany,
        speakerBio: initialData.speakerBio ?? prev.speakerBio,
        speakerImage: initialData.speakerImage ?? prev.speakerImage,
        capacity: Number(initialData.capacity ?? initialData.seats ?? prev.capacity),
        price: Number(initialData.price ?? prev.price),
        premiumOnly: Boolean(initialData.premiumOnly ?? prev.premiumOnly),
        premiumPrice: Number(initialData.premiumPrice ?? prev.premiumPrice),
        agenda: Array.isArray(initialData.agenda) ? initialData.agenda : prev.agenda,
      }))
    }
  }, [initialData, mode])

  const update = (key: keyof typeof form, val: any) => {
    setForm(p => ({ ...p, [key]: val }))
  }

  // Agenda slot handlers
  const handleAddAgenda = () => {
    if (!newAgendaSlot.trim()) return
    setForm(p => ({ ...p, agenda: [...p.agenda, newAgendaSlot.trim()] }))
    setNewAgendaSlot('')
  }

  const handleRemoveAgenda = (idx: number) => {
    setForm(p => ({ ...p, agenda: p.agenda.filter((_, i) => i !== idx) }))
  }

  const handleApplyPresetBanner = (url: string) => {
    setBannerPreviewError(false)
    update('posterUrl', url)
  }

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()

    // 1. Core validations
    if (!form.title.trim()) {
      toast.error('Please enter an event title.')
      return
    }
    if (!form.description.trim()) {
      toast.error('Please enter an event description.')
      return
    }
    if (!form.date) {
      toast.error('Please select an event date.')
      return
    }

    // 2. End date validation
    if (form.endDate && form.date) {
      const startDate = new Date(form.date)
      const endDate = new Date(form.endDate)
      if (endDate < startDate) {
        toast.error('Event end date cannot be scheduled before the start date.')
        return
      }
    }

    // 3. Registration deadline validation
    if (form.registrationDeadline && form.date) {
      const deadlineDate = new Date(form.registrationDeadline)
      const eventDate = new Date(form.date)
      if (deadlineDate > eventDate) {
        toast.error('Registration deadline cannot be scheduled after the event date.')
        return
      }
    }

    // 4. External registration channel validation
    if (form.registrationType === 'external') {
      const url = form.externalRegistrationUrl.trim()
      if (!url) {
        toast.error('Please provide the external registration link (e.g. Google Forms / Unstop).')
        return
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        toast.error('External registration link must be a valid URL starting with http:// or https://')
        return
      }
    }

    // 5. Virtual event validation
    if (form.isOnline) {
      const meetUrl = form.meetingLink.trim()
      if (meetUrl && !meetUrl.startsWith('http://') && !meetUrl.startsWith('https://')) {
        toast.error('Webinar link must be a valid URL starting with http:// or https://')
        return
      }
    } else {
      // 6. Physical event validation
      if (!form.venue.trim()) {
        toast.error('Please enter the physical venue / hall / room location.')
        return
      }
    }

    // 7. Numeric validations
    if (form.registrationType === 'internal') {
      if (form.capacity <= 0) {
        toast.error('Capacity spots must be at least 1.')
        return
      }
      if (mode === 'edit' && form.capacity < seatsBooked) {
        toast.error(`Cannot reduce capacity to ${form.capacity}. At least ${seatsBooked} seats are already booked.`)
        return
      }
      if (form.price < 0) {
        toast.error('Price cannot be negative.')
        return
      }
      if (form.premiumPrice < 0) {
        toast.error('Premium price cannot be negative.')
        return
      }
    }

    setLoading(true)
    try {
      const token = await getAuthToken(user)
      if (!token) {
        toast.error('Authentication required. Please sign in with administrator credentials.')
        router.push('/admin/login')
        return
      }

      // Prepare payload with clean fallbacks
      const payload: Record<string, any> = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        eventType: form.category,
        date: form.date,
        endDate: form.endDate || null,
        time: form.time.trim(),
        endTime: form.endTime ? form.endTime.trim() : null,
        duration: Number(form.duration),
        isOnline: Boolean(form.isOnline),
        venue: form.isOnline ? (form.meetingPlatform || 'Online Webinar') : form.venue.trim(),
        address: form.address.trim(),
        meetingLink: form.meetingLink.trim(),
        onlineLink: form.meetingLink.trim(),
        meetingPlatform: form.meetingPlatform.trim(),
        meetingId: form.meetingId.trim(),
        meetingPasscode: form.meetingPasscode.trim(),
        meetingInstructions: form.meetingInstructions.trim(),
        speaker: form.speaker.trim(),
        speakerName: form.speaker.trim(),
        speakerRole: form.speakerRole.trim(),
        speakerCompany: form.speakerCompany.trim(),
        speakerBio: form.speakerBio.trim(),
        speakerImage: form.speakerImage.trim(),
        posterUrl: form.posterUrl.trim() || '',
        collegeId: form.collegeId || null,
        collegeName: form.collegeName || 'All Campuses',
        registrationType: form.registrationType,
        externalRegistrationUrl: form.registrationType === 'external' ? form.externalRegistrationUrl.trim() : null,
        registrationDeadline: form.registrationDeadline ? form.registrationDeadline : null,
        capacity: form.registrationType === 'external' ? 0 : Number(form.capacity),
        price: form.registrationType === 'external' ? 0 : Number(form.price),
        premiumOnly: Boolean(form.premiumOnly),
        premiumPrice: form.registrationType === 'external' ? 0 : Number(form.premiumPrice),
        agenda: form.agenda,
      }

      let response: Response
      if (mode === 'create') {
        payload.status = isDraft ? 'Draft' : 'Published'
        payload.isDraft = isDraft

        response = await fetch('/api/v1/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
      } else {
        // Edit mode: PUT /api/v1/events/:id
        // Protected fields (status, isPublished, seatsBooked, createdAt, createdBy) are preserved by server
        response = await fetch(`/api/v1/events/${eventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
      }

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.success === false) {
        throw new Error(data.message || data.error || `Failed to ${mode === 'create' ? 'create' : 'update'} event.`)
      }

      if (mode === 'create') {
        if (isDraft) {
          toast.success('Event saved as Draft in database! 📝')
        } else {
          toast.success('Ecosystem Event created and published successfully! 🚀')
        }
      } else {
        toast.success('Event updated successfully! 🎉')
      }

      if (onSuccess) {
        onSuccess(data.data || data)
      } else {
        router.push('/admin/events')
      }
    } catch (err: any) {
      console.error(`Event ${mode} submit error:`, err)
      toast.error(err.message || `Error saving event. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const lifecycleStatus = initialData?.normalizedStatus || initialData?.status || 'Draft'

  return (
    <div className="space-y-8 select-none max-w-4xl pb-16">
      {/* Back button */}
      <div>
        <button 
          onClick={() => router.push('/admin/events')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Event Catalog
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-3xl font-bold text-foreground">
              {mode === 'create' ? 'Schedule New Event' : 'Edit Event Details'}
            </h1>
            {mode === 'edit' && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                lifecycleStatus === 'Published'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : lifecycleStatus === 'Cancelled'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {lifecycleStatus}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'create'
              ? 'Configure curriculum workshops, campus hackathons, lead expert sessions, and ticket settings.'
              : 'Modify schedule, curriculum topics, expert profiles, delivery logistics, and capacity.'}
          </p>
        </div>

        {mode === 'edit' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Lifecycle status is preserved during editing.</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        
        {/* SECTION 1: Core Information & Branding */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b border-border/40 pb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-mono font-bold">1</span>
              Core Event Information
            </h3>
            <span className="text-[10px] text-amber-500/80 font-bold tracking-wider uppercase">* Required fields</span>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                Event Title <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Next.js 15 Full-Stack Masterclass & Server Actions"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                Description & Learning Outcomes <span className="text-amber-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Detailed curriculum overview: What will attendees build? Key technologies covered, prerequisites, hands-on labs..."
                value={form.description}
                onChange={e => update('description', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  Category Track <span className="text-amber-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={e => update('category', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                >
                  <option value="workshop">Technical Workshop (Hands-on)</option>
                  <option value="webinar">Live Interactive Webinar</option>
                  <option value="hackathon">Hackathon & Sprint Challenge</option>
                  <option value="networking">Networking & Career Mixer</option>
                  <option value="conference">Conference / Industry Summit</option>
                  <option value="mentoring">1-on-1 Mentoring Clinic</option>
                </select>
              </div>

              {/* Host Campus / College */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-amber-500" /> Host Campus / College <span className="text-amber-500">*</span>
                </label>
                <select
                  value={form.collegeName}
                  onChange={e => {
                    const val = e.target.value
                    update('collegeName', val)
                    update('collegeId', val === 'All Campuses (Global Ecosystem)' ? '' : val.toLowerCase().replace(/[^a-z0-9]/g, '-'))
                  }}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                >
                  <option value="All Campuses (Global Ecosystem)">🌐 All Campuses (Global Ecosystem)</option>
                  {allColleges.map((c, i) => (
                    <option key={`${c.name}-${i}`} value={c.name}>
                      {c.name} ({c.state})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Event Poster / Banner URL with Live Preview */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-primary" /> Event Poster / Hero Banner URL
              </label>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-...?auto=format&fit=crop"
                  value={form.posterUrl}
                  onChange={e => {
                    setBannerPreviewError(false)
                    update('posterUrl', e.target.value)
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                />
              </div>

              {/* Banner Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-muted-foreground font-semibold">Quick Presets:</span>
                {BANNER_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPresetBanner(preset.url)}
                    className="px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted text-[10px] text-foreground border border-border/40 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Live Image Preview */}
              {form.posterUrl && !bannerPreviewError ? (
                <div className="relative mt-3 rounded-xl overflow-hidden border border-border/60 max-h-48 bg-black/40">
                  <img
                    src={form.posterUrl}
                    alt="Event Banner Preview"
                    onError={() => setBannerPreviewError(true)}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px] text-white font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Image Preview Loaded
                  </div>
                </div>
              ) : bannerPreviewError ? (
                <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Unable to load image from provided URL. Please verify the link.</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* SECTION 2: Speaker & Lead Expert Profile */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b border-border/40 pb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-mono font-bold">2</span>
              Speaker & Lead Expert Profile
            </h3>
            <span className="text-[10px] text-muted-foreground">Appears in event catalog and lead badge</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3" /> Expert Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Priya Nair"
                  value={form.speaker}
                  onChange={e => update('speaker', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Designation / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Staff Engineer"
                  value={form.speakerRole}
                  onChange={e => update('speakerRole', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Company / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google DeepMind / Vercel"
                  value={form.speakerCompany}
                  onChange={e => update('speakerCompany', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Speaker Biography & Highlights
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief background: Previous talks, open source contributions, research background..."
                  value={form.speakerBio}
                  onChange={e => update('speakerBio', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Speaker Photo URL
                </label>
                <input
                  type="url"
                  placeholder="https://.../photo.jpg"
                  value={form.speakerImage}
                  onChange={e => update('speakerImage', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                />
                
                {/* Speaker Avatar Preview */}
                <div className="pt-2 flex items-center gap-2.5">
                  <img
                    src={form.speakerImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.speaker || 'Speaker')}&background=8b5cf6&color=fff`}
                    alt="Speaker Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-border"
                  />
                  <span className="text-[11px] text-muted-foreground truncate">
                    {form.speaker ? `${form.speaker}${form.speakerCompany ? ` (${form.speakerCompany})` : ''}` : 'Default avatar generator active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Registration Settings & Access Rules */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b border-border/40 pb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-mono font-bold">3</span>
              Registration Settings & Channels
            </h3>
            <span className="text-[10px] text-muted-foreground">Control admissions, capacity, and ticketing</span>
          </div>

          <div className="space-y-4">
            {/* Channel Radio Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                form.registrationType === 'internal' 
                  ? 'bg-amber-500/10 border-amber-500/40 text-foreground' 
                  : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50'
              }`}>
                <input
                  type="radio"
                  name="regType"
                  checked={form.registrationType === 'internal'}
                  onChange={() => update('registrationType', 'internal')}
                  className="mt-0.5"
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold block text-foreground">Internal ANX Pass</span>
                  <span className="text-[11px] text-muted-foreground">Managed on-platform with instant QR ticketing, attendance scanning, and XP rewards.</span>
                </div>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                form.registrationType === 'external' 
                  ? 'bg-amber-500/10 border-amber-500/40 text-foreground' 
                  : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50'
              }`}>
                <input
                  type="radio"
                  name="regType"
                  checked={form.registrationType === 'external'}
                  onChange={() => update('registrationType', 'external')}
                  className="mt-0.5"
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold block text-foreground">External Registration Link</span>
                  <span className="text-[11px] text-muted-foreground">Redirects attendees to an external Google Form, Unstop, Devfolio, or university portal.</span>
                </div>
              </label>
            </div>

            {/* Conditional External URL Field */}
            {form.registrationType === 'external' ? (
              <div className="space-y-2 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> External Registration Portal URL <span className="text-amber-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://forms.gle/... or https://unstop.com/competitions/..."
                  value={form.externalRegistrationUrl}
                  onChange={e => update('externalRegistrationUrl', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                />
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Seating capacity and payments are handled externally on the third-party destination.
                </p>
              </div>
            ) : (
              /* Internal Registration Settings: Capacity, Price, and Premium Gate */
              <div className="space-y-3">
                {mode === 'edit' && seatsBooked > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Currently Booked: {seatsBooked} seats
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Minimum permitted capacity: <strong>{seatsBooked}</strong>
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/20 border border-border/40 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Capacity Spots <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={mode === 'edit' ? Math.max(1, seatsBooked) : 1}
                      required
                      value={form.capacity}
                      onChange={e => update('capacity', parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      General Price (₹ - 0 for Free)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.price}
                      onChange={e => update('price', parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end">
                    <div className="flex items-center justify-between bg-muted/40 border border-border/50 p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> Premium Only?
                      </span>
                      <button
                        type="button"
                        onClick={() => update('premiumOnly', !form.premiumOnly)}
                        className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-all ${
                          form.premiumOnly ? 'bg-amber-500' : 'bg-zinc-600'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full bg-white transition-transform" 
                          style={{ transform: form.premiumOnly ? 'translateX(18px)' : 'translateX(0px)' }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Registration Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Registration Closing Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={form.registrationDeadline}
                  onChange={e => update('registrationDeadline', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground">
                  Registrations close automatically after this date. Must be on or before the event date.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Event Schedule & Agenda Timeline */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b border-border/40 pb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-mono font-bold">4</span>
              Timing & Session Agenda
            </h3>
            <span className="text-[10px] text-muted-foreground">Schedule slots and timeline</span>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Event Date <span className="text-amber-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={e => update('date', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => update('endDate', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Start Time <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10:00 AM"
                  value={form.time}
                  onChange={e => update('time', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Duration (Minutes) <span className="text-amber-500">*</span>
                </label>
                <input
                  type="number"
                  min="15"
                  required
                  value={form.duration}
                  onChange={e => update('duration', parseInt(e.target.value) || 120)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Interactive Agenda Editor */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                Session Agenda Slots (Curriculum Timeline)
              </label>

              {/* Add Agenda Slot Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM - 10:45 AM: Architecture Deep Dive & Keynote"
                  value={newAgendaSlot}
                  onChange={e => setNewAgendaSlot(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddAgenda()
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddAgenda}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl border border-border flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Slot
                </button>
              </div>

              {/* Agenda Slot List */}
              {form.agenda.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {form.agenda.map((slot, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-muted/30 border border-border/40 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold shrink-0">
                          Slot #{idx + 1}
                        </span>
                        <span className="text-foreground truncate font-medium">{slot}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAgenda(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded transition-colors shrink-0"
                        title="Remove slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  No agenda slots added yet. You can add topics, break timings, or key lab milestones.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: Location & Delivery Logistics */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b border-border/40 pb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-mono font-bold">5</span>
              Location & Delivery Logistics
            </h3>
            <span className="text-[10px] text-muted-foreground">Physical Hall or Live Webinar Room</span>
          </div>

          <div className="space-y-4">
            {/* Online / Physical Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl">
              <div>
                <span className="text-xs font-bold text-foreground block">Event Delivery Format</span>
                <span className="text-[11px] text-muted-foreground">
                  {form.isOnline ? 'Virtual live streaming webinar' : 'On-campus physical meeting / hall session'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => update('isOnline', !form.isOnline)}
                className={`w-14 h-7 rounded-full p-1 flex items-center transition-all ${
                  form.isOnline ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <div 
                  className="w-5 h-5 rounded-full bg-white transition-transform" 
                  style={{ transform: form.isOnline ? 'translateX(28px)' : 'translateX(0px)' }}
                />
              </button>
            </div>

            {/* Virtual Event Inputs */}
            {form.isOnline ? (
              <div className="space-y-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-primary" /> Video Platform <span className="text-amber-500">*</span>
                    </label>
                    <select
                      value={form.meetingPlatform}
                      onChange={e => update('meetingPlatform', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom Meetings</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Discord Stage">Discord Community Stage</option>
                      <option value="YouTube Live">YouTube Live Stream</option>
                      <option value="Custom Stream">Custom RTMP / Stream Link</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      Webinar Room / Stream URL <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={form.meetingLink}
                      onChange={e => update('meetingLink', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Meeting ID / Passcode (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ID: 812-431-901 / Passcode: 2026"
                      value={form.meetingPasscode}
                      onChange={e => update('meetingPasscode', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Access Instructions for Attendees
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Room activates 10 mins prior. Join with college email."
                      value={form.meetingInstructions}
                      onChange={e => update('meetingInstructions', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Physical On-Campus Venue Inputs */
              <div className="space-y-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> Physical Venue & Room No. <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={!form.isOnline}
                      placeholder="e.g. Seminar Hall A, Dept of Computer Science"
                      value={form.venue}
                      onChange={e => update('venue', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Campus Address / Landmark / Directions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Academic Block 4, Gate 2, Opp. Central Library"
                      value={form.address}
                      onChange={e => update('address', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                  <Building className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Assigned Host Campus: <strong>{form.collegeName}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit & Navigation Bar */}
        <div className="pt-4 border-t border-border/40 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Changes will be committed directly to Cloud Firestore.
          </p>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/admin/events')}
              className="px-4 py-3 text-xs font-semibold border border-border rounded-xl hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </button>

            {mode === 'create' ? (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => handleSubmit(e, true)}
                  className="px-5 py-3 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  title="Save event as draft without publishing to students"
                >
                  Save as Draft
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow shadow-amber-500/10 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                      <span>Persisting to Database...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Publish Event to Database
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow shadow-amber-500/10 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  )
}
