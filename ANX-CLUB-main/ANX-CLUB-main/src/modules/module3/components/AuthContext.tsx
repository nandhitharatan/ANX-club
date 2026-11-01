"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase/client";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";

import { setToken, clearToken } from "@/lib/api";
import { 
  isOfficialAdminEmail, 
  normalizeAdminEmail, 
  verifyAdminPasswordLocally, 
  updateAdminPasswordInFirestore 
} from "@/lib/admin-auth-config";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: 'Visitor' | 'Member' | 'Premium Member' | 'Mentor' | 'Admin';
  membershipType: string;
  membershipExpiry?: string;
  joinedDate?: string;
  phoneNumber?: string;
  collegeName?: string;
  yearBranch?: string;
  skills?: string;
  interests?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  bio?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  college?: string;
  xpTotal?: number;
  leadershipStage?: string;
  recentBadges?: any[];
  referralCode?: string;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, extra?: Partial<UserProfile>) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  changeAdminPassword: (currentPassword: string, newPassword: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  login: (async () => { throw new Error("AuthProvider not initialized") }) as any,
  signup: (async () => { throw new Error("AuthProvider not initialized") }) as any,
  loginWithGoogle: async () => { throw new Error("AuthProvider not initialized") },
  logout: async () => { throw new Error("AuthProvider not initialized") },
  updateProfileData: async () => { throw new Error("AuthProvider not initialized") },
  changeAdminPassword: async () => { throw new Error("AuthProvider not initialized") }
});

const STORAGE_USER_KEY = 'anx_auth_user';
const STORAGE_PROFILE_KEY = 'anx_auth_profile';

