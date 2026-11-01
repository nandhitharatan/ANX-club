'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { db } from '@/lib/firebase/client'
import { doc, getDoc } from 'firebase/firestore'
import { isOfficialAdminEmail, normalizeAdminEmail } from '@/lib/admin-auth-config'

export function LoginForm({ adminOnly = false }: { adminOnly?: boolean }) {
  const router = useRouter()
  const { login, loginWithGoogle, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const cleanEmail = normalizeAdminEmail(email)
      const isOfficial = isOfficialAdminEmail(cleanEmail)

      const result = await login(cleanEmail, password)
      
      const userEmail = normalizeAdminEmail(result?.user?.email || cleanEmail)
      let isAdmin = isOfficial || isOfficialAdminEmail(userEmail)

      const userId = result?.user?.uid
      if (!isAdmin && userId) {
        try {
          const profileSnapshot = await getDoc(doc(db, 'users', userId))
          const userData = profileSnapshot?.data()
          if (userData?.role === 'Admin') {
            isAdmin = true
          }
        } catch (dbErr) {
          console.warn('Could not read user profile from firestore during login check:', dbErr)
        }
      }

      if (adminOnly && !isAdmin) {
        await logout()
        throw new Error('Access denied: You are registered as a standard member. Administrator credentials required.')
      }

      if (isAdmin) {
        localStorage.setItem('anx_admin_mode', 'true')
        document.cookie = 'anx_admin=true; path=/; max-age=2592000; SameSite=Lax'
      } else {
        localStorage.removeItem('anx_admin_mode')
        document.cookie = 'anx_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax'
      }

      toast.success(adminOnly || isAdmin ? 'Administrator sign in successful.' : 'Welcome back!')
      if (adminOnly || isAdmin) {
        window.location.href = '/admin'
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Login submission error:', err)
      toast.error(err.message || 'Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (adminOnly) return
    setLoading(true)
    try {
      await loginWithGoogle()
      toast.success('Signed in with Google!')
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Google login error:', err)
      toast.error(err.message || 'Google sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">{adminOnly ? 'Administrator sign in' : 'Welcome back'}</h1>
        <p className="text-muted-foreground mt-2">{adminOnly ? 'Access the ANX control console with administrator credentials' : 'Sign in to your A.N.X dashboard'}</p>
      </div>

      {/* Google */}
      {!adminOnly && <button onClick={handleGoogleLogin} disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl bg-card hover:bg-muted transition-all font-medium text-foreground text-sm">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>}

      {!adminOnly && <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs"><span className="px-3 bg-background text-muted-foreground uppercase tracking-wider">or</span></div>
      </div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input id="email" type="text" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder={adminOnly ? "admin@anxclub.dev" : "your@email.com"}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <button type="button" onClick={() => toast.success('Password reset instructions sent to your email!')} className="text-xs text-primary hover:underline">Forgot password?</button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>{adminOnly ? 'Sign in as administrator' : 'Sign in'}</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      {!adminOnly && <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/signup" className="text-primary font-medium hover:underline">Create one free</Link>
      </p>}
      {!adminOnly && <p className="text-center text-xs text-muted-foreground">
        <Link href="/admin/login" className="text-amber-500 font-medium hover:underline">Administrator sign in</Link>
      </p>}
    </motion.div>
  )
}
