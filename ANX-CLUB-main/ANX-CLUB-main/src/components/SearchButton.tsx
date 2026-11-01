"use client";

import { Search } from "lucide-react";

export function SearchButton() {
  return (
    <button 
      onClick={() => document.dispatchEvent(new Event('open-command-palette'))}
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'var(--surface-color)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '2rem',
        padding: '0.75rem 1.5rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        cursor: 'pointer',
        color: 'var(--text-muted)',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        transition: 'border-color 0.2s, box-shadow 0.2s'
      }}
      title="Search (Cmd + K)"
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary-color)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
      }}
    >
      <Search size={20} /> 
      <span style={{ fontSize: '1rem', flex: 1, textAlign: 'left' }}>Search events, mentors...</span>
      <span style={{ fontSize: '0.75rem', background: 'var(--bg-color)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontWeight: 600 }}>Cmd + K</span>
    </button>
  );
}
