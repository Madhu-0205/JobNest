"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export type UserRole = "worker" | "employer" | "resident" | "admin";

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  desc: string;
  date: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  kycStatus: "unverified" | "pending" | "verified";
  walletBalance: number;
  transactions: Transaction[];
  onboardingCompleted?: boolean;
  phoneNumber?: string;
  skills?: string[];
  experienceYears?: number;
  languages?: string[];
  education?: string;
  about?: string;
  workRadius?: number;
  expectedDailyEarnings?: number;
  availability?: "full-time" | "part-time" | "weekends";
  latitude?: number;
  longitude?: number;
  businessName?: string;
  ownerName?: string;
  businessType?: string;
  gstNumber?: string;
  businessAddress?: string;
  hiringFrequency?: string;
  budgetRangeMin?: number;
  budgetRangeMax?: number;
  hiringUrgency?: boolean;
  employerOnboardingCompleted?: boolean;
  savedAddress?: string;
  preferredLanguage?: string;
  paymentMethod?: string;
  residentOnboardingCompleted?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, role: UserRole, displayName?: string) => Promise<boolean>;
  signup: (email: string, role: UserRole, displayName: string) => Promise<boolean>;
  logout: () => void;
  updateKycStatus: (status: "unverified" | "pending" | "verified") => void;
  updateWalletBalance: (amount: number) => void;
  addTransaction: (tx: Transaction) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();
    
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUser({
          name: session.user.user_metadata?.['display_name'] || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          role: (session.user.user_metadata?.['role'] as UserRole) || "worker",
          avatar: "US",
          kycStatus: "unverified",
          walletBalance: 2500,
          transactions: []
        });
      }
      setIsInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsAuthenticated(true);
        setUser({
          name: session.user.user_metadata?.['display_name'] || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          role: (session.user.user_metadata?.['role'] as UserRole) || "worker",
          avatar: "US",
          kycStatus: "unverified",
          walletBalance: 2500,
          transactions: []
        });
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (_email: string, _role: UserRole, _displayName?: string): Promise<boolean> => {
    return true; // Actual login happens via server actions, this is just for legacy compatibility if called directly
  };

  const signup = async (_email: string, _role: UserRole, _displayName: string): Promise<boolean> => {
    return true;
  };

  const logout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
  };

  const updateKycStatus = (status: "unverified" | "pending" | "verified") => {
    if (!user) return;
    setUser({ ...user, kycStatus: status });
  };

  const updateWalletBalance = (amount: number) => {
    if (!user) return;
    setUser({ ...user, walletBalance: user.walletBalance + amount });
  };

  const addTransaction = (tx: Transaction) => {
    if (!user) return;
    setUser({ ...user, transactions: [tx, ...user.transactions] });
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    if (!user) return;
    setUser({ ...user, ...profile });
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        signup,
        logout,
        updateKycStatus,
        updateWalletBalance,
        addTransaction,
        updateProfile
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
