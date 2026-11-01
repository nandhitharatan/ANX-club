'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/auth-helpers';

export default function AdminBroadcastPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState({ email: true, whatsapp: false, inApp: true });
  const [formData, setFormData] = useState({ title: '', body: '', cohort: 'all' });
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const token = await getAuthToken(user);
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...formData, channels })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Broadcast sent successfully!' });
        setFormData({ title: '', body: '', cohort: 'all' });
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Broadcast Composer</h1>
      <p className="text-gray-600 mb-8">Send multi-channel alerts to specific member cohorts.</p>
      
      {status && (
        <div className={`p-4 mb-6 rounded border ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Channels</label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={channels.email} onChange={(e) => setChannels({...channels, email: e.target.checked})} className="rounded text-blue-600" />
              <span>Email</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={channels.whatsapp} onChange={(e) => setChannels({...channels, whatsapp: e.target.checked})} className="rounded text-green-600" />
              <span>WhatsApp</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={channels.inApp} onChange={(e) => setChannels({...channels, inApp: e.target.checked})} className="rounded text-purple-600" />
              <span>In-App</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Cohort</label>
          <select
            value={formData.cohort}
            onChange={(e) => setFormData({...formData, cohort: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Members</option>
            <option value="paid">Premium Members</option>
            <option value="mentors">Mentors</option>
            <option value="ambassadors">Campus Ambassadors</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Alert Title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
          <textarea
            required
            rows={5}
            value={formData.body}
            onChange={(e) => setFormData({...formData, body: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write your broadcast message..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Send Broadcast
        </button>
      </form>
    </div>
  );
}
