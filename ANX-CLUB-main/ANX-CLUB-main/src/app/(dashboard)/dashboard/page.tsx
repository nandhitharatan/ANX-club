'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Calendar,
  Users2,
  CreditCard,
  FolderGit2,
  ArrowRight,
  Megaphone,
  Zap,
  BookOpen,
  Clock,
  ChevronRight,
  Bot,
  Map,
  Shield,
  MessageSquare
} from 'lucide-react'
import { MOCK_USER, MOCK_EVENTS, MOCK_ANNOUNCEMENTS, MOCK_RESOURCES, MOCK_MENTORS } from '@/lib/constants'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { getAuthToken } from '@/lib/auth-helpers'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import GamificationWidget from '@/components/dashboard/GamificationWidget'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: 'easeOut' as const },
  }),
}

const activityData = [
  { month: 'Jan', events: 2, sessions: 1 },
  { month: 'Feb', events: 4, sessions: 2 },
  { month: 'Mar', events: 3, sessions: 3 },
  { month: 'Apr', events: 7, sessions: 2 },
  { month: 'May', events: 5, sessions: 4 },
  { month: 'Jun', events: 8, sessions: 5 },
  { month: 'Jul', events: 6, sessions: 3 },
]

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [registeredList, setRegisteredList] = useState<string[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [chartReady, setChartReady] = useState(false)

  useEffect(() => {
    setChartReady(true)
  }, [])

  useEffect(() => {
    const fetchBff = async () => {
      if (!user) return
      try {
        const token = await getAuthToken(user)
        const res = await fetch("/api/v1/module2/dashboard", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (res.ok) {
          const data = await res.json()
          setDashboardData(data)
          if (data.registeredEvents) {
            setRegisteredList(data.registeredEvents.map((e: any) => e.id))
          }
          if (data.upcomingEvents) {
            setEvents(data.upcomingEvents)
          }
        }
      } catch (err) {
        console.warn("Backend not reachable, using mock data.", err)
      }
    }
    if (user && !authLoading) {
      fetchBff()
    }
  }, [user, authLoading])

  const upcomingEvents = events.length > 0 ? events : MOCK_EVENTS;
  const announcements = dashboardData?.announcements || MOCK_ANNOUNCEMENTS;
  const mentorBookings = dashboardData?.mentorBookings || MOCK_MENTORS;
  const projects = dashboardData?.projects || [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-10">
      {/* 1. HERO BANNER */}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={0}
        variants={fadeUp}
        className="relative w-full rounded-3xl overflow-hidden border border-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.15)] bg-[#0d0a1b] min-h-[360px]"
      >
        {/* Space Background Simulation */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0a1b] via-[#1a0b2e] to-[#0d0a1b] z-0" />
        <div className="absolute top-[-50%] left-[20%] w-[800px] h-[800px] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen z-0" />
        <div className="absolute top-[-30%] right-[10%] w-[600px] h-[600px] rounded-full bg-fuchsia-600/20 blur-[100px] mix-blend-screen z-0" />
        {/* Planet Simulation */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.4)] opacity-50 z-0" />
        
        <div className="relative z-10 p-8 flex flex-col h-full justify-between gap-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                {user ? (
                  <>Welcome back, {profile?.fullName ? profile.fullName.split(' ')[0] : (user?.displayName ? user.displayName.split(' ')[0] : 'Member')}! <span className="text-2xl">👋</span></>
                ) : (
                  <>Welcome to A.N.X Ecosystem <span className="text-2xl">🚀</span></>
                )}
              </h1>
              <p className="text-sm md:text-base text-gray-300 mt-2 max-w-lg">
                {user 
                  ? 'Continue your journey of learning, building and growing with A.N.X'
                  : 'Explore events, book sessions with expert mentors, and accelerate your tech career.'}
              </p>
              {!user ? (
                <div className="mt-5 flex gap-3">
                  <Link href="/login" className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                    Sign In
                  </Link>
                  <Link href="/signup" className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-xs font-semibold">
                    Join Free
                  </Link>
                </div>
              ) : (
                <div className="mt-6 p-4 rounded-xl border border-primary/30 bg-black/40 backdrop-blur-md max-w-sm inline-block">
                  <p className="text-sm text-gray-300 italic">
                    "The future depends on what you do today."
                  </p>
                </div>
              )}
            </div>
            
            {/* AI Assistant Widget */}
            <div className="w-80 rounded-2xl border border-fuchsia-500/30 bg-black/50 backdrop-blur-xl p-5 shadow-[0_0_20px_rgba(217,70,239,0.15)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-sm text-white">A.N.X AI Assistant</span>
                </div>
                <Badge variant="primary" className="bg-fuchsia-500 text-white border-none text-[10px] px-2 py-0">BETA</Badge>
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Hello {profile?.fullName ? profile.fullName.split(' ')[0] : (user?.displayName ? user.displayName.split(' ')[0] : 'Member')}! I can help you find events, mentors, roadmaps and more.
              </p>
              <Button onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))} className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white border-none shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                Ask Anything <Zap className="h-3 w-3 ml-2" />
              </Button>
            </div>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-10">
            {[
              { label: 'Events Registered', value: upcomingEvents.length.toString(), inc: '20%', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/20' },
              { label: 'Mentor Sessions', value: mentorBookings.length.toString(), inc: '50%', icon: Users2, color: 'text-blue-400', bg: 'bg-blue-500/20' },
              { label: 'Projects In Progress', value: projects.length.toString(), inc: '25%', icon: FolderGit2, color: 'text-orange-400', bg: 'bg-orange-500/20' },
              { label: 'Community Posts', value: '8', inc: '35%', icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/20' },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-emerald-400">
                  <ArrowRight className="h-3 w-3 -rotate-45" /> {stat.inc} this month
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 2. THREE COLUMN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1 */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card padding="none" className="glass border-white/10 overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-fuchsia-500" /> Upcoming Events
              </h2>
              <Link href="/events" className="text-xs font-medium text-fuchsia-400 hover:text-fuchsia-300">View All →</Link>
            </div>
            <div className="p-3 space-y-2">
              {upcomingEvents.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">No upcoming events</div>
              ) : (
                upcomingEvents.slice(0, 3).map((ev: any) => (
                  <Link href={`/events/${ev.id}`} key={ev.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                    <div className={cn("w-14 h-14 rounded-lg bg-gradient-to-br shrink-0 shadow-lg from-cyan-600 to-blue-600")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{ev.title}</p>
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDate(ev.date)}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1"><Map className="h-3 w-3"/> {ev.venue || 'Online'}</p>
                    </div>
                    <Badge variant="primary" className="border-fuchsia-500/50 text-fuchsia-400 bg-fuchsia-500/10 text-[10px]">Registered</Badge>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* Announcements */}
          <Card padding="none" className="glass border-white/10 overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-fuchsia-500" /> Announcements
              </h2>
              <Link href="/announcements" className="text-xs font-medium text-fuchsia-400 hover:text-fuchsia-300">View All →</Link>
            </div>
            <div className="p-3 space-y-2">
              {announcements.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">No new announcements</div>
              ) : (
                announcements.slice(0, 3).map((ann: any) => (
                  <div key={ann.id} className="p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-3">
                        <Megaphone className="h-5 w-5 mt-0.5 text-orange-400" />
                        <div>
                          <p className="text-sm font-bold text-white">{ann.title}</p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{ann.content}</p>
                          <p className="text-[10px] text-gray-500 mt-2">{formatDate(ann.createdAt || new Date())}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* COLUMN 2 */}
        <div className="space-y-6">
          {/* Gamification Widget */}
          <GamificationWidget 
            xpTotal={profile?.xpTotal || dashboardData?.xpTotal || 1280} 
            leadershipStage={profile?.leadershipStage || 'Core Team'} 
            recentBadges={profile?.recentBadges || [
              { id: '1', name: 'Early Bird', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5978/5978182.png' },
              { id: '2', name: 'Product Builder', iconUrl: 'https://cdn-icons-png.flaticon.com/512/473/473402.png' }
            ]} 
          />

          {/* Learning Progress */}
          <Card padding="none" className="glass border-white/10 overflow-hidden h-fit shadow-xl hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" /> Your Learning Progress
              </h2>
              <Link href="/resources" className="text-xs font-medium text-cyan-400 hover:text-cyan-300">View Roadmaps →</Link>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-6">
                {/* Fake Circle Chart */}
                <div className="w-24 h-24 rounded-full border-[8px] border-[#1e1b4b] relative flex items-center justify-center shrink-0">
                  <div className="absolute inset-[-8px] rounded-full border-[8px] border-cyan-400 border-r-transparent border-b-transparent rotate-45 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">72%</p>
                    <p className="text-[8px] text-gray-400 uppercase">Overall</p>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span>Full Stack Web Development</span>
                    <Badge variant="blue" className="text-[9px] bg-blue-500/20 text-blue-400 border-none">Advanced</Badge>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 w-[72%] shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/10">
                    <div><p className="text-lg font-bold text-white">12</p><p className="text-[10px] text-gray-400">Completed</p></div>
                    <div><p className="text-lg font-bold text-white">4</p><p className="text-[10px] text-gray-400">In Progress</p></div>
                    <div><p className="text-lg font-bold text-white">3</p><p className="text-[10px] text-gray-400">Upcoming</p></div>
                  </div>
                </div>
              </div>

              {/* Weekly Activity Chart Area */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-white">Weekly Activity</h3>
                  <select onChange={(e) => toast.success(`Changed period to ${e.target.value}`)} className="bg-black/50 border border-white/10 text-xs text-gray-300 rounded px-2 py-1 outline-none">
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="All Time">All Time</option>
                  </select>
                </div>
                <div className="h-[120px] w-full mt-2 relative">
                  {chartReady && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={120}>
                      <AreaChart data={activityData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d946ef" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#000', border: '1px solid #333' }} />
                        <Area type="monotone" dataKey="events" stroke="#d946ef" strokeWidth={3} fill="url(#purpleGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card padding="none" className="glass border-white/10 overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-fuchsia-500" /> Recent Activity
              </h2>
              <button onClick={() => toast.success('Activity history coming soon!')} className="text-xs font-medium text-fuchsia-400 hover:text-fuchsia-300">View All →</button>
            </div>
            <div className="p-5 space-y-6">
              {[
                { icon: Calendar, color: 'bg-purple-500', text: 'You registered for AI in Real World - Workshop', time: '2h ago' },
                { icon: Users2, color: 'bg-orange-500', text: 'You booked a session with Rahul Sharma', time: '1d ago' },
                { icon: Zap, color: 'bg-emerald-500', text: 'Your project "AI Chat Assistant" was approved', time: '2d ago' },
                { icon: Shield, color: 'bg-yellow-500', text: 'You earned a new badge "Early Bird"', time: '3d ago' },
              ].map((act, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== 3 && <div className="absolute top-8 left-4 w-px h-8 bg-white/10" />}
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-lg", act.color)}>
                    <act.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-xs text-gray-300">{act.text}</p>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* COLUMN 3 */}
        <div className="space-y-6">
          {/* Upcoming Mentor Sessions */}
          <Card padding="none" className="glass border-white/10 overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-fuchsia-500" /> Upcoming Mentor Sessions
              </h2>
              <Link href="/mentors" className="text-xs font-medium text-fuchsia-400 hover:text-fuchsia-300">View All →</Link>
            </div>
            <div className="p-3 space-y-2">
              {mentorBookings.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">No upcoming sessions</div>
              ) : (
                mentorBookings.slice(0, 3).map((booking: any) => (
                  <div onClick={() => toast.success(`Viewing session with ${booking.mentorName || booking.name}`)} key={booking.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                    <Avatar name={booking.mentorName || booking.name} size="md" className="ring-2 ring-white/10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{booking.mentorName || booking.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">Mentor Session</p>
                      <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDate(booking.scheduledAt || new Date())}</p>
                    </div>
                    <Badge variant="default" className={cn("text-[10px]", booking.status === 'Confirmed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-orange-400 bg-orange-500/10 border-orange-500/30')}>
                      {booking.status || 'Pending'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* AI Recommendations */}
          <Card padding="none" className="border-border/40 bg-gradient-to-br from-[#0f172a] to-[#020617] overflow-hidden relative group">
            <div className="absolute right-[-20%] top-0 w-64 h-full bg-[url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop')] bg-cover opacity-30 mix-blend-screen" />
            <div className="relative z-10 p-5">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-fuchsia-500" /> AI Recommendations
                </h2>
                <Badge className="bg-fuchsia-500 text-white text-[9px] border-none">New</Badge>
              </div>
              <p className="text-sm font-bold text-white mt-4">Personalized Roadmap for You</p>
              <p className="text-xs text-gray-400 mt-2 max-w-[70%] leading-relaxed">
                Based on your skills and interests, our AI recommends this path for your growth.
              </p>
              <Link href="/resources" className="inline-flex items-center justify-center mt-4 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                View Roadmaps →
              </Link>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card padding="none" className="glass border-white/10 overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all">
            <div className="p-5 border-b border-white/10">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-fuchsia-500" /> Quick Actions
              </h2>
            </div>
            <div className="p-5 flex justify-between gap-2">
              {[
                { icon: Calendar, label: 'Browse Events', bg: 'bg-purple-500/20', color: 'text-purple-400', link: '/events' },
                { icon: Users2, label: 'Book Mentor', bg: 'bg-blue-500/20', color: 'text-blue-400', link: '/mentors' },
                { icon: FolderGit2, label: 'Explore Projects', bg: 'bg-orange-500/20', color: 'text-orange-400', link: '#' },
                { icon: Users2, label: 'Join Community', bg: 'bg-emerald-500/20', color: 'text-emerald-400', link: '/community' },
                { icon: MessageSquare, label: 'Start Chat', bg: 'bg-pink-500/20', color: 'text-pink-400', link: '#' },
              ].map((act, i) => (
                <Link href={act.link} onClick={(e) => { if (act.link === '#') { e.preventDefault(); toast.success('Coming soon!'); } }} key={i} className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:-translate-y-1 shadow-lg", act.bg)}>
                    <act.icon className={cn("h-5 w-5", act.color)} />
                  </div>
                  <span className="text-[9px] font-medium text-gray-400 text-center leading-tight w-14 group-hover:text-white transition-colors">{act.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          {/* Refer & Earn Rewards */}
          <Card padding="none" className="glass border-white/10 overflow-hidden relative shadow-xl hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all">
            <div className="p-5 relative z-10 w-2/3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Refer & Earn Rewards 🎁
              </h2>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Invite your friends and earn exclusive rewards and premium benefits.
              </p>
              <Button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${user?.uid}`); toast.success('Referral link copied!') }} className="mt-4 bg-primary text-white border-none text-xs h-8">
                Invite Now
              </Button>
            </div>
            <div className="absolute right-4 bottom-4 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.5)] rotate-12 flex items-center justify-center">
              <span className="text-4xl">🎁</span>
            </div>
          </Card>
        </div>
        
      </div>
    </div>
  )
}
