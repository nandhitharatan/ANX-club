'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, FileText, Upload, Send, CheckCircle2, 
  AlertCircle, Sparkles, Briefcase, Clock, Eye, 
  Download, ExternalLink, MessageSquare, Star, 
  Award, RefreshCw, XCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/modules/module3/components/AuthContext';
import { getAuthToken } from '@/lib/auth-helpers';

export default function CareerPrepPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [formData, setFormData] = useState({
    targetRole: '',
    type: 'resume',
    fileUrl: '',
    fileName: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Submissions state
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Preview Modal
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    fileUrl: string;
    fileName: string;
  }>({
    isOpen: false,
    title: '',
    fileUrl: '',
    fileName: ''
  });

  const getSafeBlobUrl = (fileUrl: string): string => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('data:')) {
      try {
        const arr = fileUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.warn('Could not create blob URL:', e);
        return fileUrl;
      }
    }
    return fileUrl;
  };

  const handleOpenInNewTab = (fileUrl: string, fileName?: string) => {
    if (!fileUrl) {
      toast.error('No document file attached');
      return;
    }
    const safeUrl = getSafeBlobUrl(fileUrl);
    const win = window.open(safeUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      handleDownloadFile(fileUrl, fileName);
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName?: string) => {
    if (!fileUrl) {
      toast.error('No document file attached');
      return;
    }
    try {
      const safeUrl = getSafeBlobUrl(fileUrl);
      const a = document.createElement('a');
      a.href = safeUrl;
      a.download = fileName || 'submission_document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloading ${fileName || 'document.pdf'}`);
    } catch (e) {
      toast.error('Could not download file');
    }
  };

  const handlePreviewDocument = (fileUrl: string, fileName?: string, title?: string) => {
    if (!fileUrl) {
      toast.error('No document file attached');
      return;
    }
    const safeUrl = getSafeBlobUrl(fileUrl);
    setPreviewModal({
      isOpen: true,
      title: title || fileName || 'Document Preview',
      fileUrl: safeUrl,
      fileName: fileName || 'document.pdf'
    });
  };

  const fetchUserSubmissions = async () => {
    if (!user) return;
    setLoadingSubmissions(true);
    try {
      const email = profile?.email || user.email || '';
      const res = await fetch(`/api/career/resume-review?userId=${user.uid}&email=${encodeURIComponent(email)}`, {
        cache: 'no-store'
      });
      const json = await res.json().catch(() => ({}));
      if (json.data && Array.isArray(json.data)) {
        setMySubmissions(json.data);
      } else if (Array.isArray(json)) {
        setMySubmissions(json);
      }
    } catch (err) {
      console.warn('Error fetching review submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchUserSubmissions();
  }, [user, profile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF document (.pdf)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    setUploadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        fileUrl: reader.result as string,
        fileName: file.name
      }));
      setUploadingFile(false);
      toast.success(`PDF attached: ${file.name}`);
    };
    reader.onerror = () => {
      setUploadingFile(false);
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to submit a review request');
      return;
    }

    if (!formData.targetRole.trim()) {
      toast.error('Please enter your target role or company');
      return;
    }

    if (formData.type !== 'mock' && !formData.fileUrl) {
      toast.error('Please attach a PDF file or provide a document link');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getAuthToken(user);

      const response = await fetch('/api/career/resume-review', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          targetRole: formData.targetRole,
          type: formData.type,
          fileUrl: formData.fileUrl,
          fileName: formData.fileName,
          notes: formData.notes,
          userId: user.uid,
          userName: profile?.fullName || user.displayName || 'Member',
          userEmail: profile?.email || user.email || ''
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Submission failed');
      }

      toast.success('Review request submitted! An industry mentor will evaluate your profile. 🚀');
      setFormData({
        targetRole: '',
        type: 'resume',
        fileUrl: '',
        fileName: '',
        notes: ''
      });

      // Reload submissions and switch to history tab
      await fetchUserSubmissions();
      setActiveTab('history');
    } catch (err: any) {
      console.error('Career review submission error:', err);
      toast.error(err.message || 'Error submitting request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewedCount = mySubmissions.filter(s => s.status === 'Completed' || s.status === 'Approved' || s.mentorFeedback).length;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-8 select-none">
      <div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Career Accelerator
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
            Career Prep & Resume Review
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            Get detailed line-by-line feedback, ATS scoring, and actionable architectural critiques from senior mentors.
          </p>
        </div>

        {/* Action Toggle Pills */}
        <div className="flex items-center p-1 bg-muted/60 rounded-2xl border border-border/60 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'submit'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Submit for Review
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              fetchUserSubmissions();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>My Submissions</span>
            {mySubmissions.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                reviewedCount > 0 ? 'bg-emerald-500 text-zinc-950' : 'bg-muted-foreground/30 text-foreground'
              }`}>
                {mySubmissions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: SUBMIT FORM */}
      {activeTab === 'submit' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="border-b border-border/40 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Submit Materials for Review</h2>
              <p className="text-xs text-muted-foreground">Select review category and attach your resume or portfolio.</p>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-500 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free with ANX Membership</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Review Type
                </label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="resume">Resume & ATS Audit</option>
                  <option value="portfolio">Portfolio & GitHub Review</option>
                  <option value="mock">Mock Technical Interview Prep</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Target Role & Company
                </label>
                <input 
                  required 
                  value={formData.targetRole}
                  onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                  placeholder="e.g. SDE-1 at Razorpay, Frontend Lead at Stripe" 
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {formData.type !== 'mock' && (
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Attach Resume Document (PDF) or Link
                </label>

                {/* Drag & Drop File Box */}
                <div className="border-2 border-dashed border-border/60 hover:border-primary/50 bg-muted/20 rounded-2xl p-6 text-center transition-all">
                  <input 
                    type="file" 
                    id="resumeFile" 
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="resumeFile" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {formData.fileName ? formData.fileName : 'Click to Upload PDF Resume'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">PDF format up to 10MB</span>
                  </label>
                </div>

                {/* Or external URL */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Or Paste Document Link (Google Drive / Dropbox)
                  </label>
                  <input 
                    type="url"
                    value={formData.fileUrl.startsWith('data:') ? '' : formData.fileUrl}
                    onChange={(e) => setFormData({...formData, fileUrl: e.target.value, fileName: 'External Link'})}
                    placeholder="https://drive.google.com/file/d/..." 
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Specific Questions or Notes for Mentors (Optional)
              </label>
              <textarea 
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="e.g. Please evaluate my system design experience bullet points..."
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={submitting || uploadingFile}
                className="px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-fuchsia-600/20 flex items-center gap-2 disabled:opacity-60 border-none"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Review Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit for Mentor Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* TAB 2: MY SUBMISSIONS & REVIEWED FEEDBACK */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Review Pipeline & Mentor Feedback</h2>
              <p className="text-xs text-muted-foreground">Track the status of your submitted profiles and inspect line-by-line mentor scorecards.</p>
            </div>
            <button
              onClick={fetchUserSubmissions}
              disabled={loadingSubmissions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold border border-border text-foreground transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSubmissions ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingSubmissions ? (
            <div className="py-16 text-center text-muted-foreground text-xs flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>Fetching your review requests...</span>
            </div>
          ) : mySubmissions.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-3xl p-12 text-center space-y-4">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No Submissions Yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                You have not submitted any resumes or portfolios for review yet. Submit your first profile to receive senior mentor guidance.
              </p>
              <button
                onClick={() => setActiveTab('submit')}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow transition-all"
              >
                Submit Resume Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {mySubmissions.map((sub) => {
                const isCompleted = sub.status === 'Completed' || sub.status === 'Approved' || Boolean(sub.mentorFeedback);
                const isInReview = sub.status === 'InReview';
                const feedback = sub.mentorFeedback;

                return (
                  <div
                    key={sub.id}
                    className={`bg-card border rounded-3xl p-6 transition-all space-y-5 shadow-sm ${
                      isCompleted 
                        ? 'border-emerald-500/40 ring-1 ring-emerald-500/20 bg-emerald-500/[0.02]' 
                        : isInReview
                        ? 'border-blue-500/30'
                        : 'border-border/60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                          isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-foreground">{sub.targetRole}</h3>
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">({sub.type})</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Submitted on {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div className="self-start sm:self-auto">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Review Completed
                          </span>
                        ) : isInReview ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <Clock className="w-3.5 h-3.5" /> Under Mentor Audit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5" /> Queued for Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body: Candidate Notes & Attached Document */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {sub.notes && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Notes:</span>
                          <p className="text-foreground bg-muted/30 p-3 rounded-xl border border-border/30 italic">
                            "{sub.notes}"
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Submitted Document:</span>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {sub.fileUrl ? (
                            <>
                              <button
                                onClick={() => handlePreviewDocument(sub.fileUrl, sub.fileName, `${sub.targetRole} - Submitted Resume`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs border border-amber-500/20 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview Document</span>
                              </button>
                              <button
                                onClick={() => handleDownloadFile(sub.fileUrl, sub.fileName)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">No file attached</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* MENTOR EVALUATION SCORECARD & FEEDBACK */}
                    {isCompleted && feedback && (
                      <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4 mt-2">
                        <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2.5">
                          <Award className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Mentor Evaluation & Feedback</h4>
                        </div>

                        {/* Metric Score Pills */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl bg-background border border-border/60 text-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Impact Score</span>
                            <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">{feedback.impact || 8} / 10</span>
                          </div>
                          <div className="p-3 rounded-xl bg-background border border-border/60 text-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tech Depth</span>
                            <span className="text-base font-extrabold text-purple-400 mt-0.5 block">{feedback.technicalDepth || 8} / 10</span>
                          </div>
                          <div className="p-3 rounded-xl bg-background border border-border/60 text-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Presentation</span>
                            <span className="text-base font-extrabold text-blue-400 mt-0.5 block">{feedback.presentation || 8} / 10</span>
                          </div>
                        </div>

                        {/* Actionable Feedback Text */}
                        {feedback.comments && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Mentor Actionable Guidance:
                            </span>
                            <div className="p-3.5 rounded-xl bg-background/80 border border-emerald-500/20 text-xs text-foreground leading-relaxed whitespace-pre-line font-medium">
                              {feedback.comments}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Waiting Message if Pending */}
                    {!isCompleted && (
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>A senior mentor has been notified and will review your profile within 24-48 hours. Evaluation feedback will appear here immediately once completed.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* MODAL: DOCUMENT PREVIEW */}
      <AnimatePresence>
        {previewModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-3xl p-5 sm:p-6 max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground truncate max-w-md">{previewModal.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{previewModal.fileName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenInNewTab(previewModal.fileUrl, previewModal.fileName)}
                    className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border flex items-center gap-1.5"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">New Tab</span>
                  </button>
                  <button
                    onClick={() => handleDownloadFile(previewModal.fileUrl, previewModal.fileName)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    title="Download document"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button
                    onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PDF Viewer Body */}
              <div className="flex-1 w-full rounded-2xl border border-border/60 bg-zinc-950 overflow-hidden relative">
                {previewModal.fileUrl ? (
                  <iframe
                    src={previewModal.fileUrl}
                    title={previewModal.title}
                    className="w-full h-full border-0 rounded-2xl bg-white"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                    <span>Unable to load document preview.</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
