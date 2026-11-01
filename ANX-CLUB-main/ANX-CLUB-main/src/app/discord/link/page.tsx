'use client';

import React from 'react';

export default function DiscordLinkPage() {

  const handleConnect = () => {
    // In a real app, this would redirect to Discord OAuth URL
    alert('Redirecting to Discord OAuth...');
    // window.location.href = `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent('http://localhost:3000/api/discord/oauth')}&response_type=code&scope=identify%20guilds.join`;
  };

  return (
    <div className="p-8 max-w-lg mx-auto text-center mt-12">
      <div className="bg-indigo-600 p-4 inline-block rounded-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 127.14 96.36" className="fill-white">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.1,53,91.08,65.69,84.69,65.69Z"/>
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-4">Connect Your Discord</h1>
      <p className="text-gray-600 mb-8">
        Link your A.N.X account to Discord to automatically receive your Elite Member, Tech Lead, and Incubator roles in the community server.
      </p>
      
      <button 
        onClick={handleConnect}
        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors text-lg"
      >
        Authorize with Discord
      </button>
      <p className="text-sm text-gray-400 mt-4">Safe and secure. We only request permission to assign roles in the official server.</p>
    </div>
  );
}
