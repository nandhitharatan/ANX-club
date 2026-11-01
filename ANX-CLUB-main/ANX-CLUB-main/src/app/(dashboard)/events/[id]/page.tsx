'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, 
  Award, Video, User, CheckCircle2, ChevronRight, 
  MapIcon, LinkIcon, HelpCircle, ExternalLink, Building, AlertCircle 
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { eventsApi } from '@/lib/api'
import { getAuthToken } from '@/lib/auth-helpers'
import { PremiumGateModal } from '@/components/common/PremiumGateModal'
import { PaidEventCheckoutModal } from '@/components/events/PaidEventCheckoutModal'

export default function EventDetailPage({ params }: { params?: { id?: string } }) {
  const router = useRouter()
  const routeParams = useParams()
  const { user, profile } = useAuth()
  
  const eventId = (routeParams?.id as string) || params?.id || ''
  
  const [event, setEvent] = useState<any>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [registeredList, setRegisteredList] = useState<string[]>([])
  const [loadingReg, setLoadingReg] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showPaidModal, setShowPaidModal] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/v1/events/${eventId}`)
        if (res.ok) {
          const data = await res.json()
          setEvent(data.data || data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingEvent(false)
      }
    }
    fetchEvent()
  }, [eventId])

  useEffect(() => {
    const fetchUserRegistrations = async () => {
      if (!user) {
        setRegisteredList([])
        return
      }
      try {
        const token = await getAuthToken(user)
        const res = await fetch("/api/v1/module2/dashboard", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (res.ok) {
          const data = await res.json()
          if (data.registeredEvents) {
            setRegisteredList(data.registeredEvents.map((e: any) => e.id))
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchUserRegistrations()
  }, [user])

  if (loadingEvent) {
    return <div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!event) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Event not found</h2>
        <p className="text-xs text-muted-foreground">The event you are looking for does not exist or has been removed.</p>
        <Link href="/events" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold">
          Back to Events
        </Link>
      </div>
    )
  }


  const isCancelled = event?.status === 'Cancelled' || event?.normalizedStatus === 'Cancelled' || Boolean(event?.cancellationReason);
  const isUserRegistered = registeredList.includes(event?.id)
  const totalCapacity = event?.capacity || event?.seats || 100
  const registeredCount = isUserRegistered ? (event?.registeredCount || 0) + 1 : (event?.registeredCount || 0)
  const seatsAvailable = isUserRegistered ? Math.max(0, (event?.seatsAvailable || totalCapacity) - 1) : (event?.seatsAvailable || totalCapacity)
  const registrationPercentage = Math.min(100, Math.round((registeredCount / totalCapacity) * 100))

  const handleRegisterToggle = async () => {
    if (isCancelled) {
      toast.error('Registration is closed: This event has been cancelled.')
      return
    }

    if (!user) {
      toast.error('Please sign in to register for events!')
      router.push('/login')
      return
    }

    if (event.registrationType === 'external' && event.externalRegistrationUrl) {
      window.open(event.externalRegistrationUrl, '_blank')
      return
    }

    if (isUserRegistered) {
      toast('Your seat registration is confirmed in the database. To release or transfer your seat, please contact event operations at support@anxplatform.com.', { icon: 'ℹ️', duration: 4000 })
      return
    }

    if (event.premiumOnly && profile?.role !== 'Premium Member' && profile?.role !== 'Admin') {
      setShowPremiumModal(true)
      return
    }

    if (event.price && event.price > 0) {
      setShowPaidModal(true)
      return
    }

    setLoadingReg(true)
    try {
      const token = await getAuthToken(user)
      const res = await fetch(`/api/v1/events/${event.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: user.uid,
          name: profile?.fullName || user.displayName || 'Member',
          email: profile?.email || user.email || '',
          phone: profile?.phoneNumber || '',
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setRegisteredList(p => [...p, event.id])
        toast.success('Registered successfully! Confirmation sent to your email +50 XP! 🎉')
      } else {
        toast.error(data.message || 'Registration failed.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Registration failed.')
    } finally {
      setLoadingReg(false)
    }
  }

  return (
    <div className="space-y-8 select-none">
      {/* Back button */}
      <div>
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Listing
        </button>
      </div>

      {/* Cancellation Notice Banner */}
      {isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl p-5 text-rose-200 space-y-2 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <h3 className="font-bold text-sm text-rose-500 uppercase tracking-wide">
              Official Notice: Event Cancelled
            </h3>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed pl-7">
            This event has been officially cancelled by administration. Registration is closed and existing tickets are void.
            {event.cancellationReason && (
              <span className="block mt-2 font-medium text-foreground bg-black/40 p-3 rounded-xl border border-rose-500/25">
                <span className="font-bold text-rose-400">Reason for Cancellation:</span> "{event.cancellationReason}"
              </span>
            )}
          </p>
        </motion.div>
      )}

      {/* Hero Cover Card */}
      <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm">
        {/* Cover background */}
        <div className="relative h-64 md:h-80 w-full bg-muted overflow-hidden">
          <img
            src={event.posterUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop"}
            alt={event.title || 'Event'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Floating Details Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
                {event.category || event.eventType || 'Event'}
              </span>
              {event.premiumOnly && (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" /> Premium Only
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
              {event.title}
            </h1>
            <p className="text-xs text-blue-100 flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4" /> {formatDate(event.date)} @ {event.time || '10:00 AM'} ({event.duration || 120} minutes)
            </p>
          </div>

          <div className="shrink-0 w-full md:w-64 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between text-xs font-semibold text-white">
              <span>Registration Status</span>
              <span>{registrationPercentage}% Full</span>
            </div>
            
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${registrationPercentage}%` }} 
              />
            </div>

            <div className="flex justify-between text-[10px] text-blue-100">
              <span>{seatsAvailable} seats remaining</span>
              <span>Capacity: {totalCapacity}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Details Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Agenda */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground">About the Event</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {event.description || 'No description provided.'}
            </p>
          </div>

          {/* Agenda Checklist */}
          {event.agenda && event.agenda.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground">Session Agenda</h3>
              
              <div className="space-y-4 relative pl-4 border-l border-border/60">
                {event.agenda.map((item: string, idx: number) => (
                  <div key={item} className="relative space-y-1">
                    {/* Bullet circle */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Slot #{idx + 1}</span>
                    <p className="text-xs font-semibold text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Venue Info Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground">Location & Connection</h3>
            
            {event.isOnline ? (
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground">Interactive Virtual Live Webinar</h4>
                  <p className="text-[11px] text-muted-foreground">Meeting link will activate for registered members 10 minutes prior to session starting.</p>
                  
                  {isUserRegistered ? (
                    <a
                      href={event.meetingLink || event.onlineLink || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline pt-1"
                    >
                      Access Live Room <LinkIcon className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider block">
                      Register to unlock live link
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">On-Campus Physical Venue</h4>
                  <p className="text-xs text-muted-foreground">{event.venue || 'Campus Hall'}</p>
                  {event.address && (
                    <p className="text-[10px] text-muted-foreground/80 mt-1">{event.address}</p>
                  )}
                  {event.collegeName && event.collegeName !== 'All Campuses (Global Ecosystem)' && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-semibold pt-1">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span>Host Campus: {event.collegeName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Speaker Showcase & Side Actions */}
        <div className="space-y-6">
          {/* Main Action Register Widget */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pricing details</span>
              <h3 className="font-display text-2xl font-black text-foreground">
                {!event.price || event.price === 0 ? 'FREE ENTRY' : formatCurrency(event.price)}
              </h3>
            </div>

            <div className="border-t border-border/40 my-3" />

            {isCancelled ? (
              <div className="w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-center">
                <AlertCircle className="w-4 h-4 shrink-0" /> Registration Closed — Event Cancelled
              </div>
            ) : event.registrationType === 'external' && event.externalRegistrationUrl ? (
              <a
                href={event.externalRegistrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
              >
                Register via Official Campus Portal <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={handleRegisterToggle}
                disabled={loadingReg}
                className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
                  isUserRegistered
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/20'
                }`}
              >
                {loadingReg ? (
                  'Processing Registration...'
                ) : isUserRegistered ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Seat Confirmed (Registered)
                  </>
                ) : (
                  'Confirm Seat Registration'
                )}
              </button>
            )}

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center">
              <HelpCircle className="w-3.5 h-3.5" />
              <a href="mailto:support@anxplatform.com" className="hover:underline hover:text-primary transition-colors">
                Need help? Contact the ANX Operations lead
              </a>
            </div>
          </div>

          {/* Speaker Showcase */}
          {(event.speaker || event.speakerName) && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="font-display text-base font-bold text-foreground">About the Lead Expert</h3>
              
              <div className="flex items-center gap-3">
                <img
                  src={event.speakerImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.speaker || event.speakerName || 'Speaker')}&background=8b5cf6&color=fff`}
                  alt={event.speaker || event.speakerName || 'Speaker'}
                  className="w-12 h-12 rounded-2xl object-cover shrink-0"
                />
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-snug">{event.speaker || event.speakerName}</h4>
                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold mt-1">
                    Featured Speaker
                  </span>
                </div>
              </div>

              {event.speakerBio && (
                <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                  {event.speakerBio}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Premium Gate Modal */}
      <PremiumGateModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Unlock Premium Masterclass"
        description="This event is exclusively reserved for ANX Premium Elite members. Upgrade your membership to attend all live workshops, hackathons, and priority Q&A sessions."
        featureName={event.title}
      />

      {/* Paid Event Checkout & Ticket Modal */}
      <PaidEventCheckoutModal
        isOpen={showPaidModal}
        onClose={() => setShowPaidModal(false)}
        event={event}
        user={user}
        profile={profile}
        onSuccess={(ticketData) => {
          setRegisteredList(p => [...p, event.id])
        }}
      />
    </div>
  )
}
