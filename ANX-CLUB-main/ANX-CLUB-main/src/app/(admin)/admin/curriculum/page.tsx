'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/auth-helpers';
import { BookOpen, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export default function CurriculumEditorPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ track: 'Full-Stack Web', stepName: '', url: '', isMandatory: true });
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const token = await getAuthToken(user);
      const res = await fetch('/api/admin/curriculum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Curriculum step added successfully!' });
        setFormData({ ...formData, stepName: '', url: '' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to update curriculum' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-400" />
          No-Code Curriculum Editor
        </h1>
        <p className="text-slate-400 mt-2">
          Add new learning modules, external links, and capstone tasks to existing roadmaps.
        </p>
      </div>

      {status && (
        <div className={`p-4 mb-6 rounded-xl border flex items-center gap-3 ${
          status.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span className="text-sm font-medium">{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#0d1527] p-8 rounded-2xl shadow-xl border border-white/10">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Roadmap Track</label>
          <select
            value={formData.track}
            onChange={(e) => setFormData({...formData, track: e.target.value})}
            className="w-full px-4 py-3 bg-[#080d1a] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="Full-Stack Web" className="bg-[#080d1a]">Full-Stack Web</option>
            <option value="AI/ML" className="bg-[#080d1a]">AI/ML & Deep Learning</option>
            <option value="Cloud & DevOps" className="bg-[#080d1a]">Cloud & DevOps Architecture</option>
            <option value="Cybersecurity" className="bg-[#080d1a]">Cybersecurity & Cryptography</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Step Name</label>
          <input
            type="text"
            required
            value={formData.stepName}
            onChange={(e) => setFormData({...formData, stepName: e.target.value})}
            className="w-full px-4 py-3 bg-[#080d1a] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="e.g. Intro to Docker & Containerization"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Resource URL (Docs/Video/Repository)</label>
          <input
            type="url"
            required
            value={formData.url}
            onChange={(e) => setFormData({...formData, url: e.target.value})}
            className="w-full px-4 py-3 bg-[#080d1a] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="https://docs.docker.com/..."
          />
        </div>

        <div className="pt-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.isMandatory} 
              onChange={(e) => setFormData({...formData, isMandatory: e.target.checked})}
              className="rounded bg-[#080d1a] border-white/20 text-indigo-600 focus:ring-indigo-500 h-4 w-4" 
            />
            <span className="text-sm font-medium text-slate-300">Mandatory Step for XP Completion</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium py-3 px-6 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {loading ? 'Adding Step...' : 'Add to Curriculum'}
        </button>
      </form>
    </div>
  );
}
