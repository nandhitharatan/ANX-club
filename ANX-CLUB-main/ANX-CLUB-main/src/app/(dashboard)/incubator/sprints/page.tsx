'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Plus, CheckCircle2, Clock, Calendar, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/modules/module3/components/AuthContext';
import { getAuthToken } from '@/lib/auth-helpers';

interface SprintGoal {
  id: string;
  goal: string;
  durationWeeks?: number;
  status: string;
  startedAt?: any;
}

const INITIAL_GOALS: SprintGoal[] = [
  { id: '1', goal: 'Setup PostgreSQL Database & Schemas', status: 'completed' },
  { id: '2', goal: 'Build Authentication Endpoints & Token Validation', status: 'active' },
  { id: '3', goal: 'Integrate Razorpay Webhooks & Signature Checks', status: 'active' },
];

export default function SprintTrackerPage() {
  const { user } = useAuth();
  const [sprintGoal, setSprintGoal] = useState('');
  const [goals, setGoals] = useState<SprintGoal[]>(INITIAL_GOALS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const q = query(collection(db, 'sprints'), orderBy('startedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const liveGoals: SprintGoal[] = [];
          snapshot.forEach(doc => {
            const d = doc.data();
            liveGoals.push({
              id: doc.id,
              goal: d.goal,
              durationWeeks: d.durationWeeks || 2,
              status: d.status || 'active',
              startedAt: d.startedAt
            });
          });
          setGoals([...liveGoals, ...INITIAL_GOALS]);
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Sprints live listener skipped:', err);
    }
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintGoal.trim()) return;

    setLoading(true);
    try {
      const token = await getAuthToken(user);
      const res = await fetch('/api/incubation/sprints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ideaId: 'active-sprint-project',
          goal: sprintGoal.trim(),
          durationWeeks: 2
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Sprint goal created! +20 XP awarded 🚀');
        setGoals(prev => [{ id: data.sprintId || Date.now().toString(), goal: sprintGoal.trim(), status: 'active' }, ...prev]);
        setSprintGoal('');
      } else {
        toast.error(data.message || data.error || 'Failed to add goal.');
      }
    } catch (err) {
      console.error('Error adding sprint goal:', err);
      toast.error('Network error adding sprint goal.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const nextStatus = g.status === 'completed' ? 'active' : 'completed';
        toast.success(nextStatus === 'completed' ? 'Goal marked completed! 🎉' : 'Goal marked active');
        return { ...g, status: nextStatus };
      }
      return g;
    }));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto select-none">
      <div>
        <Link 
          href="/incubator" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Incubator
        </Link>
        <h1 className="text-3xl font-display font-extrabold text-foreground flex items-center gap-3">
          <CheckSquare className="w-7 h-7 text-purple-400" /> Weekly Sprint Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track delivery velocity, milestone tickets, and ship deliverables for your active projects.
        </p>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/60 backdrop-blur-xl border border-border/70 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
      >
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" /> Active 2-Week Sprint Cycle
          </h2>
          <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Sprint #04 In-Progress
          </span>
        </div>
        
        <form onSubmit={handleAddGoal} className="flex gap-3">
          <input 
            type="text" 
            placeholder="Add a new sprint deliverable / milestone ticket..." 
            className="flex-1 px-4 py-3 bg-background/80 border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500 transition-colors"
            value={sprintGoal}
            onChange={(e) => setSprintGoal(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 shrink-0 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Goal (+20 XP)</span>
              </>
            )}
          </button>
        </form>

        <div className="space-y-3 pt-2">
          {goals.map((g) => {
            const isCompleted = g.status === 'completed';
            return (
              <div 
                key={g.id} 
                onClick={() => toggleGoal(g.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  isCompleted 
                    ? 'bg-background/30 border-border/40 opacity-70' 
                    : 'bg-background/80 border-border/80 hover:border-purple-500/50 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input 
                    type="checkbox" 
                    checked={isCompleted} 
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500/40 pointer-events-none" 
                  />
                  <span className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {g.goal}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {g.status}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
