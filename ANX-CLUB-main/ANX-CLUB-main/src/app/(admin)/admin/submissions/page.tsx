'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Users, Sparkles, CheckCircle2, Clock, 
  XCircle, ExternalLink, Download, Search, Filter, 
  ArrowRight, MessageSquare, Video, Calendar, AlertCircle,
  Eye, RefreshCw, Send, Check, Award, Edit3, ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { getAuthToken } from '@/lib/auth-helpers'

export default function AdminSubmissionsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'resumes' | 'mentors' | 'incubator'>('resumes')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED' | string>('ALL')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [data, setData] = useState<{
    resumeReviews: any[]
    mentorBookings: any[]
    incubatorProposals: any[]
    summary: {
      totalResumes: number
      pendingResumes: number
      totalMentorBookings: number
      pendingBookings: number
      totalProposals: number
      underReviewProposals: number
    }
  }>({
    resumeReviews: [],
    mentorBookings: [],
    incubatorProposals: [],
    summary: {
      totalResumes: 0,
      pendingResumes: 0,
      totalMentorBookings: 0,
      pendingBookings: 0,
      totalProposals: 0,
      underReviewProposals: 0
    }
  })

  // Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean
    type: 'resume' | 'incubator'
    item: any | null
    comment: string
    impactScore: number
    techScore: number
    presentationScore: number
  }>({
    isOpen: false,
    type: 'resume',
    item: null,
    comment: '',
    impactScore: 8,
    techScore: 8,
    presentationScore: 8
  })

  // Meeting link modal state
  const [meetingModal, setMeetingModal] = useState<{
    isOpen: boolean
    booking: any | null
    link: string
  }>({
    isOpen: false,
    booking: null,
    link: 'https://meet.google.com/anx-mentor-session'
  })

  // Document preview modal state
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    title: string
    fileUrl: string
    fileName: string
  }>({
    isOpen: false,
    title: '',
    fileUrl: '',
    fileName: ''
  })

  const getSafeBlobUrl = (fileUrl: string): string => {
    if (!fileUrl) return ''
    if (fileUrl.startsWith('data:')) {
      try {
        const arr = fileUrl.split(',')
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf'
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        const blob = new Blob([u8arr], { type: mime })
        return URL.createObjectURL(blob)
      } catch (e) {
        console.warn('Could not create blob URL:', e)
        return fileUrl
      }
    }
    return fileUrl
  }

  const handleOpenInNewTab = (fileUrl: string, fileName?: string) => {
    if (!fileUrl) {
      toast.error('No document file attached')
      return
    }
    const safeUrl = getSafeBlobUrl(fileUrl)
    const win = window.open(safeUrl, '_blank', 'noopener,noreferrer')
    if (!win) {
      handleDownloadFile(fileUrl, fileName)
    }
  }

  const handleDownloadFile = (fileUrl: string, fileName?: string) => {
    if (!fileUrl) {
      toast.error('No document file attached')
      return
    }
    try {
      const safeUrl = getSafeBlobUrl(fileUrl)
      const a = document.createElement('a')
      a.href = safeUrl
      a.download = fileName || 'submission_document.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(`Downloading ${fileName || 'document.pdf'}`)
    } catch (e) {
      toast.error('Could not download file')
    }
  }

  const handlePreviewDocument = (fileUrl: string, fileName?: string, title?: string) => {
    if (!fileUrl) {
      toast.error('No document file attached')
      return
    }
    const safeUrl = getSafeBlobUrl(fileUrl)
    setPreviewModal({
      isOpen: true,
      title: title || fileName || 'Document Preview',
      fileUrl: safeUrl,
      fileName: fileName || 'document.pdf'
    })
  }

  const fetchSubmissions = async (showToast = false) => {
    if (showToast) setRefreshing(true)
    try {
      const token = await getAuthToken(user)
      const res = await fetch('/api/v1/admin/submissions', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store'
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.data) {
        setData(json.data)
        if (showToast) toast.success('Submissions refreshed!')
      } else {
        console.warn('Submissions fetch response notice:', json)
      }
    } catch (e) {
      console.warn('Could not load submissions:', e)
      if (showToast) toast.error('Failed to refresh submissions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [user])

  const handleUpdateStatus = async (submissionType: 'resume' | 'mentor' | 'incubator', id: string, status: string, extra: any = {}) => {
    try {
      const token = await getAuthToken(user)
      const res = await fetch('/api/v1/admin/submissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          submissionType,
          id,
          status,
          ...extra
        })
      })

      if (res.ok) {
        toast.success(`Updated status to "${status}" & saved feedback!`)
        // Update local state immediately
        setData(prev => {
          if (submissionType === 'resume') {
            return {
              ...prev,
              resumeReviews: prev.resumeReviews.map(r => r.id === id ? { 
                ...r, 
                status, 
                mentorFeedback: extra.feedback || r.mentorFeedback,
                ...extra 
              } : r)
            }
          } else if (submissionType === 'mentor') {
            return {
              ...prev,
              mentorBookings: prev.mentorBookings.map(b => b.id === id ? { ...b, status, ...extra } : b)
            }
          } else {
            return {
              ...prev,
              incubatorProposals: prev.incubatorProposals.map(p => p.id === id ? { 
                ...p, 
                status, 
                adminFeedback: extra.feedback || p.adminFeedback,
                mentorFeedback: extra.feedback || p.mentorFeedback,
                ...extra 
              } : p)
            }
          }
        })
      } else {
        toast.error('Failed to update status')
      }
    } catch (err) {
      toast.error('Network error')
    }
  }

  // Filtered lists
  const filteredResumes = useMemo(() => {
    return data.resumeReviews.filter(r => {
      const matchesSearch = (r.userName || '').toLowerCase().includes(search.toLowerCase()) ||
                            (r.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
                            (r.targetRole || '').toLowerCase().includes(search.toLowerCase()) ||
                            (r.fileName || '').toLowerCase().includes(search.toLowerCase())
      
      let matchesStatus = true
      if (statusFilter === 'PENDING') {
        matchesStatus = r.status === 'Pending' || r.status === 'InReview'
      } else if (statusFilter === 'REVIEWED') {
        matchesStatus = r.status === 'Completed' || r.status === 'Approved' || Boolean(r.mentorFeedback)
      } else if (statusFilter !== 'ALL') {
        matchesStatus = r.status === statusFilter
      }

      return matchesSearch && matchesStatus
    })
  }, [data.resumeReviews, search, statusFilter])

  const filteredBookings = useMemo(() => {
    return data.mentorBookings.filter(b => {
      const matchesSearch = (b.memberName || '').toLowerCase().includes(search.toLowerCase()) ||
                            (b.mentorName || '').toLowerCase().includes(search.toLowerCase()) ||
                            (b.topic || '').toLowerCase().includes(search.toLowerCase()) ||
                            (b.memberEmail || '').toLowerCase().includes(search.toLowerCase())

      let matchesStatus = true
      if (statusFilter === 'PENDING') {
        matchesStatus = b.status === 'Pending'
      } else if (statusFilter === 'REVIEWED') {
        matchesStatus = b.status === 'Approved' || b.status === 'Completed'
      } else if (statusFilter !== 'ALL') {
        matchesStatus = b.status === statusFilter
      }

      return matchesSearch && matchesStatus
    })
  }, [data.mentorBookings, search, statusFilter])

  const filteredProposals = useMemo(() => {
    return data.incubatorProposals.filter(p => {
      const matchesSearch = (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
                            (p.problemStatement || '').toLowerCase().includes(search.toLowerCase()) ||
                            (p.targetUsers || '').toLowerCase().includes(search.toLowerCase())

      let matchesStatus = true
      if (statusFilter === 'PENDING') {
        matchesStatus = p.status === 'Under Review' || p.status === 'Idea' || p.status === 'Submitted'
      } else if (statusFilter === 'REVIEWED') {
        matchesStatus = p.status === 'Approved' || p.status === 'Funded' || p.status === 'Validated' || p.status === 'Launched' || Boolean(p.adminFeedback || p.mentorFeedback)
      } else if (statusFilter !== 'ALL') {
        matchesStatus = p.status === statusFilter
      }

      return matchesSearch && matchesStatus
    })
  }, [data.incubatorProposals, search, statusFilter])

  const reviewedResumesCount = data.resumeReviews.filter(r => r.status === 'Completed' || r.status === 'Approved' || Boolean(r.mentorFeedback)).length
  const reviewedBookingsCount = data.mentorBookings.filter(b => b.status === 'Approved' || b.status === 'Completed').length
  const reviewedProposalsCount = data.incubatorProposals.filter(p => p.status === 'Approved' || p.status === 'Funded' || p.status === 'Validated' || p.status === 'Launched' || Boolean(p.adminFeedback)).length

  return (
    <div className="space-y-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">User Submissions & Reviews</h1>
          <p className="text-xs text-muted-foreground mt-1">Review student resume submissions, schedule mentor sessions, and evaluate startup pitches.</p>
        </div>
        <button
          onClick={() => fetchSubmissions(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground border border-border/60 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Pipeline
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => { setActiveTab('resumes'); setStatusFilter('ALL'); }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'resumes' 
              ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20 shadow-sm' 
              : 'bg-card border-border/40 hover:border-border/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resume Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-foreground">{data.summary.totalResumes}</h3>
            <div className="flex items-center justify-between text-[11px] font-semibold mt-1">
              <span className="text-amber-500">{data.summary.pendingResumes} pending</span>
              <span className="text-emerald-400">{reviewedResumesCount} reviewed</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => { setActiveTab('mentors'); setStatusFilter('ALL'); }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'mentors' 
              ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20 shadow-sm' 
              : 'bg-card border-border/40 hover:border-border/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mentor Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-foreground">{data.summary.totalMentorBookings}</h3>
            <div className="flex items-center justify-between text-[11px] font-semibold mt-1">
              <span className="text-blue-400">{data.summary.pendingBookings} awaiting</span>
              <span className="text-emerald-400">{reviewedBookingsCount} scheduled</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => { setActiveTab('incubator'); setStatusFilter('ALL'); }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'incubator' 
              ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20 shadow-sm' 
              : 'bg-card border-border/40 hover:border-border/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Incubator Pitches</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-foreground">{data.summary.totalProposals}</h3>
            <div className="flex items-center justify-between text-[11px] font-semibold mt-1">
              <span className="text-purple-400">{data.summary.underReviewProposals} in review</span>
              <span className="text-emerald-400">{reviewedProposalsCount} approved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Quick Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-3.5 rounded-2xl border border-border/50">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Main Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl">
            <button
              onClick={() => setActiveTab('resumes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'resumes' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Resume Reviews ({data.resumeReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('mentors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'mentors' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mentor Bookings ({data.mentorBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('incubator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'incubator' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Incubator Pitches ({data.incubatorProposals.length})
            </button>
          </div>

          {/* Quick Filter: All vs Pending vs Reviewed */}
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/40">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-amber-400/80 hover:text-amber-400'
              }`}
            >
              Pending Action
            </button>
            <button
              onClick={() => setStatusFilter('REVIEWED')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'REVIEWED'
                  ? 'bg-emerald-500 text-zinc-950 shadow-xs'
                  : 'text-emerald-400/80 hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Reviewed Section</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-muted/60 border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground text-xs gap-3">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <span>Loading pipeline submissions...</span>
        </div>
      ) : (
        <div>
          {/* TAB 1: RESUME REVIEWS */}
          {activeTab === 'resumes' && (
            <div className="space-y-4">
              {filteredResumes.length === 0 ? (
                <div className="p-12 text-center bg-card rounded-2xl border border-border/40 text-muted-foreground text-xs space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-muted-foreground/60" />
                  <p>No resume submissions found in this section.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredResumes.map((req) => {
                    const isCompleted = req.status === 'Completed' || req.status === 'Approved' || Boolean(req.mentorFeedback);
                    const feedback = req.mentorFeedback;

                    return (
                      <div 
                        key={req.id}
                        className={`p-5 bg-card border rounded-2xl shadow-sm transition-all space-y-4 ${
                          isCompleted
                            ? 'border-emerald-500/40 bg-emerald-500/[0.02] ring-1 ring-emerald-500/10'
                            : req.status === 'InReview'
                            ? 'border-blue-500/30'
                            : 'border-border/50 hover:border-amber-500/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                              isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-foreground">{req.userName}</h4>
                                <span className="text-xs text-muted-foreground">({req.userEmail})</span>
                              </div>
                              <p className="text-xs font-semibold text-amber-400 mt-0.5">Target: {req.targetRole} • Type: {req.type || 'Resume'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                              isCompleted
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : req.status === 'InReview'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                              {isCompleted ? 'Reviewed & Published' : req.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Candidate Notes</span>
                            <p className="text-zinc-300 bg-muted/40 p-3 rounded-xl border border-border/40 leading-relaxed font-normal">
                              {req.notes || 'No specific notes provided.'}
                            </p>
                          </div>

                          <div className="space-y-1.5 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attached Document</span>
                              <div className="flex items-center gap-2 mt-1">
                                {req.fileUrl ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      onClick={() => handlePreviewDocument(req.fileUrl, req.fileName, `${req.userName}'s Resume`)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-semibold text-xs border border-amber-500/25 transition-colors"
                                      title="Preview Document"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span className="truncate max-w-[160px]">{req.fileName || 'Preview Resume.pdf'}</span>
                                    </button>
                                    <button
                                      onClick={() => handleOpenInNewTab(req.fileUrl, req.fileName)}
                                      className="p-2 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-xs border border-border transition-colors flex items-center gap-1 font-semibold"
                                      title="Open in New Tab"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline text-[11px]">Open</span>
                                    </button>
                                    <button
                                      onClick={() => handleDownloadFile(req.fileUrl, req.fileName)}
                                      className="p-2 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-xs border border-border transition-colors flex items-center gap-1 font-semibold"
                                      title="Download Document"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline text-[11px]">Download</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic">No document file attached</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                              {req.status !== 'InReview' && !isCompleted && (
                                <button
                                  onClick={() => handleUpdateStatus('resume', req.id, 'InReview')}
                                  className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border transition-colors"
                                >
                                  Mark In Review
                                </button>
                              )}
                              <button
                                onClick={() => setFeedbackModal({
                                  isOpen: true,
                                  type: 'resume',
                                  item: req,
                                  comment: feedback?.comments || '',
                                  impactScore: feedback?.impact || 8,
                                  techScore: feedback?.technicalDepth || 8,
                                  presentationScore: feedback?.presentation || 8
                                })}
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                                  isCompleted
                                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-sm'
                                }`}
                              >
                                {isCompleted ? (
                                  <>
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit Evaluation & Feedback</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Complete Review & Feedback</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* MENTOR EVALUATION & SCORECARD DISPLAY (IF REVIEWED) */}
                        {isCompleted && feedback && (
                          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 mt-3">
                            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-emerald-400" />
                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Published Review Scorecard</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">Visible on User Dashboard</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="p-2 rounded-lg bg-background/80 border border-border/50">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Impact</span>
                                <span className="text-sm font-bold text-emerald-400">{feedback.impact || 8} / 10</span>
                              </div>
                              <div className="p-2 rounded-lg bg-background/80 border border-border/50">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Tech Depth</span>
                                <span className="text-sm font-bold text-purple-400">{feedback.technicalDepth || 8} / 10</span>
                              </div>
                              <div className="p-2 rounded-lg bg-background/80 border border-border/50">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Presentation</span>
                                <span className="text-sm font-bold text-blue-400">{feedback.presentation || 8} / 10</span>
                              </div>
                            </div>

                            {feedback.comments && (
                              <div className="text-xs text-foreground bg-background/70 p-3 rounded-lg border border-emerald-500/15 leading-relaxed">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Mentor Feedback Comments:</span>
                                {feedback.comments}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MENTOR BOOKINGS */}
          {activeTab === 'mentors' && (
            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <div className="p-12 text-center bg-card rounded-2xl border border-border/40 text-muted-foreground text-xs space-y-2">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground/60" />
                  <p>No mentor booking requests found in this section.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredBookings.map((b) => (
                    <div 
                      key={b.id}
                      className="p-5 bg-card border border-border/50 rounded-2xl shadow-sm hover:border-blue-500/30 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">{b.memberName}</h4>
                            <span className="text-xs text-muted-foreground">({b.memberEmail})</span>
                          </div>
                          <p className="text-xs font-semibold text-blue-400 mt-0.5">Requested Mentor: {b.mentorName}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            b.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : b.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Scheduled Date & Time
                          </span>
                          <p className="text-foreground font-semibold bg-muted/30 p-2.5 rounded-xl border border-border/30">
                            {b.preferredDate || b.date} @ {b.preferredTime || b.time || '10:00 AM'}
                          </p>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Discussion Topic & Goals
                          </span>
                          <p className="text-zinc-300 bg-muted/30 p-2.5 rounded-xl border border-border/30">
                            {b.topic || b.message || '1-on-1 Mentorship Discussion'}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons & Room Link */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/30 text-xs">
                        <div className="flex items-center gap-2">
                          {b.meetingLink ? (
                            <a
                              href={b.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 font-semibold"
                            >
                              <Video className="w-3.5 h-3.5" /> Room Link: {b.meetingLink}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground italic">No meeting room link assigned yet</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setMeetingModal({
                              isOpen: true,
                              booking: b,
                              link: b.meetingLink || `https://meet.google.com/anx-${b.id}`
                            })}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> {b.meetingLink ? 'Update Room Link' : 'Approve & Issue Link'}
                          </button>
                          {b.status !== 'Rejected' && (
                            <button
                              onClick={() => handleUpdateStatus('mentor', b.id, 'Rejected')}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors"
                            >
                              Reject Request
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INCUBATOR PROPOSALS */}
          {activeTab === 'incubator' && (
            <div className="space-y-4">
              {filteredProposals.length === 0 ? (
                <div className="p-12 text-center bg-card rounded-2xl border border-border/40 text-muted-foreground text-xs space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/60" />
                  <p>No incubator project proposals found in this section.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredProposals.map((p) => {
                    const isApproved = p.status === 'Approved' || p.status === 'Funded' || p.status === 'Validated' || p.status === 'Launched';
                    const feedback = p.adminFeedback || p.mentorFeedback;

                    return (
                      <div 
                        key={p.id}
                        className={`p-5 bg-card border rounded-2xl shadow-sm transition-all space-y-4 ${
                          isApproved
                            ? 'border-purple-500/40 bg-purple-500/[0.02] ring-1 ring-purple-500/10'
                            : 'border-border/50 hover:border-purple-500/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                          <div>
                            <h4 className="text-base font-bold text-foreground">{p.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Target Audience: {p.targetUsers || 'General Developers & Builders'}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={p.status || 'Under Review'}
                              onChange={e => handleUpdateStatus('incubator', p.id, e.target.value)}
                              className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold focus:outline-none"
                            >
                              <option value="Under Review">Under Review</option>
                              <option value="Approved">Approved</option>
                              <option value="Validated">Validated</option>
                              <option value="Funded">Funded</option>
                              <option value="Launched">Launched</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Problem Statement</span>
                            <p className="text-zinc-300 mt-1 leading-relaxed">{p.problemStatement}</p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Proposed Architecture & Solution</span>
                            <p className="text-zinc-300 mt-1 leading-relaxed">{p.proposedSolution}</p>
                          </div>

                          {/* Tech stack badges */}
                          {p.techStack && (
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tech Stack</span>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {(Array.isArray(p.techStack) ? p.techStack : p.techStack.split(',')).map((t: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-zinc-300 border border-border/60">
                                    {t.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* PDF Proposal Download & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/30">
                          {p.pdfUrl || p.proposalPdf ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => handlePreviewDocument(p.pdfUrl || p.proposalPdf, p.pdfFileName, `${p.title} - Proposal`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-semibold text-xs border border-purple-500/25 transition-colors"
                                title="Preview Proposal"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[160px]">{p.pdfFileName || 'Preview Proposal.pdf'}</span>
                              </button>
                              <button
                                onClick={() => handleOpenInNewTab(p.pdfUrl || p.proposalPdf, p.pdfFileName)}
                                className="p-2 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-xs border border-border transition-colors flex items-center gap-1 font-semibold"
                                title="Open in New Tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[11px]">Open</span>
                              </button>
                              <button
                                onClick={() => handleDownloadFile(p.pdfUrl || p.proposalPdf, p.pdfFileName)}
                                className="p-2 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-xs border border-border transition-colors flex items-center gap-1 font-semibold"
                                title="Download Proposal"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[11px]">Download</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No PDF proposal document attached</span>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setFeedbackModal({
                                isOpen: true,
                                type: 'incubator',
                                item: p,
                                comment: feedback?.comments || '',
                                impactScore: feedback?.impact || 9,
                                techScore: feedback?.technicalDepth || 8,
                                presentationScore: feedback?.presentation || 8
                              })}
                              className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{feedback ? 'Edit Pitch Feedback' : 'Add Pitch Feedback'}</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus('incubator', p.id, 'Approved')}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs transition-colors"
                            >
                              Approve
                            </button>
                          </div>
                        </div>

                        {/* Proposal Feedback Display */}
                        {feedback && (
                          <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-2 mt-2">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-purple-400" />
                              <span className="font-bold text-purple-400 uppercase text-[10px]">Incubator Feedback & Architecture Review:</span>
                            </div>
                            <p className="text-zinc-200 leading-relaxed bg-background/60 p-2.5 rounded-lg border border-border/40">
                              {feedback.comments}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: RESUME / INCUBATOR REVIEW FEEDBACK */}
      <AnimatePresence>
        {feedbackModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/70 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-display text-lg font-bold text-foreground">
                  {feedbackModal.type === 'resume' ? 'Evaluate Resume & Publish Feedback' : 'Evaluate Pitch & Publish Guidance'}
                </h3>
                <button onClick={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-semibold text-foreground">Target / Project: {feedbackModal.item?.targetRole || feedbackModal.item?.title}</p>
                  <p className="text-muted-foreground">Candidate / Submitter: {feedbackModal.item?.userName || feedbackModal.item?.submitterId || 'Member'}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Impact (/10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={feedbackModal.impactScore}
                      onChange={e => setFeedbackModal(p => ({ ...p, impactScore: Number(e.target.value) }))}
                      className="w-full p-2 bg-muted rounded-xl border border-border font-bold text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Tech Depth (/10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={feedbackModal.techScore}
                      onChange={e => setFeedbackModal(p => ({ ...p, techScore: Number(e.target.value) }))}
                      className="w-full p-2 bg-muted rounded-xl border border-border font-bold text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Presentation (/10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={feedbackModal.presentationScore}
                      onChange={e => setFeedbackModal(p => ({ ...p, presentationScore: Number(e.target.value) }))}
                      className="w-full p-2 bg-muted rounded-xl border border-border font-bold text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Mentor Actionable Comments & Suggestions</label>
                  <textarea
                    rows={4}
                    placeholder="Provide specific suggestions on system design bullet points, ATS formatting, architecture, and project highlights..."
                    value={feedbackModal.comment}
                    onChange={e => setFeedbackModal(p => ({ ...p, comment: e.target.value }))}
                    className="w-full p-3 bg-muted rounded-xl border border-border text-foreground leading-relaxed focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  onClick={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const statusToSet = feedbackModal.type === 'resume' ? 'Completed' : 'Approved'
                    await handleUpdateStatus(feedbackModal.type, feedbackModal.item.id, statusToSet, {
                      feedback: {
                        impact: feedbackModal.impactScore,
                        technicalDepth: feedbackModal.techScore,
                        presentation: feedbackModal.presentationScore,
                        comments: feedbackModal.comment
                      }
                    })
                    setFeedbackModal(prev => ({ ...prev, isOpen: false }))
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold shadow-sm"
                >
                  Save & Publish Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: MENTOR SESSION MEETING LINK */}
      <AnimatePresence>
        {meetingModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/70 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-display text-base font-bold text-foreground">Approve Session & Assign Room</h3>
                <button onClick={() => setMeetingModal(prev => ({ ...prev, isOpen: false }))} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground">
                  Approving session for <strong className="text-foreground">{meetingModal.booking?.memberName}</strong> with <strong className="text-foreground">{meetingModal.booking?.mentorName}</strong> on {meetingModal.booking?.preferredDate}.
                </p>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Google Meet / Video Room Link</label>
                  <input
                    type="text"
                    value={meetingModal.link}
                    onChange={e => setMeetingModal(p => ({ ...p, link: e.target.value }))}
                    className="w-full p-2.5 bg-muted rounded-xl border border-border text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  onClick={() => setMeetingModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateStatus('mentor', meetingModal.booking.id, 'Approved', {
                      meetingLink: meetingModal.link
                    })
                    setMeetingModal(prev => ({ ...prev, isOpen: false }))
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold"
                >
                  Confirm & Send Approval
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
  )
}
