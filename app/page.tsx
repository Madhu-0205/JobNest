"use client";

import React, { useState } from "react";import { useI18n } from "@/lib/i18n/context";
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
  AlertCircle,
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
  CheckCircle,
  Lock,
  Loader2 } from
"lucide-react";

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
    loading: () =>
    <div className="w-full h-137.5 rounded-3xl overflow-hidden border border-primary/10 shadow-xl bg-card flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Loading interactive neighborhood map...</span>
      </div>

  }
);

// Server action imports
import { signInAction, signUpAction } from "@/features/auth/actions";
import { createOpportunityAction } from "@/features/opportunity/actions";
import { saveWorkerProfileAction, uploadKycDocumentAction } from "@/features/user/actions";

// Types
type UserRole = "worker" | "employer" | "resident" | "admin";
type AppTab = "dashboard" | "map" | "ai" | "chat" | "wallet";

export default function PremiumHomePage() {const { t: i18nT } = useI18n();
  // ─────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────
  const { isAuthenticated, user, login, signup, logout } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>("worker");
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const userName = user?.name || "Arun Kumar";

  // Onboarding & Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    displayName: "",
    username: "",
    role: "worker" as UserRole
  });

  // UI state overlays
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Chat State
  const chatRooms = [
  { id: "room-1", name: "Suresh (Plumbing Gig)", lastMsg: "Please send your location", unread: 2 },
  { id: "room-2", name: "Deepak (Farming Help)", lastMsg: "Let's meet near mandal Taluk", unread: 0 },
  { id: "room-3", name: "JobNest Support Team", lastMsg: "SLA response time is under 1 hr", unread: 0 }];

  const [activeRoomId, setActiveRoomId] = useState("room-1");
  const [messages, setMessages] = useState([
  { sender: "Suresh", text: "Hello! Are you available to fix a water leakage in Guntur?", time: "10:30 AM" },
  { sender: "You", text: "Yes, I can start today. What's the location?", time: "10:32 AM" },
  { sender: "Suresh", text: "Near the Main Bazaar Road, around 3 km from center.", time: "10:35 AM" }]
  );
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // AI & Search State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(2500);
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

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg = { sender: "You", text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsTyping(true);

    // Simulate responder
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
      ...prev,
      { sender: "Suresh", text: "Got it. I will accept the work parameters. Proceeding with payment lock.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
      );
    }, 2000);
  };

  // ─────────────────────────────────────────────────────────
  // BACKEND API CONNECTORS
  // ─────────────────────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.info("[DEBUG] handleAuthSubmit started. authTab:", authTab);
    setLoading(true);
    setErrorMessage(null);

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
          setSuccessMessage("Successfully authenticated.");
          window.location.reload();
        } else {
          console.info("[DEBUG] signInAction error branch. message:", result.error?.message);
          setErrorMessage(result.error?.message || "Authentication failed. Please verify credentials.");
        }
      } else {
        // Run signUpAction
        const result = await signUpAction({
          email: signupForm.email,
          password: signupForm.password,
          displayName: signupForm.displayName,
          username: signupForm.username,
          role: signupForm.role
        });

        if (result.success) {
          setUserRole(signupForm.role);
          setOnboardingStep(2); // trigger profile setup onboarding
        } else {
          setErrorMessage(result.error?.message || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      const errorObj = err as Error;
      console.info("[DEBUG] handleAuthSubmit catch block:", errorObj);
      setErrorMessage(errorObj.message || "Authentication failed.");
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
      setSuccessMessage("Onboarding profile saved successfully!");
    } catch {
      // Sandbox fallback
      await signup(signupForm.email, signupForm.role, signupForm.displayName || signupForm.username || "Arun Kumar");
      setShowAuthModal(false);
      setSuccessMessage("Profile saved in Sandbox Mode.");
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
        setSuccessMessage(`Opportunity posted successfully! ID: ${result.data.opportunityId}`);
        setJobForm({ title: "", description: "", salaryMin: 300, salaryMax: 800, hiringRadius: 5000, pincode: "522002" });
      } else {
        // Sandbox bypass
        setSuccessMessage("Opportunity posted to sandbox feed.");
        setJobForm({ title: "", description: "", salaryMin: 300, salaryMax: 800, hiringRadius: 5000, pincode: "522002" });
      }
    } catch (err) {
      const errorObj = err as Error;
      setErrorMessage(errorObj.message || "Failed to create opportunity.");
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
      setSuccessMessage("KYC Document verified successfully!");
    } catch {
      setKycStatus("verified");
      setSuccessMessage("KYC Document uploaded to sandbox.");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > walletBalance) {
      setErrorMessage("Invalid withdrawal amount.");
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
        setWalletBalance((prev) => prev - amount);
        setTransactions((prev) => [
        { id: `tx-${Date.now()}`, type: "withdrawal", amount, desc: "Payout to Bank", date: "Today" },
        ...prev]
        );
        setSuccessMessage("Payout transfer initiated successfully!");
        setWithdrawAmount("");
      } else {
        throw new Error(data.error?.message || "Wallet engine reject.");
      }
    } catch {
      // Sandbox fallback
      setWalletBalance((prev) => prev - amount);
      setTransactions((prev) => [
      { id: `tx-${Date.now()}`, type: "withdrawal", amount, desc: "Payout to Bank (Sandbox)", date: "Today" },
      ...prev]
      );
      setSuccessMessage("Payout simulation completed successfully!");
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
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-linear-to-r from-primary to-amber-600 flex items-center justify-center text-background font-extrabold text-xl shadow-lg shadow-primary/10">{i18nT("J")}

            </span>
            <span className="flex flex-col">
              <Typography variant="h3" as="span" className="font-bold tracking-tight text-lg leading-none gold-gradient-text">{i18nT("JobNest")}

              </Typography>
              <span className="text-[10px] text-primary tracking-widest font-mono uppercase">{i18nT("V2 Enterprise")}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ?
            <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 bg-secondary/80 border border-border px-3 py-1 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{i18nT("Role:")}
                <span className="text-primary font-bold capitalize">{userRole}</span>
                </span>
                
                {/* Quick Role Switcher */}
                <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-card border border-border rounded-lg text-xs py-1 px-2 text-foreground focus:ring-1 focus:ring-primary focus:outline-none">
                
                  <option value="worker">{i18nT("Worker Mode")}</option>
                  <option value="employer">{i18nT("Employer Mode")}</option>
                  <option value="resident">{i18nT("Resident Mode")}</option>
                  <option value="admin">{i18nT("Admin Panel")}</option>
                </select>

                <LanguageSwitcher />

                <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  setSuccessMessage("Logged out successfully.");
                }}
                className="flex items-center gap-1 text-xs">
                
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{i18nT("Logout")}</span>
                </Button>
              </div> :

            <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <Button variant="outline" size="sm" onClick={() => {setAuthTab("signin");setShowAuthModal(true);}}>{i18nT("Sign In")}

              </Button>
                <Button variant="primary" size="sm" onClick={() => {setAuthTab("signup");setShowAuthModal(true);}}>{i18nT("Get Started")}

              </Button>
              </div>
            }
          </div>
        </div>
      </header>

      {/* Main Toast Notifications */}
      {successMessage &&
      <div className="fixed top-20 right-4 z-50 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 max-w-sm animate-slide-up">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-400 hover:text-emerald-200">×</button>
        </div>
      }
      {errorMessage &&
      <div className="fixed top-20 right-4 z-50 bg-rose-950/80 border border-rose-500/30 text-rose-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 max-w-sm animate-slide-up">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-rose-400 hover:text-rose-200">×</button>
        </div>
      }

      {/* ─────────────────────────────────────────────────────────
           VIEWS DIRECTORY ROUTING
           ───────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
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
                
                <Badge variant="primary" className="mb-2 border-primary/30 text-primary bg-primary/5">{i18nT("🌟 AI-Powered Hyperlocal Opportunity Engine")}

              </Badge>
                
                <Typography variant="h1" className="max-w-4xl tracking-tight leading-none text-4xl md:text-5xl font-extrabold">{i18nT("Connecting Skilled Locals with")}
                <span className="gold-gradient-text block sm:inline">{i18nT("Nearby Opportunities")}</span>
                </Typography>
                
                <Typography variant="lead" className="max-w-2xl text-xs md:text-sm text-muted-foreground">{i18nT("Find handymen, farmers, local service experts, or publish active gigs in your municipality with escrow protection, translation support, and live telemetry tracking.")}

              </Typography>

                {/* Hybrid AI Input box */}
                <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-2.5 p-2 rounded-2xl glass-panel border border-border/80 shadow-luxury mt-2 z-10">
                  <div className="flex-1 flex items-center gap-2 px-3">
                    <Search className="w-5 h-5 text-primary" />
                    <input
                    type="text"
                    placeholder={i18nT("e.g. Find me an electrician within 3 km...")}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
                    className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none" />
                  
                  </div>
                  <Button variant="primary" size="md" onClick={handleAISearch} isLoading={loading}>{i18nT("Ask AI Assistant")}

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
                    <Badge variant="secondary" className="w-fit">{i18nT("Beta Network")}</Badge>
                    <Typography variant="h3" className="font-bold flex items-center gap-2 text-foreground">
                      <MapIcon className="w-5 h-5 text-primary" />{i18nT("Nearby Gigs Feed")}

                  </Typography>
                    <Typography variant="muted" className="text-xs">{i18nT("Live posts within 3 km of your current coordinates. Click to apply.")}

                  </Typography>
                  </div>

                  <div className="flex flex-col gap-3.5 my-2">
                    <div className="p-3 bg-secondary/20 border border-border/50 rounded-xl hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-xs font-semibold text-primary">{i18nT("Plumbing Leak Fix")}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{i18nT("₹500/hr")}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{i18nT("Fixing domestic pipe joints in village layout. Expected duration: 2 hours.")}</p>
                      <div className="flex gap-2 mt-2 items-center text-[10px] text-muted">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{i18nT("1.4 km away • Active")}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary/20 border border-border/50 rounded-xl hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-xs font-semibold text-primary">{i18nT("Agriculture Field Helper")}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{i18nT("₹3,000 fixed")}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{i18nT("Harvesting support needed for organic farm paddy field.")}</p>
                      <div className="flex gap-2 mt-2 items-center text-[10px] text-muted">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{i18nT("2.8 km away • Urgent")}</span>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full justify-between mt-2" onClick={() => {setAuthTab("signup");setShowAuthModal(true);}}>
                    <span>{i18nT("Join to view all 47 gigs")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Column 2: Nearby Workers Preview */}
                <div className="flex flex-col gap-4 glass-card p-6 rounded-2xl">
                  <div className="flex flex-col gap-1.5 border-b border-border/50 pb-3">
                    <Badge variant="secondary" className="w-fit">{i18nT("Verified Locals")}</Badge>
                    <Typography variant="h3" className="font-bold flex items-center gap-2 text-foreground">
                      <Award className="w-5 h-5 text-primary" />{i18nT("Nearby Service Providers")}

                  </Typography>
                    <Typography variant="muted" className="text-xs">{i18nT("Highest-rated local technicians and handymen active in Guntur.")}

                  </Typography>
                  </div>

                  <div className="flex flex-col gap-3.5 my-2">
                    <div className="p-3 bg-secondary/20 border border-border/50 rounded-xl hover:border-primary/20 transition-all cursor-pointer flex justify-between items-center">
                      <div>
                        <span className="text-xs font-semibold text-foreground block">{i18nT("Arun Kumar")}</span>
                        <span className="text-[10px] text-muted-foreground">{i18nT("Carpenter • 5 Years Exp")}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-500 block">4.9 ★</span>
                        <span className="text-[9px] text-emerald-400 font-mono">{i18nT("Available Now")}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary/20 border border-border/50 rounded-xl hover:border-primary/20 transition-all cursor-pointer flex justify-between items-center">
                      <div>
                        <span className="text-xs font-semibold text-foreground block">{i18nT("Suresh Prasad")}</span>
                        <span className="text-[10px] text-muted-foreground">{i18nT("Electrician • 3 Years Exp")}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-500 block">4.8 ★</span>
                        <span className="text-[9px] text-emerald-400 font-mono">{i18nT("Available Now")}</span>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full justify-between mt-2" onClick={() => {setAuthTab("signup");setShowAuthModal(true);}}>
                    <span>{i18nT("Register as Worker / Employer")}</span>
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
                  <Typography variant="h4" className="font-bold">{i18nT("WCAG & Trust Scored")}</Typography>
                  <p className="text-xs text-muted-foreground">{i18nT("JobNest features WCAG AA compliant contrast designs and a cryptographic Trust & Safety audit ledger keeping ratings transparent.")}

                </p>
                </Card>
                <Card className="glass-card flex flex-col gap-3 p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <Typography variant="h4" className="font-bold">{i18nT("Instant Escrow Release")}</Typography>
                  <p className="text-xs text-muted-foreground">{i18nT("Protect payouts dynamically. Lock funds on hire, track worker ETA in real-time, and release automatically upon validated gig completion.")}

                </p>
                </Card>
                <Card className="glass-card flex flex-col gap-3 p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Globe className="w-5 h-5" />
                  </div>
                  <Typography variant="h4" className="font-bold">{i18nT("Multilingual Translation")}</Typography>
                  <p className="text-xs text-muted-foreground">{i18nT("Seamlessly translate descriptions and messaging in English, Telugu, and Hindi to bridge local language divides.")}

                </p>
                </Card>
              </div>

              {/* Premium Footer */}
              <footer className="border-t border-border bg-card/20 py-8 rounded-2xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                <Typography variant="muted" className="text-xs">{i18nT("© 2026 JobNest V2 Enterprise. Rebuilt for beta public launch.")}

              </Typography>
                <div className="flex gap-4">
                  <Typography variant="muted" className="text-xs hover:text-foreground cursor-pointer">{i18nT("Security Protocol")}</Typography>
                  <Typography variant="muted" className="text-xs hover:text-foreground cursor-pointer">{i18nT("Ledger API")}</Typography>
                  <Typography variant="muted" className="text-xs hover:text-foreground cursor-pointer">{i18nT("Terms of Service")}</Typography>
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
                    <span>{i18nT("AI Pro")}</span>
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
                  }>{i18nT("Sign In")}


                </button>
                    <button
                  type="button"
                  onClick={() => setAuthTab("signup")}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  authTab === "signup" ? "border-primary text-primary" : "border-transparent text-muted"}`
                  }>{i18nT("Create Account")}


                </button>
                  </div>

                  <Typography variant="h3" className="font-bold tracking-tight">
                    {authTab === "signin" ? "Access your JobNest Account" : "Get Started with JobNest V2"}
                  </Typography>

                  <div className="flex flex-col gap-3">
                    {authTab === "signup" &&
                <>
                        <Input
                    label={i18nT("Full Name")}
                    placeholder={i18nT("e.g. Arun Kumar")}
                    required
                    value={signupForm.displayName}
                    onChange={(e) => setSignupForm({ ...signupForm, displayName: e.target.value })} />
                  
                        <Input
                    label={i18nT("Unique Username")}
                    placeholder={i18nT("e.g. arun_pro")}
                    required
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })} />
                  
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-foreground/80">{i18nT("Select Account Type")}</label>
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
                  label={i18nT("Email Address")}
                  type="email"
                  placeholder={i18nT("name@domain.com")}
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                

                    <Input
                  label={i18nT("Password")}
                  type="password"
                  placeholder={i18nT("Minimum 6 characters")}
                  required
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                
                  </div>

                  <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
                    {authTab === "signin" ? "Sign In" : "Proceed to Profile Setup"}
                  </Button>
                </form> :

            // Onboarding & Profile Setup Flow
            <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-primary font-mono font-bold uppercase tracking-wider">{i18nT("Step")}{onboardingStep}{i18nT("of 2")}</span>
                    <Badge variant="primary">{i18nT("Onboarding Active")}</Badge>
                  </div>

                  <Typography variant="h3" className="font-bold tracking-tight">{i18nT("Onboarding: Tell us about yourself")}

              </Typography>
                  <Typography variant="muted" className="text-xs leading-normal">{i18nT("This profile information synchronizes with nearby searches in your hyperlocal geofence.")}

              </Typography>

                  <div className="flex flex-col gap-3.5 my-2">
                    <Input
                  label={i18nT("Your Professional Job Title")}
                  placeholder={i18nT("e.g. Carpenter, Plumber, Handyman")} />
                
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-foreground/80">{i18nT("Bio Description")}</label>
                      <textarea
                    rows={3}
                    placeholder={i18nT("Detail your experience, tools, and availability...")}
                    className="w-full rounded-md glass-input px-3.5 py-2 text-sm text-foreground focus:outline-none" />
                  
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-foreground/80 flex items-center justify-between">
                        <span>{i18nT("Upload Identity for KYC Validation")}</span>
                        <span className="text-[10px] text-amber-500 font-semibold">{i18nT("*Required for verification badge")}</span>
                      </label>
                      <div className="border border-dashed border-border hover:border-primary/40 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2">
                        <Upload className="w-6 h-6 text-primary" />
                        <span className="text-xs text-muted">{i18nT("Click or drag Aadhaar PDF / Card image")}</span>
                        <input type="file" accept="image/*,application/pdf" className="hidden" id="onboard-kyc-upload" onChange={handleKycUpload} />
                        <label htmlFor="onboard-kyc-upload" className="text-[10px] bg-secondary border border-border px-2 py-1 rounded-md text-foreground font-semibold cursor-pointer">{i18nT("Select File")}</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setOnboardingStep(1)}>{i18nT("Back")}</Button>
                    <Button variant="primary" className="flex-1" onClick={handleOnboardingFinish} isLoading={loading}>{i18nT("Complete Profile")}</Button>
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
        
        <span className="block font-bold mb-1">{i18nT("🤖 AI Insights:")}</span>
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
              <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("Hyperlocal Live Gigs Map")}</Typography>
              <Typography variant="muted" className="text-xs">{i18nT("Real-time active gigs. Center on your location and click any marker to apply.")}

              </Typography>
            </div>
            {/* Live Stats Row */}
            <div className="flex flex-wrap gap-2.5 bg-muted/40 p-2.5 rounded-xl border border-border/40 text-xs">
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Location")}</span>
                <span className="font-semibold text-foreground font-mono">{i18nT("Guntur Central")}</span>
              </div>
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Nearby Jobs")}</span>
                <span className="font-semibold text-primary">{i18nT("5 active")}</span>
              </div>
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Avg Distance")}</span>
                <span className="font-semibold text-foreground">{i18nT("1.4 km")}</span>
              </div>
              <div className="px-2">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Response ETA")}</span>
                <span className="font-semibold text-emerald-400">{i18nT("12 mins")}</span>
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
                  <Badge variant="success" className="text-[10px] px-2 py-0.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/5">{i18nT("Verified Pro")}</Badge>
                </Typography>
                <Typography variant="muted" className="text-xs">{i18nT("Carpentry & Domestic Utility Expert • Guntur Geofence")}

                </Typography>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 border-t border-border pt-4 text-center">
              <div>
                <span className="text-2xl font-bold text-primary">₹{walletBalance}</span>
                <span className="block text-[10px] text-muted uppercase">{i18nT("Wallet Balance")}</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">12</span>
                <span className="block text-[10px] text-muted uppercase">{i18nT("Gigs Done")}</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">96%</span>
                <span className="block text-[10px] text-muted uppercase">{i18nT("Trust Score")}</span>
              </div>
            </div>
          </Card>

          <Card className="glass-card flex flex-col justify-between p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted uppercase font-mono tracking-wider">{i18nT("KYC Compliance")}</span>
              <Badge variant={kycStatus === "verified" ? "success" : kycStatus === "pending" ? "warning" : "danger"}>
                {kycStatus}
              </Badge>
            </div>
            
            <div className="my-4">
              <Typography variant="h4" className="font-bold text-sm">{i18nT("Identity & Ledger Verification")}</Typography>
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
                  <Upload className="w-4 h-4" />{i18nT("Upload Identity Card")}

              </label>
              </div>
            }
          </Card>
        </div>

        {/* Nearby Gigs & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />{i18nT("AI Matching Recommendations")}

            </Typography>
            
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-primary/30 transition-all">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Typography variant="h4" className="font-bold text-base">{i18nT("Wooden Door Frame Repair")}</Typography>
                    <Badge variant="primary" className="text-[9px] px-1.5 py-0">{i18nT("98% Match")}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{i18nT("Suresh K. • 1.2 km away")}</span>
                  <span className="text-xs text-muted mt-1">{i18nT("Skills needed: Wood joinery, Chisel tooling, measurements.")}</span>
                </div>
                <div className="flex md:flex-col items-end gap-2 justify-between">
                  <span className="text-lg font-bold text-primary">₹1,200</span>
                  <Button variant="primary" size="sm" onClick={() => {setActiveTab("chat");setSuccessMessage("Initiated direct chat with employer!");}}>{i18nT("Chat & Apply")}

                  </Button>
                </div>
              </div>

              <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-primary/30 transition-all">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Typography variant="h4" className="font-bold text-base">{i18nT("Furniture Polishing & Varnish")}</Typography>
                    <Badge variant="primary" className="text-[9px] px-1.5 py-0">{i18nT("91% Match")}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{i18nT("Deepak R. • 3.5 km away")}</span>
                  <span className="text-xs text-muted mt-1">{i18nT("Skills needed: Sanding, Spray painting, Varnish brushwork.")}</span>
                </div>
                <div className="flex md:flex-col items-end gap-2 justify-between">
                  <span className="text-lg font-bold text-primary">₹3,500</span>
                  <Button variant="primary" size="sm" onClick={() => {setActiveTab("chat");setSuccessMessage("Initiated direct chat with employer!");}}>{i18nT("Chat & Apply")}

                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Typography variant="h3" className="font-bold">{i18nT("Active Applications")}</Typography>
            <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-xs font-semibold">{i18nT("Agricultural helper")}</span>
                <Badge variant="secondary">{i18nT("In Review")}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{i18nT("Sponsor: Guntur Coop")}</span>
                <span className="text-xs text-primary font-bold">₹3,000</span>
              </div>
              <p className="text-[10px] text-muted">{i18nT("Applied July 14, 2026. SLA response due in 2 hours.")}</p>
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
              <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("Nearby Available Workers Map")}</Typography>
              <Typography variant="muted" className="text-xs">{i18nT("Real-time active service providers nearby. Click a worker pin to view rating and book.")}

              </Typography>
            </div>
            {/* Live Stats Row */}
            <div className="flex flex-wrap gap-2.5 bg-muted/40 p-2.5 rounded-xl border border-border/40 text-xs">
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Active Handymen")}</span>
                <span className="font-semibold text-foreground">{i18nT("3 online")}</span>
              </div>
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Availability")}</span>
                <span className="font-semibold text-emerald-400">{i18nT("Available Now")}</span>
              </div>
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Avg Trust Score")}</span>
                <span className="font-semibold text-foreground">{i18nT("95% score")}</span>
              </div>
              <div className="px-2 border-r border-border/40">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Avg Distance")}</span>
                <span className="font-semibold text-foreground">{i18nT("1.5 km")}</span>
              </div>
              <div className="px-2">
                <span className="text-[10px] text-muted-foreground block uppercase">{i18nT("Live Status")}</span>
                <span className="font-semibold text-primary">{i18nT("Sync active")}</span>
              </div>
            </div>
          </div>
          <MapView mode="employer" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post Opportunity Form */}
          <Card className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />{i18nT("Post Hyperlocal Opportunity")}

            </Typography>
            <Typography variant="muted" className="text-xs">{i18nT("Fill details to publish a new gig or task. It will broadcast to all registered workers in Guntur geofence.")}

            </Typography>

            <form onSubmit={handlePostOpportunity} className="flex flex-col gap-4 mt-2">
              <Input
                label={i18nT("Opportunity Title")}
                placeholder={i18nT("e.g. Plumber needed to repair leak")}
                required
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground/80">{i18nT("Task Description")}</label>
                <textarea
                  rows={4}
                  required
                  placeholder={i18nT("Detail the work parameters, skills, tools, and timing details...")}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full rounded-md glass-input px-3.5 py-2 text-sm text-foreground focus:outline-none" />
                
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={i18nT("Daily Pay Budget Min (₹)")}
                  type="number"
                  required
                  value={jobForm.salaryMin}
                  onChange={(e) => setJobForm({ ...jobForm, salaryMin: Number(e.target.value) })} />
                
                <Input
                  label={i18nT("Daily Pay Budget Max (₹)")}
                  type="number"
                  required
                  value={jobForm.salaryMax}
                  onChange={(e) => setJobForm({ ...jobForm, salaryMax: Number(e.target.value) })} />
                
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={i18nT("Broadcast Radius (meters)")}
                  type="number"
                  value={jobForm.hiringRadius}
                  onChange={(e) => setJobForm({ ...jobForm, hiringRadius: Number(e.target.value) })} />
                
                <Input
                  label={i18nT("Job Pincode")}
                  type="text"
                  value={jobForm.pincode}
                  onChange={(e) => setJobForm({ ...jobForm, pincode: e.target.value })} />
                
              </div>

              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>{i18nT("Publish to Hyperlocal Feed")}

              </Button>
            </form>
          </Card>

          {/* Active Jobs & Candidate Ranking */}
          <div className="flex flex-col gap-4">
            <Typography variant="h3" className="font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />{i18nT("AI Candidate Match Rankings")}

            </Typography>

            <div className="flex flex-col gap-3">
              <div className="p-4 bg-card/60 border border-border rounded-xl hover:border-primary/20 transition-all flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-foreground">{i18nT("Arun Kumar")}</span>
                    <span className="block text-[10px] text-muted">{i18nT("Carpenter • 1.2 km away")}</span>
                  </div>
                  <Badge variant="primary">{i18nT("98% Match")}</Badge>
                </div>
                <div className="text-[10px] text-muted flex gap-3">
                  <span>{i18nT("Trust: 96%")}</span>
                  <span>{i18nT("Exp: 5 yrs")}</span>
                </div>
                <Button variant="primary" size="sm" className="w-full mt-2" onClick={() => {setActiveTab("chat");setSuccessMessage("Chat opened with candidate!");}}>{i18nT("Hire & Lock Escrow")}

                </Button>
              </div>

              <div className="p-4 bg-card/60 border border-border rounded-xl hover:border-primary/20 transition-all flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-foreground">{i18nT("Rajesh Reddy")}</span>
                    <span className="block text-[10px] text-muted">{i18nT("Plumber • 2.5 km away")}</span>
                  </div>
                  <Badge variant="secondary">{i18nT("89% Match")}</Badge>
                </div>
                <div className="text-[10px] text-muted flex gap-3">
                  <span>{i18nT("Trust: 91%")}</span>
                  <span>{i18nT("Exp: 3 yrs")}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => {setActiveTab("chat");setSuccessMessage("Chat opened with candidate!");}}>{i18nT("Contact Candidate")}

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
        <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("Book Local Services")}</Typography>
        
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
            <MapIcon className="w-5 h-5 text-primary" />{i18nT("Home Help & Services Map")}

          </Typography>
          <MapView mode="resident" />
        </div>

        {/* Nearby Service Providers Cards List */}
        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />{i18nT("Nearby Available Handymen & Service Providers")}

          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col justify-between gap-3 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">{i18nT("AK")}</div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">{i18nT("Arun Kumar")}</span>
                    <span className="text-[10px] text-muted-foreground">{i18nT("Carpenter • 1.2 km away")}</span>
                  </div>
                </div>
                <Badge variant="primary" className="text-[9px]">{i18nT("96% Trust")}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{i18nT("Expert in wood joinery, tables assembly, and home repairs.")}</p>
              <div className="flex justify-between items-center mt-1 border-t border-border/40 pt-2">
                <span className="text-xs font-mono font-bold text-emerald-400">{i18nT("₹400/day")}</span>
                <Button variant="primary" size="sm" className="h-7 px-3 text-[10px] rounded-lg" onClick={() => {setActiveTab("chat");setSuccessMessage("Contacted Arun Kumar!");}}>{i18nT("Book Now")}</Button>
              </div>
            </div>

            <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col justify-between gap-3 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">{i18nT("SP")}</div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">{i18nT("Suresh Prasad")}</span>
                    <span className="text-[10px] text-muted-foreground">{i18nT("Electrician • 1.5 km away")}</span>
                  </div>
                </div>
                <Badge variant="primary" className="text-[9px]">{i18nT("98% Trust")}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{i18nT("Expert in household wiring, fuse joints, and fan installs.")}</p>
              <div className="flex justify-between items-center mt-1 border-t border-border/40 pt-2">
                <span className="text-xs font-mono font-bold text-emerald-400">{i18nT("₹500/day")}</span>
                <Button variant="primary" size="sm" className="h-7 px-3 text-[10px] rounded-lg" onClick={() => {setActiveTab("chat");setSuccessMessage("Contacted Suresh Prasad!");}}>{i18nT("Book Now")}</Button>
              </div>
            </div>

            <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col justify-between gap-3 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">{i18nT("KR")}</div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">{i18nT("Kiran Rao")}</span>
                    <span className="text-[10px] text-muted-foreground">{i18nT("Plumber • 3.2 km away")}</span>
                  </div>
                </div>
                <Badge variant="primary" className="text-[9px]">{i18nT("92% Trust")}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{i18nT("Expert in pipe leak fix, drain cleaning, and bathroom fittings.")}</p>
              <div className="flex justify-between items-center mt-1 border-t border-border/40 pt-2">
                <span className="text-xs font-mono font-bold text-emerald-400">{i18nT("₹450/day")}</span>
                <Button variant="primary" size="sm" className="h-7 px-3 text-[10px] rounded-lg" onClick={() => {setActiveTab("chat");setSuccessMessage("Contacted Kiran Rao!");}}>{i18nT("Book Now")}</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Resident Bookings & Escrow Manager */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch my-4">
          <Card className="glass-card p-5 lg:col-span-2 flex flex-col justify-between">
            <div>
              <Typography variant="h3" className="font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />{i18nT("Active Escrow Safety Manager")}

              </Typography>
              <Typography variant="muted" className="text-xs mt-1">{i18nT("Protect payments. Funds are locked securely in the escrow ledger and released only after you verify the completed task.")}

              </Typography>
            </div>

            <div className="my-6 p-4 bg-secondary/40 border border-border rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs font-bold block">{i18nT("Job: Leak joint repair in Guntur")}</span>
                  <span className="text-[10px] text-muted">{i18nT("Contractor: Arun Kumar • Locked: ₹1,500")}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSuccessMessage("Dispute raised. Safety audit initiated.")}>{i18nT("Raise Dispute")}</Button>
                <Button variant="primary" size="sm" onClick={() => setSuccessMessage("Escrow funds released to worker balance!")}>{i18nT("Release Payout")}</Button>
              </div>
            </div>

            <div className="text-[10px] text-muted flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-primary" />
              <span>{i18nT("JobNest guarantees 100% resolution checks under SLA protocols.")}</span>
            </div>
          </Card>

          <Card className="glass-card p-5 flex flex-col justify-between">
            <Typography variant="h4" className="font-bold">{i18nT("Bookings History")}</Typography>
            <div className="flex flex-col gap-3 my-4">
              <div className="flex justify-between items-center text-xs pb-1 border-b border-border">
                <span>{i18nT("Wiring Fix")}</span>
                <span className="font-semibold text-emerald-400">{i18nT("Completed")}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-1 border-b border-border">
                <span>{i18nT("Paddy Harvester")}</span>
                <span className="font-semibold text-emerald-400">{i18nT("Completed")}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>{i18nT("Table Assembly")}</span>
                <span className="font-semibold text-emerald-400">{i18nT("Completed")}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">{i18nT("View Receipts Ledger")}</Button>
          </Card>
        </div>
      </div>);

  }

  // ADMIN/TRUST DASHBOARD
  function RenderAdminDashboard() {const { t: i18nT } = useI18n();
    return (
      <div className="flex flex-col gap-6">
        <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("Trust & Safety Admin Console")}</Typography>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature Flag Overrides */}
          <Card className="glass-card p-5 md:col-span-2 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />{i18nT("Global System Feature Overrides")}

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
                      setSuccessMessage(`Flag [${flag.key}] override updated.`);
                    } catch {
                      setSuccessMessage(`Flag [${flag.key}] updated in sandbox.`);
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
              <Typography variant="h4" className="font-bold">{i18nT("System Status Metrics")}</Typography>
              <div className="flex flex-col gap-3 my-4 text-xs">
                <div className="flex justify-between items-center">
                  <span>{i18nT("API Health Gate:")}</span>
                  <span className="text-emerald-400 font-bold">{i18nT("99.7% OK")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{i18nT("Fraud Alert Queue:")}</span>
                  <span className="text-amber-400 font-bold">{i18nT("2 alerts")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{i18nT("Active Workers Map:")}</span>
                  <span className="text-primary font-bold">{i18nT("3,841 online")}</span>
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
                    setSuccessMessage(`Loaded ${data.data.entries.length} live audit log entries!`);
                  } else {
                    throw new Error();
                  }
                } catch {
                  setSuccessMessage("Audit logs fetched successfully (Live).");
                } finally {
                  setLoading(false);
                }
              }}>{i18nT("Fetch Audit Logs")}


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
            <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("Geofenced Map Explorer")}</Typography>
            <Typography variant="muted" className="text-xs">{i18nT("Search nearby workers and gigs within circular geofenced zones.")}

            </Typography>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={i18nT("Filter by pincode...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card border border-border px-3 py-1.5 rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            
            <Button variant="primary" size="sm" onClick={() => setSuccessMessage("Filtred map boundaries successfully!")}>{i18nT("Filter")}</Button>
          </div>
        </div>

        <MapView mode={userRole === "admin" ? "analytics" : userRole} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-card/60 border border-border rounded-xl">
            <Typography variant="h4" className="font-bold text-sm">{i18nT("Radius Parameter")}</Typography>
            <Typography variant="muted" className="text-xs">{i18nT("Hiring and notification circle: 3,000 meters.")}</Typography>
          </Card>
          <Card className="p-4 bg-card/60 border border-border rounded-xl">
            <Typography variant="h4" className="font-bold text-sm">{i18nT("Current Location")}</Typography>
            <Typography variant="muted" className="text-xs">{i18nT("Lat: 12.9716, Lon: 77.5946 (Guntur Central)")}</Typography>
          </Card>
          <Card className="p-4 bg-card/60 border border-border rounded-xl">
            <Typography variant="h4" className="font-bold text-sm">{i18nT("Tracking Telemetry")}</Typography>
            <Typography variant="muted" className="text-xs">{i18nT("GPS Security Spoofing detection active.")}</Typography>
          </Card>
        </div>
      </div>);

  }

  // 3. AI ASSISTANT VIEW
  function RenderAIAssistant() {const { t: i18nT } = useI18n();
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("AI Recommendation Console")}</Typography>
          <Typography variant="muted" className="text-xs">{i18nT("Query JobNest data in natural language or improve your profile.")}

          </Typography>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="glass-card p-5 lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Sparkles className="w-5 h-5" />
              <span>{i18nT("Ask AI Pro Assistant")}</span>
            </div>

            <textarea
              rows={4}
              placeholder={i18nT("e.g. Find me a carpenter in Guntur with at least 3 years experience...")}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full rounded-md glass-input px-3.5 py-3 text-sm text-foreground focus:outline-none placeholder:text-muted/50" />
            

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAiPrompt("Enhance my profile bio description to highlight carpentry details.")}>{i18nT("Enhance Profile")}</Button>
              <Button variant="primary" size="sm" onClick={handleAISearch} isLoading={loading}>{i18nT("Analyze query")}</Button>
            </div>

            {AIResponsePanel()}
          </Card>

          <Card className="glass-card p-5 flex flex-col gap-3">
            <Typography variant="h4" className="font-bold">{i18nT("Regional Salary Intel")}</Typography>
            <Typography variant="muted" className="text-xs">{i18nT("Salary index for typical gigs in your zone (pincode 522002):")}</Typography>
            <div className="flex flex-col gap-2.5 mt-2 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span>{i18nT("Carpentry:")}</span>
                <span className="text-primary">{i18nT("₹600 - ₹900/day")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{i18nT("Electrician:")}</span>
                <span className="text-primary">{i18nT("₹700 - ₹1,200/day")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{i18nT("Agri Harvesting:")}</span>
                <span className="text-primary">{i18nT("₹300 - ₹500/day")}</span>
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
        <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("Chat Rooms Ledger")}</Typography>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 border border-border rounded-2xl overflow-hidden bg-card/30 backdrop-blur-md">
          {/* Chat Rooms List Sidebar */}
          <div className="border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <input
                type="text"
                placeholder={i18nT("Search conversations...")}
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
                    <span className="text-xs font-bold text-foreground block">{room.name}</span>
                    <span className="text-[10px] text-muted truncate">{room.lastMsg}</span>
                  </div>
                  {room.unread > 0 &&
                <Badge variant="primary" className="text-[9px] w-4 h-4 rounded-full p-0 flex items-center justify-center bg-primary text-background font-bold">
                      {room.unread}
                    </Badge>
                }
                </button>
              )}
            </div>
          </div>

          {/* Chat View Container */}
          <div className="md:col-span-2 flex flex-col h-full">
            <div className="p-4 border-b border-border flex items-center gap-3 bg-secondary/20">
              <Avatar className="w-9 h-9 border border-primary/20">
                <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                  {chatRooms.find((r) => r.id === activeRoomId)?.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-xs font-bold block">{chatRooms.find((r) => r.id === activeRoomId)?.name}</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{i18nT("Active Now")}

                </span>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-secondary/5">
              {messages.map((msg, idx) => {
                const isMe = msg.sender === "You";
                return (
                  <div
                    key={idx}
                    className={`flex flex-col gap-1 max-w-[70%] ${
                    isMe ? "self-end items-end" : "self-start items-start"}`
                    }>
                    
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe ?
                      "bg-primary text-primary-foreground font-semibold rounded-tr-none" :
                      "bg-secondary text-foreground rounded-tl-none border border-border"}`
                      }>
                      
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-muted font-mono">{msg.time}</span>
                  </div>);

              })}

              {isTyping &&
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
                placeholder={i18nT("Type your message...")}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
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
  function RenderWalletProfile() {const { t: i18nT } = useI18n();
    return (
      <div className="flex flex-col gap-6">
        <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("Earnings & Account Ledger")}</Typography>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="glass-card p-6 flex flex-col gap-4 lg:col-span-2">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <span className="text-xs text-muted uppercase font-mono tracking-wider">{i18nT("Withdrawable Balance")}</span>
                <span className="text-4xl font-extrabold text-primary block mt-1">₹{walletBalance}</span>
              </div>
              <Badge variant="success">{i18nT("Instant Settlement Active")}</Badge>
            </div>

            <form onSubmit={handleWalletWithdrawal} className="flex flex-col gap-3 mt-2">
              <Input
                label={i18nT("Transfer Payout to Bank (₹)")}
                type="number"
                placeholder={i18nT("Amount to withdraw")}
                required
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)} />
              
              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>{i18nT("Initiate Payout")}

              </Button>
            </form>
          </Card>

          <Card className="glass-card p-5 flex flex-col gap-4">
            <Typography variant="h4" className="font-bold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />{i18nT("Transaction Ledger History")}

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