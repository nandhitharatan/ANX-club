'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/modules/module3/components/AuthContext';
import { getAuthToken } from '@/lib/auth-helpers';
import { 
  Lightbulb, Rocket, Users, Code, Plus, X, 
  FileText, Upload, CheckCircle2, AlertCircle, 
  ExternalLink, Sparkles, ArrowLeft, Paperclip, ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Idea {
  id: string;
  title: string;
  problemStatement: string;
  proposedSolution: string;
  targetUsers?: string;
  techStack?: string[];
  status: string;
  proposalPdf?: string;
  pdfFileName?: string;
  pdfUrl?: string;
  submitterId?: string;
  createdAt?: any;
  mentorFeedback?: any;
  adminFeedback?: any;
}

export default function IncubatorPage() {
  const { user, profile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [formData, setFormData] = useState({
    title: '',
    problemStatement: '',
    proposedSolution: '',
    targetUsers: '',
    techStack: '',
    pdfUrl: '',
  });

  const [pdfFile, setPdfFile] = useState<{ name: string; base64: string; size: string } | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchApiIdeas = async () => {
      try {
        const res = await fetch('/api/incubation/submit', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setIdeas(json.data);
        }
      } catch (e) {
        console.warn('Could not fetch ideas from API route:', e);
      }
    };
    fetchApiIdeas();

    const q = query(collection(db, 'ideas'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedIdeas: Idea[] = [];
        snapshot.forEach((doc) => {
          fetchedIdeas.push({ id: doc.id, ...doc.data() } as Idea);
        });
        setIdeas(fetchedIdeas);
      }
    }, (err) => {
      console.warn('Firestore ideas listener notice:', err);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Only PDF documents are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      setPdfFile({
        name: file.name,
        base64,
        size: sizeMb
      });
      toast.success(`Attached ${file.name}`);
    };
    reader.onerror = () => {
      toast.error('Error reading PDF file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to submit a proposal.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const token = await getAuthToken(user);

      const response = await fetch('/api/incubation/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: formData.title,
          problemStatement: formData.problemStatement,
          proposedSolution: formData.proposedSolution,
          targetUsers: formData.targetUsers,
          techStack: formData.techStack.split(',').map(s => s.trim()).filter(Boolean),
          proposalPdf: pdfFile?.base64 || formData.pdfUrl || undefined,
          pdfFileName: pdfFile?.name || (formData.pdfUrl ? 'Proposal Link' : undefined),
          pdfUrl: formData.pdfUrl || (pdfFile?.base64 ? pdfFile.base64 : undefined)
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Submission failed');
      }
      
      setStatus('success');
      toast.success('🎉 Proposal submitted! +30 XP awarded.');
      
      setTimeout(() => {
        setShowModal(false);
        setStatus('idle');
        setFormData({
          title: '',
          problemStatement: '',
          proposedSolution: '',
          targetUsers: '',
          techStack: '',
          pdfUrl: '',
        });
        setPdfFile(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Error submitting idea');
      toast.error(err.message || 'Failed to submit proposal');
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'idea';
    switch(s) {
      case 'launched': 
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">🚀 Launched (+250 XP)</span>;
      case 'building': 
        return <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">🔨 Building</span>;
      case 'testing': 
        return <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">🧪 Testing</span>;
      case 'validated': 
        return <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">✅ Validated</span>;
      default: 
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">💡 Idea Pitch</span>;
    }
  };

  const filteredIdeas = filterStatus === 'ALL' 
    ? ideas 
    : ideas.filter(i => (i.status || 'idea').toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="space-y-8 select-none">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-fuchsia-400 transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.4)]">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                Product Incubator
              </h1>
            </div>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">
              Turn innovative concepts into production software. Pitch an idea, attach your proposal PDF, build a team, and earn <span className="text-fuchsia-400 font-bold">+250 XP</span> upon launch.
            </p>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(217,70,239,0.35)] transition-all transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Submit Proposal (+30 XP)
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'Idea', 'Validated', 'Building', 'Testing', 'Launched'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                  : 'bg-zinc-900/80 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {st === 'ALL' ? 'All Proposals' : st}
            </button>
          ))}
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.length === 0 ? (
            <div className="col-span-full bg-zinc-950 border border-white/10 rounded-2xl p-12 text-center space-y-4">
              <Lightbulb className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
              <h3 className="text-lg font-bold text-white">No Proposals Found</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No ideas match the selected stage. Be the pioneer by submitting the first product blueprint.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs shadow transition-all"
              >
                Create First Pitch
              </button>
            </div>
          ) : (
            filteredIdeas.map((idea) => {
              const hasPdf = Boolean(idea.proposalPdf || idea.pdfUrl);
              return (
                <div 
                  key={idea.id}
                  className="bg-zinc-950/80 border border-white/10 hover:border-fuchsia-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(217,70,239,0.15)] group relative backdrop-blur-md"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-white group-hover:text-fuchsia-400 transition-colors line-clamp-2">
                        {idea.title}
                      </h3>
                      <div className="shrink-0">{getStatusBadge(idea.status)}</div>
                    </div>

                    <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                      {idea.problemStatement}
                    </p>

                    {idea.proposedSolution && (
                      <div className="bg-zinc-900/60 rounded-xl p-3 border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider block">Solution</span>
                        <p className="text-xs text-gray-400 line-clamp-2">{idea.proposedSolution}</p>
                      </div>
                    )}

                    {/* PDF Attachment Badge */}
                    {hasPdf && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-fuchsia-950/20 border border-fuchsia-500/30 text-fuchsia-300 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-fuchsia-400 shrink-0" />
                          <span className="font-semibold truncate">{idea.pdfFileName || 'Proposal Document.pdf'}</span>
                        </div>
                        <a 
                          href={idea.proposalPdf || idea.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-fuchsia-600/30 hover:bg-fuchsia-600/50 text-[10px] font-bold text-white transition-colors shrink-0 flex items-center gap-1"
                        >
                          View PDF <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Mentor / Admin Feedback Display */}
                    {Boolean((idea as any).adminFeedback || idea.mentorFeedback) && (
                      <div className="bg-fuchsia-950/30 border border-fuchsia-500/30 rounded-xl p-3 space-y-1.5 mt-2">
                        <div className="flex items-center gap-1.5 text-fuchsia-400 text-[11px] font-bold uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Evaluation & Mentor Feedback:</span>
                        </div>
                        <p className="text-xs text-zinc-200 leading-relaxed bg-black/40 p-2 rounded-lg border border-white/5">
                          {((idea as any).adminFeedback?.comments || idea.mentorFeedback?.comments || (typeof (idea as any).adminFeedback === 'string' ? (idea as any).adminFeedback : '') || (typeof idea.mentorFeedback === 'string' ? idea.mentorFeedback : ''))}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
                    {idea.techStack && idea.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {idea.techStack.map((tech, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-[10px] font-medium text-gray-400"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {idea.targetUsers && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="truncate">Audience: {idea.targetUsers}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL - Fully Adaptive & Responsive */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="p-6 md:px-8 md:pt-8 md:pb-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-400" />
                    <h2 className="text-xl font-bold text-white">Submit Product Pitch</h2>
                  </div>
                  <p className="text-xs text-gray-400">
                    Provide your product architecture, problem statement, and proposal PDF to earn +30 XP.
                  </p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl bg-zinc-900 text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form Content */}
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Project Title <span className="text-fuchsia-400">*</span>
                  </label>
                  <input 
                    required 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. AI-Powered Autonomous Cloud Orchestrator" 
                    className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Problem Statement <span className="text-fuchsia-400">*</span>
                  </label>
                  <textarea 
                    required 
                    rows={3}
                    value={formData.problemStatement}
                    onChange={(e) => setFormData({...formData, problemStatement: e.target.value})}
                    placeholder="What specific friction or problem in software engineering does this address?" 
                    className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Proposed Solution & Architecture <span className="text-fuchsia-400">*</span>
                  </label>
                  <textarea 
                    required 
                    rows={3}
                    value={formData.proposedSolution}
                    onChange={(e) => setFormData({...formData, proposedSolution: e.target.value})}
                    placeholder="How does your product solve it? Describe the core technical architecture." 
                    className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Target Users
                    </label>
                    <input 
                      type="text"
                      value={formData.targetUsers}
                      onChange={(e) => setFormData({...formData, targetUsers: e.target.value})}
                      placeholder="e.g. SREs, Devs, Students" 
                      className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Tech Stack (Comma Separated)
                    </label>
                    <input 
                      type="text"
                      value={formData.techStack}
                      onChange={(e) => setFormData({...formData, techStack: e.target.value})}
                      placeholder="e.g. Next.js, FastAPI, Pinecone, AWS" 
                      className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all"
                    />
                  </div>
                </div>

                {/* PDF Proposal Submission Section */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Proposal Deck / PDF Attachment</span>
                    <span className="text-[10px] text-gray-500 font-normal">Optional (Max 10MB)</span>
                  </label>

                  {pdfFile ? (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-fuchsia-500/40 text-white">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate text-left">
                          <p className="text-xs font-bold truncate">{pdfFile.name}</p>
                          <p className="text-[10px] text-gray-400">{pdfFile.size}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setPdfFile(null)}
                        className="p-1 rounded-md text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-white/15 hover:border-fuchsia-500/50 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-fuchsia-400" />
                      <div className="text-center">
                        <span className="text-xs font-bold text-fuchsia-400">Click to upload proposal PDF</span>
                        <span className="text-xs text-gray-500 block">or drag and drop PDF file here</span>
                      </div>
                      <input 
                        type="file" 
                        accept="application/pdf,.pdf" 
                        onChange={handleFileUpload}
                        className="hidden" 
                      />
                    </label>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-gray-500 uppercase">OR</span>
                    <input 
                      type="url"
                      value={formData.pdfUrl}
                      onChange={(e) => setFormData({...formData, pdfUrl: e.target.value})}
                      placeholder="Paste PDF or Google Docs link (https://...)" 
                      className="flex-1 px-3 py-2 bg-zinc-900/70 border border-white/10 rounded-lg text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all"
                    />
                  </div>
                </div>

                {/* Status & Submit Actions */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {status === 'error' && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errorMessage || 'Failed to submit proposal'}</span>
                    </div>
                  )}
                  {status === 'success' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submitted successfully! +30 XP Awarded</span>
                    </div>
                  )}
                  <div className="sm:ml-auto flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-gray-300 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={status === 'submitting'}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(217,70,239,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {status === 'submitting' ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Publish Proposal</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
