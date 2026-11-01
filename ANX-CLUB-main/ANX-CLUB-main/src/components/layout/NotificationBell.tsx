'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import styles from './NotificationBell.module.css';

interface AppNotification {
  id: string;
  title: string;
  body: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: any;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifs.push({
          id: doc.id,
          title: data.title || '',
          body: data.message || data.body || '',
          actionUrl: data.link || data.actionUrl || '',
          isRead: data.isRead || data.read || false,
          createdAt: data.createdAt,
        });
      });
      // Sort newest first
      notifs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || new Date(a.createdAt).getTime() / 1000 || 0;
        const timeB = b.createdAt?.seconds || new Date(b.createdAt).getTime() / 1000 || 0;
        return timeB - timeA;
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [userId]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const markAsRead = async (id: string) => {
    try {
      const notifRef = doc(db, 'notifications', id);
      await updateDoc(notifRef, { isRead: true });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.isRead).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <div className={styles.bellContainer}>
      <button className={styles.bellButton} onClick={toggleDropdown} aria-label="Notifications">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className={styles.markAllRead} onClick={markAllAsRead}>Mark all as read</button>
            )}
          </div>
          
          <div className={styles.notificationList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>No notifications yet</div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`${styles.notificationItem} ${!notif.isRead ? styles.unread : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className={styles.notifContent}>
                    <p className={styles.notifTitle}>{notif.title}</p>
                    <p className={styles.notifBody}>{notif.body}</p>
                  </div>
                  {!notif.isRead && <div className={styles.unreadDot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
