'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, CheckCircle2, Ticket, QrCode, X, 
  Sparkles, Calendar, Clock, MapPin, ShieldCheck, 
  Download, ArrowRight, Check, AlertCircle 
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { createRazorpayOrder, verifyRazorpayPayment } from '@/modules/module3/lib/razorpay'
import { getAuthToken } from '@/lib/auth-helpers'

interface PaidEventCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  event: any
  user: any
  profile: any
  onSuccess: (data: { ticketId: string; qrCodeUrl: string; seatNumber: string }) => void
}

export function PaidEventCheckoutModal({
  isOpen,
  onClose,
  event,
  user,
  profile,
  onSuccess
}: PaidEventCheckoutModalProps) {
  const [loading, setLoading] = useState(false)
  const [ticketResult, setTicketResult] = useState<{
    ticketId: string
    seatNumber: string
    qrCodeUrl: string
  } | null>(null)

  if (!isOpen || !event) return null

  const isPremiumUser = profile?.role === 'Premium Member' || profile?.membershipType === 'premium'
  const effectivePrice = isPremiumUser && event.premiumPrice !== undefined ? event.premiumPrice : (event.price || 0)
  const isGatewayAvailable = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)

  const completePaidRegistration = async (paymentId: string, orderId: string) => {
    setLoading(true)
    try {
      const token = await getAuthToken(user)
      const res = await fetch(`/api/v1/events/${event.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: user?.uid,
          name: profile?.fullName || user?.displayName || 'Member',
          email: profile?.email || user?.email || '',
          phone: profile?.phoneNumber || '',
          paymentId,
          orderId,
          amount: effectivePrice,
          paymentStatus: 'paid'
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        const ticketData = {
          ticketId: data.data?.ticketId || `ANX-TCK-${Date.now().toString().slice(-6)}`,
          seatNumber: data.data?.seatNumber || `Seat #1`,
          qrCodeUrl: data.data?.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ANX-VIP-PASS`
        }
        setTicketResult(ticketData)
        onSuccess(ticketData)
        toast.success('🎉 Payment verified! VIP Ticket sent to your email +50 XP!')
      } else {
        toast.error(data.message || 'Payment processing failed in database.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error processing registration.')
    } finally {
      setLoading(false)
    }
  }

  const handleRazorpayPayment = async () => {
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      toast.error('Razorpay Payment Gateway is not configured (missing NEXT_PUBLIC_RAZORPAY_KEY_ID). Paid checkout is disabled.')
      return
    }

    setLoading(true)
    try {
      const order = await createRazorpayOrder(effectivePrice, 'INR', {
        paymentType: 'event_registration',
        eventId: event.id
      })

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "ANX Platform",
        description: `Ticket: ${event.title}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await verifyRazorpayPayment(response, user.uid, profile?.email || user.email, effectivePrice, "event_ticket")
            await completePaidRegistration(response.razorpay_payment_id, response.razorpay_order_id)
          } catch (err: any) {
            toast.error("Payment verification failed: " + err.message)
          }
        },
        prefill: {
          name: profile?.fullName || user?.displayName || "",
          email: profile?.email || user?.email || "",
        },
        theme: {
          color: "#8b5cf6",
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        toast.error("Payment Failed: " + response.error.description)
      })
      rzp.open()
    } catch (err: any) {
      toast.error("Error creating Razorpay order: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#0d1527] border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] text-white overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {!ticketResult ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[11px] font-bold uppercase tracking-wider">
                  <Ticket className="w-3.5 h-3.5" /> Event Ticket Checkout
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight">
                {event.title}
              </h2>

              {/* Event Metadata */}
              <div className="my-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>{formatDate(event.date)} @ {event.time || '10:00 AM'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>{event.venue || (event.isOnline ? 'Online Live Stream' : 'Campus Hall A')}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Admission Fee</span>
                  <div className="text-2xl font-black text-white">
                    {formatCurrency(effectivePrice)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Secure Checkout
                  </span>
                </div>
              </div>

              {!isGatewayAvailable && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Payment Gateway is not configured (missing NEXT_PUBLIC_RAZORPAY_KEY_ID). Live transactions cannot be processed.</span>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleRazorpayPayment}
                  disabled={loading || !isGatewayAvailable}
                  className={`w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                    !isGatewayAvailable
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-600/30'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {!isGatewayAvailable 
                      ? 'Payment Gateway Unavailable' 
                      : loading 
                      ? 'Processing Payment...' 
                      : `Pay ${formatCurrency(effectivePrice)} & Get Ticket`}
                  </span>
                </button>

                <p className="text-[11px] text-slate-400 text-center">
                  Instant confirmation email with QR admission pass will be sent to <strong>{profile?.email || user?.email}</strong>.
                </p>
              </div>
            </div>
          ) : (
            /* TICKET SUCCESS VIEW */
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-white">
                Ticket Confirmed & Issued! 🎉
              </h2>

              <p className="text-xs text-slate-300">
                A copy with full entry pass details has been emailed to <strong>{profile?.email || user?.email}</strong>.
              </p>

              {/* TICKET PASS PREVIEW */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-[#090d18] border border-purple-500/30 text-left space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Ticket ID</span>
                    <p className="font-mono text-xs text-white font-bold">{ticketResult.ticketId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Seat</span>
                    <p className="text-xs text-emerald-400 font-bold">{ticketResult.seatNumber}</p>
                  </div>
                </div>

                <div className="py-2 text-center">
                  <div className="bg-white p-3 rounded-xl inline-block shadow-lg">
                    <img src={ticketResult.qrCodeUrl} alt="QR Pass" className="w-36 h-36 mx-auto" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">Present QR code at venue check-in</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg"
              >
                Done / Return to Event
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
