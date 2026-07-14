import { GigStatus } from "@/constants";

/**
 * Core User schema definition.
 */
export interface User {
  id: string;
  email: string;
  role: "worker" | "employer" | "admin";
  createdAt: string;
}

/**
 * Profile schema containing details for workers and employers.
 */
export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  skills: string[];
  bio?: string;
  verificationStatus: "unverified" | "pending" | "verified";
  rating?: number;
}

/**
 * Job posting schema for hyperlocal opportunities.
 */
export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  latitude: number;
  longitude: number;
  status: GigStatus;
  employerId: string;
  workerId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Financial transaction log.
 */
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: "deposit" | "withdrawal" | "payment" | "refund";
  status: "pending" | "completed" | "failed";
  referenceId?: string;
  createdAt: string;
}
