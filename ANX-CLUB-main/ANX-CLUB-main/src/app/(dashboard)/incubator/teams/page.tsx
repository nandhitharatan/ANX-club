'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, Sparkles, Code, CheckCircle2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/modules/module3/components/AuthContext';
import { getAuthToken } from '@/lib/auth-helpers';

interface ValidatedIdea {
  id: string;
  title: string;
  problemStatement: string;
  proposedSolution: string;
  techStack?: string[];
  status: string;
}

const DEFAULT_PROJECTS = [
  {
    id: 'carpool-1',
    title: 'Campus Carpool App',
    problemStatement: 'Students struggle with daily commute costs and traffic.',
    proposedSolution: 'A hyper-local carpooling platform for students to share rides to college, reducing costs and emissions.',
    techStack: ['React Native', 'Node.js', 'PostgreSQL'],
    status: 'Validated',
    roles: [
      { name: 'Frontend Developer (React Native)', filled: false },
      { name: 'Backend Developer (Node.js)', filled: false },
      { name: 'UI/UX Designer', filled: true },
    ]
  },
  {
    id: 'ai-syllabus-2',
    title: 'AI Syllabus Summarizer',
    problemStatement: 'Dense course curricula are hard to parse into daily milestones.',
    proposedSolution: 'Upload course PDFs and get week-by-week study plans powered by LLMs.',
    techStack: ['Python', 'FastAPI', 'Next.js'],
    status: 'Validated',
    roles: [
      { name: 'AI Engineer (Python)', filled: false },
      { name: 'Full-Stack Developer (Next.js)', filled: false },
    ]
  }
];

export default function TeamFormationPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>(DEFAULT_PROJECTS);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    try {
      const q = query(collection(db, 'ideas'), where('status', 'in', ['Validated', 'Building']));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const liveIdeas: any[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            liveIdeas.push({
              id: doc.id,
              title: data.title,
              problemStatement: data.problemStatement,
              proposedSolution: data.proposedSolution,
              techStack: data.techStack || ['Full Stack'],
              status: data.status || 'Validated',
              roles: (data.techStack || ['Developer', 'Designer']).map((skill: string) => ({
                name: `${skill} Specialist`,
                filled: false
              }))
            });
          });
          setProjects([...liveIdeas, ...DEFAULT_PROJECTS]);
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore live ideas listener skipped:', err);
    }
  }, []);

  const handleApplyRole = async (projectId: string, roleName: string) => {
    if (!user) {
      toast.error('Please log in to claim a role.');
      return;
    }

    setJoining(`${projectId}_${roleName}`);
    try {
      const token = await getAuthToken(user);
      const res = await fetch('/api/incubation/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ideaId: projectId,
          name: `Team for Project #${projectId.substring(0, 6)}`,
          members: [user.uid]
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Successfully joined team for "${roleName}"! 🎉`);
      } else {
        toast.error(data.message || data.error || 'Failed to join team.');
      }
    } catch (err) {
      console.error('Error applying for team role:', err);
      toast.error('Network error joining team.');
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto select-none">
      <div>
        <Link 
          href="/incubator" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Incubator
        </Link>
        <h1 className="text-3xl font-display font-extrabold text-foreground flex items-center gap-3">
          <Users className="w-7 h-7 text-purple-400" /> Team Formation & Validated Projects
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Join vetted high-velocity projects by claiming open builder & designer role slots.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <motion.div 
            key={proj.id} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/60 backdrop-blur-xl border border-border/70 hover:border-purple-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 transition-all"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-3">
                <h2 className="text-lg font-display font-bold text-white">{proj.title}</h2>
                <span className="bg-purple-500/10 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full border border-purple-500/20 shrink-0">
                  {proj.status}
                </span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{proj.proposedSolution}</p>
              
              <div className="pt-2">
                <h3 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-2.5">Open Roles</h3>
                <ul className="space-y-2">
                  {proj.roles.map((role: any) => {
                    const roleKey = `${proj.id}_${role.name}`;
                    const isApplying = joining === roleKey;
                    return (
                      <li key={role.name} className="flex justify-between items-center bg-background/80 p-3 rounded-xl border border-border/70">
                        <span className="text-xs font-medium text-foreground">{role.name}</span>
                        {role.filled ? (
                          <span className="text-[10px] text-muted-foreground font-semibold px-2.5 py-1 bg-muted/40 rounded-lg">
                            Claimed
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleApplyRole(proj.id, role.name)}
                            disabled={isApplying}
                            className="text-xs font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isApplying ? (
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" />
                                <span>Apply</span>
                              </>
                            )}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {proj.techStack && (
              <div className="pt-3 border-t border-border/40 flex flex-wrap gap-1.5">
                {proj.techStack.map((tech: string) => (
                  <span key={tech} className="text-[10px] bg-background/90 text-muted-foreground px-2.5 py-0.5 rounded-md border border-border/70">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
