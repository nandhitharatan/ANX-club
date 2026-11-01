'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, Award, CreditCard, Sparkles, HelpCircle, 
  ChevronRight, Calendar, ArrowRight, ShieldCheck, X 
} from 'lucide-react'
import { MOCK_USER, PREMIUM_BENEFITS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

import { useAuth } from '@/modules/module3/components/AuthContext'
import { useEffect } from 'react'
import { createRazorpayOrder, verifyRazorpayPayment } from '@/modules/module3/lib/razorpay'
import { useRouter } from 'next/navigation'

export default function MembershipPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('premium')
  const [loadingPayment, setLoadingPayment] = useState(false)

  useEffect(() => {
    // Inject Razorpay checkout script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to upgrade!')
      router.push('/login')
      return
    }
    setLoadingPayment(true)
    
    try {
      const order = await createRazorpayOrder(price, 'INR', {
        paymentType: 'membership',
        billingPeriod,
      })

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency,
        name: "ANX Platform",
        description: "Premium Elite Membership",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await verifyRazorpayPayment(response, user.uid, profile?.email || user.email || '', price, "membership")
            toast.success("Payment successful! You are now a Premium Member. 🚀")
            router.push("/dashboard")
          } catch (err: any) {
            toast.error("Payment verification failed: " + err.message)
          }
        },
        prefill: {
          name: profile?.fullName || "",
          email: profile?.email || user.email || "",
        },
        theme: {
          color: "#2563eb",
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any){
        toast.error("Payment Failed: " + response.error.description)
      })
      rzp.open()
    } catch (error: any) {
      toast.error("Error initiating payment: " + error.message)
    } finally {
      setLoadingPayment(false)
    }
  }

  const price = billingPeriod === 'annual' ? 999 : 149
  const originalPrice = billingPeriod === 'annual' ? 1999 : 299
  const saving = originalPrice - price

  return (
    <div className="space-y-8 select-none">
      {/* Header Section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Level Up Your Campus Journey
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Sleek Pricing for Sleek Builders
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
          Gain access to priority registrations, premium mentor hours, interactive courses, and verified certificates.
        </p>

        {/* Toggle Switch */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-semibold ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className="w-12 h-6.5 rounded-full bg-primary/20 p-1 flex items-center transition-all focus:outline-none relative"
          >
            <motion.div
              layout
              className="w-4.5 h-4.5 rounded-full bg-primary"
              style={{ marginLeft: billingPeriod === 'annual' ? '24px' : '0px' }}
            />
          </button>
          <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annual <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Save 50%</span>
          </span>
        </div>
      </div>

      {/* Plan Cards section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-6">
        {/* Free Plan */}
        <div className="bg-card border border-border/50 rounded-3xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-border transition-all">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Base Tier</span>
              <h3 className="font-display text-xl font-bold text-foreground">Standard Free</h3>
              <p className="text-xs text-muted-foreground">For campus beginners exploring the community.</p>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-black text-foreground">₹0</span>
              <span className="text-xs text-muted-foreground">/ forever</span>
            </div>

            <div className="border-t border-border/40 my-3" />

            <ul className="space-y-3 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Access to standard workshops & hackathons</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Browse resources index directory</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Read general ecosystem announcements</span>
              </li>
              <li className="flex items-center gap-2.5 text-muted-foreground/40 line-through">
                <span>Priority registration access</span>
              </li>
              <li className="flex items-center gap-2.5 text-muted-foreground/40 line-through">
                <span>1-on-1 mentor booking hours</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full py-3 mt-8 bg-muted text-muted-foreground font-semibold rounded-xl text-xs transition-colors border border-border/40 cursor-not-allowed"
          >
            Current Active Plan
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-card border border-primary/30 rounded-3xl p-8 flex flex-col justify-between shadow-lg shadow-primary/5 relative overflow-hidden group hover:border-primary/50 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Popular Tag */}
          <div className="absolute top-4 right-4 shrink-0">
            <span className="inline-flex items-center gap-0.5 px-3 py-1 bg-primary text-primary-foreground border border-primary/20 text-[9px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
              Most Popular
            </span>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Premium Tier</span>
              <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-1.5">
                Premium Elite <Award className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-muted-foreground">For active builders looking to launch high-growth careers.</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-black text-foreground">{formatCurrency(price)}</span>
                <span className="text-xs text-muted-foreground">/ {billingPeriod === 'annual' ? 'year' : 'month'}</span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide">
                  Save ₹{saving} compared to monthly billing!
                </p>
              )}
            </div>

            <div className="border-t border-border/40 my-3" />

            <ul className="space-y-3 text-xs text-foreground font-medium">
              {PREMIUM_BENEFITS.map((benefit: string) => (
                <li key={benefit} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setShowCheckout(true)}
            disabled={loadingPayment || profile?.role === "Premium Member"}
            className="w-full py-3 mt-8 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl text-xs transition-all shadow-md shadow-primary/15 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {profile?.role === "Premium Member" ? "Current Active Plan" : "Upgrade Plan Now"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto shadow-sm space-y-4">
        <h3 className="font-display text-lg font-bold text-foreground text-center mb-6">Detailed Perks Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 text-[10px] uppercase text-muted-foreground tracking-wider font-bold">
                <th className="py-3 pr-4">Features</th>
                <th className="py-3 px-4">Standard Free</th>
                <th className="py-3 px-4">Premium Elite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 font-medium">
              <tr>
                <td className="py-3 pr-4 font-bold text-foreground">Standard Event Seats</td>
                <td className="py-3 px-4 text-muted-foreground">General Entry</td>
                <td className="py-3 px-4 text-primary font-bold">Priority Front Row</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-foreground">Premium Masterclasses</td>
                <td className="py-3 px-4 text-muted-foreground">Unavailable</td>
                <td className="py-3 px-4 text-emerald-500 font-bold">Free access (unlimited)</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-foreground">Mentor bookings</td>
                <td className="py-3 px-4 text-muted-foreground">Unavailable</td>
                <td className="py-3 px-4 text-foreground">5 hours / month</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-foreground">Verified Certificates</td>
                <td className="py-3 px-4 text-muted-foreground">Unavailable</td>
                <td className="py-3 px-4 text-emerald-500 font-bold">Included</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-foreground">Support response</td>
                <td className="py-3 px-4 text-muted-foreground">Standard 48 hours</td>
                <td className="py-3 px-4 text-foreground">Premium 2 hours priority</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Checkout Modal Dialog */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckout(false)}
              className="fixed inset-0 bg-black"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden z-10"
            >
              <div className="p-6 border-b border-border/40 flex justify-between items-center bg-muted/20">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Complete Payment</span>
                <button onClick={() => setShowCheckout(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-5">
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Subscription Order</span>
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-sm font-bold text-foreground">Premium Elite ({billingPeriod})</h4>
                    <span className="text-base font-black text-foreground">{formatCurrency(price)}</span>
                  </div>
                </div>

                {/* Simulated Payment Cards */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cardholder Name</label>
                    <input 
                      type="text" 
                      required 
                      defaultValue={MOCK_USER.fullName}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Card Details</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required 
                        placeholder="4111 2222 3333 4444"
                        className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 pl-10" 
                      />
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expiry date</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="MM / YY" 
                        className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CVV</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="•••" 
                        maxLength={3}
                        className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl border border-border/20 flex gap-2.5 text-[10px] text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Your transaction is encrypted securely. Mock billing order verified via Razorpay sandbox.</span>
                </div>

                <button
                  type="submit"
                  disabled={loadingPayment}
                  className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl text-xs transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
                >
                  {loadingPayment ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Authorize Payment of {formatCurrency(price)}</span> <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
