'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Video, Calendar, Sparkles, Clock, ArrowLeft, CheckCircle2, ShieldCheck, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/modules/module3/components/AuthContext';
import { getAuthToken } from '@/lib/auth-helpers';

export default function MockInterviewsPage() {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({ date: '', role: 'Frontend Engineer', experience: 'Entry Level' });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      toast.error('Please select your preferred date');
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const token = await getAuthToken(user);
      const res = await fetch('/api/career/mock-interviews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Mock interview requested successfully! 🚀');
        setStatus({ type: 'success', message: 'Mock interview requested! A mentor will review and schedule your session link.' });
      } else {
        toast.error(data.message || data.error || 'Failed to request session.');
        setStatus({ type: 'error', message: data.message || 'An error occurred. Please try again.' });
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      setStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/career" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Career Prep
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Video className="w-7 h-7 text-purple-400" /> Schedule Mock Technical Interview
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Book a 45-minute live coding session with senior industry engineers to prep for your dream role.</p>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          status.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldCheck className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 bg-card/60 backdrop-blur-xl border border-border/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-3 bg-background/80 border border-border/80 rounded-xl text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="Frontend Engineer" className="bg-zinc-900">Frontend Engineer (React / Next.js)</option>
                <option value="Backend Engineer" className="bg-zinc-900">Backend Engineer (Node / Python / Go)</option>
                <option value="Full-Stack Engineer" className="bg-zinc-900">Full-Stack Engineer</option>
                <option value="Data Scientist" className="bg-zinc-900">AI / Data Science Engineer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Experience Level</label>
              <select
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="w-full px-4 py-3 bg-background/80 border border-border/80 rounded-xl text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="Entry Level" className="bg-zinc-900">Entry Level (0-1 years)</option>
                <option value="Junior" className="bg-zinc-900">Junior (1-3 years)</option>
                <option value="Mid-Level" className="bg-zinc-900">Mid-Level (3-5 years)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferred Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 bg-background/80 border border-border/80 rounded-xl text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Request Mock Interview Session (+50 XP)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar info */}
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-zinc-950/60 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" /> 45-Min Session Rubric
            </h4>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span><strong className="text-white">5 Mins:</strong> System & Background Intro</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span><strong className="text-white">30 Mins:</strong> Live Coding & System Architecture</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <span><strong className="text-white">10 Mins:</strong> Rubric Breakdown & Mentor Guidance</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
