'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Award, CheckCircle2, ShieldCheck, Send, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/modules/module3/components/AuthContext';
import { getAuthToken } from '@/lib/auth-helpers';

export default function InternshipReviewsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    internId: '', 
    weekNumber: '1', 
    summary: '', 
    impact: '5',
    technicalDepth: '5',
    presentation: '5',
    notes: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.internId.trim() || !formData.summary.trim()) {
      toast.error('Please fill in intern identification and summary');
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const token = await getAuthToken(user);
      const res = await fetch('/api/internships/reviews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Structured review submitted successfully! 🎉');
        setStatus({ type: 'success', message: 'Evaluation logged in intern audit ledger.' });
        setFormData({ ...formData, impact: '5', technicalDepth: '5', presentation: '5', summary: '', notes: '' });
      } else {
        toast.error(data.message || data.error || 'Review submission failed');
        setStatus({ type: 'error', message: data.message || 'An error occurred.' });
      }
    } catch (error) {
      toast.error('Network error submitting review');
      setStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto select-none">
      <div>
        <Link 
          href="/internships" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Internships
        </Link>
        <h1 className="text-3xl font-display font-extrabold text-foreground flex items-center gap-3">
          <Award className="w-7 h-7 text-purple-400" /> Structured Intern Rubric Review
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit weekly rubric evaluations and competency milestones for your active project interns.
        </p>
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

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/60 backdrop-blur-xl border border-border/70 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Intern Name / ID</label>
              <input
                type="text"
                required
                value={formData.internId}
                onChange={(e) => setFormData({...formData, internId: e.target.value})}
                className="w-full px-4 py-3 bg-background/80 border border-border/80 rounded-xl text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="e.g. Rohit Verma (ANX-INT-09)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evaluation Cycle</label>
              <select
                value={formData.weekNumber}
                onChange={(e) => setFormData({...formData, weekNumber: e.target.value})}
                className="w-full px-4 py-3 bg-background/80 border border-border/80 rounded-xl text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(week => (
                  <option key={week} value={week} className="bg-zinc-900">Sprint Week {week}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-background/50 border border-border/70 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" /> Rubric Evaluation Scores
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Engineering Quality & Depth</span>
                  <span className="font-bold text-purple-400">{formData.technicalDepth} / 5</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={formData.technicalDepth} 
                  onChange={(e) => setFormData({...formData, technicalDepth: e.target.value})} 
                  className="w-full accent-purple-500" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Product & Business Impact</span>
                  <span className="font-bold text-purple-400">{formData.impact} / 5</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={formData.impact} 
                  onChange={(e) => setFormData({...formData, impact: e.target.value})} 
                  className="w-full accent-purple-500" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Communication & Team Collaboration</span>
                  <span className="font-bold text-purple-400">{formData.presentation} / 5</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={formData.presentation} 
                  onChange={(e) => setFormData({...formData, presentation: e.target.value})} 
                  className="w-full accent-purple-500" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deliverables Summary</label>
            <textarea
              required
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              className="w-full px-4 py-3 bg-background/80 border border-border/80 rounded-xl text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="What core features, PRs, or tickets did they complete this cycle?"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Actionable Feedback for Intern</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 bg-background/80 border border-border/80 rounded-xl text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Strengths and areas of improvement for next sprint..."
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
                <Send className="w-4 h-4" />
                <span>Submit Evaluation Rubric</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
