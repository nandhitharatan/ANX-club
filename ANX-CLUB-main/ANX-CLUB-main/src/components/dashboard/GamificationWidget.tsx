import React from 'react';
import styles from './GamificationWidget.module.css';

interface Badge {
  id: string;
  name: string;
  iconUrl: string;
}

interface GamificationProps {
  xpTotal: number;
  leadershipStage: string;
  recentBadges: Badge[];
}

export default function GamificationWidget({ xpTotal = 0, leadershipStage = 'Member', recentBadges = [] }: GamificationProps) {
  // Calculate progress to next stage based on PRD
  // 1: 0 XP (Member), 2: 100 XP (Associate), 3: 350 XP (Lead), 4: 750 XP (Dept Head), 5: 1500 XP (Core Team)
  let nextStageXp = 100;
  if (xpTotal >= 1500) nextStageXp = xpTotal; // Max stage
  else if (xpTotal >= 750) nextStageXp = 1500;
  else if (xpTotal >= 350) nextStageXp = 750;
  else if (xpTotal >= 100) nextStageXp = 350;
  
  const progressPercent = Math.min((xpTotal / nextStageXp) * 100, 100);

  return (
    <div className={styles.widgetContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Your Progress</h3>
        <span className={styles.stageBadge}>{leadershipStage}</span>
      </div>

      <div className={styles.xpSection}>
        <div className={styles.xpText}>
          <span className={styles.xpTotal}>{xpTotal} XP</span>
          <span className={styles.xpNext}>/ {nextStageXp} XP</span>
        </div>
        <div className={styles.progressBarBg}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className={styles.badgesSection}>
        <h4 className={styles.badgesTitle}>Recent Badges</h4>
        {recentBadges.length > 0 ? (
          <div className={styles.badgesList}>
            {recentBadges.map(badge => (
              <div key={badge.id} className={styles.badgeItem} title={badge.name}>
                <img src={badge.iconUrl} alt={badge.name} className={styles.badgeIcon} />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noBadgesText}>Complete events or submit ideas to earn badges!</p>
        )}
      </div>
    </div>
  );
}
