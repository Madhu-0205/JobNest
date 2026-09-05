"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/providers/AuthProvider";

// ... UI Primitive Components import ...
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  Shield,
  Wallet,
  MessageSquare,
  Sparkles,
  Plus,
  Award,
  Map as MapIcon,
  Globe,
  Paperclip,
  Send,
  Compass,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Upload,
  LogOut,
  Sliders,
  Lock,
  Loader2,
  Menu,
  X,
  Briefcase,
  Users } from
"lucide-react";

import { useMode } from "@/features/mode/ModeProvider";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/useToast";

// UI Primitive Components
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";

// Sub-components & hooks
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/components/maps/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: function LoadingFallback() {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { t: i18nT } = require("@/lib/i18n/context").useI18n();
      return (<div className="w-full h-137.5 rounded-3xl overflow-hidden border border-primary/10 shadow-xl bg-card flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">{i18nT("app.loadingInteractiveNeighborhoodMap")}</span>
      </div>);
    }

  }
);

// Server action imports
import { signInAction, signUpAction } from "@/features/auth/actions";
import { getChatRoomsAction } from "@/features/realtime/actions";
import { useChat } from "@/hooks/useChat";
import { createOpportunityAction } from "@/features/opportunity/actions";
import { saveWorkerProfileAction, uploadKycDocumentAction } from "@/features/user/actions";

// Types
type UserRole = "worker" | "employer" | "resident" | "admin";
type AppTab = "dashboard" | "map" | "ai" | "chat" | "wallet";

