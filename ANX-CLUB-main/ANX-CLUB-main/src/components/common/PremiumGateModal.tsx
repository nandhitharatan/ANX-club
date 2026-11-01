'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, Award, CheckCircle2, ArrowRight, X, 
  ShieldCheck, Zap, Lock, Users, BookOpen 
} from 'lucide-react'

interface PremiumGateModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  featureName?: string
}

export function PremiumGateModal({
  isOpen,
  onClose,
  title = "Unlock ANX Premium Elite",
  description = "This feature is exclusively available to ANX Premium members. Upgrade to get unlimited access to all masterclasses, 1-on-1 mentorship sessions, and verified career roadmaps.",
  featureName = "Premium Content"
}: PremiumGateModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleExploreMembership = () => {
    onClose()
    router.push('/membership')
  }

  const perks = [
    { icon: Award, title: "All Premium Masterclasses & Events", desc: "Free entry to paid hackathons, workshops & recordings" },
    { icon: Users, title: "1-on-1 Expert Mentorship", desc: "Book private sessions with engineers at Google, Stripe & Vercel" },
    { icon: BookOpen, title: "Full Capstone Roadmaps & Certificates", desc: "Production code repositories, architectural reviews & credentials" },
    { icon: Zap, title: "Incubator Grants & Priority Referrals", desc: "Fast-track funding review for student startups and FAANG referrals" }
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#0d1527] border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] text-white overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/10 blur-[80px] pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Icon & Tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Premium Elite Access
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h2>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {description}
          </p>

          {/* Pricing Highlight Card */}
          <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900/90 border border-purple-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-purple-300 uppercase tracking-widest font-semibold">Special Student Pricing</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-white">₹999</span>
                <span className="text-xs text-slate-400 line-through">₹1,999</span>
                <span className="text-xs text-emerald-400 font-semibold">/ year (₹83/mo)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                50% OFF
              </span>
            </div>
          </div>

          {/* Perks list */}
          <div className="space-y-2.5 mb-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">What you get with Premium:</span>
            {perks.map((perk, idx) => {
              const Icon = perk.icon
              return (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{perk.title}</h4>
                    <p className="text-[11px] text-slate-400">{perk.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleExploreMembership}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-sm hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 transition-all duration-200 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
            >
              <span>Explore Membership & Perks</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
