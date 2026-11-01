'use client';

import React, { useState } from 'react';

export default function AmbassadorPortalPage() {
  const [stats] = useState({
    referralCode: 'ANX-MIT-2026',
    totalSignups: 42,
    paidConversions: 18,
    revenueShare: '₹2,700'
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Campus Ambassador Portal</h1>
      <p className="text-gray-600 mb-8">Track your college chapter's growth and your earned commissions.</p>
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Your Unique Invite Code</h3>
          <p className="text-3xl font-bold mt-1 text-blue-600">{stats.referralCode}</p>
        </div>
        <button className="mt-4 md:mt-0 bg-black text-white px-6 py-2 rounded font-medium hover:bg-gray-800 transition">
          Copy Link
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Total Signups (Free)</h3>
          <p className="text-4xl font-bold mt-2">{stats.totalSignups}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Paid Member Conversions</h3>
          <p className="text-4xl font-bold mt-2 text-green-600">{stats.paidConversions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue Share Earned</h3>
          <p className="text-4xl font-bold mt-2 text-purple-600">{stats.revenueShare}</p>
        </div>
      </div>
    </div>
  );
}
