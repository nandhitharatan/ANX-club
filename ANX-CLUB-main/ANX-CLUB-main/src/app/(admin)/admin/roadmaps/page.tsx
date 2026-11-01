'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Award, Search, Plus, Trash2, BookOpen, Clock, 
  Sparkles, CheckCircle, Upload, ArrowLeft, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { DEFAULT_NATIVE_ROADMAPS } from '@/lib/roadmaps'
import { getAuthToken } from '@/lib/auth-helpers'

export default function AdminManageRoadmapsPage() {
  const { user } = useAuth()
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // New Roadmap Form
  const [newRoadmap, setNewRoadmap] = useState({
    title: '',
    category: 'Full Stack',
    difficulty: 'Intermediate',
    description: '',
    isPremium: false,
    estimatedHours: 80,
    stepsText: '1. Fundamentals & Architecture\n2. Practical Implementation & Core Modules\n3. Advanced Production & Cloud Deploy'
  })

  const fetchRoadmaps = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/roadmaps')
      if (res.ok) {
        const data = await res.json()
        setRoadmaps(Array.isArray(data) && data.length > 0 ? data : DEFAULT_NATIVE_ROADMAPS)
      } else {
        setRoadmaps(DEFAULT_NATIVE_ROADMAPS)
      }
    } catch (err) {
      console.error('Failed to load roadmaps:', err)
      setRoadmaps(DEFAULT_NATIVE_ROADMAPS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoadmaps()
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete roadmap: "${title}"?`)) return

    try {
      const token = await getAuthToken(user)
      const res = await fetch(`/api/roadmaps/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (res.ok) {
        setRoadmaps(prev => prev.filter(r => r.id !== id))
        toast.success('Roadmap deleted from catalog! 🗑️')
      } else {
        toast.error('Failed to delete roadmap.')
      }
    } catch (err) {
      toast.error('Network error deleting roadmap.')
    }
  }

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoadmap.title || !newRoadmap.description) {
      toast.error('Please enter title and description.')
      return
    }

    setCreating(true)
    try {
      const token = await getAuthToken(user)
      const steps = newRoadmap.stepsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .map((stepTitle, idx) => ({
          id: `step-${idx + 1}`,
          title: stepTitle.replace(/^\d+[\.\)]\s*/, ''),
          description: `Key learning targets for ${stepTitle}`
        }))

      const payload = {
        title: newRoadmap.title,
        category: newRoadmap.category,
        difficulty: newRoadmap.difficulty,
        description: newRoadmap.description,
        isPremium: newRoadmap.isPremium,
        estimatedHours: Number(newRoadmap.estimatedHours),
        steps
      }

      const res = await fetch('/api/roadmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create roadmap')
      }

      const result = await res.json()
      toast.success('New learning roadmap published to platform! 🚀')
      setIsCreateModalOpen(false)
      setNewRoadmap({
        title: '',
        category: 'Full Stack',
        difficulty: 'Intermediate',
        description: '',
        isPremium: false,
        estimatedHours: 80,
        stepsText: '1. Fundamentals & Architecture\n2. Practical Implementation & Core Modules\n3. Advanced Production & Cloud Deploy'
      })
      fetchRoadmaps()
    } catch (err: any) {
      toast.error(err.message || 'Error publishing roadmap.')
    } finally {
      setCreating(false)
    }
  }

  const filteredRoadmaps = roadmaps.filter(r => 
    (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.category || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Manage Learning Roadmaps</h1>
          <p className="text-xs text-muted-foreground mt-1">Upload native curriculum roadmaps, configure milestones, and manage premium gating.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRoadmaps}
            disabled={loading}
            className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 shadow shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" /> Upload / Create Roadmap
          </button>
        </div>
      </div>

      {/* Filter */}
      <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
          <input
            type="text"
            placeholder="Search roadmaps by title or tech discipline..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/60 rounded-xl text-xs placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-card transition-all"
          />
        </div>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoadmaps.map((rm) => (
          <div
            key={rm.id}
            className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all group relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {rm.category || 'General'}
                </span>
                <div className="flex items-center gap-1.5">
                  {rm.isPremium ? (
                    <span className="text-[9px] bg-amber-500 text-zinc-950 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Premium
                    </span>
                  ) : (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Free
                    </span>
                  )}
                  {rm.isAiGenerated && (
                    <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-foreground group-hover:text-amber-500 transition-colors">
                  {rm.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {rm.description}
                </p>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold pt-2 border-t border-border/30">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" /> {rm.estimatedHours || 80} Hours
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" /> {rm.steps?.length || 0} Milestones
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/30 flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{rm.difficulty || 'Intermediate'}</span>
              <button
                onClick={() => handleDelete(rm.id, rm.title)}
                className="p-2 rounded-lg border border-border/40 hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 transition-all"
                title="Delete Roadmap"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden z-10 p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">Upload / Create Learning Roadmap</h3>
                  <p className="text-xs text-muted-foreground">Publish a structured curriculum track to the member ecosystem.</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1 bg-muted text-xs font-semibold rounded-lg hover:bg-muted/80"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleCreateRoadmap} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Roadmap Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js & Generative AI Architect"
                    value={newRoadmap.title}
                    onChange={e => setNewRoadmap(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI / ML, Full Stack, DevOps"
                      value={newRoadmap.category}
                      onChange={e => setNewRoadmap(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Difficulty</label>
                    <select
                      value={newRoadmap.difficulty}
                      onChange={e => setNewRoadmap(p => ({ ...p, difficulty: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overview Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Comprehensive description of what members will learn in this track..."
                    value={newRoadmap.description}
                    onChange={e => setNewRoadmap(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Milestones / Steps (1 per line)
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="1. Foundations & Setup&#10;2. Building the Core Platform&#10;3. Cloud Deployment"
                    value={newRoadmap.stepsText}
                    onChange={e => setNewRoadmap(p => ({ ...p, stepsText: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-center justify-between bg-muted/20 border border-border/40 p-3 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-foreground block">Premium Membership Gated?</span>
                    <span className="text-[10px] text-muted-foreground">Only accessible to active premium subscribers.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewRoadmap(p => ({ ...p, isPremium: !p.isPremium }))}
                    className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-all ${
                      newRoadmap.isPremium ? 'bg-amber-500' : 'bg-zinc-600'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-full bg-white transition-transform" 
                      style={{ transform: newRoadmap.isPremium ? 'translateX(20px)' : 'translateX(0px)' }}
                    />
                  </button>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 border border-border rounded-xl text-xs font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow shadow-amber-500/10 flex items-center gap-1.5"
                  >
                    {creating ? (
                      <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Publish Roadmap
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
