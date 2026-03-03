"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { UserProfile, AccountType, SubscriptionStatus } from "@/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasAccess: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only initialize Firebase auth on the client
    let unsubscribe: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          setUserProfile({
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "",
            accountType: "trial" as AccountType,
            stripeCustomerId: null,
            subscriptionStatus: "trialing" as SubscriptionStatus,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            subscriptionEndsAt: null,
            plan: null,
            skillLevel: null,
            gameStylePreference: null,
            homeCity: "",
            homeGeopoint: null,
            savedCities: [],
            favoriteGames: [],
            organizerProfile: null,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          });
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      });
    } catch {
      // Firebase not configured — run in demo mode
      setLoading(false);
    }

    return () => unsubscribe?.();
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
  };

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  };

  const hasAccess =
    userProfile?.accountType === "admin" ||
    userProfile?.accountType === "subscriber" ||
    (userProfile?.accountType === "trial" &&
      userProfile.trialEndsAt !== null &&
      new Date(userProfile.trialEndsAt) > new Date());

  const isAdmin = userProfile?.accountType === "admin";
  const isOrganizer = userProfile?.accountType === "organizer";

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        hasAccess,
        isAdmin,
        isOrganizer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
