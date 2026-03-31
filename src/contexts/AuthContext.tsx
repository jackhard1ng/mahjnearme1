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
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile, AccountType, SubscriptionStatus, ContributorStatus } from "@/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  hasAccess: boolean;
  isAdmin: boolean;
  isContributor: boolean;
  isOrganizer: boolean;
  isSubscribedOrganizer: boolean;
  hasMetroAccess: (metroAbbreviation: string | null) => boolean;
  needsMetroSelection: boolean;
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
          // Default profile for new users
          const defaultProfile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "",
            accountType: "free" as AccountType,
            stripeCustomerId: null,
            subscriptionStatus: "none" as SubscriptionStatus,
            trialEndsAt: null,
            subscriptionEndsAt: null,
            plan: null,
            isContributor: false,
            isOrganizer: false,
            organizerProfileId: null,
            contributorCity: null,
            contributorMetro: null,
            contributorAppliedAt: null,
            contributorStatus: null,
            lastActivityDate: null,
            verificationsThisMonth: 0,
            subscribedPrice: null,
            subscribedDate: null,
            isGrandfathered: false,
            referralCode: null,
            referralLink: null,
            referredByCode: null,
            homeMetro: null,
            homeMetroSelectedAt: null,
            photoURL: firebaseUser.photoURL || null,
            avatarColor: null,
            bio: null,
            skillLevel: null,
            gameStylePreference: "american",
            contactPhone: null,
            homeCity: "",
            homeGeopoint: null,
            savedCities: [],
            favoriteGames: [],
            savedEvents: [],
            emailNotifications: { newEventsInArea: false, weeklyDigest: false },
            notifyStates: [],
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

          try {
            const db = getFirebaseDb();
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

            if (userDoc.exists()) {
              const data = userDoc.data();
              const now = new Date().toISOString();
              setUserProfile({
                ...defaultProfile,
                ...data,
                id: firebaseUser.uid,
                email: firebaseUser.email || data.email || "",
                displayName: data.displayName || firebaseUser.displayName || "",
                lastLoginAt: now,
              } as UserProfile);
              // Update last login in Firestore (fire-and-forget)
              setDoc(doc(db, "users", firebaseUser.uid), { lastLoginAt: now }, { merge: true }).catch(() => {});
            } else {
              // First-time user, create their Firestore document
              await setDoc(doc(db, "users", firebaseUser.uid), {
                email: defaultProfile.email,
                displayName: defaultProfile.displayName,
                accountType: defaultProfile.accountType,
                subscriptionStatus: defaultProfile.subscriptionStatus,
                createdAt: defaultProfile.createdAt,
                lastLoginAt: defaultProfile.lastLoginAt,
              });
              setUserProfile(defaultProfile);
            }
          } catch {
            // Firestore unavailable, use defaults (works for demo/dev)
            setUserProfile(defaultProfile);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      });
    } catch {
      // Firebase not configured, run in demo mode
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

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    // Optimistically update local state
    setUserProfile((prev) => prev ? { ...prev, ...updates } : prev);

    if (!user) return false;

    try {
      const db = getFirebaseDb();

      // Write to Firestore
      await setDoc(
        doc(db, "users", user.uid),
        { ...updates, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      // If displayName was updated, also sync to Firebase Auth
      // so it persists across page reloads (Auth displayName is read on load)
      if (updates.displayName && updates.displayName !== user.displayName) {
        await updateProfile(user, { displayName: updates.displayName });
      }

      return true;
    } catch (err) {
      console.error("[updateUserProfile] Write failed:", err);
      // Revert optimistic update on failure
      if (userProfile) {
        setUserProfile(userProfile);
      }
      return false;
    }
  };

  const hasAccess =
    userProfile?.accountType === "admin" ||
    userProfile?.accountType === "subscriber" ||
    userProfile?.accountType === "contributor" ||
    userProfile?.subscriptionStatus === "active" ||
    userProfile?.subscriptionStatus === "past_due" ||
    // Legacy: treat any trialing status as active (trial feature removed)
    userProfile?.subscriptionStatus === "trialing" ||
    userProfile?.accountType === "trial";

  const isAdmin = userProfile?.accountType === "admin";
  const isContributor = userProfile?.isContributor === true || userProfile?.accountType === "contributor";
  const isOrganizer = userProfile?.isOrganizer === true || userProfile?.accountType === "organizer";
  const isSubscribedOrganizer = isOrganizer && (
    userProfile?.accountType === "subscriber" ||
    userProfile?.subscriptionStatus === "active"
  );

  const isPaidUser =
    userProfile?.accountType === "admin" ||
    userProfile?.accountType === "subscriber" ||
    userProfile?.accountType === "contributor" ||
    userProfile?.subscriptionStatus === "active";

  const hasMetroAccess = (metroAbbreviation: string | null): boolean => {
    if (!user || !userProfile) return false;
    if (isPaidUser) return true;
    if (hasAccess) return true; // trial users get full access
    if (!metroAbbreviation) return true; // general content
    return userProfile.homeMetro === metroAbbreviation;
  };

  const needsMetroSelection =
    !!user &&
    !!userProfile &&
    userProfile.accountType === "free" &&
    !userProfile.homeMetro &&
    !isPaidUser;

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
        updateUserProfile,
        hasAccess,
        isAdmin,
        isContributor,
        isOrganizer,
        isSubscribedOrganizer,
        hasMetroAccess,
        needsMetroSelection,
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
