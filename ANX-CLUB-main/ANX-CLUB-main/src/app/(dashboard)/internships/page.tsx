'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/modules/module3/components/AuthContext';
import { getAuthToken } from '@/lib/auth-helpers';
import { 
  Briefcase, Building, Sparkles, MapPin, DollarSign, 
  ArrowRight, CheckCircle2, ChevronRight, ShieldCheck, Clock 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Internship {
  id: string;
  title: string;
  company: string;
  stipend: string;
  location?: string;
  type?: string;
  requiredSkills: string[];
}

const DEFAULT_INTERNSHIPS: Internship[] = [
  {
    id: 'int-1',
    title: 'Full Stack Engineer Intern',
    company: 'Algorithm Aliens Labs',
    stipend: '₹25,000 / month',
    location: 'Remote',
    type: 'Full-time Intern',
    requiredSkills: ['Next.js', 'TypeScript', 'Node.js', 'TailwindCSS']
  },
  {
    id: 'int-2',
    title: 'AI Systems & LLM Intern',
    company: 'NeuroNexus AI',
    stipend: '₹30,000 / month',
    location: 'Bengaluru / Hybrid',
    type: '3 Months',
    requiredSkills: ['Python', 'LangChain', 'FastAPI', 'PyTorch']
  },
  {
    id: 'int-3',
    title: 'Cloud & DevOps Associate',
    company: 'HyperScale Cloud',
    stipend: '₹20,000 / month',
    location: 'Remote',
    type: '6 Months',
    requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD']
  }
];

export default function InternshipsPage() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<Record<string, string>>({});
  const [internships, setInternships] = useState<Internship[]>(DEFAULT_INTERNSHIPS);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const q = query(collection(db, 'internships'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const fetched: Internship[] = [];
          snapshot.forEach((doc) => {
            fetched.push({ id: doc.id, ...doc.data() } as Internship);
          });
          setInternships([...fetched, ...DEFAULT_INTERNSHIPS]);
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore internships listener notice:', err);
    }
  }, []);

  const handleApply = async (internshipId: string) => {
    if (!user) {
      toast.error('Please sign in to apply for internships');
      return;
    }

    setApplyingId(internshipId);
    setStatus(prev => ({ ...prev, [internshipId]: 'applying' }));
    try {
      const token = await getAuthToken(user);
      const res = await fetch('/api/internships/apply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          internshipId,
          userId: user.uid,
          userEmail: user.email || '',
          userName: profile?.fullName || user.displayName || 'Member'
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Application submitted! Match score: ${data.skillMatchScore || 85}% 🎉`);
        setStatus(prev => ({ ...prev, [internshipId]: `Applied (${data.skillMatchScore || 85}% Match)` }));
      } else {
        toast.error(data.error || data.message || 'Application failed');
        setStatus(prev => ({ ...prev, [internshipId]: '' }));
      }
    } catch (e: any) {
      toast.error('Error submitting application');
      setStatus(prev => ({ ...prev, [internshipId]: '' }));
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-950 border border-purple-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Direct Hiring Pipeline
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
              Internship & Career Portal
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Apply directly to exclusive partner openings, verified startup fellowships, and internal core engineering roles with automated resume matching.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/career"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all flex items-center gap-2"
            >
              Resume Audit <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Internship Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {internships.map((job) => {
          const isApplied = status[job.id]?.startsWith('Applied');
          const isApplying = applyingId === job.id;

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-card/60 backdrop-blur-xl border border-border/70 hover:border-purple-500/40 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shrink-0">
                    <Building className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {job.type || 'Internship'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-display font-bold text-white group-hover:text-purple-300 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Building className="w-3.5 h-3.5 text-purple-400/80" /> {job.company}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <DollarSign className="w-3.5 h-3.5" /> {job.stipend}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" /> {job.location || 'Remote'}
                  </span>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills?.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-background/80 border border-border/80 text-muted-foreground font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-border/40">
                <button
                  onClick={() => handleApply(job.id)}
                  disabled={isApplied || isApplying}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isApplied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-purple-500/20'
                  }`}
                >
                  {isApplying ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isApplied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{status[job.id]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>1-Click Fast Apply (+10 XP)</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