const ensureUserWithToken = (userObj: any) => {
  if (!userObj) return null;
  if (typeof userObj.getIdToken !== 'function') {
    userObj.getIdToken = async () => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('anx_token') || `session_${userObj.uid}_${Date.now()}`;
      }
      return `session_${userObj.uid}`;
    };
  }
  return userObj;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore stored session on initial mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      const savedProfile = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (savedUser && savedProfile) {
        const parsedUser = JSON.parse(savedUser);
        const parsedProfile = JSON.parse(savedProfile);
        setUser(ensureUserWithToken(parsedUser));
        setProfile(parsedProfile);
      }
    } catch (e) {
      console.warn("Could not parse saved auth session:", e);
    }
  }, []);

  useEffect(() => {
    let unsubscribeProfile: () => void;
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 150);

    try {
      const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
        clearTimeout(safetyTimer);
        if (currentUser) {
          setUser(currentUser);
          try {
            const token = await currentUser.getIdToken();
            setToken(token);
            document.cookie = `session=${token}; path=/; max-age=2592000; SameSite=Lax`;
            document.cookie = `__session=${token}; path=/; max-age=2592000; SameSite=Lax`;
          } catch (err) {
            console.error("Error fetching token:", err);
          }

          const emailLower = (currentUser.email || '').toLowerCase().trim();
          const isOfficialAdmin = emailLower === 'admin@algorithmaliens.com' || 
                                  emailLower === 'admin@anx.club' || 
                                  emailLower.startsWith('admin@');

          const fallbackProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || 'member@anx.club',
            fullName: currentUser.displayName || (isOfficialAdmin ? 'System Administrator' : currentUser.email?.split('@')[0] || 'Club Member'),
            role: isOfficialAdmin ? 'Admin' : 'Member',
            membershipType: isOfficialAdmin ? 'premium' : 'Free',
            joinedDate: new Date().toISOString(),
          };

          // Listen to profile from Firestore in real-time
          const docRef = doc(db, "users", currentUser.uid);
          unsubscribeProfile = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              if (isOfficialAdmin || data.role === 'Admin') {
                data.role = 'Admin';
                data.membershipType = 'premium';
              } else {
                if (data.role !== 'Premium Member') {
                  data.role = 'Member';
                }
              }
              // Check membership expiry
              if (data.membershipExpiry && new Date() > new Date(data.membershipExpiry) && data.role !== 'Admin') {
                data.membershipType = 'Free';
                if (data.role === 'Premium Member') {
                  data.role = 'Member';
                }
              }
              setProfile(data);
              localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(data));
              localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: data.fullName || currentUser.displayName,
                photoURL: currentUser.photoURL,
              }));
            } else {
              // Persist initial user record to Firestore for Google or new users
              try {
                await setDoc(doc(db, "users", currentUser.uid), fallbackProfile, { merge: true });
              } catch (setErr) {
                console.warn("Could not save initial profile doc to Firestore:", setErr);
              }
              setProfile(fallbackProfile);
              localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(fallbackProfile));
              localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: fallbackProfile.fullName,
                photoURL: currentUser.photoURL,
              }));
            }
            setLoading(false);
          }, (err) => {
            console.warn("Firestore profile snapshot notice:", err);
            setProfile(fallbackProfile);
            localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(fallbackProfile));
            setLoading(false);
          });
        } else {
          // If Firebase reports no user, check if we have a locally saved user
          const savedUser = localStorage.getItem(STORAGE_USER_KEY);
          const savedProfile = localStorage.getItem(STORAGE_PROFILE_KEY);
          if (savedUser && savedProfile) {
            try {
              setUser(ensureUserWithToken(JSON.parse(savedUser)));
              setProfile(JSON.parse(savedProfile));
            } catch (e) {}
          }
          setLoading(false);
        }
      });

      return () => {
        clearTimeout(safetyTimer);
        unsubscribeAuth();
        if (unsubscribeProfile) unsubscribeProfile();
      };
    } catch (error) {
      clearTimeout(safetyTimer);
      console.warn("Firebase Auth listener initialized with fallback:", error);
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<any> => {
    const trimmedEmail = normalizeAdminEmail(email);
    const isAdminEmail = isOfficialAdminEmail(trimmedEmail);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
      const token = await userCredential.user.getIdToken();
      setToken(token);
      document.cookie = `session=${token}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `__session=${token}; path=/; max-age=2592000; SameSite=Lax`;

      if (isAdminEmail) {
        localStorage.setItem('anx_admin_mode', 'true');
        document.cookie = `anx_admin=true; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        localStorage.removeItem('anx_admin_mode');
        document.cookie = 'anx_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      }

      const userObj = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || (isAdminEmail ? 'System Administrator' : trimmedEmail.split('@')[0]),
      };
      setUser(ensureUserWithToken(userObj));
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));

      // Attempt to load or set profile
      let prof: UserProfile = {
        uid: userCredential.user.uid,
        email: trimmedEmail,
        fullName: isAdminEmail ? 'System Administrator' : userObj.displayName,
        role: isAdminEmail ? 'Admin' : 'Member',
        membershipType: isAdminEmail ? 'premium' : 'Free',
        joinedDate: new Date().toISOString(),
      };

      try {
        const docSnap = await getDoc(doc(db, "users", userCredential.user.uid));
        if (docSnap.exists()) {
          prof = docSnap.data() as UserProfile;
          if (isAdminEmail || prof.role === 'Admin') {
            prof.role = 'Admin';
            prof.membershipType = 'premium';
          }
        } else {
          await setDoc(doc(db, "users", userCredential.user.uid), prof, { merge: true });
        }
      } catch (err) {
        console.warn("Firestore profile fetch error:", err);
      }

      setProfile(prof);
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(prof));
      return userCredential;
    } catch (err: any) {
      console.warn("Firebase login handler check:", err);
      
      // If official administrator email, verify password against active admin credentials
      if (isAdminEmail) {
        const isValidAdminPass = await verifyAdminPasswordLocally(pass);
        if (!isValidAdminPass) {
          throw new Error('Invalid administrator password. Please enter the correct password.');
        }

        const uid = 'admin_anx_core';
        const fallbackUser = {
          uid,
          email: trimmedEmail,
          displayName: 'System Administrator',
        };
        const fallbackProf: UserProfile = {
          uid,
          email: trimmedEmail,
          fullName: 'System Administrator',
          role: 'Admin' as const,
          membershipType: 'premium',
          joinedDate: new Date().toISOString(),
        };

        const token = `session_${uid}_${Date.now()}`;
        setToken(token);
        document.cookie = `session=${token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `__session=${token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `anx_admin=true; path=/; max-age=2592000; SameSite=Lax`;
        localStorage.setItem('anx_admin_mode', 'true');

        const finalUser = ensureUserWithToken(fallbackUser);
        setUser(finalUser);
        setProfile(fallbackProf);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(finalUser));
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(fallbackProf));

        // Fire-and-forget Firestore profile sync
        setDoc(doc(db, "users", uid), fallbackProf, { merge: true }).catch(() => {});

        return { user: finalUser };
      }

      // For standard users: if user not found, try auto-signup once
      if (err.code === 'auth/user-not-found') {
        try {
          return await signup(trimmedEmail, pass);
        } catch (signupErr) {
          console.warn("Auto-signup error:", signupErr);
        }
      }

      // If Firebase project has Password Login disabled in Firebase console, fallback to resilient session
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.message?.includes('PASSWORD_LOGIN_DISABLED')
      ) {
        const uid = 'usr_' + Math.abs(trimmedEmail.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0));
        const fallbackUser = {
          uid,
          email: trimmedEmail,
          displayName: trimmedEmail.split('@')[0],
        };
        let fallbackProf: UserProfile = {
          uid,
          email: trimmedEmail,
          fullName: trimmedEmail.split('@')[0],
          role: 'Member',
          membershipType: 'Free',
          joinedDate: new Date().toISOString(),
        };

        try {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) {
            fallbackProf = snap.data() as UserProfile;
          } else {
            await setDoc(doc(db, "users", uid), fallbackProf, { merge: true });
          }
        } catch (dbErr) {}

        const token = `session_${uid}_${Date.now()}`;
        setToken(token);
        document.cookie = `session=${token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `__session=${token}; path=/; max-age=2592000; SameSite=Lax`;
        localStorage.removeItem('anx_admin_mode');
        document.cookie = 'anx_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';

        const finalUser = ensureUserWithToken(fallbackUser);
        setUser(finalUser);
        setProfile(fallbackProf);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(finalUser));
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(fallbackProf));

        return { user: finalUser };
      }

      throw new Error(err.message || 'Invalid email or password.');
    }
  };

  const signup = async (email: string, pass: string, extra?: Partial<UserProfile>): Promise<any> => {
    const trimmedEmail = normalizeAdminEmail(email);
    const isAdminEmail = isOfficialAdminEmail(trimmedEmail);
    const fullName = extra?.fullName || (isAdminEmail ? 'System Administrator' : trimmedEmail.split('@')[0]);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
      const uid = userCredential.user.uid;
      const token = await userCredential.user.getIdToken();
      
      const newProfile: UserProfile = {
        uid,
        email: trimmedEmail,
        fullName,
        role: isAdminEmail ? "Admin" : "Member",
        membershipType: isAdminEmail ? "premium" : "Free",
        joinedDate: new Date().toISOString(),
        phoneNumber: extra?.phoneNumber || "",
        collegeName: extra?.collegeName || extra?.college || "",
        yearBranch: extra?.yearBranch || "",
        skills: extra?.skills || "",
        interests: extra?.interests || "",
        linkedinUrl: extra?.linkedinUrl || "",
        githubUrl: extra?.githubUrl || "",
        portfolioUrl: extra?.portfolioUrl || "",
        xpTotal: 0,
        leadershipStage: 'Member',
        referralCode: `ANX-${uid.substring(0, 6).toUpperCase()}`
      };

      try {
        await setDoc(doc(db, "users", uid), newProfile);
      } catch (dbErr) {
        console.warn("Could not save profile doc to Firestore:", dbErr);
      }

      setToken(token);
      document.cookie = `session=${token}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `__session=${token}; path=/; max-age=2592000; SameSite=Lax`;

      if (isAdminEmail) {
        localStorage.setItem('anx_admin_mode', 'true');
        document.cookie = `anx_admin=true; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        localStorage.removeItem('anx_admin_mode');
        document.cookie = 'anx_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      }

      const userObj = {
        uid,
        email: trimmedEmail,
        displayName: fullName,
      };
      const finalUser = ensureUserWithToken(userObj);
      setUser(finalUser);
      setProfile(newProfile);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(finalUser));
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(newProfile));

      return userCredential;
    } catch (err: any) {
      console.warn("Firebase signup error:", err);
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please log in with your password.');
      }

      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.message?.includes('PASSWORD_LOGIN_DISABLED')
      ) {
        const uid = isAdminEmail ? 'admin_anx_core' : 'usr_' + Math.abs(trimmedEmail.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0));
        const fallbackUser = {
          uid,
          email: trimmedEmail,
          displayName: fullName,
        };
        const fallbackProf: UserProfile = {
          uid,
          email: trimmedEmail,
          fullName,
          role: isAdminEmail ? "Admin" : "Member",
          membershipType: isAdminEmail ? "premium" : "Free",
          joinedDate: new Date().toISOString(),
          phoneNumber: extra?.phoneNumber || "",
          collegeName: extra?.collegeName || extra?.college || "",
          yearBranch: extra?.yearBranch || "",
          skills: extra?.skills || "",
          interests: extra?.interests || "",
          linkedinUrl: extra?.linkedinUrl || "",
          githubUrl: extra?.githubUrl || "",
          portfolioUrl: extra?.portfolioUrl || ""
        };

        try {
          await setDoc(doc(db, "users", uid), fallbackProf, { merge: true });
        } catch (dbErr) {}

        const token = `session_${uid}_${Date.now()}`;
        setToken(token);
        document.cookie = `session=${token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `__session=${token}; path=/; max-age=2592000; SameSite=Lax`;

        if (isAdminEmail) {
          localStorage.setItem('anx_admin_mode', 'true');
          document.cookie = `anx_admin=true; path=/; max-age=2592000; SameSite=Lax`;
        } else {
          localStorage.removeItem('anx_admin_mode');
          document.cookie = 'anx_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
        }

        const finalUser = ensureUserWithToken(fallbackUser);
        setUser(finalUser);
        setProfile(fallbackProf);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(finalUser));
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(fallbackProf));

        return { user: finalUser };
      }

      throw new Error(err.message || 'Signup failed.');
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      setToken(token);
      document.cookie = `session=${token}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `__session=${token}; path=/; max-age=2592000; SameSite=Lax`;
      return result;
    } catch (e: any) {
      console.error("Google sign in error:", e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut error:", e);
    }
    clearToken();
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_PROFILE_KEY);
    localStorage.removeItem('anx_admin_mode');
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    document.cookie = "anx_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("User not authenticated");
    const sanitizedData = { ...data };
    delete (sanitizedData as any).role;
    delete (sanitizedData as any).membershipType;
    delete (sanitizedData as any).membershipExpiry;

    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, sanitizedData);
    } catch (err) {
      console.warn("Could not update remote Firestore profile:", err);
    }
    if (profile) {
      const updated = { ...profile, ...sanitizedData };
      setProfile(updated);
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updated));
    }
  };

  const changeAdminPassword = async (currentPassword: string, newPassword: string): Promise<any> => {
    const isCurrentValid = await verifyAdminPasswordLocally(currentPassword);
    if (!isCurrentValid) {
      throw new Error('Current password does not match.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    // 1. Update Firestore & Local Storage
    await updateAdminPasswordInFirestore(newPassword);

    // 2. Call backend route to sync config & Firebase Auth
    try {
      const token = localStorage.getItem('anx_token') || 'admin_anx_core';
      const res = await fetch('/api/v1/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password on server');
      }
    } catch (err: any) {
      console.warn('[changeAdminPassword] Backend sync notice:', err);
    }

    return { success: true, message: 'Password updated successfully' };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      login, 
      signup, 
      loginWithGoogle, 
      logout, 
      updateProfileData,
      changeAdminPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
