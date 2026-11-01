"use client";

import { useAuth } from "./AuthContext";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notifs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read", error);
    }
  };

  const markAllAsRead = () => {
    notifications.filter(n => !n.read).forEach(n => handleMarkAsRead(n.id));
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '0.5rem', color: 'var(--text-color)' }}
        aria-label="Notifications"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '0', right: '0',
            backgroundColor: 'var(--primary-color)', color: 'white',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="glass-panel" style={{
          position: 'absolute', top: '100%', right: '0',
          width: '320px', padding: '1rem', marginTop: '0.5rem',
          zIndex: 100, maxHeight: '400px', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.875rem' }}>
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>No notifications yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => handleMarkAsRead(notif.id)}
                  style={{ 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem', 
                    backgroundColor: notif.read ? 'transparent' : 'var(--surface-hover)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: notif.read ? 400 : 600, fontSize: '0.875rem' }}>{notif.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{notif.message}</div>
                  {notif.link && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                        setIsOpen(false);
                        router.push(notif.link);
                      }}
                      style={{ display: 'inline-block', fontSize: '0.75rem', color: 'var(--primary-color)', marginTop: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      View Details
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

