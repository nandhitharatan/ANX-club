import {adminDb, logFirestoreFallback} from '@/lib/firebase/admin';
const db = adminDb;
import { MembershipInfo } from '@/modules/module2/types/dashboard';
import { getMembershipByUserId } from '@/modules/module2/data';

function enrichMembership(membership: MembershipInfo): MembershipInfo {
  if (!membership || !membership.tier) return {};
  
  const tier = membership.tier;
  const status = membership.status || '';
  const expiresAt = membership.expiresAt || '';
  
  const isPremium = (tier === 'Premium' || tier === 'Enterprise') && status === 'active';
  
  let upgradeCTA: { text: string; link: string } | undefined = undefined;
  
  if (status === 'expired') {
    const dateFormatted = expiresAt ? new Date(expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently';
    upgradeCTA = {
      text: `Your ${tier} subscription expired on ${dateFormatted}. Renew now to regain access to advanced engineering paths and mentor sessions!`,
      link: '/billing/renew'
    };
  } else if (status === 'pending') {
    upgradeCTA = {
      text: 'Your manual bank draft payment validation is currently pending. Full premium features will unlock upon approval.',
      link: '/billing/status'
    };
  } else if (tier === 'Basic') {
    upgradeCTA = {
      text: 'Upgrade to a Premium tier to unlock advanced systems architecture roadmaps and schedule 1-on-1 mentor consultations!',
      link: '/upgrade'
    };
  }
  
  return {
    ...membership,
    isPremium,
    upgradeCTA
  };
}

export async function getMembership(
  userId: string,
  mock = false,
  fail = false
): Promise<MembershipInfo | Record<string, never>> {
  if (fail) {
    throw new Error('Simulated failure in Membership Service');
  }

  if (db && !mock) {
    try {
      const doc = await db.collection('memberships').doc(userId).get();
      if (doc.exists) {
        const data = doc.data();
        return data ? enrichMembership(data) : {};
      }
    } catch (error) {
      logFirestoreFallback('Membership service', error);
    }
  }

  // Fallback / Mock data from Data Layer
  const membership = getMembershipByUserId(userId);
  if (membership) {
    return enrichMembership(membership);
  }

  return {};
}