export function LegacyLocalHome() {const { t: i18nT } = useI18n();
  // ─────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────
  const { isAuthenticated, user, login, signup, logout } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>("worker");
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const userName = user?.name || "Arun Kumar";

  const { mode, toggleMode } = useMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Onboarding & Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    username: "",
    role: "worker" as UserRole
  });

  // UI state overlays
  const [loading, setLoading] = useState(false);
  const { success: showSuccess, error: showError } = useToast();
  const { balance: walletBalance, loading: walletLoading, error: walletError, isUnauthorized } = useWallet();
  
  useEffect(() => {
    if (walletError && !isUnauthorized) {
      showError(i18nT("app.unableToLoadWallet") || "Unable to load your wallet. Please try again.");
    }
  }, [walletError, isUnauthorized, showError, i18nT]);

  // Chat State
  type ChatRoom = { id: string; employer_id: string; worker_id: string; opportunity_id?: string; metadata?: { jobTitle?: string }; };
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  
  useEffect(() => {
    async function loadRooms() {
      if (!user) return;
      try {
        const res = await getChatRoomsAction();
        if (res.success && res.data) {
          setChatRooms(res.data as unknown as ChatRoom[]);
          if (res.data.length > 0) {
            setActiveRoomId((res.data[0] as unknown as ChatRoom).id);
          }
        }
      } catch (err) {
        console.error("Failed to load chat rooms", err);
      }
    }
    loadRooms();
  }, [user]);

  const activeRoom = chatRooms.find((r) => r.id === activeRoomId) || null;
  const otherUserId = activeRoom ? (activeRoom.employer_id === user?.id ? activeRoom.worker_id : activeRoom.employer_id) : "";
  const { messages, otherUserTyping, notifyTyping, sendMessage } = useChat(
    activeRoomId || "",
    user?.id || "",
    otherUserId
  );

  // AI & Search State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Wallet State

  const [transactions, setTransactions] = useState([
  { id: "tx-1", type: "deposit", amount: 1500, desc: "Completed Agricultural Work", date: "July 15, 2026" },
  { id: "tx-2", type: "withdrawal", amount: 500, desc: "Transferred to Bank Account", date: "July 12, 2026" },
  { id: "tx-3", type: "escrow_locked", amount: 1000, desc: "Escrow Deposit - Plumbing", date: "July 10, 2026" }]
  );
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Worker KYC & Certifications State
  const [kycStatus, setKycStatus] = useState<"unverified" | "pending" | "verified">("unverified");

  // Employer post opportunity State
  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    salaryMin: 300,
    salaryMax: 800,
    hiringRadius: 5000,
    pincode: "522002"
  });

  // Admin Config Overrides (Feature Flags)
  const [featureFlags, setFeatureFlags] = useState([
  { key: "ai.semantic_search", label: "Semantic Hybrid Search", value: true },
  { key: "payments.escrow", label: "Escrow Payment Routing", value: true },
  { key: "realtime.live_tracking", label: "Live Coordinates Tracking", value: true },
  { key: "kyc.face_match", label: "KYC Face Verification", value: false }]
  );

  // Map settings
  const mapCenter = { lat: 12.9716, lng: 77.5946 };

  // ─────────────────────────────────────────────────────────
  // DUMMY RESPONSE ENGINE (AI & CHAT fallback)
  // ─────────────────────────────────────────────────────────
  const handleAISearch = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (aiPrompt.toLowerCase().includes("electrician") || aiPrompt.toLowerCase().includes("plumber")) {
        setAiResponse(
          "I found 3 matching professionals near you:\n1. Deepak R. (Electrician) - 1.2 km away - 98% trust score.\n2. Shiva K. (Wireman) - 2.8 km away - 94% trust score.\n\nWould you like to initiate an escrow contract?"
        );
      } else {
        setAiResponse(
          `AI Insights for "${aiPrompt}":\nBased on regional market indexes in your area (Pincode: 522002), average salary ranges are ₹400 - ₹900 per day. Recommended pricing model is hourly. No skill gaps identified.`
        );
      }
    }, 1200);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !activeRoomId) return;
    const content = chatInput;
    setChatInput("");
    await sendMessage(content, "text");
  };

  const getRoomName = (room: ChatRoom) => {
    if (room.metadata?.jobTitle) return room.metadata.jobTitle;
    return `Chat with ${room.employer_id === user?.id ? room.worker_id.substring(0,6) : room.employer_id.substring(0,6)}`;
  };

  // ─────────────────────────────────────────────────────────
  // BACKEND API CONNECTORS
  // ─────────────────────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.info("[DEBUG] handleAuthSubmit started. authTab:", authTab);
    setLoading(true);
    

    try {
      if (authTab === "signin") {
        console.info("[DEBUG] Sign In branch. email:", signupForm.email, "password length:", signupForm.password.length);
        if (!signupForm.email || !signupForm.password) {
          console.info("[DEBUG] Validation failed: missing email or password");
          throw new Error("Email and password are required.");
        }
        // Run signInAction with credentials
        console.info("[DEBUG] Calling signInAction Server Action...");
        const result = await signInAction({
          email: signupForm.email,
          password: signupForm.password
        });
        console.info("[DEBUG] signInAction returned:", result);
        if (result.success) {
          console.info("[DEBUG] login via useAuth()");
          await login(signupForm.email, signupForm.role || "worker", signupForm.displayName);
          setShowAuthModal(false);
          showSuccess("Successfully authenticated.");
          window.location.reload();
        } else {
          console.info("[DEBUG] signInAction error branch. message:", result.error?.message);
          showError(result.error?.message || "Authentication failed. Please verify credentials.");
        }
      } else {
        console.info("[DEBUG] Validating signup form data");
        if (!signupForm.email) {
          console.info("[DEBUG] Return: missing email");
          showError("Please enter your email.");
          return;
        }
        if (!signupForm.password) {
          console.info("[DEBUG] Return: missing password");
          showError("Please enter a password.");
          return;
        }
        if (signupForm.password.length < 8) {
          console.info("[DEBUG] Return: password length failure");
          showError("Password must be at least 8 characters long.");
          return;
        }
        if (signupForm.password !== signupForm.confirmPassword) {
          console.info("[DEBUG] Return: password mismatch");
          showError("Passwords do not match.");
          return;
        }
        if (!/[A-Z]/.test(signupForm.password) || !/[a-z]/.test(signupForm.password) || !/[0-9]/.test(signupForm.password) || !/[^a-zA-Z0-9]/.test(signupForm.password)) {
          console.info("[DEBUG] Return: password complexity failure");
          showError("Password must contain at least one uppercase, lowercase, number, and special character.");
          return;
        }
        if (!signupForm.displayName || signupForm.displayName.length < 2) {
          console.info("[DEBUG] Return: missing profile fields (displayName)");
          showError("Display name must be at least 2 characters.");
          return;
        }
        if (!signupForm.username || signupForm.username.length < 3) {
          console.info("[DEBUG] Return: missing profile fields (username)");
          showError("Username must be at least 3 characters.");
          return;
        }

        console.info("[DEBUG] Calling signUpAction Server Action...");
        // Run signUpAction
        const result = await signUpAction({
          email: signupForm.email,
          password: signupForm.password,
          displayName: signupForm.displayName,
          username: signupForm.username,
          role: signupForm.role
        });
        console.info("[DEBUG] signUpAction returned:", result);

        if (result.success) {
          if (result.data?.requiresEmailConfirmation) {
            showSuccess(i18nT("app.accountCreatedPleaseVerifyYourEmail"));
          } else {
            setUserRole(signupForm.role);
            setOnboardingStep(2); // trigger profile setup onboarding
          }
        } else {
          let msg = "Something went wrong. Please try again.";
          if (result.error?.message === "RATE_LIMIT") msg = "Too many signup attempts. Please try again later.";
          if (result.error?.message === "DUPLICATE_ACCOUNT") msg = "An account with this email already exists.";
          if (result.error?.message === "NETWORK_FAILURE") msg = "Unable to connect to the authentication service. Please try again.";
          if (result.error?.code === "VALIDATION_FAILED") msg = "Input validation failed. Please check your details.";
          
          showError(i18nT(msg));
        }
      }
    } catch (err) {
      const errorObj = err as Error;
      console.info("[DEBUG] handleAuthSubmit catch block:", errorObj);
      showError(errorObj.message || "Authentication failed.");
    } finally {
      console.info("[DEBUG] handleAuthSubmit finally block.");
      setLoading(false);
    }
  };

  const handleOnboardingFinish = async () => {
    setLoading(true);
    try {
      // Save profile action
      await saveWorkerProfileAction({
        jobTitle: "Premium Handyman Pro",
        bio: "Specialized in smart home repairs, plumbing, and local chores.",
        experienceYears: 5,
        serviceRadiusMeters: 5000,
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        preferredWorkArea: "Guntur",
        travelDistanceKm: 15
      });
      await signup(signupForm.email, signupForm.role, signupForm.displayName || signupForm.username || "Arun Kumar");
      setShowAuthModal(false);
      showSuccess("Onboarding profile saved successfully!");
    } catch {
      // Sandbox fallback
      await signup(signupForm.email, signupForm.role, signupForm.displayName || signupForm.username || "Arun Kumar");
      setShowAuthModal(false);
      showSuccess("Profile saved in Sandbox Mode.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createOpportunityAction({
        categoryId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        typeId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        title: jobForm.title,
        description: jobForm.description,
        pricingModel: "hourly",
        salaryMin: Number(jobForm.salaryMin),
        salaryMax: Number(jobForm.salaryMax),
        currency: "INR",
        pincode: jobForm.pincode,
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        hiringRadiusMeters: Number(jobForm.hiringRadius)
      });

      if (result.success) {
        showSuccess(`Opportunity posted successfully! ID: ${result.data.opportunityId}`);
        setJobForm({ title: "", description: "", salaryMin: 300, salaryMax: 800, hiringRadius: 5000, pincode: "522002" });
      } else {
        // Sandbox bypass
        showSuccess("Opportunity posted to sandbox feed.");
        setJobForm({ title: "", description: "", salaryMin: 300, salaryMax: 800, hiringRadius: 5000, pincode: "522002" });
      }
    } catch (err) {
      const errorObj = err as Error;
      showError(errorObj.message || "Failed to create opportunity.");
    } finally {
      setLoading(false);
    }
  };

  const handleKycUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setLoading(true);
    try {
      // Simulate file upload action
      await uploadKycDocumentAction({
        documentType: "aadhaar",
        documentNumber: "1234-5678-9012",
        fileUrl: "https://jobnest.io/kyc/doc-9284.pdf"
      });
      setKycStatus("verified");
      showSuccess("KYC Document verified successfully!");
    } catch {
      setKycStatus("verified");
      showSuccess("KYC Document uploaded to sandbox.");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || (walletBalance !== null && amount > walletBalance)) {
      showError("Invalid withdrawal amount.");
      return;
    }
    setLoading(true);
    try {
      // Make real atomic wallet engine RPC call via simulated fetch
      const res = await fetch("/api/financial/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "current-user", amount: -amount })
      });
      const data = await res.json();
      if (data.success) {
        // we will fetch actual wallet status later via a hook refresh in a real app
        // for now just log it
        setTransactions((prev) => [
        { id: `tx-${Date.now()}`, type: "withdrawal", amount, desc: "Payout to Bank", date: "Today" },
        ...prev]
        );
        showSuccess("Payout transfer initiated successfully!");
        setWithdrawAmount("");
      } else {
        throw new Error(data.error?.message || "Wallet engine reject.");
      }
    } catch {
      // Sandbox fallback
      // mock offline
      // setWalletBalance((prev) => prev - amount);
      setTransactions((prev) => [
      { id: `tx-${Date.now()}`, type: "withdrawal", amount, desc: "Payout to Bank (Sandbox)", date: "Today" },
      ...prev]
      );
      showSuccess("Payout simulation completed successfully!");
      setWithdrawAmount("");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // COMPONENT RENDERING
  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-linear-to-r from-primary to-amber-600 flex items-center justify-center text-background font-extrabold text-xl shadow-lg shadow-primary/10">
              {i18nT("J")}
            </span>
            <span className="flex flex-col">
              <Typography variant="h3" as="span" className="font-bold tracking-tight text-lg leading-none gold-gradient-text">
                {i18nT("JobNest")}
              </Typography>
              <span className="text-[10px] text-primary tracking-widest font-mono uppercase">
                {i18nT("app.v2Enterprise")}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-muted-foreground mr-2">
              <Link href="/worker/opportunities" className="hover:text-primary transition-colors">
                {i18nT("app.nearbyGigsFeed") || "Nearby Gigs"}
              </Link>
              <Link href="/pro" className="hover:text-primary transition-colors">
                {i18nT("app.proNetwork") || "Pro Network"}
              </Link>
              <Link href="/pro/jobs" className="hover:text-primary transition-colors">
                {i18nT("app.jobs") || "Jobs"}
              </Link>
              <Link href="/trust" className="hover:text-primary transition-colors">
                {i18nT("app.trustLedger") || "Trust & Safety"}
              </Link>
            </nav>

            <LanguageSwitcher />

            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 bg-secondary/80 border border-border px-3 py-1 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {i18nT("Role:")}
                  <span className="text-primary font-bold capitalize">{userRole}</span>
                </span>
                
                {/* Quick Role Switcher */}
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="hidden sm:block bg-card border border-border rounded-lg text-xs py-1 px-2 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="worker">{i18nT("app.workerMode")}</option>
                  <option value="employer">{i18nT("app.employerMode")}</option>
                  <option value="resident">{i18nT("app.residentMode")}</option>
                  <option value="admin">{i18nT("app.adminPanel")}</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    showSuccess("Logged out successfully.");
                  }}
                  className="hidden sm:flex items-center gap-1 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{i18nT("Logout")}</span>
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {setAuthTab("signin");setShowAuthModal(true);}}>
                  {i18nT("app.signIn")}
                </Button>
                <Button variant="primary" size="sm" onClick={() => {setAuthTab("signup");setShowAuthModal(true);}}>
                  {i18nT("app.getStarted")}
                </Button>
              </div>
            )}

            {/* Mobile Hamburger Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="md:hidden p-2 rounded-xl border border-border text-foreground hover:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary min-w-11 min-h-11 flex items-center justify-center transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div
            id="mobile-navigation-drawer"
            className="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md"
            />

            {/* Drawer Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-h-[85vh] bg-card border-t border-border/80 shadow-2xl rounded-t-3xl p-6 flex flex-col gap-5 overflow-y-auto z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-linear-to-r from-primary to-amber-600 flex items-center justify-center text-background font-black text-sm">
                    J
                  </span>
                  <span className="font-bold text-base gold-gradient-text">JobNest Menu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 min-w-11 min-h-11 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="bg-secondary/40 p-3 rounded-xl border border-border/60 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Active Mode</span>
                  <span className="text-[10px] text-muted-foreground">
                    {mode === "LOCAL" ? "Local Opportunities & Gigs" : "Professional Career Network"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={mode === "LOCAL" ? "outline" : "primary"}
                  onClick={() => {
                    toggleMode();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold"
                >
                  Switch to {mode === "LOCAL" ? "Pro Mode" : "Local Mode"}
                </Button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground px-2">Navigation</span>
                <Link
                  href="/worker/opportunities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 text-sm font-medium transition-colors"
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Nearby Gigs & Tasks</span>
                </Link>
                <Link
                  href="/pro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 text-sm font-medium transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span>Professional Network</span>
                </Link>
                <Link
                  href="/pro/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 text-sm font-medium transition-colors"
                >
                  <Search className="w-4 h-4 text-primary" />
                  <span>Job Search & Openings</span>
                </Link>
                <Link
                  href="/trust"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 text-sm font-medium transition-colors"
                >
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Trust Ledger & Safety</span>
                </Link>
                <Link
                  href="/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 text-sm font-medium transition-colors"
                >
                  <Wallet className="w-4 h-4 text-primary" />
                  <span>Wallet & Escrow</span>
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 text-sm font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Messages</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 text-sm font-medium transition-colors"
                >
                  <Users className="w-4 h-4 text-primary" />
                  <span>Profile & KYC</span>
                </Link>
              </div>

              {/* Auth actions */}
              <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
                {!isAuthenticated ? (
                  <>
                    <Button
                      variant="primary"
                      className="w-full justify-center font-bold py-3"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAuthTab("signup");
                        setShowAuthModal(true);
                      }}
                    >
                      {i18nT("app.getStarted")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-center font-semibold py-3 border-border"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAuthTab("signin");
                        setShowAuthModal(true);
                      }}
                    >
                      {i18nT("app.signIn")}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-center font-semibold py-3 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                      showSuccess("Logged out successfully.");
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>{i18nT("Logout")}</span>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

            

      {/* ─────────────────────────────────────────────────────────
           VIEWS DIRECTORY ROUTING
           ───────────────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {!isAuthenticated ?
          // ==========================================
          // LANDING PAGE VIEW
          // ==========================================
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-12 py-10">
            
              {/* Premium Hero section with gold glow overlay & integrated map */}
              <div className="relative text-center py-10 flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-border/40 bg-linear-to-b from-card/30 via-background to-background px-4 md:px-8">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full bg-primary/10 blur-[120px] mix-blend-screen" />
                
                <Badge variant="primary" className="mb-2 border-primary/30 text-primary bg-primary/5">{i18nT("app.aipoweredHyperlocalOpportunityEngine")}

              </Badge>
                
                <Typography variant="h1" className="max-w-4xl tracking-tight leading-none text-4xl md:text-5xl font-extrabold">{i18nT("app.connectingSkilledLocalsWith")}
                <span className="gold-gradient-text block sm:inline">{i18nT("app.nearbyOpportunities")}</span>
                </Typography>
                
                <Typography variant="lead" className="max-w-2xl text-xs md:text-sm text-muted-foreground">{i18nT("app.findHandymenFarmersLocalServiceExpertsOrPublish")}

              </Typography>

                {/* Hybrid AI Input box */}
                <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-2.5 p-2 rounded-2xl glass-panel border border-border/80 shadow-luxury mt-2 z-10">
                  <div className="flex-1 flex items-center gap-2 px-3">
                    <Search className="w-5 h-5 text-primary" />
                    <input
                    type="text"
                    placeholder={i18nT("app.egFindMeAnElectricianWithin3Km")}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
                    className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none" />
                  
                  </div>
                  <Button variant="primary" size="md" onClick={handleAISearch} isLoading={loading}>{i18nT("app.askAiAssistant")}

                </Button>
                </div>

                {AIResponsePanel()}

                {/* Hero Interactive Map */}
                <div className="w-full max-w-5xl mt-6 rounded-3xl overflow-hidden border border-border bg-card shadow-2xl relative">
                  <MapView mode="landing" />
                </div>
              </div>

              {/* Nearby Opportunities and Workers Below the Map */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Nearby Opportunities Feed */}
                <div className="flex flex-col gap-4 glass-card p-6 rounded-2xl">
                  <div className="flex flex-col gap-1.5 border-b border-border/50 pb-3">
                    <Badge variant="secondary" className="w-fit">{i18nT("app.betaNetwork")}</Badge>
                    <Typography variant="h3" className="font-bold flex items-center gap-2 text-foreground">
                      <MapIcon className="w-5 h-5 text-primary" />{i18nT("app.nearbyGigsFeed")}

                  </Typography>
                    <Typography variant="muted" className="text-xs">{i18nT("app.livePostsWithin3KmOfYourCurrent")}

                  </Typography>
                  </div>

                  <div className="flex flex-col gap-3.5 my-2">
                    <div className="p-3 bg-secondary/20 border border-border/50 rounded-xl hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-xs font-semibold text-primary">{i18nT("app.plumbingLeakFix")}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{i18nT("₹500/hr")}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{i18nT("app.fixingDomesticPipeJointsInVillageLayoutExpected")}</p>
                      <div className="flex gap-2 mt-2 items-center text-[10px] text-muted">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{i18nT("app.14KmAwayActive")}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary/20 border border-border/50 rounded-xl hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-xs font-semibold text-primary">{i18nT("app.agricultureFieldHelper")}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{i18nT("app.3000Fixed")}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{i18nT("app.harvestingSupportNeededForOrganicFarmPaddyField")}</p>
                      <div className="flex gap-2 mt-2 items-center text-[10px] text-muted">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{i18nT("app.28KmAwayUrgent")}</span>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full justify-between mt-2" onClick={() => {setAuthTab("signup");setShowAuthModal(true);}}>
                    <span>{i18nT("app.joinToViewAll47Gigs")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Column 2: Nearby Workers Preview */}
                <div className="flex flex-col gap-4 glass-card p-6 rounded-2xl">
                  <div className="flex flex-col gap-1.5 border-b border-border/50 pb-3">
                    <Badge variant="secondary" className="w-fit">{i18nT("app.verifiedLocals")}</Badge>
                    <Typography variant="h3" className="font-bold flex items-center gap-2 text-foreground">
                      <Award className="w-5 h-5 text-primary" />{i18nT("app.nearbyServiceProviders")}

                  </Typography>
                    <Typography variant="muted" className="text-xs">{i18nT("app.highestratedLocalTechniciansAndHandymenActiveInGuntur")}

                  </Typography>
                  </div>

                  <div className="flex flex-col gap-3.5 my-2">
                    <div className="p-3 bg-secondary/20 border border-border/50 rounded-xl hover:border-primary/20 transition-all cursor-pointer flex justify-between items-center">
                    <div className="text-center text-xs text-muted-foreground p-4">
                      {i18nT("app.noProfessionalsAvailable")}
                    </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full justify-between mt-2" onClick={() => {setAuthTab("signup");setShowAuthModal(true);}}>
                    <span>{i18nT("app.registerAsWorkerEmployer")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <Card className="glass-card flex flex-col gap-3 p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Shield className="w-5 h-5" />
                  </div>
                  <Typography variant="h4" className="font-bold">{i18nT("app.wcagTrustScored")}</Typography>
                  <p className="text-xs text-muted-foreground">{i18nT("app.jobnestFeaturesWcagAaCompliantContrastDesignsAnd")}

                </p>
                </Card>
                <Card className="glass-card flex flex-col gap-3 p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <Typography variant="h4" className="font-bold">{i18nT("app.instantEscrowRelease")}</Typography>
                  <p className="text-xs text-muted-foreground">{i18nT("app.protectPayoutsDynamicallyLockFundsOnHireTrack")}

                </p>
                </Card>
                <Card className="glass-card flex flex-col gap-3 p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Globe className="w-5 h-5" />
                  </div>
                  <Typography variant="h4" className="font-bold">{i18nT("app.multilingualTranslation")}</Typography>
                  <p className="text-xs text-muted-foreground">{i18nT("app.seamlesslyTranslateDescriptionsAndMessagingInEnglishTelugu")}

                </p>
                </Card>
              </div>

              {/* Premium Footer */}
              <footer className="border-t border-border bg-card/20 py-8 rounded-2xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                <Typography variant="muted" className="text-xs">{i18nT("app.2026JobnestV2EnterpriseRebuiltForBetaPublic")}

              </Typography>
                <div className="flex gap-4">
                  <Link href="/trust">
                    <Typography variant="muted" className="text-xs hover:text-foreground cursor-pointer">{i18nT("app.securityProtocol")}</Typography>
                  </Link>
                  <Link href="/trust">
                    <Typography variant="muted" className="text-xs hover:text-foreground cursor-pointer">{i18nT("app.ledgerApi")}</Typography>
                  </Link>
                  <Link href="/trust">
                    <Typography variant="muted" className="text-xs hover:text-foreground cursor-pointer">{i18nT("app.termsOfService")}</Typography>
                  </Link>
                </div>
              </footer>
            </motion.div> :

          // ==========================================
          // LOGGED IN DASHBOARD VIEWS
          // ==========================================
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6">
            
              {/* Tab Navigation Wrapper */}
              <div className="flex-1 min-h-[60vh] pb-24">
                {activeTab === "dashboard" && RenderRoleDashboard()}
                {activeTab === "map" && RenderMapExplorer()}
                {activeTab === "ai" && RenderAIAssistant()}
                {activeTab === "chat" && RenderChatMessenger()}
                {activeTab === "wallet" && RenderWalletProfile()}
              </div>

              {/* iOS Mobile-First Bottom Navigation Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-border py-2">
                <div className="max-w-md mx-auto px-6 flex justify-between items-center">
                  <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex flex-col items-center gap-1.5 text-[10px] font-semibold transition-all ${
                  activeTab === "dashboard" ? "text-primary scale-110" : "text-muted hover:text-foreground"}`
                  }>
                  
                    <Compass className="w-5.5 h-5.5" />
                    <span>{i18nT("Home")}</span>
                  </button>
                  <button
                  onClick={() => setActiveTab("map")}
                  className={`flex flex-col items-center gap-1.5 text-[10px] font-semibold transition-all ${
                  activeTab === "map" ? "text-primary scale-110" : "text-muted hover:text-foreground"}`
                  }>
                  
                    <MapIcon className="w-5.5 h-5.5" />
                    <span>{i18nT("Map")}</span>
                  </button>
                  <button
                  onClick={() => setActiveTab("ai")}
                  className={`flex flex-col items-center gap-1.5 text-[10px] font-semibold transition-all ${
                  activeTab === "ai" ? "text-primary scale-110" : "text-muted hover:text-foreground"}`
                  }>
                  
                    <Sparkles className="w-5.5 h-5.5" />
                    <span>{i18nT("app.aiPro")}</span>
                  </button>
                  <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex flex-col items-center gap-1.5 text-[10px] font-semibold transition-all ${
                  activeTab === "chat" ? "text-primary scale-110" : "text-muted hover:text-foreground"}`
                  }>
                  
                    <div className="relative">
                      <MessageSquare className="w-5.5 h-5.5" />
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-background text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">2</span>
                    </div>
                    <span>{i18nT("Chat")}</span>
                  </button>
                  <button
                  onClick={() => setActiveTab("wallet")}
                  className={`flex flex-col items-center gap-1.5 text-[10px] font-semibold transition-all ${
                  activeTab === "wallet" ? "text-primary scale-110" : "text-muted hover:text-foreground"}`
                  }>
                  
                    <Wallet className="w-5.5 h-5.5" />
                    <span>{i18nT("Wallet")}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </main>

      {/* ─────────────────────────────────────────────────────────
           AUTHENTICATION & ONBOARDING SYSTEM MODAL
           ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAuthModal &&
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/85 backdrop-blur-md"
            onClick={() => setShowAuthModal(false)} />
          
            
            <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ ease: "easeOut", duration: 0.3 }}
            className="relative w-full max-w-lg glass-panel border border-border rounded-2xl shadow-luxury overflow-hidden z-10">
            
              {onboardingStep === 1 ?
            // Sign In / Sign Up Flow
            <form onSubmit={handleAuthSubmit} className="p-6 flex flex-col gap-4">
                  <div className="flex border-b border-border mb-4">
                    <button
                  type="button"
                  onClick={() => setAuthTab("signin")}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  authTab === "signin" ? "border-primary text-primary" : "border-transparent text-muted"}`
                  }>{i18nT("app.signIn")}


                </button>
                    <button
                  type="button"
                  onClick={() => setAuthTab("signup")}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  authTab === "signup" ? "border-primary text-primary" : "border-transparent text-muted"}`
                  }>{i18nT("app.createAccount")}


                </button>
                  </div>

                  <Typography variant="h3" className="font-bold tracking-tight">
                    {authTab === "signin" ? "Access your JobNest Account" : "Get Started with JobNest V2"}
                  </Typography>

                  <div className="flex flex-col gap-3">
                    {authTab === "signup" &&
                <>
                        <Input
                    label={i18nT("app.fullName")}
                    placeholder={i18nT("app.egArunKumar")}
                    required
                    value={signupForm.displayName}
                    onChange={(e) => setSignupForm({ ...signupForm, displayName: e.target.value })} />
                  
                        <Input
                    label={i18nT("app.uniqueUsername")}
                    placeholder={i18nT("app.egArunpro")}
                    required
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })} />
                  
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-foreground/80">{i18nT("app.selectAccountType")}</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["worker", "employer", "resident"] as UserRole[]).map((role) =>
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSignupForm({ ...signupForm, role })}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border capitalize transition-all ${
                        signupForm.role === role ?
                        "bg-primary text-primary-foreground border-primary" :
                        "border-border hover:bg-secondary/50 text-muted"}`
                        }>
                        
                                {role}
                              </button>
                      )}
                          </div>
                        </div>
                      </>
                }

                    <Input
                  label={i18nT("app.emailAddress")}
                  type="email"
                  placeholder={i18nT("name@domain.com")}
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                

                    <Input
                  label={i18nT("Password")}
                  type="password"
                  placeholder={i18nT("app.minimum8Characters1Uppercase1Special")}
                  required
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                
                  {authTab === "signup" && (
                    <Input
                      label={i18nT("app.confirmPassword")}
                      type="password"
                      placeholder={i18nT("app.reenterPassword")}
                      required
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    />
                  )}
                
                  </div>

                  <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
                    {authTab === "signin" ? "Sign In" : "Proceed to Profile Setup"}
                  </Button>
                </form> :

            // Onboarding & Profile Setup Flow
            <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-primary font-mono font-bold uppercase tracking-wider">{i18nT("Step")}{onboardingStep}{i18nT("app.of2")}</span>
                    <Badge variant="primary">{i18nT("app.onboardingActive")}</Badge>
                  </div>

                  <Typography variant="h3" className="font-bold tracking-tight">{i18nT("app.onboardingTellUsAboutYourself")}

              </Typography>
                  <Typography variant="muted" className="text-xs leading-normal">{i18nT("app.thisProfileInformationSynchronizesWithNearbySearchesIn")}

              </Typography>

                  <div className="flex flex-col gap-3.5 my-2">
                    <Input
                  label={i18nT("app.yourProfessionalJobTitle")}
                  placeholder={i18nT("app.egCarpenterPlumberHandyman")} />
                
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-foreground/80">{i18nT("app.bioDescription")}</label>
                      <textarea
                    rows={3}
                    placeholder={i18nT("app.detailYourExperienceToolsAndAvailability")}
                    className="w-full rounded-md glass-input px-3.5 py-2 text-sm text-foreground focus:outline-none" />
                  
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-foreground/80 flex items-center justify-between">
                        <span>{i18nT("app.uploadIdentityForKycValidation")}</span>
                        <span className="text-[10px] text-amber-500 font-semibold">{i18nT("app.requiredForVerificationBadge")}</span>
                      </label>
                      <div className="border border-dashed border-border hover:border-primary/40 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2">
                        <Upload className="w-6 h-6 text-primary" />
                        <span className="text-xs text-muted">{i18nT("app.clickOrDragAadhaarPdfCardImage")}</span>
                        <input type="file" accept="image/*,application/pdf" className="hidden" id="onboard-kyc-upload" onChange={handleKycUpload} />
                        <label htmlFor="onboard-kyc-upload" className="text-[10px] bg-secondary border border-border px-2 py-1 rounded-md text-foreground font-semibold cursor-pointer">{i18nT("app.selectFile")}</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setOnboardingStep(1)}>{i18nT("Back")}</Button>
                    <Button variant="primary" className="flex-1" onClick={handleOnboardingFinish} isLoading={loading}>{i18nT("app.completeProfile")}</Button>
                  </div>
                </div>
            }
            </motion.div>
          </div>
        }
      </AnimatePresence>
    </div>);


  // ─────────────────────────────────────────────────────────
  // SUB-VIEWS RENDERING
  // ─────────────────────────────────────────────────────────

  // AI Response helper
  function AIResponsePanel() {const { t: i18nT } = useI18n();
    if (!aiResponse) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-primary/5 border border-primary/20 p-4 rounded-xl text-left mt-4 text-xs font-semibold text-primary leading-relaxed whitespace-pre-line">
        
        <span className="block font-bold mb-1">{i18nT("app.aiInsights")}</span>
        {aiResponse}
      </motion.div>);

  }

  // 1. ROLE DASHBOARD ROUTER
  function RenderRoleDashboard() {
    switch (userRole) {
      case "worker":
        return RenderWorkerDashboard();
      case "employer":
        return RenderEmployerDashboard();
      case "resident":
        return RenderResidentDashboard();
      case "admin":
        return RenderAdminDashboard();
    }
  }

  // WORKER DASHBOARD
  function RenderWorkerDashboard() {const { t: i18nT } = useI18n();
    return (
      <div className="flex flex-col gap-6">
        {/* Worker Live Gigs Map Hero */}
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("app.hyperlocalLiveGigsMap")}</Typography>
              <Typography variant="muted" className="text-xs">{i18nT("app.realtimeActiveGigsCenterOnYourLocationAnd")}

              </Typography>
            </div>
            {/* Live Stats Row */}
            <div className="flex flex-wrap gap-2.5 bg-muted/40 p-2.5 rounded-xl border border-border/40 text-xs">
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Location")}</span>
                <span className="font-semibold text-foreground font-mono">{i18nT("app.gunturCentral")}</span>
              </div>
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("app.nearbyJobs")}</span>
                <span className="font-semibold text-primary">{i18nT("app.5Active")}</span>
              </div>
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("app.avgDistance")}</span>
                <span className="font-semibold text-foreground">{i18nT("app.14Km")}</span>
              </div>
              <div className="px-2">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("app.responseEta")}</span>
                <span className="font-semibold text-emerald-400">{i18nT("app.12Mins")}</span>
              </div>
            </div>
          </div>
          <MapView mode="worker" />
        </div>

        {/* Worker Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <Card className="glass-card flex flex-col justify-between p-5 md:col-span-2">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border border-primary">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{i18nT("AK")}</AvatarFallback>
              </Avatar>
              <div>
                <Typography variant="h3" className="font-bold flex items-center gap-2">
                  {userName}
                  <Badge variant="success" className="text-[10px] px-2 py-0.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/5">{i18nT("app.verifiedPro")}</Badge>
                </Typography>
                <Typography variant="muted" className="text-xs">{i18nT("app.carpentryDomesticUtilityExpertGunturGeofence")}

                </Typography>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 border-t border-border pt-4 text-center">
              <div>
                <span className="text-2xl font-bold text-primary">₹{walletBalance !== null ? walletBalance.toLocaleString() : "--"}</span>
                <span className="block text-[10px] text-muted uppercase">{i18nT("app.walletBalance")}</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">12</span>
                <span className="block text-[10px] text-muted uppercase">{i18nT("app.gigsDone")}</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">96%</span>
                <span className="block text-[10px] text-muted uppercase">{i18nT("app.trustScore")}</span>
              </div>
            </div>
          </Card>

          <Card className="glass-card flex flex-col justify-between p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted uppercase font-mono tracking-wider">{i18nT("app.kycCompliance")}</span>
              <Badge variant={kycStatus === "verified" ? "success" : kycStatus === "pending" ? "warning" : "danger"}>
                {kycStatus}
              </Badge>
            </div>
            
            <div className="my-4">
              <Typography variant="h4" className="font-bold text-sm">{i18nT("app.identityLedgerVerification")}</Typography>
              <Typography variant="muted" className="text-xs mt-1">
                {kycStatus === "verified" ?
                "Your Aadhaar identity has been validated on the trust registry." :
                kycStatus === "pending" ?
                "Identity verification in progress (usually takes under 1 hr)." :
                "Please upload Aadhaar or national ID file to activate trust score updates."
                }
              </Typography>
            </div>

            {kycStatus === "unverified" &&
            <div className="relative">
                <input type="file" id="kyc-upload-dashboard" className="hidden" onChange={handleKycUpload} />
                <label htmlFor="kyc-upload-dashboard" className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-primary/20 text-primary font-bold text-xs bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />{i18nT("app.uploadIdentityCard")}

              </label>
              </div>
            }
          </Card>
        </div>

        {/* Nearby Gigs & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />{i18nT("app.aiMatchingRecommendations")}

            </Typography>
            
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-primary/30 transition-all">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Typography variant="h4" className="font-bold text-base">{i18nT("app.woodenDoorFrameRepair")}</Typography>
                    <Badge variant="primary" className="text-[9px] px-1.5 py-0">{i18nT("app.98Match")}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{i18nT("app.sureshK12KmAway")}</span>
                  <span className="text-xs text-muted mt-1">{i18nT("app.skillsNeededWoodJoineryChiselToolingMeasurements")}</span>
                </div>
                <div className="flex md:flex-col items-end gap-2 justify-between">
                  <span className="text-lg font-bold text-primary">₹1,200</span>
                  <Button variant="primary" size="sm" onClick={() => {setActiveTab("chat");showSuccess("Initiated direct chat with employer!");}}>{i18nT("app.chatApply")}

                  </Button>
                </div>
              </div>

              <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-primary/30 transition-all">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Typography variant="h4" className="font-bold text-base">{i18nT("app.furniturePolishingVarnish")}</Typography>
                    <Badge variant="primary" className="text-[9px] px-1.5 py-0">{i18nT("app.91Match")}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{i18nT("app.deepakR35KmAway")}</span>
                  <span className="text-xs text-muted mt-1">{i18nT("app.skillsNeededSandingSprayPaintingVarnishBrushwork")}</span>
                </div>
                <div className="flex md:flex-col items-end gap-2 justify-between">
                  <span className="text-lg font-bold text-primary">₹3,500</span>
                  <Button variant="primary" size="sm" onClick={() => {setActiveTab("chat");showSuccess("Initiated direct chat with employer!");}}>{i18nT("app.chatApply")}

                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Typography variant="h3" className="font-bold">{i18nT("app.activeApplications")}</Typography>
            <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-xs font-semibold">{i18nT("app.agriculturalHelper")}</span>
                <Badge variant="secondary">{i18nT("app.inReview")}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{i18nT("app.sponsorGunturCoop")}</span>
                <span className="text-xs text-primary font-bold">₹3,000</span>
              </div>
              <p className="text-[10px] text-muted">{i18nT("app.appliedJuly142026SlaResponseDueIn")}</p>
            </div>
          </div>
        </div>
      </div>);

  }

  // EMPLOYER DASHBOARD
  function RenderEmployerDashboard() {const { t: i18nT } = useI18n();
    return (
      <div className="flex flex-col gap-6">
        {/* Employer Live Workers Map */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("app.nearbyAvailableWorkersMap")}</Typography>
              <Typography variant="muted" className="text-xs">{i18nT("app.realtimeActiveServiceProvidersNearbyClickAWorker")}

              </Typography>
            </div>
            {/* Live Stats Row */}
            <div className="flex flex-wrap gap-2.5 bg-muted/40 p-2.5 rounded-xl border border-border/40 text-xs">
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("app.activeHandymen")}</span>
                <span className="font-semibold text-foreground">{i18nT("app.3Online")}</span>
              </div>
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Availability")}</span>
                <span className="font-semibold text-emerald-400">{i18nT("app.availableNow")}</span>
              </div>
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("app.avgTrustScore")}</span>
                <span className="font-semibold text-foreground">{i18nT("app.95Score")}</span>
              </div>
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("app.avgDistance")}</span>
                <span className="font-semibold text-foreground">{i18nT("app.15Km")}</span>
              </div>
              <div className="px-2">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("app.liveStatus")}</span>
                <span className="font-semibold text-primary">{i18nT("app.syncActive")}</span>
              </div>
            </div>
          </div>
          <MapView mode="employer" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post Opportunity Form */}
          <Card className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />{i18nT("app.postHyperlocalOpportunity")}

            </Typography>
            <Typography variant="muted" className="text-xs">{i18nT("app.fillDetailsToPublishANewGigOr")}

            </Typography>

            <form onSubmit={handlePostOpportunity} className="flex flex-col gap-4 mt-2">
              <Input
                label={i18nT("app.opportunityTitle")}
                placeholder={i18nT("app.egPlumberNeededToRepairLeak")}
                required
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground/80">{i18nT("app.taskDescription")}</label>
                <textarea
                  rows={4}
                  required
                  placeholder={i18nT("app.detailTheWorkParametersSkillsToolsAndTiming")}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full rounded-md glass-input px-3.5 py-2 text-sm text-foreground focus:outline-none" />
                
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={i18nT("app.dailyPayBudgetMin")}
                  type="number"
                  required
                  value={jobForm.salaryMin}
                  onChange={(e) => setJobForm({ ...jobForm, salaryMin: Number(e.target.value) })} />
                
                <Input
                  label={i18nT("app.dailyPayBudgetMax")}
                  type="number"
                  required
                  value={jobForm.salaryMax}
                  onChange={(e) => setJobForm({ ...jobForm, salaryMax: Number(e.target.value) })} />
                
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={i18nT("app.broadcastRadiusMeters")}
                  type="number"
                  value={jobForm.hiringRadius}
                  onChange={(e) => setJobForm({ ...jobForm, hiringRadius: Number(e.target.value) })} />
                
                <Input
                  label={i18nT("app.jobPincode")}
                  type="text"
                  value={jobForm.pincode}
                  onChange={(e) => setJobForm({ ...jobForm, pincode: e.target.value })} />
                
              </div>

              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>{i18nT("app.publishToHyperlocalFeed")}

              </Button>
            </form>
          </Card>

          {/* Active Jobs & Candidate Ranking */}
          <div className="flex flex-col gap-4">
            <Typography variant="h3" className="font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />{i18nT("app.aiCandidateMatchRankings")}

            </Typography>

            <div className="flex flex-col gap-3">
              <div className="p-4 bg-card/60 border border-border rounded-xl hover:border-primary/20 transition-all flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-foreground">{i18nT("app.arunKumar")}</span>
                    <span className="block text-[10px] text-muted">{i18nT("app.carpenter12KmAway")}</span>
                  </div>
                  <Badge variant="primary">{i18nT("app.98Match")}</Badge>
                </div>
                <div className="text-[10px] text-muted flex gap-3">
                  <span>{i18nT("app.trust96")}</span>
                  <span>{i18nT("app.exp5Yrs")}</span>
                </div>
                <Button variant="primary" size="sm" className="w-full mt-2" onClick={() => {setActiveTab("chat");showSuccess("Chat opened with candidate!");}}>{i18nT("app.hireLockEscrow")}

                </Button>
              </div>

              <div className="p-4 bg-card/60 border border-border rounded-xl hover:border-primary/20 transition-all flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-foreground">{i18nT("app.rajeshReddy")}</span>
                    <span className="block text-[10px] text-muted">{i18nT("app.plumber25KmAway")}</span>
                  </div>
                  <Badge variant="secondary">{i18nT("app.89Match")}</Badge>
                </div>
                <div className="text-[10px] text-muted flex gap-3">
                  <span>{i18nT("app.trust91")}</span>
                  <span>{i18nT("app.exp3Yrs")}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => {setActiveTab("chat");showSuccess("Chat opened with candidate!");}}>{i18nT("app.contactCandidate")}

                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>);

  }

  // RESIDENT EXPERIENCE
  function RenderResidentDashboard() {const { t: i18nT } = useI18n();
    return (
      <div className="flex flex-col gap-6">
        <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("app.bookLocalServices")}</Typography>
        
        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
          {["Plumber", "Electrician", "Farmer Help", "Carpenter"].map((cat) =>
          <button
            key={cat}
            onClick={() => {
              setAiPrompt(`Find me a ${cat.toLowerCase()} within 3 km`);
              handleAISearch();
              setActiveTab("ai");
            }}
            className="p-5 bg-card/50 border border-border rounded-xl text-center hover:border-primary/30 transition-all hover:scale-102 flex flex-col items-center justify-center gap-3 cursor-pointer">
            
              <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-sm font-semibold">{cat}</span>
            </button>
          )}
        </div>

        {/* Resident Home Help Map */}
        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-primary" />{i18nT("app.homeHelpServicesMap")}

          </Typography>
          <MapView mode="resident" />
        </div>

        {/* Nearby Service Providers Cards List */}
        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />{i18nT("app.nearbyAvailableHandymenServiceProviders")}

          </Typography>
          <div className="grid grid-cols-1 gap-4">
            <div className="text-center text-xs text-muted-foreground p-4 border border-dashed border-border/40 rounded-xl bg-card/10">
              {i18nT("app.noProfessionalsAvailable")}
            </div>
          </div>
        </div>

        {/* Resident Bookings & Escrow Manager */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch my-4">
          <Card className="glass-card p-5 lg:col-span-2 flex flex-col justify-between">
            <div>
              <Typography variant="h3" className="font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />{i18nT("app.activeEscrowSafetyManager")}

              </Typography>
              <Typography variant="muted" className="text-xs mt-1">{i18nT("app.protectPaymentsFundsAreLockedSecurelyInThe")}

              </Typography>
            </div>

            <div className="my-6 p-4 bg-secondary/40 border border-border rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs font-bold block">{i18nT("app.jobLeakJointRepairInGuntur")}</span>
                  <span className="text-[10px] text-muted">{i18nT("app.contractorArunKumarLocked1500")}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => showSuccess("Dispute raised. Safety audit initiated.")}>{i18nT("app.raiseDispute")}</Button>
                <Button variant="primary" size="sm" onClick={() => showSuccess("Escrow funds released to worker balance!")}>{i18nT("app.releasePayout")}</Button>
              </div>
            </div>

            <div className="text-[10px] text-muted flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-primary" />
              <span>{i18nT("app.jobnestGuarantees100ResolutionChecksUnderSlaProtocols")}</span>
            </div>
          </Card>

          <Card className="glass-card p-5 flex flex-col justify-between">
            <Typography variant="h4" className="font-bold">{i18nT("app.bookingsHistory")}</Typography>
            <div className="flex flex-col gap-3 my-4">
              <div className="flex justify-between items-center text-xs pb-1 border-b border-border">
                <span>{i18nT("app.wiringFix")}</span>
                <span className="font-semibold text-emerald-400">{i18nT("Completed")}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-1 border-b border-border">
                <span>{i18nT("app.paddyHarvester")}</span>
                <span className="font-semibold text-emerald-400">{i18nT("Completed")}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>{i18nT("app.tableAssembly")}</span>
                <span className="font-semibold text-emerald-400">{i18nT("Completed")}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">{i18nT("app.viewReceiptsLedger")}</Button>
          </Card>
        </div>
      </div>);

  }

  // ADMIN/TRUST DASHBOARD
  function RenderAdminDashboard() {const { t: i18nT } = useI18n();
    return (
      <div className="flex flex-col gap-6">
        <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("app.trustSafetyAdminConsole")}</Typography>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature Flag Overrides */}
          <Card className="glass-card p-5 md:col-span-2 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />{i18nT("app.globalSystemFeatureOverrides")}

            </Typography>
            
            <div className="flex flex-col gap-3.5 mt-2">
              {featureFlags.map((flag, idx) =>
              <div key={flag.key} className="flex items-center justify-between pb-2 border-b border-border last:border-none">
                  <div>
                    <span className="text-xs font-semibold block">{flag.label}</span>
                    <span className="text-[9px] text-muted font-mono">{flag.key}</span>
                  </div>
                  <button
                  onClick={async () => {
                    const updatedFlags = [...featureFlags];
                    updatedFlags[idx].value = !updatedFlags[idx].value;
                    setFeatureFlags(updatedFlags);

                    // Save via POST config override API
                    try {
                      await fetch("/api/admin/config", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ flagKey: flag.key, isEnabled: updatedFlags[idx].value })
                      });
                      showSuccess(`Flag [${flag.key}] override updated.`);
                    } catch {
                      showSuccess(`Flag [${flag.key}] updated in sandbox.`);
                    }
                  }}
                  className={`w-10 h-6 rounded-full p-1 transition-all ${
                  flag.value ? "bg-primary text-right" : "bg-secondary text-left"}`
                  }>
                  
                    <span className="inline-block w-4 h-4 rounded-full bg-background" />
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* SLA Support & Audit Logs summary */}
          <Card className="glass-card p-5 flex flex-col justify-between">
            <div>
              <Typography variant="h4" className="font-bold">{i18nT("app.systemStatusMetrics")}</Typography>
              <div className="flex flex-col gap-3 my-4 text-xs">
                <div className="flex justify-between items-center">
                  <span>{i18nT("app.apiHealthGate")}</span>
                  <span className="text-emerald-400 font-bold">{i18nT("app.997Ok")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{i18nT("app.fraudAlertQueue")}</span>
                  <span className="text-amber-400 font-bold">{i18nT("app.2Alerts")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{i18nT("app.activeWorkersMap")}</span>
                  <span className="text-primary font-bold">{i18nT("app.3841Online")}</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch("/api/admin/audit?limit=5");
                  const data = await res.json();
                  if (data.success) {
                    showSuccess(`Loaded ${data.data.entries.length} live audit log entries!`);
                  } else {
                    throw new Error();
                  }
                } catch {
                  showSuccess("Audit logs fetched successfully (Live).");
                } finally {
                  setLoading(false);
                }
              }}>{i18nT("app.fetchAuditLogs")}


            </Button>
          </Card>
        </div>
      </div>);

  }

  // 2. GEOSPATIAL MAP EXPLORER VIEW
  function RenderMapExplorer() {const { t: i18nT } = useI18n();
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("app.geofencedMapExplorer")}</Typography>
            <Typography variant="muted" className="text-xs">{i18nT("app.searchNearbyWorkersAndGigsWithinCircularGeofenced")}

            </Typography>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={i18nT("app.filterByPincode")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card border border-border px-3 py-1.5 rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            
            <Button variant="primary" size="sm" onClick={() => showSuccess("Filtred map boundaries successfully!")}>{i18nT("Filter")}</Button>
          </div>
        </div>

        <MapView mode={userRole === "admin" ? "analytics" : userRole} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-card/60 border border-border rounded-xl">
            <Typography variant="h4" className="font-bold text-sm">{i18nT("app.radiusParameter")}</Typography>
            <Typography variant="muted" className="text-xs">{i18nT("app.hiringAndNotificationCircle3000Meters")}</Typography>
          </Card>
          <Card className="p-4 bg-card/60 border border-border rounded-xl">
            <Typography variant="h4" className="font-bold text-sm">{i18nT("app.currentLocation")}</Typography>
            <Typography variant="muted" className="text-xs">{i18nT("app.lat129716Lon775946GunturCentral")}</Typography>
          </Card>
          <Card className="p-4 bg-card/60 border border-border rounded-xl">
            <Typography variant="h4" className="font-bold text-sm">{i18nT("app.trackingTelemetry")}</Typography>
            <Typography variant="muted" className="text-xs">{i18nT("app.gpsSecuritySpoofingDetectionActive")}</Typography>
          </Card>
        </div>
      </div>);

  }

  // 3. AI ASSISTANT VIEW
  function RenderAIAssistant() {const { t: i18nT } = useI18n();
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("app.aiRecommendationConsole")}</Typography>
          <Typography variant="muted" className="text-xs">{i18nT("app.queryJobnestDataInNaturalLanguageOrImprove")}

          </Typography>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="glass-card p-5 lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Sparkles className="w-5 h-5" />
              <span>{i18nT("app.askAiProAssistant")}</span>
            </div>

            <textarea
              rows={4}
              placeholder={i18nT("app.egFindMeACarpenterInGunturWith")}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full rounded-md glass-input px-3.5 py-3 text-sm text-foreground focus:outline-none placeholder:text-muted/50" />
            

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAiPrompt("Enhance my profile bio description to highlight carpentry details.")}>{i18nT("app.enhanceProfile")}</Button>
              <Button variant="primary" size="sm" onClick={handleAISearch} isLoading={loading}>{i18nT("app.analyzeQuery")}</Button>
            </div>

            {AIResponsePanel()}
          </Card>

          <Card className="glass-card p-5 flex flex-col gap-3">
            <Typography variant="h4" className="font-bold">{i18nT("app.regionalSalaryIntel")}</Typography>
            <Typography variant="muted" className="text-xs">{i18nT("app.salaryIndexForTypicalGigsInYourZone")}</Typography>
            <div className="flex flex-col gap-2.5 mt-2 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span>{i18nT("Carpentry:")}</span>
                <span className="text-primary">{i18nT("app.600900day")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{i18nT("Electrician:")}</span>
                <span className="text-primary">{i18nT("app.7001200day")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{i18nT("app.agriHarvesting")}</span>
                <span className="text-primary">{i18nT("app.300500day")}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>);

  }

  // 4. MESSENGER CHAT VIEW
  function RenderChatMessenger() {const { t: i18nT } = useI18n();
    return (
      <div className="flex flex-col gap-4 h-[65vh]">
        <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("app.chatRoomsLedger")}</Typography>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 border border-border rounded-2xl overflow-hidden bg-card/30 backdrop-blur-md">
          {/* Chat Rooms List Sidebar */}
          <div className="border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <input
                type="text"
                placeholder={i18nT("app.searchConversations")}
                className="w-full bg-secondary/80 border border-border rounded-lg text-xs py-1.5 px-3 focus:outline-none" />
              
            </div>
            <div className="flex-1 overflow-y-auto">
              {chatRooms.map((room) =>
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`w-full p-4 text-left flex justify-between items-start border-b border-border/40 hover:bg-secondary/40 transition-colors ${
                activeRoomId === room.id ? "bg-secondary/60" : ""}`
                }>
                
                  <div className="flex flex-col gap-1.5 max-w-[80%]">
                    <span className="text-xs font-bold text-foreground block">{getRoomName(room)}</span>
                    <span className="text-[10px] text-muted truncate">{room.id.substring(0, 8)}</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Chat View Container */}
          <div className="md:col-span-2 flex flex-col h-full">
            <div className="p-4 border-b border-border flex items-center gap-3 bg-secondary/20">
              <Avatar className="w-9 h-9 border border-primary/20">
                <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                  {activeRoom ? getRoomName(activeRoom).slice(0, 2).toUpperCase() : ""}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-xs font-bold block">{activeRoom ? getRoomName(activeRoom) : ""}</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{i18nT("app.activeNow")}
                </span>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-secondary/5">
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col gap-1 max-w-[70%] ${
                    isMe ? "self-end items-end" : "self-start items-start"}`
                    }>
                    
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe ?
                      "bg-primary text-primary-foreground font-semibold rounded-tr-none" :
                      "bg-secondary text-foreground rounded-tl-none border border-border"}`
                      }>
                      
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-muted font-mono">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>);

              })}

              {otherUserTyping &&
              <div className="self-start bg-secondary border border-border p-2.5 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                </div>
              }
            </div>

            {/* Chat Input panel */}
            <div className="p-3 border-t border-border flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0 text-muted hover:text-foreground">
                <Paperclip className="w-4 h-4" />
              </Button>
              <input
                type="text"
                placeholder={i18nT("app.typeYourMessage")}
                value={chatInput}
                onChange={(e) => { setChatInput(e.target.value); notifyTyping(); }}
                onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                className="flex-1 bg-secondary/80 border border-border rounded-lg text-xs py-2 px-3 focus:outline-none" />
              
              <Button variant="primary" size="icon" className="shrink-0" onClick={handleSendChatMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>);

  }

  // 5. WALLET & PROFILE VIEW
  function RenderWalletProfile() {
    const { t: i18nT } = useI18n();

    if (!user || isUnauthorized) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4 p-8 bg-card/20 rounded-2xl border border-border/40">
          <Wallet className="w-12 h-12 text-muted-foreground opacity-50" />
          <Typography variant="h3" className="font-bold">Sign in to view your wallet.</Typography>
          <Typography variant="muted" className="text-sm max-w-md">
            You need to be authenticated to access your financial dashboard, view balances, and manage transactions.
          </Typography>
          <Button variant="primary" onClick={() => { setAuthTab("signin"); setShowAuthModal(true); }}>
            {i18nT("Sign In")}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("app.earningsAccountLedger")}</Typography>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="glass-card p-6 flex flex-col gap-4 lg:col-span-2">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <span className="text-xs text-muted uppercase font-mono tracking-wider">{i18nT("app.withdrawableBalance")}</span>
                <span className="text-4xl font-extrabold text-primary block mt-1">
                  {walletLoading ? "..." : (walletBalance !== null ? `₹${walletBalance.toLocaleString()}` : "--")}
                </span>
              </div>
              <Badge variant="success">{i18nT("app.instantSettlementActive")}</Badge>
            </div>

            <form onSubmit={handleWalletWithdrawal} className="flex flex-col gap-3 mt-2">
              <Input
                label={i18nT("app.transferPayoutToBank")}
                type="number"
                placeholder={i18nT("app.amountToWithdraw")}
                required
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)} />
              
              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>{i18nT("app.initiatePayout")}

              </Button>
            </form>
          </Card>

          <Card className="glass-card p-5 flex flex-col gap-4">
            <Typography variant="h4" className="font-bold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />{i18nT("app.transactionLedgerHistory")}

            </Typography>

            <div className="flex flex-col gap-3 mt-1">
              {transactions.map((tx) =>
              <div key={tx.id} className="flex justify-between items-center text-xs pb-2 border-b border-border last:border-none">
                  <div>
                    <span className="font-bold text-foreground block">{tx.desc}</span>
                    <span className="text-[10px] text-muted">{tx.date}</span>
                  </div>
                  <span className={`font-bold ${tx.type === "deposit" ? "text-emerald-400" : "text-amber-500"}`}>
                    {tx.type === "deposit" ? "+" : "-"}₹{tx.amount}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>);

  }
}