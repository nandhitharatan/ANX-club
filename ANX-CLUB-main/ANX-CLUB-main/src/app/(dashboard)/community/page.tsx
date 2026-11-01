'use client'
import React, { useState, useEffect, useDeferredValue } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Heart, Share2, Plus, Sparkles, Send } from 'lucide-react'
import { communityApi } from '@/lib/api'
import { useAuth } from '@/modules/module3/components/AuthContext'
import toast from 'react-hot-toast'
import { MOCK_USER } from '@/lib/constants'

export default function CommunityPage() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const deferredNewPost = useDeferredValue(newPost)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})

  const handleLike = (id: any) => {
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p))
  }

  const handleShare = async (id: any) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/community?post=${id}`)
      toast.success('Link copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const toggleComments = (id: any) => {
    setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }))
  }

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await communityApi.list()
        if (res.data) setPosts(res.data)
      } catch (err) {
        console.warn('API for community failed. Using mock data.', err)
        setPosts([
          {
            id: 1,
            authorName: 'Arjun Sharma',
            authorRole: 'SDE-1 @ Vercel',
            avatar: 'https://i.pravatar.cc/150?img=11',
            content: 'Just successfully deployed our new edge rendering architecture! Let me know if anyone wants a breakdown of how we utilized Next.js 14 server actions. 🚀',
            likes: 124,
            comments: 18,
            timestamp: '2 hours ago',
          },
          {
            id: 2,
            authorName: 'Priya Patel',
            authorRole: 'Product Designer',
            avatar: 'https://i.pravatar.cc/150?img=5',
            content: 'Anyone attending the A.N.X UI/UX workshop this weekend? I am looking for a partner to build out the hackathon project together!',
            likes: 45,
            comments: 12,
            timestamp: '5 hours ago',
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const handlePost = async () => {
    if (!newPost.trim()) return
    if (!user) {
      toast.error('Please sign in to post')
      return
    }

    try {
      // Optimistic update
      const postObj = {
        id: Date.now(),
        authorName: profile?.fullName || 'Anonymous User',
        author: profile?.fullName || user?.displayName || 'A.N.X Member',
        avatar: user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user?.displayName || 'User')}&background=8b5cf6&color=fff`,
        content: newPost,
        likes: 0,
        comments: 0,
        timestamp: 'Just now'
      }
      setPosts([postObj, ...posts])
      setNewPost('')
      toast.success('Posted successfully!')
      
      await communityApi.create({ 
        content: newPost, 
        authorId: user.uid, 
        authorName: profile?.fullName || 'Anonymous User',
        title: 'New Post',
        type: 'post'
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to publish post.')
    }
  }

  return (
    <div className="space-y-8 select-none max-w-4xl mx-auto">
      {/* Header section */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Community Hub</h1>
        <p className="text-xs text-muted-foreground mt-1">Connect, share ideas, and collaborate with ecosystem members.</p>
      </div>

      {/* Create Post Input */}
      <section className="glass rounded-3xl p-5 shadow-xl flex gap-4 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-2xl rounded-full pointer-events-none" />
        <img
          src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user?.displayName || 'User')}&background=8b5cf6&color=fff`}
          alt={profile?.fullName || user?.displayName || 'Avatar'}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0 relative z-10"
        />
        <div className="flex-1 space-y-3 relative z-10">
          <textarea
            rows={3}
            placeholder="What are you building today? Share your thoughts..."
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 resize-none shadow-inner"
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-fuchsia-400 flex items-center gap-1 transition-colors cursor-default">
              <Sparkles className="w-3.5 h-3.5" /> Markdown Supported
            </span>
            <button
              onClick={handlePost}
              disabled={!newPost.trim()}
              className="px-5 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(217,70,239,0.4)] flex items-center gap-2 border-none"
            >
              Post <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Feed */}
      <div className="space-y-6">
        <AnimatePresence>
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass rounded-3xl p-6 shadow-xl hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all border border-white/10"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img src={post.avatar} alt={post.authorName} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-sm text-white">{post.authorName}</h4>
                    <p className="text-[10px] text-fuchsia-400 font-semibold">{post.authorRole}</p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{post.timestamp}</span>
              </div>
              
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                {post.content}
              </p>

              <div className="flex items-center gap-6 border-t border-white/10 pt-4">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 text-muted-foreground hover:text-fuchsia-400 transition-colors text-xs font-semibold group">
                  <Heart className="w-4 h-4 group-hover:fill-fuchsia-400" /> {post.likes}
                </button>
                <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-xs font-semibold">
                  <MessageSquare className="w-4 h-4" /> {post.comments} Comments
                </button>
                <button onClick={() => handleShare(post.id)} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-xs font-semibold ml-auto">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
              {expandedComments[post.id] && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-muted-foreground italic">Comments section coming soon...</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
