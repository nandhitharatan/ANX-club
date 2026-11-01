"use client";

import { useAuth } from "@/providers/AuthProvider";
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
      where("recipientId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notifs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.isRead).length);
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
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read", error);
    }
  };

  const markAllAsRead = () => {
    notifications.filter(n => !n.isRead).forEach(n => handleMarkAsRead(n.id));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-pink-400 hover:text-pink-300 hover:bg-pink-950/30 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] overflow-y-auto bg-[#13151f] border border-border/80 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in-scale">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-border/60">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="text-xs font-medium text-primary hover:text-primary-light transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-foreground-muted">
              All caught up! No notifications.
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    notif.isRead 
                      ? 'bg-transparent border-border/30 opacity-75' 
                      : 'bg-[#1a1d2e] border-primary/40 shadow-sm'
                  }`}
                >
                  <div className="text-xs font-semibold text-foreground">{notif.title}</div>
                  <div className="text-[11px] text-foreground-muted mt-0.5 leading-relaxed">{notif.body}</div>
                  {notif.actionUrl && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                        setIsOpen(false);
                        router.push(notif.actionUrl);
                      }}
                      className="inline-block text-[11px] font-medium text-cyan-400 hover:underline mt-1.5"
                    >
                      View Details →
                    </button>
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

