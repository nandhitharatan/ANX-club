"use client";

import { useAuth } from "@/modules/module3/components/AuthContext";
import { useState, useRef, useEffect } from "react";
import { User } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";

export function ProfileDropdown() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "U";

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          width: '2.5rem', height: '2.5rem', borderRadius: '50%',
          background: 'var(--primary-color)', color: 'white',
          border: 'none', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: '1.2rem',
          boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
        }}
        title="View Profile"
      >
        {initials}
      </button>

      {open && (
        <div 
          className="glass-panel animate-fade-in"
          style={{
            position: 'absolute', top: '120%', right: 0,
            width: '320px', padding: '1.5rem', zIndex: 2000,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '50%',
              background: 'var(--primary-color)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1.5rem'
            }}>
              {initials}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{profile?.fullName || "Member"}</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Bio</h4>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>{profile?.bio || "No bio added."}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Phone</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>{/* @ts-ignore */ profile?.phone || "-"}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* @ts-ignore */}
              {profile?.linkedin && (
                <a href={/* @ts-ignore */ profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0A66C2', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 600 }}>LinkedIn</a>
              )}
              {/* @ts-ignore */}
              {profile?.github && (
                <a href={/* @ts-ignore */ profile.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 600 }}>GitHub</a>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>College</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>{profile?.college || "-"}</p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Year / Branch</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>{profile?.yearBranch || "-"}</p>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Skills</h4>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {profile?.skills ? (
                profile.skills.split(',').map((skill: string, idx: number) => (
                  <span key={idx} style={{ padding: '0.125rem 0.5rem', backgroundColor: 'var(--surface-hover)', borderRadius: '1rem', fontSize: '0.75rem' }}>
                    {skill.trim()}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No skills listed.</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Link href="/profile" className="btn btn-primary" style={{ flex: 1, textAlign: 'center', padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => setOpen(false)}>
              Edit Profile
            </Link>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => auth.signOut()}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

