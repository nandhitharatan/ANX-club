'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, SlidersHorizontal, BookOpen, Video, 
  FileText, Download, Play, Compass, Award, 
  Eye, CheckCircle, Map, ArrowRight, Check, Sparkles,
  X, Clock, Cpu, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase/client'
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { DEFAULT_NATIVE_ROADMAPS, Roadmap } from '@/lib/roadmaps'
import { getAuthToken } from '@/lib/auth-helpers'

import { PremiumGateModal } from '@/components/common/PremiumGateModal'

const levels = ['all', 'Beginner', 'Intermediate', 'Advanced']
const categories = ['all', 'Full Stack', 'AI / ML', 'DevOps', 'Security', 'Design', 'Mobile']

export default function ResourcesPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'roadmaps' | 'resources'>('roadmaps')
  const [resources, setResources] = useState<any[]>([])
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>(DEFAULT_NATIVE_ROADMAPS)
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true)
  const [loadingResources, setLoadingResources] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [roadmapProgress, setRoadmapProgress] = useState<Record<string, string[]>>({})

  // Modal states
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiDifficulty, setAiDifficulty] = useState('Intermediate')
  const [aiTimeframe, setAiTimeframe] = useState('3 Months')
  const [generatingAi, setGeneratingAi] = useState(false)

  // Premium Gate Modal
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [premiumModalDetail, setPremiumModalDetail] = useState<{ title: string; desc: string }>({
    title: 'Unlock ANX Premium Elite Tracks',
    desc: 'Access verified production curriculum tracks, advanced milestones, and exclusive masterclasses.'
  })

  // Fetch Roadmaps from Firestore API
  const fetchRoadmaps = async () => {
    try {
      const res = await fetch('/api/roadmaps')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setRoadmaps(data)
        }
      }
    } catch (err) {
      console.warn('Using default roadmaps:', err)
    } finally {
      setLoadingRoadmaps(false)
    }
  }

  useEffect(() => {
    fetchRoadmaps()
  }, [])

  // User roadmap progress loader
  useEffect(() => {
    const loadProgress = async () => {
      if (!profile?.uid) return
      try {
        const token = await getAuthToken(user)
        const res = await fetch(`/api/roadmaps/progress?userId=${profile.uid}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (res.ok) {
          const data = await res.json()
          if (data.progress) {
            setRoadmapProgress(data.progress)
          }
        }
      } catch (e) {
        console.warn('Could not fetch roadmap progress from server:', e)
      }
    }
    loadProgress()
  }, [profile, user])

  const toggleStep = async (roadmapId: string, stepId: string) => {
    if (!profile?.uid && !user?.uid) {
      toast.error('Please log in to track progress')
      return
    }
    const currentUid = profile?.uid || user?.uid
    const currentSteps = roadmapProgress[roadmapId] || []
    const isCompleted = currentSteps.includes(stepId)
    const newSteps = isCompleted 
      ? currentSteps.filter(id => id !== stepId)
      : [...currentSteps, stepId]
    
    // Optimistic UI update
    setRoadmapProgress(prev => ({ ...prev, [roadmapId]: newSteps }))
    
    try {
      const token = await getAuthToken(user)
      const res = await fetch('/api/roadmaps/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: currentUid,
          roadmapId,
          completedStepIds: newSteps
        })
      })

      if (res.ok) {
        const resData = await res.json()
        if (resData.xpAwarded > 0) {
          toast.success('🎉 Roadmap fully completed! +40 XP awarded.')
        }
      }
    } catch (err) {
      console.warn('Roadmap progress sync error:', err)
    }
  }

  // Fetch Resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch('/api/v1/resources')
        if (res.ok) {
          const data = await res.json()
          setResources(Array.isArray(data) && data.length > 0 ? data : [])
        }
      } catch (err) {
        console.error('Failed to load resources:', err)
      } finally {
        setLoadingResources(false)
      }
    }
    fetchResources()
  }, [])

  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      const matchesSearch = res.title.toLowerCase().includes(search.toLowerCase()) || 
                            res.category.toLowerCase().includes(search.toLowerCase())
      
      const matchesLevel = selectedLevel === 'all' || res.level === selectedLevel
      const matchesCategory = selectedCategory === 'all' || res.category.toLowerCase() === selectedCategory.toLowerCase()

      return matchesSearch && matchesLevel && matchesCategory
    })
  }, [search, selectedLevel, selectedCategory, resources])

  const filteredRoadmaps = useMemo(() => {
    return roadmaps.filter(rm => {
      const matchesSearch = rm.title.toLowerCase().includes(search.toLowerCase()) || 
                            rm.description.toLowerCase().includes(search.toLowerCase()) ||
                            rm.category.toLowerCase().includes(search.toLowerCase())
      return matchesSearch
    })
  }, [search, roadmaps])

  const handleOpenRoadmap = (roadmap: Roadmap) => {
    if (roadmap.isPremium) {
      const isUserPremium = profile?.role === 'Premium Member' || profile?.role === 'Admin' || profile?.membershipType === 'premium'
      if (!isUserPremium) {
        setPremiumModalDetail({
          title: `Unlock "${roadmap.title}" Track`,
          desc: `This production-ready roadmap and its source code milestones are exclusive to ANX Premium members.`
        })
        setIsPremiumModalOpen(true)
        return
      }
    }
    setSelectedRoadmap(roadmap)
  }

  const handleOpenAiModal = () => {
    const isUserPremium = profile?.role === 'Premium Member' || profile?.role === 'Admin' || profile?.membershipType === 'premium'
    if (!isUserPremium) {
      setPremiumModalDetail({
        title: 'Unlock AI Roadmap Generator ⚡',
        desc: 'Generate custom AI-powered milestone learning paths tailored for any role, discipline, or engineering domain.'
      })
      setIsPremiumModalOpen(true)
      return
    }
    setIsAiModalOpen(true)
  }

  const handleGenerateAiRoadmap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiTopic.trim()) {
      toast.error('Please enter a role or topic.')
      return
    }

    const isUserPremium = profile?.role === 'Premium Member' || profile?.role === 'Admin' || profile?.membershipType === 'premium'
    if (!isUserPremium) {
      setPremiumModalDetail({
        title: 'Unlock AI Roadmap Generator ⚡',
        desc: 'Generate custom AI-powered milestone learning paths tailored for any role, discipline, or engineering domain.'
      })
      setIsPremiumModalOpen(true)
      return
    }

    setGeneratingAi(true)
    try {
      const token = await getAuthToken(user)
      const res = await fetch('/api/roadmaps/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          topic: aiTopic,
          difficulty: aiDifficulty,
          timeframe: aiTimeframe
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to generate AI roadmap')
      }

      const resData = await res.json()
      toast.success('AI Roadmap Generated & Added to Your Catalog! 🚀')
      setIsAiModalOpen(false)
      setAiTopic('')
      await fetchRoadmaps()
      if (resData.data) {
        setSelectedRoadmap(resData.data)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error generating roadmap')
    } finally {
      setGeneratingAi(false)
    }
  }

  return (
    <div className="space-y-8 select-none">
      {/* Premium Gate Modal */}
      <PremiumGateModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        title={premiumModalDetail.title}
        description={premiumModalDetail.desc}
      />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Learning Tracks & Resources</h1>
          <p className="text-xs text-muted-foreground mt-1">Accelerate your technical mastery with structured curriculum tracks and curated masterclasses.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Generator Button for Premium */}
          <button
            onClick={handleOpenAiModal}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold rounded-2xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/20 shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-current" /> Generate AI Roadmap ⚡
          </button>

          {/* Tab Switcher */}
          <div className="flex bg-black/40 border border-white/10 p-1 rounded-2xl w-fit shrink-0">
            <button
              onClick={() => setActiveTab('roadmaps')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'roadmaps'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Roadmaps ({roadmaps.length})
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'resources'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Resources ({resources.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <section className="glass rounded-2xl p-4 shadow-xl">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search tracks, languages, or skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-white shadow-inner"
          />
        </div>
      </section>

      {activeTab === 'roadmaps' ? (
        /* NATIVE ROADMAPS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoadmaps.map((roadmap) => {
            const completedSteps = roadmapProgress[roadmap.id] || []
            const completedCount = completedSteps.length
            const totalSteps = roadmap.steps?.length || 0
            const pct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0
            const roadmapImage = roadmap.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop'

            return (
              <div
                key={roadmap.id}
                className="glass border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-fuchsia-500/40 transition-all hover:shadow-[0_0_25px_rgba(217,70,239,0.15)] group relative bg-zinc-950/80"
              >
                <div>
                  {/* Top Image Banner */}
                  <div className="relative h-44 w-full bg-zinc-900 overflow-hidden cursor-pointer" onClick={() => handleOpenRoadmap(roadmap)}>
                    <img 
                      src={roadmapImage} 
                      alt={roadmap.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-bold text-fuchsia-400 uppercase tracking-wider">
                        {roadmap.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-bold text-gray-300 uppercase">
                        {roadmap.difficulty}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {roadmap.isPremium ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider shadow">
                          <Award className="w-3 h-3" /> Premium
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                          Free
                        </span>
                      )}
                      {roadmap.isAiGenerated && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-500 text-white text-[9px] font-bold uppercase shadow">
                          <Sparkles className="w-2.5 h-2.5" /> AI
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-display font-bold text-base text-white group-hover:text-fuchsia-400 transition-colors drop-shadow">
                        {roadmap.title}
                      </h3>
                    </div>
                  </div>

                  {/* Milestones Checkbox List */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-300 border-b border-white/5 pb-2">
                      <span className="flex items-center gap-1.5 text-fuchsia-400">
                        <CheckCircle className="w-4 h-4" /> Track Progress
                      </span>
                      <span className="font-mono text-[11px] text-gray-400">
                        {completedCount}/{totalSteps} ({pct}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Checklist */}
                    <div className="space-y-2 pt-1">
                      {roadmap.steps?.slice(0, 4).map((step, idx) => {
                        const isDone = completedSteps.includes(step.id)
                        return (
                          <div
                            key={step.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStep(roadmap.id, step.id)
                            }}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-zinc-900/50 border-white/5 hover:border-white/20 text-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md flex shrink-0 items-center justify-center border transition-all ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-zinc-950 font-bold'
                                : 'border-gray-500 bg-zinc-900 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-emerald-400/80' : ''}`}>
                              {step.title}
                            </span>
                          </div>
                        )
                      })}

                      {totalSteps > 4 && (
                        <p className="text-[11px] text-gray-500 text-center pt-1 font-medium">
                          +{totalSteps - 4} more milestones in full view
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleOpenRoadmap(roadmap)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border-none ${
                      roadmap.isPremium
                        ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                    }`}
                  >
                    <span>Open Roadmap View</span> <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* RESOURCE LIBRARY VIEW */
        <AnimatePresence mode="wait">
          {filteredResources.length > 0 ? (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredResources.map((res) => {
                const isVideo = res.type?.toLowerCase() === 'video' || res.type?.toLowerCase() === 'workshop'
                
                return (
                  <div
                    key={res.id}
                    className="glass border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-primary/30 transition-all hover:shadow-[0_0_20px_rgba(217,70,239,0.15)] group relative"
                  >
                    <div className="relative h-44 w-full bg-muted overflow-hidden">
                      <img
                        src={res.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'}
                        alt={res.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      <div className="absolute top-3.5 left-3.5 flex gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] text-white font-bold uppercase tracking-wider">
                          {res.category}
                        </span>
                      </div>

                      <div className="absolute top-3.5 right-3.5">
                        {res.isPremium ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-500 text-zinc-950 text-[9px] font-bold uppercase tracking-wider shadow">
                            <Award className="w-2.5 h-2.5" /> Premium
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider shadow">
                            Free
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4 relative z-10">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{res.level || 'All Levels'}</span>
                        <h3 className="font-display font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {res.title}
                        </h3>
                      </div>

                      <button
                        onClick={() => {
                          if (res.isPremium && profile?.role !== 'Premium Member' && profile?.role !== 'Admin') {
                            setPremiumModalDetail({
                              title: `Unlock "${res.title}"`,
                              desc: `This masterclass and resource material is exclusively available to ANX Premium members.`
                            })
                            setIsPremiumModalOpen(true)
                            return
                          }
                          if (res.url && res.url !== '#') window.open(res.url, '_blank')
                          else toast.success(`Opened material: ${res.title}`)
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
                      >
                        {isVideo ? <Play className="w-3.5 h-3.5 fill-current" /> : <Download className="w-3.5 h-3.5" />}
                        <span>Access Material</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </motion.section>
          ) : (
            <div className="glass border border-white/10 rounded-2xl p-12 text-center shadow-xl space-y-3 max-w-sm mx-auto">
              <Compass className="w-10 h-10 text-muted-foreground/80 mx-auto animate-pulse" />
              <h3 className="font-display text-sm font-bold text-foreground">No resources match query</h3>
            </div>
          )}
        </AnimatePresence>
      )}

      {/* ROADMAP DETAIL MODAL */}
      <AnimatePresence>
        {selectedRoadmap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRoadmap(null)}
              className="fixed inset-0 bg-black backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-3xl shadow-2xl relative overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Image banner at the top of modal */}
              <div className="relative h-48 md:h-60 w-full shrink-0 bg-zinc-900 overflow-hidden">
                <img 
                  src={selectedRoadmap.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop'} 
                  alt={selectedRoadmap.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                
                <button
                  onClick={() => setSelectedRoadmap(null)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 backdrop-blur-md text-gray-300 hover:text-white border border-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-6 right-6 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider bg-fuchsia-500/20 px-2 py-0.5 rounded border border-fuchsia-500/30">
                      {selectedRoadmap.category}
                    </span>
                    <span className="text-[10px] font-bold text-gray-300 uppercase bg-black/40 px-2 py-0.5 rounded border border-white/10">
                      {selectedRoadmap.difficulty}
                    </span>
                  </div>
                  <h2 className="font-display text-xl md:text-2xl font-bold text-white drop-shadow-md">
                    {selectedRoadmap.title}
                  </h2>
                </div>
              </div>

              {/* Milestones Checklist Content */}
              <div className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300 pb-2 border-b border-white/10">
                  <span className="flex items-center gap-1.5 text-fuchsia-400">
                    <CheckCircle className="w-4 h-4" /> Interactive Milestone Tracker
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {(roadmapProgress[selectedRoadmap.id] || []).length} / {selectedRoadmap.steps?.length || 0} Completed
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedRoadmap.steps?.map((step, idx) => {
                    const isDone = (roadmapProgress[selectedRoadmap.id] || []).includes(step.id)

                    return (
                      <div
                        key={step.id}
                        onClick={() => toggleStep(selectedRoadmap.id, step.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                          isDone 
                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                            : 'bg-zinc-900/60 border-white/10 hover:border-fuchsia-500/40 hover:bg-zinc-900'
                        }`}
                      >
                        <div className={`mt-0.5 w-6 h-6 rounded-lg flex shrink-0 items-center justify-center border transition-all ${
                          isDone 
                            ? 'bg-emerald-500 border-emerald-500 text-zinc-950 font-bold' 
                            : 'border-gray-500 bg-zinc-900 text-gray-400'
                        }`}>
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-[10px] font-mono">{idx + 1}</span>}
                        </div>

                        <div className="flex-1 space-y-1">
                          <h4 className={`text-sm font-bold transition-colors ${
                            isDone ? 'text-emerald-400 line-through' : 'text-white'
                          }`}>
                            {step.title}
                          </h4>
                          {step.description && (
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI ROADMAP GENERATOR MODAL */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => !generatingAi && setIsAiModalOpen(false)}
              className="fixed inset-0 bg-black backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden z-10 p-6 md:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">AI Roadmap Generator ⚡</h3>
                    <p className="text-xs text-amber-500 font-semibold uppercase tracking-wider">Premium Member Feature</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  disabled={generatingAi}
                  className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGenerateAiRoadmap} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Role / Technology / Discipline
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LLM Agent Architect, Rust Game Engine Developer, Kubernetes SRE..."
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Difficulty Level</label>
                    <select
                      value={aiDifficulty}
                      onChange={e => setAiDifficulty(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    >
                      <option value="Beginner">Beginner (Zero to Foundational)</option>
                      <option value="Intermediate">Intermediate (Practitioner)</option>
                      <option value="Advanced">Advanced (Production Architect)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Learning Timeline</label>
                    <select
                      value={aiTimeframe}
                      onChange={e => setAiTimeframe(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                    >
                      <option value="1 Month">1 Month Sprint</option>
                      <option value="3 Months">3 Months Intensive</option>
                      <option value="6 Months">6 Months Comprehensive</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-muted-foreground space-y-1">
                  <span className="font-bold text-amber-500 block">AI Engine Integration (Ollama API Ready)</span>
                  <span>Synthesizes an industry-aligned milestone plan with foundational steps, architecture modules, and production delivery targets.</span>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    disabled={generatingAi}
                    className="px-4 py-2.5 border border-border rounded-xl text-xs font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generatingAi}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow shadow-amber-500/20 flex items-center gap-1.5"
                  >
                    {generatingAi ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                        <span>Synthesizing Curriculum...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>Generate & Publish Track</span>
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
