'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Medal, Award, Flame, Star, Sparkles, 
  Search, Users, Calendar, BookOpen, ChevronUp, 
  TrendingUp, Shield, Zap, RefreshCw
} from 'lucide-react'
import { useAuth } from '@/modules/module3/components/AuthContext'
import { getAuthToken } from '@/lib/auth-helpers'

export default function LeaderboardPage() {
  const { user, profile } = useAuth()
  const [period, setPeriod] = useState<'all_time' | 'monthly' | 'weekly'>('all_time')
  const [search, setSearch] = useState('')
  const [leaderboardData, setLeaderboardData] = useState<any>({
    podium: [],
    rankings: [],
    currentUserRank: null,
  })
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const token = await getAuthToken(user)
      const currentUid = profile?.uid || user?.uid || ''
      const res = await fetch(`/api/v1/leaderboard?period=${period}${currentUid ? `&userId=${currentUid}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setLeaderboardData(data)
      }
    } catch (err) {
      console.warn('Leaderboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [period, user, profile])

  const filteredRankings = useMemo(() => {
    if (!leaderboardData?.rankings) return []
    if (!search.trim()) return leaderboardData.rankings
    return leaderboardData.rankings.filter((r: any) => 
      (r.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.stage || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.badge || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [leaderboardData, search])

  const podium = leaderboardData?.podium || []
  const firstPlace = podium[0]
  const secondPlace = podium[1]
  const thirdPlace = podium[2]

  const userRank = leaderboardData?.currentUserRank || (
    profile?.uid 
      ? {
          rank: 12,
          fullName: profile.fullName || user?.displayName || 'You',
          xp: profile.xpTotal || 140,
          stage: profile.leadershipStage || 'Associate',
          badge: 'Rising Star'
        }
      : null
  )

  return (
    <div className="space-y-8 select-none">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Global XP Rankings
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Community Leaderboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Earn XP by completing roadmaps (+40 XP), attending events (+50 XP), booking mentorships (+40 XP), and shipping ideas.
          </p>
        </div>

        {/* Timeframe Filters */}
        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 border border-white/10 p-1 rounded-2xl w-fit shrink-0">
            {(['all_time', 'monthly', 'weekly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                  period === p
                    ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {p.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Your Standing Banner */}
      {user && userRank && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-purple-950/60 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-[2px] shadow-lg shrink-0">
              <img
                src={userRank.avatar || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userRank.fullName || 'User')}&background=8b5cf6&color=fff`}
                alt="Your Avatar"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{userRank.fullName} (You)</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                  {userRank.stage || 'Associate'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Current Rank: <strong className="text-amber-400 font-bold">#{userRank.rank}</strong> • Total XP: <strong className="text-emerald-400 font-bold">{userRank.xp} XP</strong>
              </p>
            </div>
          </div>

          {/* XP Progress Bar towards next tier */}
          <div className="w-full md:w-80 space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-300">
              <span>Leadership Progress</span>
              <span className="text-purple-300">Next Tier: {userRank.xp >= 3000 ? 'Max Level' : 'Director (+3000 XP)'}</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(15, (userRank.xp / 3000) * 100))}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Podium Showcase (Top 3) */}
      {podium.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
          {/* 2nd Place Podium */}
          {secondPlace && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass border border-slate-400/30 rounded-3xl p-6 text-center relative overflow-hidden bg-slate-900/60 shadow-[0_0_25px_rgba(148,163,184,0.15)] flex flex-col items-center justify-between min-h-[300px]"
            >
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-xl bg-slate-400/20 text-slate-300 font-bold text-xs border border-slate-400/30">
                  🥈 2nd Place
                </span>
              </div>

              <div className="relative mt-6 mb-3">
                <img
                  src={secondPlace.avatar}
                  alt={secondPlace.fullName}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-400/50 shadow-xl"
                />
                <span className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-300 text-slate-900 rounded-full font-extrabold text-xs flex items-center justify-center shadow">
                  2
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-white text-base truncate">{secondPlace.fullName}</h3>
                <span className="text-[11px] font-semibold text-slate-400 block">{secondPlace.stage}</span>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 w-full">
                <span className="text-xl font-black text-slate-200">{secondPlace.xp}</span>
                <span className="text-xs text-slate-400 font-bold ml-1">XP</span>
              </div>
            </motion.div>
          )}

          {/* 1st Place Podium (Grand Winner) */}
          {firstPlace && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass border-2 border-amber-500/60 rounded-3xl p-7 text-center relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950 shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col items-center justify-between min-h-[340px] md:-translate-y-4"
            >
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center gap-1 shadow">
                  👑 1st Champion
                </span>
              </div>

              <div className="relative mt-6 mb-3">
                <img
                  src={firstPlace.avatar}
                  alt={firstPlace.fullName}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                />
                <span className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-400 text-zinc-950 rounded-full font-black text-sm flex items-center justify-center shadow-lg">
                  1
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-lg truncate">{firstPlace.fullName}</h3>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">{firstPlace.stage}</span>
              </div>

              <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 w-full">
                <span className="text-2xl font-black text-amber-300">{firstPlace.xp}</span>
                <span className="text-xs text-amber-400 font-bold ml-1">XP EARNED</span>
              </div>
            </motion.div>
          )}

          {/* 3rd Place Podium */}
          {thirdPlace && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass border border-amber-700/40 rounded-3xl p-6 text-center relative overflow-hidden bg-slate-900/60 shadow-[0_0_25px_rgba(180,83,9,0.15)] flex flex-col items-center justify-between min-h-[290px]"
            >
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-xl bg-amber-800/20 text-amber-400 font-bold text-xs border border-amber-800/30">
                  🥉 3rd Place
                </span>
              </div>

              <div className="relative mt-6 mb-3">
                <img
                  src={thirdPlace.avatar}
                  alt={thirdPlace.fullName}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-amber-700/60 shadow-xl"
                />
                <span className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-600 text-white rounded-full font-extrabold text-xs flex items-center justify-center shadow">
                  3
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-white text-base truncate">{thirdPlace.fullName}</h3>
                <span className="text-[11px] font-semibold text-amber-400/80 block">{thirdPlace.stage}</span>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 w-full">
                <span className="text-xl font-black text-amber-200">{thirdPlace.xp}</span>
                <span className="text-xs text-slate-400 font-bold ml-1">XP</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Full Leaderboard Table Section */}
      <section className="glass rounded-3xl p-6 shadow-xl space-y-5 bg-zinc-950/80 border border-white/10">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Full Global Standings</h2>
            <span className="text-xs text-slate-400 font-medium">({filteredRankings.length} Members)</span>
          </div>

          <div className="relative w-full md:max-w-xs group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by member name or tier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all text-white"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Leadership Stage</th>
                <th className="py-3 px-4 hidden sm:table-cell">Events</th>
                <th className="py-3 px-4 hidden sm:table-cell">Mentorships</th>
                <th className="py-3 px-4 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRankings.map((userItem: any) => {
                const isTop3 = userItem.rank <= 3
                const isCurrent = user && (userItem.userId === user.uid || userItem.userId === profile?.uid)

                return (
                  <tr
                    key={userItem.userId || userItem.rank}
                    className={`transition-colors hover:bg-white/[0.04] ${
                      isCurrent ? 'bg-purple-600/10 border-l-2 border-purple-500' : ''
                    }`}
                  >
                    {/* Rank Column */}
                    <td className="py-3.5 px-4 font-bold">
                      {userItem.rank === 1 ? (
                        <span className="text-base">🥇</span>
                      ) : userItem.rank === 2 ? (
                        <span className="text-base">🥈</span>
                      ) : userItem.rank === 3 ? (
                        <span className="text-base">🥉</span>
                      ) : (
                        <span className="text-slate-400 font-mono">#{userItem.rank}</span>
                      )}
                    </td>

                    {/* Member Details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={userItem.avatar}
                          alt={userItem.fullName}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className={`font-bold block truncate ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                            {userItem.fullName} {isCurrent && '(You)'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {userItem.badge || 'Contributor'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Leadership Stage */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        userItem.stage === 'Director'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : userItem.stage === 'Core Team'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : userItem.stage === 'Dept Head'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-white/5 text-slate-300 border-white/10'
                      }`}>
                        {userItem.stage || 'Associate'}
                      </span>
                    </td>

                    {/* Events */}
                    <td className="py-3.5 px-4 hidden sm:table-cell text-slate-300 font-medium">
                      {userItem.eventsAttended || 0}
                    </td>

                    {/* Mentorships */}
                    <td className="py-3.5 px-4 hidden sm:table-cell text-slate-300 font-medium">
                      {userItem.mentorSessions || 0}
                    </td>

                    {/* Total XP */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-mono font-bold text-xs border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                        {userItem.xp} XP
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
