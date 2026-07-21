"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider";
import { saveEmployerOnboardingAction } from "@/features/user/actions";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useI18n } from "@/lib/i18n/context";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  MapPin,
  Shield,
  Globe,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Building,
  Upload,
  Check,
  TrendingUp,
  FileText,
  DollarSign,
  Sliders
} from "lucide-react";

// Lazy load MapView
const MapView = dynamic(
  () => import("@/components/maps/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[220px] rounded-2xl overflow-hidden border border-border/40 shadow-luxury bg-black/10 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground">Loading geofenced business map...</span>
      </div>
    ),
  }
);

const AVAILABLE_LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "mr", label: "मराठी (Marathi)" }
];

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, user, login, signup, updateProfile } = useAuth();
  const { locale, setLocale } = useI18n();
  const { latitude, longitude, errorMessage: geoError, requestPermission } = useCurrentLocation();

  // Wizard Steps (1-6)
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Screen 1 & Authentication States
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Screen 2: Business Information
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessType, setBusinessType] = useState("SME");
  const [gstNumber, setGstNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");

  // Screen 3: Business Verification
  const [uploadedDoc, setUploadedDoc] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "pending" | "verified">("unverified");

  // Screen 4: Business Location
  const [radiusKm, setRadiusKm] = useState(10);
  const [gpsGranted, setGpsGranted] = useState(false);

  // Screen 5: Hiring Preferences
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hiringFrequency, setHiringFrequency] = useState("Monthly");
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(["English"]);
  const [budgetMin] = useState(800);
  const [budgetMax, setBudgetMax] = useState(2500);
  const [workingHours, setWorkingHours] = useState("09:00 AM - 06:00 PM");
  const [urgentHiring, setUrgentHiring] = useState(false);

  // Common UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pre-fill fields if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role !== "employer") {
        // Guard check: if logged in role doesn't match employer, route them appropriately
        router.push(`/${user.role}`);
      } else {
        setOwnerName(user.name);
        setEmail(user.email);
        setPhoneNumber(user.phoneNumber || "");
        setBusinessName(user.businessName || "");
        setBusinessType(user.businessType || "SME");
        setGstNumber(user.gstNumber || "");
        setBusinessAddress(user.businessAddress || "");
        setVerificationStatus(user.kycStatus || "unverified");
        if (user.employerOnboardingCompleted) {
          router.push("/employer");
        }
      }
    }
  }, [isAuthenticated, user, router]);

  // Sync Geolocation permission
  useEffect(() => {
    if (latitude && longitude) {
      setGpsGranted(true);
    }
  }, [latitude, longitude]);

  // Stepper controls
  const nextStep = () => {
    if (validateStep()) {
      setDirection(1);
      setStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Validation rules
  const validateStep = () => {
    setErrorMsg(null);

    if (step === 1 && !isAuthenticated) {
      if (!email || !password) {
        setErrorMsg("Email and password fields are required.");
        return false;
      }
      if (!email.includes("@")) {
        setErrorMsg("Please enter a valid business email.");
        return false;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return false;
      }
    }

    if (step === 2) {
      if (!businessName.trim()) {
        setErrorMsg("Business Name is required.");
        return false;
      }
      if (!ownerName.trim()) {
        setErrorMsg("Owner Name is required.");
        return false;
      }
      if (!phoneNumber.trim() || phoneNumber.length < 10) {
        setErrorMsg("Please enter a valid 10-digit contact number.");
        return false;
      }
      if (!businessAddress.trim()) {
        setErrorMsg("Business Address is required.");
        return false;
      }
    }

    if (step === 3) {
      if (verificationStatus === "unverified" && !uploadedDoc) {
        setErrorMsg("Please upload Aadhaar or GST Certificate for business validation.");
        return false;
      }
    }

    if (step === 5) {
      if (selectedCategories.length === 0) {
        setErrorMsg("Please pick at least one worker category you expect to hire.");
        return false;
      }
    }

    return true;
  };

  // Actions

  // Dynamic login/signup auth bypass
  const handleAuthSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isLoginMode) {
        const success = await login(email, "employer");
        if (success) {
          setSuccessMsg("Success! Secure session established.");
          setTimeout(() => {
            setSuccessMsg(null);
            nextStep();
          }, 1000);
        } else {
          setErrorMsg("Login failed. Check credentials.");
        }
      } else {
        const success = await signup(email, "employer", ownerName || "Business Owner");
        if (success) {
          setSuccessMsg("Employer account registered!");
          setTimeout(() => {
            setSuccessMsg(null);
            nextStep();
          }, 1000);
        } else {
          setErrorMsg("Signup failed. Email may already be registered.");
        }
      }
    } catch {
      setErrorMsg("Connection failure. Check local endpoints.");
    } finally {
      setLoading(false);
    }
  };

  // Simulating business document reader
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setLoading(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedDoc(reader.result as string);
      setVerificationStatus("pending");
      setSuccessMsg("Document received! Simulating OCR validation ledger...");
      setTimeout(() => {
        setVerificationStatus("verified");
        setSuccessMsg("GST/Aadhaar validated! Verification Badge is active.");
        setLoading(false);
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  // Geolocation handling
  const handleGrantLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const success = await requestPermission();
      if (success) {
        setGpsGranted(true);
        setSuccessMsg("Location parameters synced!");
        setTimeout(() => {
          setSuccessMsg(null);
          nextStep();
        }, 1200);
      } else {
        setErrorMsg(geoError || "Location access denied. Please select manually.");
      }
    } catch {
      setErrorMsg(geoError || "Location access denied. Please select manually.");
    } finally {
      setLoading(false);
    }
  };

  // Submit and Complete profile
  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      const result = await saveEmployerOnboardingAction({
        companyName: businessName,
        gstNumber: gstNumber || "",
        industry: businessType || "Services",
        bio: businessDesc || "Local business hiring verified local workers.",
        categories: selectedCategories,
        budgetRangeMin: Number(budgetMin) || 0,
        budgetRangeMax: Number(budgetMax) || 0,
        latitude: latitude || 16.3067,
        longitude: longitude || 80.4365,
        ownerName,
        phoneNumber,
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

      await updateProfile({
        name: ownerName,
        phoneNumber,
        avatar: ownerName.substring(0, 2).toUpperCase(),
        kycStatus: verificationStatus,
        businessName,
        businessType,
        gstNumber,
        businessAddress,
        about: businessDesc,
        employerOnboardingCompleted: true,
        skills: selectedCategories, // Using skills field as worker hiring categories
        hiringFrequency,
        expectedDailyEarnings: budgetMax, // Using budgetMax inside dailyRate parameters
        latitude: latitude || 16.3067,
        longitude: longitude || 80.4365,
        languages: preferredLanguages
      });
      setSuccessMsg("Business profile finalized! Redirecting...");
      setTimeout(() => {
        router.push("/employer");
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to persist details. Check database.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // Checkbox handlers
  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const handleLanguageToggle = (lang: string) => {
    setPreferredLanguages((prev) =>
      prev.includes(lang) ? prev.filter((item) => item !== lang) : [...prev, lang]
    );
  };

  // Animation values
  const pageVariants = {
    initial: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 })
  };

  return (
    <div className="w-screen min-h-screen bg-background text-foreground flex flex-col justify-between p-4 md:p-6 overflow-x-hidden">
      
      {/* HEADER BAR */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-border/20 pb-4">
        <Typography variant="h3" className="font-extrabold tracking-tight flex items-center gap-1.5">
          <Building className="w-5 h-5 text-amber-500" />
          <span className="gold-gradient-text">JobNest Business</span>
        </Typography>

        <div className="flex items-center gap-4 text-xs">
          {/* Locale switcher */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe className="w-3.5 h-3.5" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as "en" | "hi" | "te" | "ta" | "kn" | "mr")}
              className="bg-transparent border-none text-foreground font-semibold cursor-pointer focus:outline-hidden"
            >
              {AVAILABLE_LANGS.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
          {/* Progress bar step count */}
          <span className="text-muted-foreground font-bold">Step {step} of 6</span>
        </div>
      </div>

      {/* STEPPER PROGRESS */}
      <div className="max-w-xl mx-auto w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden my-4 border border-border/10">
        <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${(step / 6) * 100}%` }} />
      </div>

      {/* CENTRAL CARD CONTENT CONTAINER */}
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center items-stretch relative min-h-[460px]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="w-full flex flex-col justify-between flex-1 gap-4"
          >
            {/* ── SCREEN 1: WELCOME ─────────────────────────────────── */}
            {step === 1 && (
              <Card className="glass-panel border-border flex flex-col justify-between h-full p-6">
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-3 border border-amber-500/20">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                    Hire trusted local workers in minutes.
                  </CardTitle>
                  <CardDescription className="text-xs leading-normal mt-2">
                    Access vetted skilled contractors, SMEs, and daily-wage operators around your geofenced address instantly.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex flex-col gap-4 pt-4">
                  {isAuthenticated ? (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 rounded-xl p-4 text-center text-xs">
                      <span className="font-bold block text-sm">Welcome back, {user?.name}!</span>
                      <span className="mt-1 block text-muted-foreground">You are logged in. Press Continue to configure business data.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Business Email Address</span>
                        <input
                          type="email"
                          placeholder="e.g. name@shop.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-black/25 border border-border/40 rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Secure Password</span>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/25 border border-border/40 rounded-xl pl-4 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs mt-1 border-t border-border/10 pt-3">
                        <span className="text-muted-foreground">
                          {isLoginMode ? "Need a business account?" : "Already registered?"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsLoginMode(!isLoginMode)}
                          className="text-amber-500 hover:underline font-bold cursor-pointer"
                        >
                          {isLoginMode ? "Register Now" : "Sign In"}
                        </button>
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── SCREEN 2: BUSINESS INFORMATION ──────────────────────── */}
            {step === 2 && (
              <Card className="glass-panel border-border flex flex-col justify-between h-full p-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Building className="w-5 h-5 text-amber-500" />
                    Business Information
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Please provide your operational registration parameters.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[350px] pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Business Name</span>
                      <input
                        type="text"
                        placeholder="e.g. Guntur Agro"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="bg-black/25 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Owner Name</span>
                      <input
                        type="text"
                        placeholder="Owner / Partner"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="bg-black/25 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Business Type</span>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="bg-black/25 border border-border/40 rounded-xl p-2.5 text-xs text-foreground focus:outline-hidden focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Local Shop">Local Retail Shop</option>
                        <option value="Restaurant">Restaurant / Hotel</option>
                        <option value="Contractor">Skilled Contractor</option>
                        <option value="SME">SME / Startup Office</option>
                        <option value="Homeowner">Residential Owner</option>
                        <option value="Factory">Factory / Workshop</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">GSTIN (Optional)</span>
                      <input
                        type="text"
                        placeholder="37AAAAA0000A1Z0"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        className="bg-black/25 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Contact Phone</span>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-black/25 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Business Address</span>
                    <textarea
                      placeholder="Complete physical office address"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      rows={2}
                      className="bg-black/25 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Description</span>
                    <textarea
                      placeholder="Brief details about what your business hires for..."
                      value={businessDesc}
                      onChange={(e) => setBusinessDesc(e.target.value)}
                      rows={2}
                      className="bg-black/25 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500 resize-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-2.5 rounded-xl text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── SCREEN 3: BUSINESS VERIFICATION ────────────────────── */}
            {step === 3 && (
              <Card className="glass-panel border-border flex flex-col justify-between h-full p-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-500" />
                    Business Verification
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cryptographically validate business parameters on JobNest registry.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col gap-4 pt-2">
                  
                  {/* Badge Preview */}
                  <div className="bg-black/25 rounded-2xl border border-border/40 p-4.5 text-center flex flex-col items-center justify-center gap-2">
                    <div className="relative">
                      <Building className="w-12 h-12 text-muted-foreground" />
                      {verificationStatus === "verified" && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 border border-background">
                          <Check className="w-3.5 h-3.5 text-background" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <span className="font-bold text-foreground text-sm block">{businessName || "My Business"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5 block tracking-wider">
                        Status: {verificationStatus === "verified" ? "Verified Partner" : "Validation Required"}
                      </span>
                    </div>

                    {verificationStatus === "verified" ? (
                      <Badge variant="success" className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold py-0.5 px-2 mt-1">
                        Verified Business Badge Active
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="bg-amber-950/60 border border-amber-500/30 text-amber-400 text-[9px] font-bold py-0.5 px-2 mt-1">
                        Pending Document Review
                      </Badge>
                    )}
                  </div>

                  {/* Document Uploader */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Document Credentials File</span>
                    
                    <div className="relative">
                      <input
                        type="file"
                        id="document-upload-employer-onboarding"
                        className="hidden"
                        onChange={handleDocUpload}
                        disabled={loading}
                      />
                      <label
                        htmlFor="document-upload-employer-onboarding"
                        className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed border-border/40 bg-black/15 hover:bg-black/25 cursor-pointer transition-all text-xs"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <span>Processing Business registry document...</span>
                          </>
                        ) : uploadedDoc ? (
                          <>
                            <FileText className="w-8 h-8 text-amber-500" />
                            <span className="text-emerald-400 font-bold">GST / License Uploaded Successfully</span>
                            <span className="text-[10px] text-muted-foreground">Click to upload another file</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground" />
                            <span className="font-semibold text-foreground">Upload Business License / GSTIN / Aadhaar</span>
                            <span className="text-[10px] text-muted">Supports JPG, PNG, PDF up to 4MB</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-2.5 rounded-xl text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-xs flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

            {/* ── SCREEN 4: BUSINESS LOCATION ────────────────────────── */}
            {step === 4 && (
              <Card className="glass-panel border-border flex flex-col justify-between h-full p-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    Business Location Geofence
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pin your business address to establish your hiring radius geofence.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-between gap-4 pt-1">
                  
                  {/* Map radar */}
                  <div className="w-full flex-1 min-h-[200px] rounded-2xl overflow-hidden border border-border/40 relative">
                    <MapView mode="employer" />
                  </div>

                  {/* Radius Slider */}
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-muted-foreground">Hiring Service Radius:</span>
                      <span className="text-amber-500 font-mono">{radiusKm} Km</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Detect GPS coordinates */}
                  {!gpsGranted && (
                    <Button
                      variant="primary"
                      onClick={handleGrantLocation}
                      disabled={loading}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-background py-3.5 font-bold rounded-xl text-xs cursor-pointer shadow-luxury"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-1.5" />
                          Detecting coordinates...
                        </>
                      ) : (
                        "Auto-detect Business Coordinates"
                      )}
                    </Button>
                  )}

                  {errorMsg && (
                    <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-2.5 rounded-xl text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-xs flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

            {/* ── SCREEN 5: HIRING PREFERENCES ────────────────────────── */}
            {step === 5 && (
              <Card className="glass-panel border-border flex flex-col justify-between h-full p-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-500" />
                    Hiring Preferences
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tell us what types of workers you want to hire.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[350px] pr-1">
                  
                  {/* Category choices */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Worker Categories Needed</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Carpenter", "Plumber", "Electrician", "Agricultural Worker", "AC Technician"].map((cat) => {
                        const isSelected = selectedCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryToggle(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-amber-600/20 text-amber-300 border-amber-500"
                                : "border-border/40 hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Languages preferred */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Preferred Languages</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["English", "Hindi", "Telugu", "Tamil", "Kannada"].map((lang) => {
                        const isSelected = preferredLanguages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => handleLanguageToggle(lang)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-amber-600/20 text-amber-300 border-amber-500"
                                : "border-border/40 hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Budget slider */}
                  <div className="flex flex-col gap-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Expected Daily Budget Limit</span>
                    <div className="flex items-center justify-between font-mono bg-black/20 border border-border/20 p-2.5 rounded-xl">
                      <span className="flex items-center text-amber-500 font-bold">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>₹{budgetMin} / day</span>
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className="flex items-center text-amber-500 font-bold">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>₹{budgetMax} / day</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="100"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Spacing alignment */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Working Hours Preference</span>
                      <input
                        type="text"
                        placeholder="e.g. 09:00 AM - 06:00 PM"
                        value={workingHours}
                        onChange={(e) => setWorkingHours(e.target.value)}
                        className="bg-black/25 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Hiring Frequency</span>
                        <select
                          value={hiringFrequency}
                          onChange={(e) => setHiringFrequency(e.target.value)}
                          className="bg-black/25 border border-border/40 rounded-xl p-2.5 text-xs text-foreground focus:outline-hidden focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Daily">Daily gigs</option>
                          <option value="Weekly">Weekly contracts</option>
                          <option value="Monthly">Monthly intervals</option>
                          <option value="Occasional">Occasional hiring</option>
                        </select>
                      </div>

                    {/* Urgent hiring switch */}
                    <div className="flex items-center justify-end h-full pt-4">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground select-none">
                        <input
                          type="checkbox"
                          checked={urgentHiring}
                          onChange={(e) => setUrgentHiring(e.target.checked)}
                          className="rounded accent-amber-500"
                        />
                        <span className="text-xs font-semibold">Urgent Hiring Active</span>
                      </label>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-2.5 rounded-xl text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

            {/* ── SCREEN 6: COMPLETION ──────────────────────────────── */}
            {step === 6 && (
              <Card className="glass-panel border-border flex flex-col justify-between h-full p-6">
                <CardHeader className="text-center pb-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-3 border border-emerald-500/20">
                    <CheckCircle className="w-8 h-8 animate-bounce" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-black text-foreground">
                    Business Profile Complete!
                  </CardTitle>
                  <CardDescription className="text-xs leading-normal mt-2">
                    Congratulations. Your JobNest employer register credential has been successfully generated.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-between gap-5 pt-3">
                  
                  {/* Completion percentage meter */}
                  <div className="bg-black/25 rounded-2xl border border-border/40 p-4.5 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Hiring Score Index</span>
                      <span className="text-lg font-black text-foreground">100% Registry Score</span>
                    </div>
                    <Badge variant="success" className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-1">
                      Ready to Hire
                    </Badge>
                  </div>

                  {/* Detailed Next Steps */}
                  <div className="border border-border/20 bg-zinc-950 p-4 rounded-2xl flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      Hiring Next Steps
                    </span>
                    <ul className="list-disc pl-4 flex flex-col gap-1 text-[11px] text-muted-foreground">
                      <li>Post your first hyperlocal gig project mapping.</li>
                      <li>Review matching local worker applicants live coordinates.</li>
                      <li>Secure payments escrow funding options.</li>
                    </ul>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-2.5 rounded-xl text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-xs flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FOOTER ACTIONS AND NAVIGATION CONTROLS */}
      <div className="max-w-md mx-auto w-full flex items-center gap-3 mt-6 border-t border-border/20 pt-4 bg-background">
        {step > 1 && (
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={loading}
            className="border border-border/40 py-3.5 px-4.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}

        {step === 1 && !isAuthenticated ? (
          <Button
            variant="primary"
            onClick={handleAuthSubmit}
            disabled={loading}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-background py-3.5 font-extrabold rounded-xl text-xs cursor-pointer shadow-luxury"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isLoginMode ? "Sign In & Continue" : "Create Account & Continue"}</span>
            )}
          </Button>
        ) : step === 6 ? (
          <Button
            variant="primary"
            onClick={handleCompleteOnboarding}
            disabled={loading}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-background py-3.5 font-extrabold rounded-xl text-xs cursor-pointer shadow-luxury"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Start Hiring
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={nextStep}
            disabled={loading}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-background py-3.5 font-extrabold rounded-xl text-xs cursor-pointer shadow-luxury flex items-center justify-center gap-1.5"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

    </div>
  );
}
