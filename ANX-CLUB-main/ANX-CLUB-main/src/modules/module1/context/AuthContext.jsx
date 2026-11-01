import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Note: Since we don't have a real Firebase backend yet,
  // we will mock the Firestore operations for now.
  const [mockUsers, setMockUsers] = useState({});

  const fetchOrUpdateProfile = async (user, additionalData = {}) => {
    if (!user) return null;
    
    // MOCK FIRESTORE GET
    if (mockUsers[user.uid]) {
      return mockUsers[user.uid];
    } else {
      const newProfile = {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || additionalData.fullName || 'New User',
        role: 'Visitor', // Default role
        joinedDate: new Date().toISOString(),
        phoneNumber: '',
        collegeName: '',
        yearBranch: '',
        skills: '',
        interests: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: ''
      };
      
      // MOCK FIRESTORE SET
      setMockUsers(prev => ({...prev, [user.uid]: newProfile}));
      
      return newProfile;
    }
  };

  const signup = async (email, password, fullName) => {
    // For now we just mock this since we don't have a real Firebase project
    // A real implementation would call createUserWithEmailAndPassword
    return new Promise((resolve) => {
      const mockUser = {
        uid: Math.random().toString(36).substring(7),
        email: email,
      };
      const profile = {
        uid: mockUser.uid,
        email: email,
        fullName: fullName,
        role: 'Visitor',
        joinedDate: new Date().toISOString(),
        phoneNumber: '',
        collegeName: '',
        yearBranch: '',
        skills: '',
        interests: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: ''
      };
      setMockUsers(prev => ({...prev, [mockUser.uid]: profile}));
      setCurrentUser(mockUser);
      setUserProfile(profile);
      resolve({ user: mockUser });
    });
  };

  const login = (email, password) => {
    // MOCK LOGIN
    return new Promise((resolve, reject) => {
      const users = Object.values(mockUsers);
      const user = users.find(u => u.email === email);
      if (user) {
        setCurrentUser({ uid: user.uid, email: user.email });
        setUserProfile(user);
        resolve({ user: { uid: user.uid, email: user.email }});
      } else {
        reject(new Error("User not found (Mock)"));
      }
    });
  };

  const loginWithGoogle = async () => {
    // MOCK GOOGLE LOGIN
    return new Promise((resolve) => {
       const mockUser = { uid: 'google_mock_1', email: 'test@gmail.com', displayName: 'Google User' };
       setCurrentUser(mockUser);
       
       if (!mockUsers[mockUser.uid]) {
         const profile = {
           uid: mockUser.uid,
           email: mockUser.email,
           fullName: mockUser.displayName,
           role: 'Member',
           joinedDate: new Date().toISOString()
         };
         setMockUsers(prev => ({...prev, [mockUser.uid]: profile}));
         setUserProfile(profile);
       } else {
         setUserProfile(mockUsers[mockUser.uid]);
       }
       
       resolve({ user: mockUser });
    });
  };

  const logout = () => {
    return new Promise((resolve) => {
      setCurrentUser(null);
      setUserProfile(null);
      resolve();
    });
  };

  const updateProfileData = async (data) => {
    // MOCK FIRESTORE UPDATE
    const updated = { ...userProfile, ...data };
    setUserProfile(updated);
    setMockUsers(prev => ({...prev, [currentUser.uid]: updated}));
  };
  
  const getAllUsers = () => {
    // MOCK GET ALL USERS FOR ADMIN
    return Object.values(mockUsers);
  }

  useEffect(() => {
    // Normally onAuthStateChanged goes here
    // Mocking initial load
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateProfileData,
    getAllUsers, // For admin component
    setMockUsers // Just for mocking admin role changes easily
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
