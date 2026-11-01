'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, BookOpen, ArrowRight, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { validatePassword } from '@/lib/utils'
import { useAuth } from '@/modules/module3/components/AuthContext'

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const BRANCHES = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Information Technology', 'Other']

export function SignupForm() {
  const router = useRouter()
  const { signup } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', college: '', year: '', branch: '' })

  const update = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))
  const { strength } = validatePassword(form.password)
  const strengthColors = { weak: 'bg-red-500', fair: 'bg-orange-500', good: 'bg-yellow-500', strong: 'bg-green-500' }
  const strengthWidth = { weak: '25%', fair: '50%', good: '75%', strong: '100%' }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      if (!form.fullName.trim() || !form.email.trim() || !form.password) {
        toast.error('Please complete all fields.')
        return
      }
      setStep(2)
      return
    }
    setLoading(true)
    try {
      await signup(form.email.trim(), form.password, {
        fullName: form.fullName.trim(),
        collegeName: form.college.trim(),
        yearBranch: `${form.year} - ${form.branch}`,
      })
      toast.success('Account created! Welcome to A.N.X 🎉')
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Signup error:', err)
      toast.error(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-1">
          {step === 2 && <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-5 h-5" /></button>}
          <div className="flex gap-2 ml-auto">
            <div className={`h-1 rounded-full transition-all ${step >= 1 ? 'w-8 bg-primary' : 'w-8 bg-muted'}`} />
            <div className={`h-1 rounded-full transition-all ${step >= 2 ? 'w-8 bg-primary' : 'w-8 bg-muted'}`} />
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">{step === 1 ? 'Create your account' : 'Tell us about yourself'}</h1>
        <p className="text-muted-foreground mt-2">{step === 1 ? 'Join the A.N.X community for free' : 'Help us personalize your experience'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)} required placeholder="Arjun Sharma"
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="your@college.edu"
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-12 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strengthColors[strength]}`} style={{ width: strengthWidth[strength] }} />
                    </div>
                    <p className="text-xs text-muted-foreground">Password strength: <span className="font-medium capitalize">{strength}</span></p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">College / University</label>
                <div className="relative">
                  <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={form.college} onChange={e => update('college', e.target.value)} required placeholder="IIT Madras"
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Year</label>
                  <select value={form.year} onChange={e => update('year', e.target.value)} required
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm">
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Branch</label>
                  <select value={form.branch} onChange={e => update('branch', e.target.value)} required
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm">
                    <option value="">Select branch</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>{step === 1 ? 'Continue' : 'Create Account'}</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </motion.div>
  )
}
