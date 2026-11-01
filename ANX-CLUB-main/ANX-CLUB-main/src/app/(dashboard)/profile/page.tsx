'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Mail, Phone, BookOpen, GraduationCap, 
  Globe, Plus, X, Check, Edit2, 
  Award, ShieldAlert 
} from 'lucide-react'
import { MOCK_USER, SKILLS, INTERESTS } from '@/lib/constants'
import toast from 'react-hot-toast'

import { useAuth } from '@/modules/module3/components/AuthContext'
import { useEffect } from 'react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, profile: dbProfile, loading: authLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<any>({
    fullName: '',
    bio: 'Product Builder & Tech Enthusiast',
    phone: '',
    college: '',
    year: '1st Year',
    branch: 'Computer Science',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    interests: ['Web Development', 'AI/ML', 'Open Source'],
  })

  useEffect(() => {
    if (user) {
      setProfile((prev: any) => ({
        ...prev,
        fullName: dbProfile?.fullName || user.displayName || user.email?.split('@')[0] || 'Member',
        phone: dbProfile?.phoneNumber || '',
        college: dbProfile?.collegeName || '',
        bio: dbProfile?.bio || prev.bio,
        year: (dbProfile?.yearBranch || '').split(' - ')[0] || '1st Year',
        branch: (dbProfile?.yearBranch || '').split(' - ')[1] || 'Computer Science',
        linkedinUrl: dbProfile?.linkedinUrl || '',
        githubUrl: dbProfile?.githubUrl || '',
        portfolioUrl: dbProfile?.portfolioUrl || '',
        skills: Array.isArray(dbProfile?.skills) ? dbProfile.skills : (typeof dbProfile?.skills === 'string' && dbProfile?.skills ? dbProfile.skills.split(', ') : prev.skills),
        interests: Array.isArray(dbProfile?.interests) ? dbProfile.interests : (typeof dbProfile?.interests === 'string' && dbProfile?.interests ? dbProfile.interests.split(', ') : prev.interests),
      }))
    }
  }, [user, dbProfile])

  const [newSkill, setNewSkill] = useState('')
  const [tempProfile, setTempProfile] = useState({ ...profile })

  useEffect(() => {
    setTempProfile({ ...profile })
  }, [profile])

  if (!user && !authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.2)]">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Sign In Required</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          Please sign in to view, edit, and manage your A.N.X profile and club credentials.
        </p>
        <div className="flex gap-3 pt-2">
          <Link href="/login" className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-xl text-xs font-semibold shadow-[0_0_15px_rgba(217,70,239,0.4)]">
            Sign In
          </Link>
          <Link href="/signup" className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-semibold">
            Create Account
          </Link>
        </div>
      </div>
    )
  }

  const handleStartEdit = () => {
    setTempProfile({ ...profile })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!user) return
    
    if (tempProfile.bio && tempProfile.bio.length > 500) {
      toast.error('Bio must be less than 500 characters.')
      return
    }

    if (tempProfile.githubUrl && !tempProfile.githubUrl.startsWith('http')) {
      toast.error('GitHub link must start with http:// or https://')
      return
    }

    if (tempProfile.linkedinUrl && !tempProfile.linkedinUrl.startsWith('http')) {
      toast.error('LinkedIn link must start with http:// or https://')
      return
    }

    if (tempProfile.portfolioUrl && !tempProfile.portfolioUrl.startsWith('http')) {
      toast.error('Portfolio link must start with http:// or https://')
      return
    }

    try {
      const updatePayload = {
        fullName: tempProfile.fullName,
        bio: tempProfile.bio,
        phoneNumber: tempProfile.phone,
        collegeName: tempProfile.college,
        yearBranch: `${tempProfile.year} - ${tempProfile.branch}`,
        linkedinUrl: tempProfile.linkedinUrl,
        githubUrl: tempProfile.githubUrl,
        portfolioUrl: tempProfile.portfolioUrl,
        skills: Array.isArray(tempProfile.skills) ? tempProfile.skills.join(', ') : '',
        interests: Array.isArray(tempProfile.interests) ? tempProfile.interests.join(', ') : '',
      }

      try {
        const { doc, setDoc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase/client')
        await setDoc(doc(db, "users", user.uid), updatePayload, { merge: true })
      } catch (dbErr) {
        console.warn('Remote Firestore write skipped, updating local state:', dbErr)
      }

      setProfile({ ...tempProfile })
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to save profile modifications.')
    }
  }

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSkill.trim()) return
    if (tempProfile.skills.includes(newSkill.trim())) {
      toast.error('Skill already exists!')
      return
    }
    setTempProfile((p: any) => ({
      ...p,
      skills: [...p.skills, newSkill.trim()]
    }))
    setNewSkill('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setTempProfile((p: any) => ({
      ...p,
      skills: p.skills.filter((s: string) => s !== skillToRemove)
    }))
  }

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage your club ecosystem persona and career details</p>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-xs font-semibold border border-border/80 hover:bg-muted text-foreground rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(217,70,239,0.4)] flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={handleStartEdit}
              className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(217,70,239,0.4)] flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Showcase Card */}
      <section className="glass border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user?.displayName || 'User')}&background=8b5cf6&color=fff&size=128`}
            alt={profile?.fullName || user?.displayName || 'Avatar'}
            className="w-28 h-28 md:w-32 md:h-32 rounded-3xl object-cover ring-4 ring-muted"
          />
          <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white p-1.5 rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.6)] border border-white/20">
            <Award className="w-4 h-4" />
          </span>
        </div>

        {/* Quick Details */}
        <div className="flex-1 space-y-4 text-center md:text-left min-w-0">
          <div className="space-y-1.5">
            <div className="flex flex-col md:flex-row md:items-center gap-2.5 justify-center md:justify-start">
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfile.fullName}
                  onChange={e => setTempProfile((p: any) => ({ ...p, fullName: e.target.value }))}
                  className="px-3 py-1.5 bg-muted border border-border rounded-xl text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full max-w-sm"
                />
              ) : (
                <h2 className="font-display text-2xl font-extrabold text-white">{profile.fullName}</h2>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 text-[10px] font-semibold uppercase tracking-wider mx-auto md:mx-0 shadow-[0_0_10px_rgba(217,70,239,0.1)]">
                {dbProfile?.role || MOCK_USER.role}
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 justify-center md:justify-start">
              <GraduationCap className="w-4 h-4 text-primary" /> {profile.college} • {profile.branch} • {profile.year}
            </p>
          </div>

          <div className="border-t border-border/40 my-3" />

          {/* Bio */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">About Me</span>
            {isEditing ? (
              <textarea
                value={tempProfile.bio}
                onChange={e => setTempProfile((p: any) => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
              />
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{profile.bio}</p>
            )}
          </div>
        </div>
      </section>

      {/* Main Info Blocks Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Socials */}
        <div className="glass border border-white/10 rounded-2xl p-6 shadow-xl space-y-6 hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all">
          <h3 className="font-display text-base font-bold text-white">Contact & Connections</h3>

          <div className="space-y-4">
            {/* Email (Readonly) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" /> Email address
              </label>
              <div className="text-xs font-semibold text-foreground px-3.5 py-2.5 bg-muted/30 border border-border/30 rounded-xl">
                {user?.email || MOCK_USER.email}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" /> Contact Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfile.phone}
                  onChange={e => setTempProfile((p: any) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              ) : (
                <div className="text-xs font-semibold text-foreground px-3.5 py-2.5 bg-muted/10 border border-border/30 rounded-xl">
                  {profile.phone}
                </div>
              )}
            </div>

            <div className="border-t border-border/40 my-3" />

            {/* LinkedIn */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg> LinkedIn Profile
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfile.linkedinUrl}
                  onChange={e => setTempProfile((p: any) => ({ ...p, linkedinUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                />
              ) : (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between text-xs font-semibold text-primary px-3.5 py-2.5 bg-muted/10 border border-border/30 rounded-xl hover:bg-primary/5 transition-all group"
                >
                  <span className="truncate">{profile.linkedinUrl}</span>
                  <Globe className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                </a>
              )}
            </div>

            {/* GitHub */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-foreground fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg> GitHub Profile
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfile.githubUrl}
                  onChange={e => setTempProfile((p: any) => ({ ...p, githubUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                />
              ) : (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between text-xs font-semibold text-foreground px-3.5 py-2.5 bg-muted/10 border border-border/30 rounded-xl hover:bg-muted/30 transition-all group"
                >
                  <span className="truncate">{profile.githubUrl}</span>
                  <Globe className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Skills, Interests & Career Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills Management */}
          <div className="glass border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-base font-bold text-white">Skills Inventory</h3>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{isEditing ? (tempProfile.skills?.length || 0) : (profile.skills?.length || 0)} skills listed</span>
            </div>

            {/* Skills chip container */}
            <div className="flex flex-wrap gap-2">
              {(isEditing ? tempProfile.skills : profile.skills)?.map((skill: string) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-white/10 text-white text-xs font-semibold rounded-xl"
                >
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="p-0.5 rounded-full hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {/* Add skill input */}
            {isEditing && (
              <form onSubmit={handleAddSkill} className="flex gap-2 mt-4 max-w-sm">
                <input
                  type="text"
                  placeholder="Add skill (e.g. Docker, Figma)..."
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="submit"
                  className="p-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 text-white rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.4)] transition-colors border-none"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Education Details Card */}
          <div className="glass border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 hover:shadow-[0_0_30px_rgba(217,70,239,0.05)] transition-all">
            <h3 className="font-display text-base font-bold text-white">Education Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">College / Institution</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempProfile.college}
                    onChange={e => setTempProfile((p: any) => ({ ...p, college: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  />
                ) : (
                  <div className="text-xs font-semibold text-foreground px-3.5 py-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    {profile.college}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Major Branch</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempProfile.branch}
                    onChange={e => setTempProfile((p: any) => ({ ...p, branch: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  />
                ) : (
                  <div className="text-xs font-semibold text-foreground px-3.5 py-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    {profile.branch}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Graduation Year</span>
                {isEditing ? (
                  <select
                    value={tempProfile.year}
                    onChange={e => setTempProfile((p: any) => ({ ...p, year: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  >
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                ) : (
                  <div className="text-xs font-semibold text-foreground px-3.5 py-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    {profile.year} Year
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
