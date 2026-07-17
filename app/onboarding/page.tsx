"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider";
import { useI18n } from "@/lib/i18n/context";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  MapPin,
  Sparkles,
  Shield,
  Globe,
  Lock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  Clock,
  Eye,
  EyeOff,
  User,
  AlertCircle
} from "lucide-react";

// Predefined Popular Skills
const POPULAR_SKILLS = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Home Painter",
  "Appliance Repair",
  "Agricultural Worker",
  "Farming Mechanic",
  "AC Technician",
  "Cleaning Expert",
  "Gardener",
  "Delivery Partner"
];

// Predefined Languages
const AVAILABLE_LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "mr", label: "मराठी" }
];

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, user, login, signup, updateProfile } = useAuth();
  const { locale, setLocale } = useI18n();
  const { latitude, longitude, errorMessage: geoError, requestPermission } = useCurrentLocation();

  // Wizard Steps (1-8)
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Local Loading/Success/Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields State
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [aboutBio, setAboutBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [experience, setExperience] = useState("1");
  const [workRadius, setWorkRadius] = useState(10); // in Km
  const [earnings, setEarnings] = useState(1200); // ₹ expected daily earnings
  const [availability, setAvailability] = useState<"full-time" | "part-time" | "weekends">("full-time");
  const [citySearch, setCitySearch] = useState("");
  const [gpsGranted, setGpsGranted] = useState(false);

  // AI suggestions list based on Guntur region defaults
  const aiSuggestions = ["Agricultural Helper", "Borewell Repair Pro", "Coconut Harvester"];

  // Set values if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // If user is already authenticated and has finished onboarding, route to home
      if (user.onboardingCompleted) {
        router.push("/worker");
      } else {
        // Skip auth screens (1-3) and start from Step 4 (Location)
        if (step < 4) {
          setStep(4);
        }
        setFullName(user.name);
        setEmail(user.email);
      }
    }
  }, [isAuthenticated, user, router, step]);

  // Sync Geolocation permission grant
  useEffect(() => {
    if (latitude && longitude) {
      setGpsGranted(true);
      setErrorMsg(null);
    }
  }, [latitude, longitude]);

  // Form Validation helper
  const validateStep = () => {
    setErrorMsg(null);
    if (step === 2) {
      if (!email.includes("@")) {
        setErrorMsg("Please enter a valid email address.");
        return false;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return false;
      }
    }
    if (step === 3) {
      if (!fullName.trim()) {
        setErrorMsg("Please enter your full name.");
        return false;
      }
      if (!email.includes("@")) {
        setErrorMsg("Please enter a valid email address.");
        return false;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return false;
      }
    }
    if (step === 5) {
      if (!fullName.trim()) {
        setErrorMsg("Please enter your full name.");
        return false;
      }
      if (phoneNumber.length < 10) {
        setErrorMsg("Please enter a valid 10-digit phone number.");
        return false;
      }
      if (!aboutBio.trim()) {
        setErrorMsg("Please write a short bio about yourself.");
        return false;
      }
    }
    if (step === 6) {
      if (selectedSkills.length === 0) {
        setErrorMsg("Please select at least one skill to continue.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setDirection(1);
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  // Auth submits
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      if (authMode === "signin") {
        const success = await login(email, "worker", fullName || email.split("@")[0]);
        if (success) {
          setSuccessMsg("Logged in successfully!");
          setTimeout(() => {
            setSuccessMsg(null);
            setStep(4);
          }, 1000);
        } else {
          setErrorMsg("Invalid credentials. Please try again.");
        }
      } else {
        const success = await signup(email, "worker", fullName);
        if (success) {
          setSuccessMsg("Account created successfully!");
          setTimeout(() => {
            setSuccessMsg(null);
            setStep(4);
          }, 1000);
        } else {
          setErrorMsg("Registration failed. Email might already exist.");
        }
      }
    } catch {
      setErrorMsg("An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  // Geolocation handling
  const handleGrantLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const success = await requestPermission();
      if (success) {
        setGpsGranted(true);
        setSuccessMsg("Location permission granted!");
        setTimeout(() => {
          setSuccessMsg(null);
          nextStep();
        }, 1200);
      } else {
        setErrorMsg(geoError || "Location access denied. Please select a city or enable manually.");
      }
    } catch {
      setErrorMsg(geoError || "Location access denied. Please select a city or enable manually.");
    } finally {
      setLoading(false);
    }
  };

  // Profile image upload simulation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Add/Remove Skills
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (skillQuery.trim() && !selectedSkills.includes(skillQuery.trim())) {
      setSelectedSkills((prev) => [...prev, skillQuery.trim()]);
      setSkillQuery("");
    }
  };

  // Onboarding Complete submit
  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      await updateProfile({
        name: fullName,
        phoneNumber,
        avatar: profilePhoto || fullName.substring(0, 2).toUpperCase(),
        onboardingCompleted: true,
        skills: selectedSkills,
        experienceYears: Number(experience),
        about: aboutBio,
        workRadius,
        expectedDailyEarnings: earnings,
        availability,
        latitude: latitude || 16.3067, // Default Guntur coordinates
        longitude: longitude || 80.4365,
        languages: [locale === "en" ? "English" : locale === "hi" ? "Hindi" : locale === "te" ? "Telugu" : "Other"]
      });
      setSuccessMsg("Profile saved! Redirecting to Worker Cockpit...");
      setTimeout(() => {
        router.push("/worker");
      }, 1500);
    } catch {
      setErrorMsg("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Framer Motion Animation Settings
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#05050c] via-[#0b0c16] to-[#05050c] text-foreground flex flex-col justify-between items-center py-6 px-4 md:px-8 font-sans overflow-hidden">
      
      {/* ── HEADER STATUS BAR ─────────────────────────────────────── */}
      <div className="w-full max-w-xl flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-linear-to-r from-amber-500 to-amber-600 flex items-center justify-center text-background font-extrabold text-sm shadow-md">
            JN
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Worker Portal</span>
        </div>
        
        {/* Step Progress indicators */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx + 1 === step
                  ? "w-5 bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                  : idx + 1 < step
                  ? "w-2 bg-emerald-500"
                  : "w-2 bg-border/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── NOTIFICATIONS ALERTS ───────────────────────────────────── */}
      <div className="w-full max-w-xl fixed top-4 z-50 px-4">
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-950/80 border border-red-500/30 text-red-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 mb-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 mb-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MAIN CARD FLOW CONTAINER ────────────────────────────────── */}
      <div className="w-full max-w-xl flex-1 flex items-center justify-center relative my-4">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            
            {/* ── STEP 1: WELCOME SCREEN ───────────────────────────────── */}
            {step === 1 && (
              <Card className="glass-panel border-border shadow-luxury backdrop-blur-md overflow-hidden flex flex-col min-h-[480px]">
                <CardHeader className="pb-3 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-linear-to-br from-amber-500 to-amber-700 flex items-center justify-center text-background font-black text-3xl shadow-lg mb-4">
                    🛠️
                  </div>
                  <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                    Build Your Hyperlocal Future
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Connect instantly with customers in your neighborhood.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-6 pt-2">
                  <div className="flex flex-col gap-4 text-xs text-muted-foreground leading-relaxed">
                    <p className="bg-black/25 border border-border/30 rounded-xl p-3.5 flex items-center gap-3">
                      <Globe className="w-5 h-5 text-amber-500 shrink-0" />
                      <span>
                        Choose language / भाषा चुनें:
                        <select
                          value={locale}
                          onChange={(e) => setLocale(e.target.value as "en" | "hi" | "te" | "ta" | "kn" | "mr")}
                          className="ml-2 bg-muted text-foreground px-2 py-1 rounded-md border border-border/40 font-semibold cursor-pointer"
                        >
                          {AVAILABLE_LANGS.map((lang) => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                          ))}
                        </select>
                      </span>
                    </p>
                    <p className="bg-black/25 border border-border/30 rounded-xl p-3.5 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                      <span>Instant UPI payouts, escrow guarantees, and verification badges build your trust score automatically.</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <Button
                      variant="primary"
                      onClick={() => { setAuthMode("signup"); setStep(3); }}
                      className="w-full flex items-center justify-center gap-2 py-5 cursor-pointer"
                    >
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => { setAuthMode("signin"); setStep(2); }}
                      className="w-full border border-border/40 cursor-pointer"
                    >
                      Sign In to My Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── STEP 2: LOGIN SCREEN ─────────────────────────────────── */}
            {step === 2 && (
              <Card className="glass-panel border-border shadow-luxury backdrop-blur-md flex flex-col min-h-[480px]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-500" />
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sign in to resume finding hyperlocal gigs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-6">
                  <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@domain.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="relative">
                      <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password..."
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-[34px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-amber-500 font-bold self-end cursor-pointer hover:underline">
                      Forgot Password?
                    </span>
                    <Button type="submit" variant="primary" className="w-full mt-2 cursor-pointer" isLoading={loading}>
                      Sign In
                    </Button>
                  </form>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest justify-center">
                      <div className="h-[1px] bg-border/40 flex-1" />
                      <span>or continue with</span>
                      <div className="h-[1px] bg-border/40 flex-1" />
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEmail("demo@jobnest.io");
                        setFullName("Arun Kumar");
                        login("demo@jobnest.io", "worker", "Arun Kumar");
                      }}
                      className="w-full border border-border/40 text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-amber-500" />
                      <span>Sandbox Google Login (Bypass)</span>
                    </Button>
                    <button onClick={prevStep} className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-2 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Welcome</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── STEP 3: SIGNUP SCREEN ────────────────────────────────── */}
            {step === 3 && (
              <Card className="glass-panel border-border shadow-luxury backdrop-blur-md flex flex-col min-h-[480px]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-500" />
                    Create Worker Account
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Get verified and unlock direct payouts instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-6">
                  <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                    <Input
                      label="Full Name"
                      placeholder="e.g. Arun Kumar"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@domain.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="relative">
                      <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-[34px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {password.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-muted-foreground">Strength:</span>
                        <div className="flex gap-1 flex-1">
                          <div className={`h-1 rounded-full flex-1 ${password.length >= 6 ? "bg-amber-500" : "bg-red-500"}`} />
                          <div className={`h-1 rounded-full flex-1 ${password.length >= 8 && /[A-Z]/.test(password) ? "bg-emerald-500" : "bg-border/30"}`} />
                        </div>
                      </div>
                    )}

                    <Button type="submit" variant="primary" className="w-full mt-2 cursor-pointer" isLoading={loading}>
                      Create Account
                    </Button>
                  </form>

                  <div className="text-center">
                    <button onClick={prevStep} className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mx-auto cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Welcome</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── STEP 4: LOCATION PERMISSION ──────────────────────────── */}
            {step === 4 && (
              <Card className="glass-panel border-border shadow-luxury backdrop-blur-md flex flex-col min-h-[480px]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-500 animate-bounce" />
                    Enable Hyperlocal Matching
                  </CardTitle>
                  <CardDescription className="text-xs">
                    JobNest matches you with customers in your vicinity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-6">
                  <div className="bg-black/35 rounded-xl border border-border/40 p-4 text-xs text-muted-foreground flex flex-col gap-3 leading-relaxed">
                    <p className="font-semibold text-foreground">Why do we need location access?</p>
                    <p>• Customers can calculate your real-time ETA and travel distance.</p>
                    <p>• Receive live push notifications when a customer posts a job nearby.</p>
                    <p className="text-[10px] text-amber-500 font-medium">*Your coordinates are encrypted and only shared with users on active booked jobs.</p>
                  </div>

                  {/* Manual search backup */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground" htmlFor="city-search">
                      Or search your city manually
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="city-search"
                        placeholder="e.g. Guntur, Bangalore..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setCitySearch("Guntur, Andhra Pradesh");
                          setGpsGranted(true);
                          setSuccessMsg("Matched to Guntur coordinates!");
                          setTimeout(() => setSuccessMsg(null), 2000);
                        }}
                        className="border border-border/40 text-xs px-3 cursor-pointer"
                      >
                        Set City
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <Button
                      variant="primary"
                      onClick={handleGrantLocation}
                      className="w-full flex items-center justify-center gap-2 py-4 cursor-pointer"
                      isLoading={loading}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{gpsGranted ? "Permission Granted" : "Grant GPS Permission"}</span>
                    </Button>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <button onClick={prevStep} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                      <button onClick={nextStep} className="text-amber-500 font-semibold hover:underline cursor-pointer">
                        Skip & Set Later
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── STEP 5: WORKER PROFILE SETUP ─────────────────────────── */}
            {step === 5 && (
              <Card className="glass-panel border-border shadow-luxury backdrop-blur-md flex flex-col min-h-[480px]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Complete Worker Profile
                  </CardTitle>
                  <CardDescription className="text-xs">
                    This info builds customer trust.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-5">
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[290px] pr-1">
                    
                    {/* Photo Upload */}
                    <div className="flex items-center gap-4 border-b border-border/20 pb-3">
                      <div className="relative w-16 h-16 rounded-full bg-muted border border-border/40 overflow-hidden flex items-center justify-center">
                        {profilePhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-muted-foreground">{fullName.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="profile-avatar" className="text-xs bg-amber-600 hover:bg-amber-700 text-background px-3 py-1.5 rounded-lg font-bold cursor-pointer inline-block text-center">
                          Upload Photo
                        </label>
                        <input type="file" id="profile-avatar" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        <span className="text-[9px] text-muted-foreground">JPG/PNG. Max size 2MB.</span>
                      </div>
                    </div>

                    <Input
                      label="Contact Phone Number"
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-muted-foreground">Experience level</label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="bg-muted text-foreground text-xs font-semibold px-3 py-2 rounded-xl border border-border outline-none cursor-pointer"
                      >
                        <option value="1">1 Year or Less</option>
                        <option value="2">2 - 3 Years</option>
                        <option value="5">5+ Years (Expert)</option>
                        <option value="10">10+ Years (Master)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-muted-foreground">About / Professional Bio</label>
                      <textarea
                        value={aboutBio}
                        onChange={(e) => setAboutBio(e.target.value)}
                        rows={3}
                        placeholder="State your tools, areas of expertise, and service quality guarantee..."
                        className="w-full rounded-xl bg-muted/40 border border-border/40 p-3 text-xs text-foreground focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <button onClick={prevStep} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <Button variant="primary" onClick={nextStep} className="px-5 text-xs cursor-pointer">
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── STEP 6: SKILL SELECTION ──────────────────────────────── */}
            {step === 6 && (
              <Card className="glass-panel border-border shadow-luxury backdrop-blur-md flex flex-col min-h-[480px]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Select Your Skills
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose categories and get dynamic AI recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-5">
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-1">
                    
                    {/* Add Custom Skill form */}
                    <form onSubmit={handleAddCustomSkill} className="flex gap-2">
                      <Input
                        placeholder="Search or add skill..."
                        value={skillQuery}
                        onChange={(e) => setSkillQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" variant="ghost" className="border border-border/40 text-xs px-3 cursor-pointer">
                        Add
                      </Button>
                    </form>

                    {/* Selected skills list */}
                    {selectedSkills.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">My Selected Skills</label>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSkills.map((s) => (
                            <Badge
                              key={s}
                              variant="success"
                              className="px-2.5 py-1 text-xs rounded-full flex items-center gap-1.5 cursor-pointer bg-emerald-950/60 border border-emerald-500/30 text-emerald-400"
                              onClick={() => toggleSkill(s)}
                            >
                              <span>{s}</span>
                              <span className="text-[9px] opacity-75">✕</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular skills chips */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Popular Handyman Skills</label>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SKILLS.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className={`py-1 px-3 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                              selectedSkills.includes(skill)
                                ? "bg-amber-600/30 text-amber-300 border-amber-500"
                                : "border-border hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Suggestions section */}
                    <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3.5 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] uppercase font-bold text-amber-400">AI Demand Suggestions (Guntur)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiSuggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => toggleSkill(s)}
                            className={`py-1 px-2.5 text-[10px] font-bold rounded-lg border border-dashed transition-all cursor-pointer ${
                              selectedSkills.includes(s)
                                ? "bg-amber-600/30 text-amber-300 border-amber-500"
                                : "border-amber-500/30 text-amber-400/80 hover:bg-amber-950/40"
                            }`}
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <button onClick={prevStep} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <Button variant="primary" onClick={nextStep} className="px-5 text-xs cursor-pointer">
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── STEP 7: WORK PREFERENCES ─────────────────────────────── */}
            {step === 7 && (
              <Card className="glass-panel border-border shadow-luxury backdrop-blur-md flex flex-col min-h-[480px]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Configure Work Preferences
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define payout ranges and hyperlocal operating boundaries.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-5">
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-1">
                    
                    {/* Radius Slider */}
                    <div className="flex flex-col gap-2 border border-border/20 rounded-xl p-3.5 bg-black/10">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Hyperlocal Travel Distance</span>
                        <span className="text-amber-500 font-bold">{workRadius} Km</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={workRadius}
                        onChange={(e) => setWorkRadius(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg bg-border/40"
                      />
                      <span className="text-[10px] text-muted-foreground">Receive client requests up to {workRadius} kilometers away.</span>
                    </div>

                    {/* Expected Payout Slider */}
                    <div className="flex flex-col gap-2 border border-border/20 rounded-xl p-3.5 bg-black/10">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Expected Daily Rate</span>
                        <span className="text-amber-500 font-bold">₹{earnings} / day</span>
                      </div>
                      <input
                        type="range"
                        min="300"
                        max="5000"
                        step="100"
                        value={earnings}
                        onChange={(e) => setEarnings(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg bg-border/40"
                      />
                      <span className="text-[10px] text-muted-foreground">Helps suggest pricing parameters for booked jobs automatically.</span>
                    </div>

                    {/* Availability Select */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Availability Schedule</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["full-time", "part-time", "weekends"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setAvailability(mode)}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border capitalize transition-all cursor-pointer ${
                              availability === mode
                                ? "bg-amber-600/30 text-amber-300 border-amber-500"
                                : "border-border hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            {mode.replace("-", " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <button onClick={prevStep} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <Button variant="primary" onClick={nextStep} className="px-5 text-xs cursor-pointer">
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── STEP 8: COMPLETION SCREEN ────────────────────────────── */}
            {step === 8 && (
              <Card className="glass-panel border-border shadow-luxury backdrop-blur-md flex flex-col min-h-[480px]">
                <CardHeader className="text-center">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg mb-3">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    Onboarding Completed!
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your profile registry is now live in Guntur region.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-5">
                  <div className="bg-black/35 border border-border/30 rounded-xl p-4 flex flex-col gap-3 text-xs leading-relaxed">
                    <div className="flex justify-between items-center border-b border-border/10 pb-2">
                      <span className="text-muted-foreground">Full Name:</span>
                      <span className="font-bold text-foreground">{fullName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/10 pb-2">
                      <span className="text-muted-foreground">Hyperlocal Distance:</span>
                      <span className="font-bold text-amber-500">{workRadius} Km</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/10 pb-2">
                      <span className="text-muted-foreground">Selected Skills:</span>
                      <span className="font-bold text-foreground truncate max-w-[200px]">{selectedSkills.join(", ")}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-muted-foreground">Profile Status:</span>
                      <Badge variant="success" className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">100% Complete</Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <Button
                      variant="primary"
                      onClick={handleCompleteOnboarding}
                      className="w-full flex items-center justify-center gap-2 py-4 cursor-pointer"
                      isLoading={loading}
                    >
                      <span>Start Finding Opportunities</span>
                      <ArrowRight className="w-4 h-4 animate-pulse" />
                    </Button>
                    <button onClick={prevStep} className="text-xs text-muted-foreground hover:text-foreground self-center cursor-pointer">
                      Review Preferences
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── FOOTER TRUST METRICS ──────────────────────────────────── */}
      <div className="w-full max-w-xl text-center mt-4">
        <Typography variant="muted" className="text-[10px] leading-relaxed flex items-center justify-center gap-1.5 text-muted-foreground/60">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>JobNest Verified Worker Trust Network • Aadhaar KYC Verified</span>
        </Typography>
      </div>
    </div>
  );
}
