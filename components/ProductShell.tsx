"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserRole } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useMode } from "@/features/mode/ModeProvider";
import { useI18n } from "@/lib/i18n/context";
import { LocaleCode } from "@/lib/i18n/translations";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  Shield,
  Wallet,
  MessageSquare,
  Sparkles,
  Plus,
  Map as MapIcon,
  Sliders,
  Lock,
  Loader2,
  LogOut,
  Bell,
  User,
  Settings,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  PhoneCall } from
"lucide-react";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { EmptyState } from "@/components/ui/EmptyState";

interface ProductShellProps {
  children: React.ReactNode;
}

const mockNotifications = [
  { id: 1, title: "Aadhaar Verified", desc: "Your KYC trust badge is now active on ledger.", unread: true, time: "2m ago" },
  { id: 2, title: "New Job Nearby", desc: "Agriculture harvest helper needed within 2 km.", unread: true, time: "1h ago" },
  { id: 3, title: "Escrow Deposit Locked", desc: "₹1,500 locked by employer Arun for joint leak fixing.", unread: false, time: "1d ago" }
];

export function ProductShell({ children }: ProductShellProps) {
  const { t: i18nT } = useI18n();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { mode, toggleMode } = useMode();
  const { locale, setLocale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  // Responsive mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const hasUnread = notifications.some((n) => n.unread);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Guard routing logic
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Lock body scroll and listen for Escape when mobile menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  if (!isAuthenticated || !user) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{i18nT("common.verifyingSecureSessionRegistry")}</span>
      </div>);

  }

  // Global Navigation Links configuration
  const navItems = [
  {
    label: "Dashboard",
    path: user.role === "admin" ? "/admin" : `/${user.role}`,
    icon: Sliders,
    roles: ["worker", "employer", "resident", "admin"] as UserRole[]
  },
  {
    label: "Nearby Gigs",
    path: "/worker/opportunities",
    icon: MapIcon,
    roles: ["worker"] as UserRole[]
  },
  {
    label: "Geospatial Intelligence",
    path: "/geospatial",
    icon: MapIcon,
    roles: ["employer", "resident", "admin"] as UserRole[]
  },
  {
    label: "AI Engine Insights",
    path: "/ai",
    icon: Sparkles,
    roles: ["worker", "employer", "resident", "admin"] as UserRole[]
  },
  {
    label: "Realtime Messages",
    path: "/messages",
    icon: MessageSquare,
    roles: ["worker", "employer", "resident", "admin"] as UserRole[]
  },
  {
    label: "Wallet & Escrow",
    path: "/wallet",
    icon: Wallet,
    roles: ["worker", "employer", "resident", "admin"] as UserRole[]
  },
  {
    label: "Trust & Safety Ledger",
    path: "/trust",
    icon: Shield,
    roles: ["worker", "employer", "resident", "admin"] as UserRole[]
  },
  {
    label: "Admin Console",
    path: "/admin",
    icon: Lock,
    roles: ["admin"] as UserRole[]
  },
  {
    label: "My Profile",
    path: "/profile",
    icon: User,
    roles: ["worker", "employer", "resident", "admin"] as UserRole[]
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["worker", "employer", "resident", "admin"] as UserRole[]
  }];


  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role));

  // Dynamic breadcrumbs generation
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Home", path: "/" }];

    return [
    { label: "Home", path: "/" },
    ...segments.map((seg, idx) => {
      const path = `/${segments.slice(0, idx + 1).join("/")}`;
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace("-", " ");
      return { label, path };
    })];

  };

  const breadcrumbs = getBreadcrumbs();

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    router.push(`/ai?q=${encodeURIComponent(searchVal)}`);
    setSearchVal("");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* ─────────────────────────────────────────────────────────
           1. DESKTOP LEFT SIDEBAR
           ───────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-card/40 border-r border-border/40 backdrop-blur-xl shrink-0 h-screen sticky top-0 z-50 p-4">
        <div className="flex items-center gap-3 px-2 py-4 border-b border-border/20 mb-6">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-background font-extrabold text-xl shadow-luxury ${mode === 'PRO' ? 'bg-linear-to-r from-primary to-amber-600' : 'bg-linear-to-r from-emerald-500 to-teal-500'}`}>{i18nT("J")}

          </span>
          <div>
            <Typography variant="h3" className="font-bold text-base leading-tight">{mode === 'PRO' ? i18nT("common.jobnestPro") : "JobNest Local"}</Typography>
            <Typography variant="muted" className={`text-[10px] uppercase font-mono tracking-wider ${mode === 'PRO' ? 'text-primary' : 'text-emerald-500'}`}>{i18nT("common.enterpriseV2")}</Typography>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="px-2 mb-4">
          <div className="flex bg-muted/40 p-1 rounded-lg border border-border/40">
            <button 
              onClick={() => mode !== "LOCAL" && toggleMode()}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition-all ${mode === "LOCAL" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Local
            </button>
            <button 
              onClick={() => mode !== "PRO" && toggleMode()}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition-all ${mode === "PRO" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Pro
            </button>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.path || item.path !== "/" && pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive ?
                "bg-primary/10 border-l-2 border-primary text-primary" :
                "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`
                }>
                
                <Icon className={`w-4 h-4 ${isActive ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                <span>{item.label}</span>
                {item.label === "Realtime Messages" &&
                <Badge variant="primary" className="ml-auto text-[9px] px-1.5 py-0 h-4 flex items-center bg-primary/20 text-primary border-none">2</Badge>
                }
              </Link>);

          })}
        </nav>

        {/* Sidebar Bottom Profile Card */}
        <div className="border-t border-border/20 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-1">
            <Avatar className="w-10 h-10 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {user.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-foreground block truncate">{user.name}</span>
              <span className="text-[10px] text-muted-foreground block capitalize">{user.role}{i18nT("Account")}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-xs font-semibold gap-2 border-border/40 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20">
            
            <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-rose-400" />
            <span>{i18nT("common.signOut")}</span>
          </Button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────
           2. TOP BAR AND CONTENT WRAPPER
           ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border/40 h-16 flex items-center px-4 md:px-6 justify-between gap-4">
          
          {/* Breadcrumbs (Desktop) or Brand Logo (Mobile) */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-border/60 hover:bg-secondary/40 text-foreground transition-colors min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
              aria-label={i18nT("common.toggleMobileNavigationMenu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo on Mobile */}
            <div className="md:hidden flex items-center gap-2">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-background font-extrabold text-base ${mode === 'PRO' ? 'bg-linear-to-r from-primary to-amber-600' : 'bg-linear-to-r from-emerald-500 to-teal-500'}`}>{i18nT("J")}

              </span>
            </div>

            {/* Breadcrumbs list */}
            <nav className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              {breadcrumbs.map((crumb, i) =>
              <React.Fragment key={crumb.path}>
                  {i > 0 && <ChevronRight className="w-3 h-3 text-muted/40" />}
                  {i === breadcrumbs.length - 1 ?
                <span className="text-foreground font-bold">{crumb.label}</span> :

                <Link href={crumb.path} className="hover:text-foreground transition-all">
                      {crumb.label}
                    </Link>
                }
                </React.Fragment>
              )}
            </nav>
          </div>

          {/* Persistent Global Search */}
          <form onSubmit={handleGlobalSearch} className="hidden lg:flex items-center max-w-md flex-1 relative">
            <div className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 ${
            searchFocused ? "border-primary/50 shadow-luxury bg-card" : "border-border/40 bg-muted/20"}`
            }>
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={i18nT("common.askAiAssistantOrSearchGigsGlobally")}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full bg-transparent border-none text-xs placeholder:text-muted-foreground/60 focus:outline-none" />
              <div className="hidden lg:flex items-center justify-center px-1.5 py-0.5 rounded border border-border/50 bg-background/50 text-[10px] text-muted-foreground font-mono">
                ⌘K
              </div>
            </div>
          </form>

          {/* Action Icons right-side bar */}
          <div className="flex items-center gap-2">
            
            {/* Persistant Search Trigger on Tablet/Mobile */}
            <button
              onClick={() => {
                const val = prompt("Search JobNest AI database:");
                if (val) router.push(`/ai?q=${encodeURIComponent(val)}`);
              }}
              className="lg:hidden p-2 rounded-xl hover:bg-secondary/40 border border-transparent hover:border-border/30 text-muted-foreground hover:text-foreground"
              aria-label={i18nT("common.triggerGlobalSearchQueryDialog")}>
              
              <Search className="w-4 h-4" />
            </button>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as LocaleCode)}
                className="bg-muted/40 hover:bg-muted text-foreground text-[10px] font-bold px-2 py-1.5 rounded-xl border border-border/40 outline-none cursor-pointer"
                aria-label={i18nT("common.toggleUserSystemLanguageTranslation")}>
                
                <option value="en">{i18nT("EN")}</option>
                <option value="hi">{i18nT("HI")}</option>
                <option value="te">{i18nT("TE")}</option>
                <option value="ta">{i18nT("TA")}</option>
                <option value="kn">{i18nT("KN")}</option>
                <option value="ml">{i18nT("ML")}</option>
                <option value="mr">{i18nT("MR")}</option>
                <option value="gu">{i18nT("GU")}</option>
                <option value="bn">{i18nT("BN")}</option>
                <option value="pa">{i18nT("PA")}</option>
                <option value="or">{i18nT("OR")}</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border/40 hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              aria-label={i18nT("common.switchInterfaceBrightnessTheme")}>
              
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Notifications Center Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className={`p-2 rounded-xl border border-border/40 hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer relative ${
                showNotifications ? "bg-secondary/50" : ""}`
                }
                aria-label={i18nT("common.showNotificationLogsCenter")}>
                
                <Bell className="w-4 h-4" />
                {hasUnread && (
                  <>
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                  </>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-72 bg-card border border-border shadow-luxury rounded-2xl p-4 z-50 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-center border-b border-border/30 pb-2">
                        <span className="text-xs font-bold">{i18nT("common.activityNotifications")}</span>
                        <button
                          onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
                          className="text-[10px] text-primary cursor-pointer hover:underline bg-transparent border-none p-0 font-medium"
                        >
                          {i18nT("common.markAllRead")}
                        </button>
                      </div>
                      <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <EmptyState
                            icon={<Bell className="w-6 h-6 text-muted-foreground" />}
                            title="No Notifications"
                            description="You're all caught up! Platform alerts and milestones will appear here."
                            className="py-4 border-none bg-transparent text-xs"
                          />
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-2 rounded-lg text-xs flex flex-col gap-0.5 border ${
                                notif.unread ? "bg-primary/5 border-primary/10" : "bg-transparent border-transparent"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-foreground">{notif.title}</span>
                                <span className="text-[9px] text-muted">{notif.time}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-normal">{notif.desc}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile Avatar Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 cursor-pointer"
                aria-label={i18nT("common.openUserSystemSettingsProfileCard")}>
                
                <Avatar className="w-8 h-8 border border-primary/30">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {user.avatar}
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* User Menu Dropdown Panel */}
              <AnimatePresence>
                {showUserMenu &&
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-card border border-border shadow-luxury rounded-2xl p-3 z-50 flex flex-col gap-1">
                    
                      <div className="px-2 py-1.5 border-b border-border/30 mb-1">
                        <span className="text-xs font-bold text-foreground block truncate">{user.name}</span>
                        <a href={`mailto:${user.email}`} className="text-[10px] text-muted-foreground block truncate hover:underline hover:text-foreground">{user.email}</a>
                        <Badge variant="primary" className="mt-1.5 text-[9px] uppercase px-1.5 py-0 bg-primary/20 border-none text-primary">
                          {user.role}{i18nT("Dashboard")}
                      </Badge>
                      </div>

                      <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-secondary/40 text-muted-foreground hover:text-foreground cursor-pointer">
                      
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{i18nT("common.myProfile")}</span>
                      </Link>

                      <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-secondary/40 text-muted-foreground hover:text-foreground cursor-pointer">
                      
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span>{i18nT("common.accountSettings")}</span>
                      </Link>

                      <div className="border-t border-border/25 my-1" />

                      <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-rose-500/10 text-rose-400 cursor-pointer text-left">
                      
                        <LogOut className="w-4 h-4" />
                        <span>{i18nT("common.logOut")}</span>
                      </button>
                    </motion.div>
                  </>
                }
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────
             3. MOBILE MENU BAR OVERLAY
             ───────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen &&
          <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
              <motion.aside
                id="mobile-navigation-drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
                className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border/50 z-60 p-4 md:hidden flex flex-col shadow-2xl">
              
                <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-background font-extrabold text-base shadow-luxury ${mode === 'PRO' ? 'bg-linear-to-r from-primary to-amber-600' : 'bg-linear-to-r from-emerald-500 to-teal-500'}`}>{i18nT("J")}</span>
                    <Typography variant="h3" className="font-bold text-sm">{mode === 'PRO' ? i18nT("common.jobnestPro") : "JobNest Local"}</Typography>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="p-2 rounded-lg border border-border text-foreground hover:bg-secondary/40 min-h-10 min-w-10 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Mode Toggle */}
                <div className="px-1 mb-4">
                  <div className="flex bg-muted/40 p-1 rounded-lg border border-border/40">
                    <button 
                      onClick={() => mode !== "LOCAL" && toggleMode()}
                      className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition-all ${mode === "LOCAL" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      Local
                    </button>
                    <button 
                      onClick={() => mode !== "PRO" && toggleMode()}
                      className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition-all ${mode === "PRO" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      Pro
                    </button>
                  </div>
                </div>

                <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
                  {visibleNavItems.map((item) => {
                  const isActive = pathname === item.path || item.path !== "/" && pathname.startsWith(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                      isActive ?
                      "bg-primary/10 border-l-2 border-primary text-primary" :
                      "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`
                      }>
                      
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>);

                })}
                </nav>

                <div className="border-t border-border/20 pt-4 flex flex-col gap-3 mt-auto">
                  <div className="flex items-center gap-3 px-1">
                    <Avatar className="w-9 h-9 border border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-foreground block truncate">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground block capitalize">{user.role}{i18nT("Account")}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={logout} className="w-full text-xs gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>{i18nT("common.signOut")}</span>
                  </Button>
                </div>
              </motion.aside>
            </>
          }
        </AnimatePresence>

        {/* ─────────────────────────────────────────────────────────
             4. MAIN CONTAINER LAYOUT WITH SCROLL PADDING FOR MOBILE
             ───────────────────────────────────────────────────────── */}
        <main id="main-content" className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>

        {/* ─────────────────────────────────────────────────────────
             5. MOBILE BOTTOM NAVIGATION BAR
             ───────────────────────────────────────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/85 backdrop-blur-xl border-t border-border/30 md:hidden flex items-center justify-around z-40 px-2 py-1 safe-bottom pb-safe">
          <Link
            href={user.role === "admin" ? "/admin" : `/${user.role}`}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl cursor-pointer ${
            pathname === `/${user.role}` || pathname === "/admin" ? "text-primary font-bold" : "text-muted-foreground"}`
            }>
            
            <Sliders className="w-4 h-4" />
            <span className="text-[9px] mt-1">{i18nT("Dashboard")}</span>
          </Link>
          
          <Link
            href="/geospatial"
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl cursor-pointer ${
            pathname === "/geospatial" ? "text-primary font-bold" : "text-muted-foreground"}`
            }>
            
            <MapIcon className="w-4 h-4" />
            <span className="text-[9px] mt-1">{i18nT("Map")}</span>
          </Link>

          <Link
            href="/ai"
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl cursor-pointer ${
            pathname === "/ai" ? "text-primary font-bold" : "text-muted-foreground"}`
            }>
            
            <Sparkles className="w-4 h-4" />
            <span className="text-[9px] mt-1">{i18nT("common.aiSearch")}</span>
          </Link>

          <Link
            href="/messages"
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl cursor-pointer ${
            pathname === "/messages" ? "text-primary font-bold" : "text-muted-foreground"}`
            }>
            
            <MessageSquare className="w-4 h-4" />
            <span className="text-[9px] mt-1">{i18nT("Chat")}</span>
          </Link>

          <Link
            href="/wallet"
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl cursor-pointer ${
            pathname === "/wallet" ? "text-primary font-bold" : "text-muted-foreground"}`
            }>
            
            <Wallet className="w-4 h-4" />
            <span className="text-[9px] mt-1">{i18nT("Wallet")}</span>
          </Link>
        </nav>

        {/* ─────────────────────────────────────────────────────────
             6. MOBILE FLOATING ACTION BUTTON (FAB)
             ───────────────────────────────────────────────────────── */}
        <div className="fixed bottom-20 right-4 z-40 md:hidden flex flex-col gap-2">
          {/* Voice SOS Emergency Call FAB (Worker) or Create Opportunity FAB (Employer/Resident) */}
          {user.role === "worker" ?
          <button
            onClick={() => {
              setSosActive(true);
            }}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-luxury cursor-pointer"
            aria-label={i18nT("common.sendEmergencyDistressSosSignal")}>
            
              <PhoneCall className="w-5 h-5 animate-bounce" />
            </button> :

          <button
            onClick={() => {
              router.push(user.role === "employer" ? "/employer#post-opportunity" : "/resident#book-services");
            }}
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary-hover text-background flex items-center justify-center shadow-luxury cursor-pointer"
            aria-label={i18nT("common.createNewHyperlocalGigOpportunity")}>
            
              <Plus className="w-6 h-6" />
            </button>
          }
        </div>

        {/* ── EMERGENCY SOS MODAL ───────────────────────────────────── */}
        {sosActive &&
        <div className="fixed inset-0 bg-rose-950/80 backdrop-blur-xs flex items-center justify-center z-9999 p-4">
            <Card className="glass-panel border-rose-500/40 max-w-sm w-full p-6 flex flex-col gap-4 text-center shadow-luxury animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/35 flex items-center justify-center mx-auto text-rose-500 animate-pulse">
                <PhoneCall className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <Typography variant="h3" className="font-black text-rose-500 text-lg tracking-tight">{i18nT("common.emergencySosActive")}</Typography>
                <span className="text-[11px] text-muted-foreground leading-relaxed mt-1">{i18nT("common.liveTelemetryCoordinatesAadhaarKycIdentityPacketBroadcasted")}

              </span>
              </div>
              <Button
              variant="outline"
              onClick={() => setSosActive(false)}
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 w-full rounded-xl text-xs py-2 h-9 font-bold">{i18nT("common.deactivateSosSignal")}


            </Button>
            </Card>
          </div>
        }

        {/* ── GLOBAL VOICE ASSISTANT ────────────────────────────────── */}
        <VoiceAssistant />

      </div>
    </div>);

}