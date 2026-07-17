"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
    // Load from localStorage on mount
    const storedAuth = localStorage.getItem("jobnest_auth");
    const storedUser = localStorage.getItem("jobnest_user");
    
    if (storedAuth === "true" && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
    setIsInitialized(true);
  }, []);

  const login = async (email: string, role: UserRole, displayName?: string): Promise<boolean> => {
    const name = displayName || email.split("@")[0] || "User";
    const avatar = name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    
    const newUser: UserProfile = {
      name,
      email,
      role,
      avatar,
      kycStatus: "unverified",
      walletBalance: 2500,
      transactions: [
        { id: "tx-1", type: "deposit", amount: 1500, desc: "Completed Agricultural Work", date: "July 15, 2026" },
        { id: "tx-2", type: "withdrawal", amount: 500, desc: "Transferred to Bank Account", date: "July 12, 2026" },
        { id: "tx-3", type: "escrow_locked", amount: 1000, desc: "Escrow Deposit - Plumbing", date: "July 10, 2026" }
      ]
    };

    setIsAuthenticated(true);
    setUser(newUser);
    localStorage.setItem("jobnest_auth", "true");
    localStorage.setItem("jobnest_user", JSON.stringify(newUser));
    return true;
  };

  const signup = async (email: string, role: UserRole, displayName: string): Promise<boolean> => {
    return login(email, role, displayName);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("jobnest_auth");
    localStorage.removeItem("jobnest_user");
  };

  const updateKycStatus = (status: "unverified" | "pending" | "verified") => {
    if (!user) return;
    const updated = { ...user, kycStatus: status };
    setUser(updated);
    localStorage.setItem("jobnest_user", JSON.stringify(updated));
  };

  const updateWalletBalance = (amount: number) => {
    if (!user) return;
    const updated = { ...user, walletBalance: user.walletBalance + amount };
    setUser(updated);
    localStorage.setItem("jobnest_user", JSON.stringify(updated));
  };

  const addTransaction = (tx: Transaction) => {
    if (!user) return;
    const updated = { ...user, transactions: [tx, ...user.transactions] };
    setUser(updated);
    localStorage.setItem("jobnest_user", JSON.stringify(updated));
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...profile };
    setUser(updated);
    localStorage.setItem("jobnest_user", JSON.stringify(updated));
  };

  if (!isInitialized) {
    return null; // Prevent hydration mismatch / flash
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
