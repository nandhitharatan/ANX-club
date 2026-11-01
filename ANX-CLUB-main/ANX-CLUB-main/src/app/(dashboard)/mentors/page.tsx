'use client'
import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Search, Award, Star, Calendar, 
  Clock, X, Check, ArrowRight, ShieldCheck, 
  MessageSquare, Video, CreditCard, Sparkles 
} from 'lucide-react'
import { MOCK_MENTORS, SKILLS } from '@/lib/constants'
import toast from 'react-hot-toast'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { useEffect } from 'react'
import { mentorsApi } from '@/lib/api'
import { PremiumGateModal } from '@/components/common/PremiumGateModal'

const SLOT_TIMINGS = [
  '09:00 AM - 10:00 AM',
  '11:30 AM - 12:30 PM',
  '02:00 PM - 03:00 PM',
  '04:30 PM - 05:30 PM',
  '07:00 PM - 08:00 PM'
]

export default function MentorsPage() {
  const { user, profile } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('all')
  const [activeBookingMentor, setActiveBookingMentor] = useState<any | null>(null)
  const [mentors, setMentors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Premium Gate Modal
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [premiumModalDetail, setPremiumModalDetail] = useState<{ title: string; desc: string }>({
    title: 'Unlock 1-on-1 Expert Mentorship',
    desc: 'Book private mentoring sessions with staff engineers and engineering leaders from top tech firms.'
  })

  // Booking details
  const [bookingDetails, setBookingDetails] = useState({
    date: '',
    time: SLOT_TIMINGS[0],
    reason: '',
  })

  // Paid booking state
  const [paymentStep, setPaymentStep] = useState<'details' | 'payment' | 'confirmed'>('details')
  const [confirmedBookingData, setConfirmedBookingData] = useState<any | null>(null)

  // Fetch mentors list
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await mentorsApi.list()
        if (res.data) {
          setMentors(res.data)
        } else {
          setMentors(MOCK_MENTORS)
        }
      } catch (err) {
        console.error("Failed to fetch mentors", err)
        setMentors(MOCK_MENTORS)
      } finally {
        setLoading(false)
      }
    }
    fetchMentors()
  }, [])

  // Filtered mentors list
  const filteredMentors = useMemo(() => {
    return (mentors.length > 0 ? mentors : MOCK_MENTORS).filter((men: any) => {
      const matchesSearch = (men.name || '').toLowerCase().includes(search.toLowerCase()) ||
                            (men.company || '').toLowerCase().includes(search.toLowerCase()) ||
                            (men.role || '').toLowerCase().includes(search.toLowerCase())
      
      const matchesSkill = selectedSkill === 'all' || (men.skills || []).includes(selectedSkill)

      return matchesSearch && matchesSkill
    })
  }, [mentors, search, selectedSkill])

  const openBookingModal = (men: any) => {
    const isUserPremium = profile?.role === 'Premium Member' || profile?.role === 'Admin' || profile?.membershipType === 'premium'
    if (men.isPremiumOnly && !isUserPremium) {
      setPremiumModalDetail({
        title: `Book Session with ${men.name}`,
        desc: `1-on-1 mentorship with ${men.name} (${men.role} @ ${men.company}) is exclusively available to ANX Premium members.`
      })
      setIsPremiumModalOpen(true)
      return
    }

    setActiveBookingMentor(men)
    setPaymentStep('details')
    setBookingDetails({
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Default tomorrow
      time: SLOT_TIMINGS[0],
      reason: '',
    })
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const today = new Date().toISOString().split('T')[0]
    if (bookingDetails.date < today) {
      toast.error('Please select an upcoming date. Sessions cannot be booked in the past.')
      return
    }
    if (!user) {
      toast.error('Please sign in to book a session')
      return
    }

    const mentorRate = Number(activeBookingMentor.hourlyRate || activeBookingMentor.rate || 0)
    
    // If mentor has an hourly rate > 0 and user isn't on payment step yet, move to payment step
    if (mentorRate > 0 && paymentStep === 'details') {
      setPaymentStep('payment')
      return
    }
    
    setIsSubmitting(true)
    try {
      const isPaid = mentorRate > 0
      const generatedMeetLink = `https://meet.google.com/anx-${activeBookingMentor.id || 'mentor'}-${Math.floor(1000 + Math.random() * 9000)}`

      const payload = {
        memberId: user.uid,
        memberName: profile?.fullName || user.displayName || "Anonymous Member",
        memberEmail: user.email || profile?.email || "member@example.com",
        mentorName: activeBookingMentor.name,
        dateTime: `${bookingDetails.date} ${bookingDetails.time}`,
        date: bookingDetails.date,
        time: bookingDetails.time,
        status: isPaid ? "Approved" : "Pending",
        reason: bookingDetails.reason,
        isPaid,
        amount: mentorRate,
        meetingLink: generatedMeetLink,
        paymentId: isPaid ? `PAY_MEN_${Date.now()}` : undefined
      }

      const res = await mentorsApi.book(activeBookingMentor.id, payload)
      
      setConfirmedBookingData({
        ...payload,
        id: res?.data?.id || `req_${Date.now()}`,
        meetingLink: res?.data?.meetingLink || generatedMeetLink
      })
      setPaymentStep('confirmed')

      if (isPaid) {
        toast.success(`🎉 Registered! Slot scheduled for ${bookingDetails.time}. Google Meet link emailed! +40 XP awarded.`)
      } else {
        toast.success(`🎉 Registered! Mentorship session request submitted for ${bookingDetails.date} (${bookingDetails.time}). Details emailed! +40 XP awarded.`)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || err.message || "Failed to submit booking request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 select-none">
      {/* Premium Gate Modal */}
      <PremiumGateModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        title={premiumModalDetail.title}
        description={premiumModalDetail.desc}
      />

      {/* Header section */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Ecosystem Expert Mentorship</h1>
        <p className="text-xs text-muted-foreground mt-1">Book 1-on-1 video mentorship sessions with tech leaders at Google, Vercel, and Stripe.</p>
      </div>

      {/* Filter Utilities */}
      <section className="glass rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search mentors by name, role, or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-white"
            />
          </div>

          {/* Skill Filter Selector */}
          <div className="w-full md:w-auto shrink-0">
            <select
              value={selectedSkill}
              onChange={e => setSelectedSkill(e.target.value)}
              className="w-full md:w-48 px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">Filter by Skill Tag</option>
              {SKILLS.slice(0, 8).map((sk: string) => <option key={sk} value={sk}>{sk}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Grid listing */}
      <AnimatePresence mode="wait">
        {filteredMentors.length > 0 ? (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredMentors.map((men: any) => {
              const hourlyRate = Number(men.hourlyRate || men.rate || 0)
              
              return (
                <div
                  key={men.id}
                  className="glass rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-5 justify-between hover:border-primary/30 transition-all hover:shadow-[0_0_20px_rgba(217,70,239,0.15)] group relative overflow-hidden bg-zinc-950/80"
                >
                  {men.isPremiumOnly && (
                    <div className="absolute top-0 right-0 p-0 hover:scale-105 pointer-events-none">
                      <span className="inline-flex items-center gap-0.5 px-3 py-1 bg-amber-500 text-zinc-950 text-[9px] font-bold uppercase rounded-bl-2xl shadow">
                        <Star className="w-2.5 h-2.5 fill-current" /> Premium
                      </span>
                    </div>
                  )}

                  {/* Profile Avatar Block */}
                  <div className="flex gap-4 items-start flex-1 min-w-0">
                    <img
                      src={men.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(men.name || 'Mentor')}&background=8b5cf6&color=fff`}
                      alt={men.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10 shrink-0"
                    />
                    <div className="space-y-1.5 min-w-0">
                      <h3 className="font-display font-bold text-sm md:text-base text-foreground truncate group-hover:text-primary transition-colors">
                        {men.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate font-medium">
                        {men.role} @ <strong className="font-bold text-foreground">{men.company}</strong>
                      </p>
                      
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-current" /> {men.rating || '4.9'}
                        </span>
                        <span>•</span>
                        <span>{men.sessions || '24'} sessions completed</span>
                      </div>

                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-emerald-400">
                          {hourlyRate > 0 ? `₹${hourlyRate} / Session` : 'Free for Community'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content & Action summary */}
                  <div className="md:w-56 space-y-4 flex flex-col justify-between shrink-0 border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-5">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Skills & Specialty</span>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(men.skills) ? men.skills : (men.skills ? men.skills.split(', ') : [])).slice(0, 3).map((sk: string) => (
                          <span key={sk} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => openBookingModal(men)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-semibold shadow transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(217,70,239,0.4)] border-none"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Book 1-on-1 Session
                    </button>
                  </div>
                </div>
              )
            })}
          </motion.section>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-2xl p-12 text-center shadow-sm space-y-3 max-w-sm mx-auto"
          >
            <Users className="w-10 h-10 text-muted-foreground/80 mx-auto" />
            <h3 className="font-display text-sm font-bold text-foreground">No mentors found</h3>
            <p className="text-xs text-muted-foreground">Adjust your keyword search or skills tags and check again.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Drawer Modal dialog */}
      <AnimatePresence>
        {activeBookingMentor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveBookingMentor(null)
                setPaymentStep('details')
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0b0c1b] border border-purple-500/30 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden z-10 text-white"
            >
              {/* Modal Top Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {paymentStep === 'details' && 'Schedule Mentoring Session'}
                      {paymentStep === 'payment' && 'Confirm & Secure Booking'}
                      {paymentStep === 'confirmed' && 'Booking Confirmed & Registered!'}
                    </h3>
                    <p className="text-[10px] text-slate-400">1-on-1 Dedicated Technical Mentorship</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveBookingMentor(null)
                    setPaymentStep('details')
                  }} 
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step 1: Session Details & Slot Timings */}
              {paymentStep === 'details' && (
                <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">
                  <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <img
                      src={activeBookingMentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeBookingMentor.name)}`}
                      alt={activeBookingMentor.name}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white leading-snug">{activeBookingMentor.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{activeBookingMentor.role} @ {activeBookingMentor.company}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-400 font-semibold">
                        <span>{Number(activeBookingMentor.hourlyRate || activeBookingMentor.rate || 0) > 0 ? `Fee: ₹${activeBookingMentor.hourlyRate || activeBookingMentor.rate}` : 'Free Session'}</span>
                        <span>•</span>
                        <span className="text-purple-300">+40 XP Award</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Select Date */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Date</label>
                      <input 
                        type="date" 
                        required 
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDetails.date}
                        onChange={e => setBookingDetails(p => ({ ...p, date: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500" 
                      />
                    </div>

                    {/* Select Slot Timing (Pills) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" /> Select Slot Timing (IST)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SLOT_TIMINGS.map((slot) => {
                          const isSelected = bookingDetails.time === slot
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingDetails(p => ({ ...p, time: slot }))}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between ${
                                isSelected
                                  ? 'bg-purple-600/30 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                  : 'bg-white/[0.02] border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
                              }`}
                            >
                              <span>{slot}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Booking Reason */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Core Focus / Topic
                      </label>
                      <textarea 
                        required 
                        rows={3}
                        placeholder="What would you like to focus on? (e.g. System design critique, resume audit, React architecture...)"
                        value={bookingDetails.reason}
                        onChange={e => setBookingDetails(p => ({ ...p, reason: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 placeholder:text-slate-500 leading-relaxed" 
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 flex gap-2.5 text-[11px] text-slate-300 leading-normal">
                    <Video className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Your session will be scheduled and a dedicated Google Meet link matching your chosen slot timing will be dispatched to your email.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(217,70,239,0.4)] flex items-center justify-center gap-2 border-none"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{Number(activeBookingMentor.hourlyRate || activeBookingMentor.rate || 0) > 0 ? 'Proceed to Payment (₹' + (activeBookingMentor.hourlyRate || activeBookingMentor.rate) + ')' : 'Register & Schedule Session'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Payment Checkout for Paid Mentor Sessions */}
              {paymentStep === 'payment' && (
                <div className="p-6 space-y-5">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Booking Order Summary</span>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Mentor</span>
                      <span className="font-bold text-white">{activeBookingMentor.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Scheduled Date</span>
                      <span className="font-mono text-white">{bookingDetails.date}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Selected Slot</span>
                      <span className="font-mono text-purple-300">{bookingDetails.time}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200">Total Session Fee</span>
                      <span className="text-base font-bold text-emerald-400">₹{activeBookingMentor.hourlyRate || activeBookingMentor.rate}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Payment Method</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl border border-purple-500 bg-purple-500/10 flex items-center gap-2 cursor-pointer">
                        <CreditCard className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white">UPI / Instant Pay</span>
                      </div>
                      <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-2 opacity-60">
                        <Sparkles className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-300">Card / NetBanking</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStep('details')}
                      className="px-4 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleBookingSubmit}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Pay ₹{activeBookingMentor.hourlyRate || activeBookingMentor.rate} & Register</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Booking Confirmed Screen */}
              {paymentStep === 'confirmed' && confirmedBookingData && (
                <div className="p-6 space-y-5 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">Registered & Scheduled!</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Your 1-on-1 session with <strong className="text-white">{confirmedBookingData.mentorName}</strong> has been confirmed.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date & Slot:</span>
                      <span className="font-bold text-white">{confirmedBookingData.date} ({confirmedBookingData.time})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        {confirmedBookingData.isPaid ? 'CONFIRMED / PAID' : 'REGISTERED / PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">XP Awarded:</span>
                      <span className="font-bold text-purple-400">+40 XP</span>
                    </div>
                    {confirmedBookingData.meetingLink && (
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[10px] text-slate-400 block mb-1">Google Meet Link (also emailed to you):</span>
                        <a 
                          href={confirmedBookingData.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-fuchsia-400 hover:underline font-mono break-all flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5 shrink-0" />
                          <span>{confirmedBookingData.meetingLink}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveBookingMentor(null)
                      setPaymentStep('details')
                      setConfirmedBookingData(null)
                    }}
                    className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl text-xs hover:opacity-90 transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                  >
                    Done & Return to Mentors
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

