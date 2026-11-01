'use client'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, SlidersHorizontal, Calendar, Clock, 
  MapPin, Users, Award, ExternalLink, CheckCircle2, 
  Tag, RefreshCw, Building, AlertCircle 
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { COLLEGES_BY_STATE } from '@/lib/data/colleges'
import toast from 'react-hot-toast'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { eventsApi } from '@/lib/api'
import { getAuthToken } from '@/lib/auth-helpers'
import { PremiumGateModal } from '@/components/common/PremiumGateModal'
import { PaidEventCheckoutModal } from '@/components/events/PaidEventCheckoutModal'

const categories = [
  { id: 'all', label: 'All Categories' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'webinar', label: 'Webinars' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'networking', label: 'Networking' },
]

const EventCardMemo = React.memo(function EventCardMemoItem({
  evt,
  isUserRegistered,
  onRegisterToggle,
}: {
  evt: any;
  isUserRegistered: boolean;
  onRegisterToggle: (id: string, title: string) => void;
}) {
  const isCancelled = evt.status === 'Cancelled' || evt.normalizedStatus === 'Cancelled' || Boolean(evt.cancellationReason);
  const eventDate = new Date(evt.date);
  const isCompleted = !isCancelled && (evt.status === 'completed' || eventDate < new Date());

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`glass rounded-2xl overflow-hidden flex flex-col justify-between transition-all group relative ${
        isCancelled
          ? 'opacity-80 border-rose-500/20'
          : isCompleted 
          ? 'opacity-65 grayscale-[35%] hover:opacity-95 hover:grayscale-0 border-white/5' 
          : 'hover:border-primary/30 hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none z-0" />
      
      {/* Poster Image */}
      <div className="relative h-44 w-full overflow-hidden bg-muted">
        <img
          src={evt.posterUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop"}
          alt={evt.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Floating indicators */}
        <div className="absolute top-3.5 left-3.5 flex gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] text-white font-bold uppercase tracking-wider">
            {evt.category}
          </span>
          {evt.registrationType === 'external' && (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/80 backdrop-blur-md text-[9px] text-white font-bold uppercase tracking-wider">
              External Link
            </span>
          )}
        </div>

        <div className="absolute top-3.5 right-3.5">
          {isCancelled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-bold uppercase tracking-wider shadow border border-rose-500/30">
              🚫 Cancelled
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 text-[10px] font-bold uppercase tracking-wider shadow border border-white/10">
              🏁 Finished
            </span>
          ) : evt.premiumOnly ? (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider shadow">
              <Award className="w-2.5 h-2.5" /> Premium
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider shadow">
              Free
            </span>
          )}
        </div>

        {/* Overlay for cancelled or completed events */}
        {isCancelled ? (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center pointer-events-none">
            <span className="px-3 py-1 rounded-xl bg-rose-600/90 text-white text-[11px] font-bold tracking-wide uppercase shadow">
              Event Cancelled
            </span>
            {evt.cancellationReason && (
              <p className="text-[10px] text-rose-200 mt-1.5 max-w-[90%] line-clamp-2 italic">
                "{evt.cancellationReason}"
              </p>
            )}
          </div>
        ) : isCompleted ? (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="px-3.5 py-1.5 rounded-xl bg-zinc-900/90 border border-white/20 text-white text-xs font-bold shadow-lg tracking-wide uppercase">
              Event Concluded
            </span>
          </div>
        ) : null}
      </div>

      {/* Body Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4 relative z-10">
        <div className="space-y-2">
          <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
            {evt.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {evt.description}
          </p>
        </div>

        {/* Metadata details */}
        <div className="space-y-2.5 border-t border-border/40 pt-4 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span>{formatDate(evt.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>{evt.time} ({evt.duration} mins)</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{evt.venue}</span>
          </div>
          {evt.collegeName && evt.collegeName !== 'All Campuses (Global Ecosystem)' && (
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Building className="w-4 h-4 shrink-0" />
              <span className="truncate">{evt.collegeName}</span>
            </div>
          )}
        </div>

        {/* Speaker Info Card */}
        {evt.speaker && (
          <div className="flex items-center gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
            <img
              src={evt.speakerImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(evt.speaker)}&background=8b5cf6&color=fff`}
              alt={evt.speaker}
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground leading-none">Led by</p>
              <p className="text-xs font-bold text-foreground truncate mt-0.5 leading-none">{evt.speaker}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Link
            href={`/events/${evt.id}`}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 hover:border-white/30 shrink-0"
          >
            Details <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {isCancelled ? (
            <div className="flex-1 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-not-allowed">
              Event Cancelled
            </div>
          ) : evt.registrationType === 'external' && evt.externalRegistrationUrl ? (
            <a
              href={evt.externalRegistrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              External Portal <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              onClick={() => !isCompleted && onRegisterToggle(evt.id, evt.title)}
              disabled={isCompleted}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                isCompleted
                  ? 'bg-white/5 text-zinc-400 border border-white/10 cursor-not-allowed'
                  : isUserRegistered
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:opacity-90 shadow-[0_0_15px_rgba(217,70,239,0.4)] border-none'
              }`}
            >
              {isCompleted ? (
                'Completed / Finished'
              ) : isUserRegistered ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                </>
              ) : (
                'Register Event'
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
});

export default function EventsPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCollege, setSelectedCollege] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all') // 'all' | 'free' | 'premium'
  const [registeredList, setRegisteredList] = useState<string[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extract unique campus names from available colleges
  const allColleges = useMemo(() => {
    const list: string[] = []
    Object.values(COLLEGES_BY_STATE).forEach(colleges => {
      colleges.forEach(name => {
        if (name !== 'Other' && !list.includes(name)) {
          list.push(name)
        }
      })
    })
    return list.sort()
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await eventsApi.list()
      if (res.data?.success) {
        setEvents(res.data.data || [])
      } else if (Array.isArray(res.data)) {
        setEvents(res.data)
      } else {
        setEvents([])
        if (res.data?.error) {
          setError(res.data.error)
        }
      }
    } catch (err: any) {
      console.error('Failed to load events:', err)
      setEvents([])
      setError(err?.response?.data?.message || err?.message || 'Database service temporarily unavailable. Failed to fetch events.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUserRegistrations = useCallback(async () => {
    if (!user) return
    try {
      const token = await getAuthToken(user)
      const res = await fetch("/api/v1/module2/dashboard", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await res.json()
      if (data.registeredEvents) {
        setRegisteredList(data.registeredEvents.map((e: any) => e.id))
      }
    } catch (err) {
      console.error(err)
    }
  }, [user])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (user) {
      fetchUserRegistrations()
    }
  }, [user, fetchUserRegistrations])

  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showPaidModal, setShowPaidModal] = useState(false)
  const [activeModalEvent, setActiveModalEvent] = useState<any | null>(null)

  const handleRegisterToggle = async (eventId: string, title: string) => {
    if (!user) {
      toast.error("Please sign in to register for events!")
      router.push('/login')
      return
    }

    const event = events.find((item) => item.id === eventId)
    if (!event) return

    if (event.status === 'Cancelled' || event.normalizedStatus === 'Cancelled') {
      toast.error('Registration is closed: This event has been cancelled.')
      return
    }

    if (event.registrationType === 'external' && event.externalRegistrationUrl) {
      window.open(event.externalRegistrationUrl, '_blank')
      return
    }

    if (event.premiumOnly && profile?.role !== 'Premium Member' && profile?.role !== 'Admin') {
      setActiveModalEvent(event)
      setShowPremiumModal(true)
      return
    }

    const isRegistered = registeredList.includes(eventId)
    if (isRegistered) {
      setRegisteredList(p => p.filter(id => id !== eventId))
      toast.success(`Registration cancelled for: ${title}`)
      return
    }

    if (event.price && event.price > 0) {
      setActiveModalEvent(event)
      setShowPaidModal(true)
      return
    }

    try {
      const token = await getAuthToken(user)
      const res = await fetch(`/api/v1/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
        setRegisteredList(p => [...p, eventId])
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, registeredCount: (e.registeredCount || 0) + 1, seatsAvailable: Math.max(0, (e.seatsAvailable || 100) - 1) } : e))
        toast.success(`Successfully registered for ${title}! Confirmation sent to your email +50 XP! 🎉`)
      } else {
        toast.error(data.message || 'Failed to register.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to update registration status.')
    }
  }

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const matchesSearch = evt.title.toLowerCase().includes(search.toLowerCase()) || 
                            (evt.description && evt.description.toLowerCase().includes(search.toLowerCase())) ||
                            (evt.speaker && evt.speaker.toLowerCase().includes(search.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || evt.category === selectedCategory
      
      let matchesPrice = true
      if (priceFilter === 'free') {
        matchesPrice = evt.price === 0 || !evt.price
      } else if (priceFilter === 'premium') {
        matchesPrice = evt.premiumOnly === true
      }

      const matchesCollege = selectedCollege === 'all' || 
                             evt.collegeName === selectedCollege || 
                             (evt.collegeName && evt.collegeName.includes(selectedCollege))

      return matchesSearch && matchesCategory && matchesPrice && matchesCollege
    })
  }, [events, search, selectedCategory, priceFilter, selectedCollege])

  return (
    <div className="space-y-8 select-none">
      {/* Header section */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Club & Ecosystem Events</h1>
        <p className="text-xs text-muted-foreground mt-1">Discover, learn, and expand your professional circle with highly-curated workshops.</p>
      </div>

      {/* Filter Utilities */}
      <section className="glass rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by title, speaker, or keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-white"
            />
          </div>

          {/* College Campus Dropdown */}
          <div className="w-full md:w-64">
            <select
              value={selectedCollege}
              onChange={e => setSelectedCollege(e.target.value)}
              aria-label="Filter events by Campus or College"
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="all" className="bg-zinc-900 text-white">All Campuses (Global)</option>
              {allColleges.map((college) => (
                <option key={college} value={college} className="bg-zinc-900 text-white">
                  {college}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing filters */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Price:
            </span>
            {['all', 'free', 'premium'].map((f) => (
              <button
                key={f}
                onClick={() => setPriceFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                  priceFilter === f
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                    : 'bg-muted/50 border border-border/40 hover:bg-muted text-muted-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-t border-border/40 pt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 ${
                  isSelected ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeCategoryIndicator"
                    className="absolute inset-0 bg-primary/10 border border-primary/25 rounded-xl"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Main Content States: Loading, Error, Empty, and Events Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          /* Loading Skeleton State */
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="glass rounded-2xl overflow-hidden p-6 space-y-4 animate-pulse border border-white/5">
                <div className="h-44 bg-muted/60 rounded-xl -mx-6 -mt-6 mb-6" />
                <div className="h-5 bg-muted/70 rounded w-3/4" />
                <div className="h-3 bg-muted/40 rounded w-full" />
                <div className="h-3 bg-muted/40 rounded w-2/3" />
                <div className="pt-6 flex justify-between gap-4">
                  <div className="h-8 bg-muted/40 rounded-xl w-1/3" />
                  <div className="h-8 bg-muted/60 rounded-xl flex-1" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : error && events.length === 0 ? (
          /* Database Failure / Error State with Retry */
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-rose-500/30 rounded-2xl p-12 text-center shadow-sm space-y-4 max-w-md mx-auto"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-foreground">Database Service Unavailable</h3>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <button
              onClick={fetchEvents}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </motion.div>
        ) : events.length === 0 ? (
          /* Empty Database State (Genuine 0 records) */
          <motion.div
            key="empty-db"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-2xl p-12 text-center shadow-sm space-y-4 max-w-md mx-auto"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-foreground">No Events Scheduled Yet</h3>
              <p className="text-xs text-muted-foreground">There are currently no events published in the database. Check back soon for upcoming campus hackathons and masterclasses!</p>
            </div>
          </motion.div>
        ) : filteredEvents.length === 0 ? (
          /* Filtered Empty State (Query returned 0 results) */
          <motion.div
            key="no-matches"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-2xl p-12 text-center shadow-sm space-y-4 max-w-md mx-auto"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-foreground">No events match your criteria</h3>
              <p className="text-xs text-muted-foreground">Try modifying your campus, category, or search filters.</p>
            </div>
            <button
              onClick={() => {
                setSearch('')
                setSelectedCategory('all')
                setSelectedCollege('all')
                setPriceFilter('all')
              }}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-colors shadow"
            >
              Reset Filters
            </button>
          </motion.div>
        ) : (
          /* Events Grid (Real Database Records) */
          <motion.section
            key="events-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [content-visibility:auto]"
          >
            {filteredEvents.map((evt) => {
              const isUserRegistered = registeredList.includes(evt.id)
              
              return (
                <EventCardMemo
                  key={evt.id}
                  evt={evt}
                  isUserRegistered={isUserRegistered}
                  onRegisterToggle={handleRegisterToggle}
                />
              )
            })}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Premium Gate Modal */}
      <PremiumGateModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Unlock Premium Masterclass"
        description="This event is exclusively reserved for ANX Premium members. Upgrade to unlock all live workshops, hackathons, and priority Q&A sessions."
        featureName={activeModalEvent?.title}
      />

      {/* Paid Event Checkout Modal */}
      {activeModalEvent && (
        <PaidEventCheckoutModal
          isOpen={showPaidModal}
          onClose={() => {
            setShowPaidModal(false)
            setActiveModalEvent(null)
          }}
          event={activeModalEvent}
          user={user}
          profile={profile}
          onSuccess={(ticketData) => {
            setRegisteredList(p => [...p, activeModalEvent.id])
            setEvents(prev => prev.map(e => e.id === activeModalEvent.id ? { ...e, registeredCount: (e.registeredCount || 0) + 1, seatsAvailable: Math.max(0, (e.seatsAvailable || 100) - 1) } : e))
          }}
        />
      )}
    </div>
  )
}
