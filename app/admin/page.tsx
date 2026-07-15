"use client";

import { useState, useEffect } from "react";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { useModeration } from "@/hooks/useModeration";
import { useSupport } from "@/hooks/useSupport";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "analytics" | "moderation" | "support" | "revenue" | "fraud" | "config" | "audit" | "reports";

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  category: string;
  resource: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────
// I18n (5 Languages)
// ─────────────────────────────────────────────────────────────────

const T = {
  en: {
    title: "Enterprise Command Center",
    subtitle: "Business Operating System · JobNest V2",
    overview: "Overview", analytics: "Analytics", moderation: "Moderation",
    support: "Support", revenue: "Revenue", fraud: "Fraud Ops",
    config: "Configuration", audit: "Audit", reports: "Reports",
    activeUsers: "Active Users", onlineWorkers: "Online Workers",
    onlineEmployers: "Online Employers", liveJobs: "Live Jobs",
    dailyRevenue: "Daily Revenue", fraudAlerts: "Fraud Alerts",
    aiRequests: "AI Requests Today", apiHealth: "API Health",
    pending: "Pending", inReview: "In Review", resolvedToday: "Resolved Today",
    escalated: "Escalated", approve: "Approve", reject: "Reject",
    escalate: "Escalate", openTickets: "Open Tickets", slaBreached: "SLA Breached",
    avgResponse: "Avg Response", resolve: "Resolve", close: "Close",
    featureFlags: "Feature Flags", systemSettings: "System Settings",
    enabled: "Enabled", disabled: "Disabled",
    generateReport: "Generate Report", reportQueued: "Report Queued",
    growth: "Growth", conversionRate: "Hire Conversion Rate",
    completionRate: "Completion Rate", cancellationRate: "Cancellation Rate",
    topSkills: "Top Skills", languageUsage: "Language Usage",
    villageCoverage: "Village vs Urban Coverage",
    trustDistribution: "Trust Score Distribution",
    loadData: "Load Data",
  },
  hi: {
    title: "एंटरप्राइज़ कमांड सेंटर",
    subtitle: "व्यापार संचालन प्रणाली · JobNest V2",
    overview: "अवलोकन", analytics: "एनालिटिक्स", moderation: "मॉडरेशन",
    support: "सहायता", revenue: "राजस्व", fraud: "धोखाधड़ी",
    config: "कॉन्फ़िगरेशन", audit: "ऑडिट", reports: "रिपोर्ट",
    activeUsers: "सक्रिय उपयोगकर्ता", onlineWorkers: "ऑनलाइन कर्मचारी",
    onlineEmployers: "ऑनलाइन नियोक्ता", liveJobs: "लाइव जॉब",
    dailyRevenue: "दैनिक राजस्व", fraudAlerts: "धोखा अलर्ट",
    aiRequests: "आज AI अनुरोध", apiHealth: "API स्वास्थ्य",
    pending: "लंबित", inReview: "समीक्षा में", resolvedToday: "आज हल",
    escalated: "एस्केलेट", approve: "अनुमोदित", reject: "अस्वीकार",
    escalate: "एस्केलेट", openTickets: "खुले टिकट", slaBreached: "SLA उल्लंघन",
    avgResponse: "औसत प्रतिक्रिया", resolve: "हल करें", close: "बंद करें",
    featureFlags: "फ़ीचर फ्लैग", systemSettings: "सिस्टम सेटिंग",
    enabled: "सक्षम", disabled: "अक्षम",
    generateReport: "रिपोर्ट बनाएं", reportQueued: "रिपोर्ट कतार में",
    growth: "वृद्धि", conversionRate: "भर्ती रूपांतरण दर",
    completionRate: "पूर्णता दर", cancellationRate: "रद्दीकरण दर",
    topSkills: "शीर्ष कौशल", languageUsage: "भाषा उपयोग",
    villageCoverage: "गांव बनाम शहर कवरेज",
    trustDistribution: "विश्वास स्कोर वितरण",
    loadData: "डेटा लोड करें",
  },
  te: {
    title: "ఎంటర్‌ప్రైజ్ కమాండ్ సెంటర్",
    subtitle: "వ్యాపార నిర్వహణ వ్యవస్థ · JobNest V2",
    overview: "అవలోకనం", analytics: "విశ్లేషణలు", moderation: "మోడరేషన్",
    support: "మద్దతు", revenue: "ఆదాయం", fraud: "మోసం కార్యకలాపాలు",
    config: "కాన్ఫిగరేషన్", audit: "ఆడిట్", reports: "నివేదికలు",
    activeUsers: "యాక్టివ్ వినియోగదారులు", onlineWorkers: "ఆన్‌లైన్ కార్మికులు",
    onlineEmployers: "ఆన్‌లైన్ యజమానులు", liveJobs: "లైవ్ ఉద్యోగాలు",
    dailyRevenue: "రోజువారీ ఆదాయం", fraudAlerts: "మోసం హెచ్చరికలు",
    aiRequests: "నేడు AI అభ్యర్థనలు", apiHealth: "API ఆరోగ్యం",
    pending: "పెండింగ్", inReview: "సమీక్షలో", resolvedToday: "నేడు పరిష్కరించబడింది",
    escalated: "ఎస్కలేట్", approve: "ఆమోదించు", reject: "తిరస్కరించు",
    escalate: "ఎస్కలేట్", openTickets: "తెరిచిన టిక్కెట్లు", slaBreached: "SLA ఉల్లంఘన",
    avgResponse: "సగటు ప్రతిస్పందన", resolve: "పరిష్కరించు", close: "మూసివేయి",
    featureFlags: "ఫీచర్ ఫ్లాగ్‌లు", systemSettings: "సిస్టమ్ సెట్టింగులు",
    enabled: "సక్రియం", disabled: "నిష్క్రియం",
    generateReport: "నివేదిక రూపొందించు", reportQueued: "నివేదిక క్యూలో ఉంది",
    growth: "వృద్ధి", conversionRate: "నియామక మార్పిడి రేటు",
    completionRate: "పూర్తి రేటు", cancellationRate: "రద్దు రేటు",
    topSkills: "అగ్రశ్రేణి నైపుణ్యాలు", languageUsage: "భాష వినియోగం",
    villageCoverage: "గ్రామం vs పట్టణ కవరేజ్",
    trustDistribution: "నమ్మకం స్కోర్ పంపిణీ",
    loadData: "డేటా లోడ్ చేయి",
  },
  ta: {
    title: "நிறுவன கட்டளை மையம்",
    subtitle: "வணிக இயக்க அமைப்பு · JobNest V2",
    overview: "மேலோட்டம்", analytics: "பகுப்பாய்வு", moderation: "மிதனம்",
    support: "ஆதரவு", revenue: "வருவாய்", fraud: "மோசடி நடவடிக்கை",
    config: "கட்டமைப்பு", audit: "தணிக்கை", reports: "அறிக்கைகள்",
    activeUsers: "செயலில் உள்ள பயனர்கள்", onlineWorkers: "ஆன்லைன் தொழிலாளர்கள்",
    onlineEmployers: "ஆன்லைன் முதலாளிகள்", liveJobs: "நேரடி வேலைகள்",
    dailyRevenue: "தினசரி வருவாய்", fraudAlerts: "மோசடி எச்சரிக்கைகள்",
    aiRequests: "இன்றைய AI கோரிக்கைகள்", apiHealth: "API நலன்",
    pending: "நிலுவையில்", inReview: "மதிப்பாய்வில்", resolvedToday: "இன்று தீர்க்கப்பட்டது",
    escalated: "அதிகரிக்கப்பட்டது", approve: "அனுமதி", reject: "நிராகரி",
    escalate: "அதிகரி", openTickets: "திறந்த டிக்கெட்கள்", slaBreached: "SLA மீறல்",
    avgResponse: "சராசரி பதில் நேரம்", resolve: "தீர்வு காண்", close: "மூடு",
    featureFlags: "அம்ச கொடிகள்", systemSettings: "கணினி அமைப்புகள்",
    enabled: "இயக்கப்பட்டது", disabled: "முடக்கப்பட்டது",
    generateReport: "அறிக்கை உருவாக்கு", reportQueued: "அறிக்கை வரிசையில்",
    growth: "வளர்ச்சி", conversionRate: "பணியமர்த்தல் மாற்று விகிதம்",
    completionRate: "நிறைவு விகிதம்", cancellationRate: "ரத்து விகிதம்",
    topSkills: "சிறந்த திறன்கள்", languageUsage: "மொழி பயன்பாடு",
    villageCoverage: "கிராமம் vs நகரம் கவரேஜ்",
    trustDistribution: "நம்பிக்கை மதிப்பெண் விநியோகம்",
    loadData: "தரவு ஏற்றவும்",
  },
  kn: {
    title: "ಎಂಟರ್‌ಪ್ರೈಸ್ ಕಮಾಂಡ್ ಸೆಂಟರ್",
    subtitle: "ವ್ಯಾಪಾರ ಕಾರ್ಯಾಚರಣೆ ವ್ಯವಸ್ಥೆ · JobNest V2",
    overview: "ಅವಲೋಕನ", analytics: "ವಿಶ್ಲೇಷಣೆ", moderation: "ಮಧ್ಯಸ್ಥಿಕೆ",
    support: "ಬೆಂಬಲ", revenue: "ಆದಾಯ", fraud: "ವಂಚನೆ ಕಾರ್ಯಾಚರಣೆ",
    config: "ಕಾನ್ಫಿಗರೇಶನ್", audit: "ಆಡಿಟ್", reports: "ವರದಿಗಳು",
    activeUsers: "ಸಕ್ರಿಯ ಬಳಕೆದಾರರು", onlineWorkers: "ಆನ್‌ಲೈನ್ ಕಾರ್ಮಿಕರು",
    onlineEmployers: "ಆನ್‌ಲೈನ್ ಉದ್ಯೋಗದಾತರು", liveJobs: "ಲೈವ್ ಉದ್ಯೋಗಗಳು",
    dailyRevenue: "ದೈನಂದಿನ ಆದಾಯ", fraudAlerts: "ವಂಚನೆ ಎಚ್ಚರಿಕೆಗಳು",
    aiRequests: "ಇಂದಿನ AI ವಿನಂತಿಗಳು", apiHealth: "API ಆರೋಗ್ಯ",
    pending: "ಬಾಕಿ", inReview: "ಪರಿಶೀಲನೆಯಲ್ಲಿ", resolvedToday: "ಇಂದು ಪರಿಹರಿಸಲಾಗಿದೆ",
    escalated: "ಎಸ್ಕಲೇಟ್", approve: "ಅನುಮೋದಿಸು", reject: "ತಿರಸ್ಕರಿಸು",
    escalate: "ಎಸ್ಕಲೇಟ್", openTickets: "ತೆರೆದ ಟಿಕೆಟ್‌ಗಳು", slaBreached: "SLA ಉಲ್ಲಂಘನೆ",
    avgResponse: "ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ", resolve: "ಪರಿಹರಿಸು", close: "ಮುಚ್ಚು",
    featureFlags: "ವೈಶಿಷ್ಟ್ಯ ಧ್ವಜಗಳು", systemSettings: "ಸಿಸ್ಟಮ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    enabled: "ಸಕ್ರಿಯ", disabled: "ನಿಷ್ಕ್ರಿಯ",
    generateReport: "ವರದಿ ರಚಿಸು", reportQueued: "ವರದಿ ಸರದಿಯಲ್ಲಿದೆ",
    growth: "ಬೆಳವಣಿಗೆ", conversionRate: "ನೇಮಕ ಪರಿವರ್ತನೆ ದರ",
    completionRate: "ಪೂರ್ಣಗೊಳಿಸುವ ದರ", cancellationRate: "ರದ್ದುಗೊಳಿಸುವ ದರ",
    topSkills: "ಅಗ್ರ ಕೌಶಲಗಳು", languageUsage: "ಭಾಷೆ ಬಳಕೆ",
    villageCoverage: "ಗ್ರಾಮ vs ನಗರ ಕವರೇಜ್",
    trustDistribution: "ನಂಬಿಕೆ ಸ್ಕೋರ್ ವಿತರಣೆ",
    loadData: "ಡೇಟಾ ಲೋಡ್ ಮಾಡಿ",
  },
} as const;

type Lang = keyof typeof T;

// ─────────────────────────────────────────────────────────────────
// Simulated Fraud Cases
// ─────────────────────────────────────────────────────────────────

const FRAUD_CASES = [
  { id: "fc-1", title: "Automated Mass Application Bot", suspect: "user-bot-1", severity: "critical", status: "investigating", created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: "fc-2", title: "GPS Spoofing — Impossible Travel", suspect: "user-gps-2", severity: "high", status: "confirmed", created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: "fc-3", title: "Duplicate Identity — 3 Accounts", suspect: "user-dup-3", severity: "high", status: "open", created_at: new Date(Date.now() - 21600000).toISOString() },
  { id: "fc-4", title: "Fake Employer Scam — Payment Evasion", suspect: "user-scam-4", severity: "critical", status: "action_taken", created_at: new Date(Date.now() - 28800000).toISOString() },
  { id: "fc-5", title: "Review Manipulation Ring", suspect: "user-ring-5", severity: "medium", status: "investigating", created_at: new Date(Date.now() - 36000000).toISOString() },
];

const REPORT_TYPES = [
  { type: "daily_summary", label: "Daily Platform Summary" },
  { type: "weekly_revenue", label: "Weekly Revenue Report" },
  { type: "monthly_analytics", label: "Monthly Analytics" },
  { type: "worker_growth", label: "Worker Growth Report" },
  { type: "employer_growth", label: "Employer Growth Report" },
  { type: "fraud_summary", label: "Fraud Summary" },
  { type: "trust_scores", label: "Trust Score Distribution" },
  { type: "opportunity_analytics", label: "Opportunity Analytics" },
  { type: "support_sla", label: "Support SLA Report" },
  { type: "financial_reconciliation", label: "Financial Reconciliation" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

function severityColor(s: string) {
  if (s === "critical") return "#ff1744";
  if (s === "high") return "#ff6d00";
  if (s === "medium") return "#ffc400";
  return "#69f0ae";
}

function priorityColor(p: string) {
  if (p === "critical") return "#ff1744";
  if (p === "urgent") return "#ff6d00";
  if (p === "high") return "#ff9800";
  if (p === "medium") return "#06b6d4";
  return "#94a3b8";
}

function statusColor(s: string) {
  if (s === "open") return "#f59e0b";
  if (s === "in_progress") return "#06b6d4";
  if (s === "escalated") return "#ef4444";
  if (s === "resolved" || s === "closed") return "#10b981";
  return "#94a3b8";
}

const TABS: { key: Tab; icon: string }[] = [
  { key: "overview", icon: "🏠" },
  { key: "analytics", icon: "📊" },
  { key: "moderation", icon: "🛡️" },
  { key: "support", icon: "🎫" },
  { key: "revenue", icon: "💰" },
  { key: "fraud", icon: "🚨" },
  { key: "config", icon: "⚙️" },
  { key: "audit", icon: "📋" },
  { key: "reports", icon: "📈" },
];

const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" }, { code: "hi", label: "हि" },
  { code: "te", label: "తె" }, { code: "ta", label: "த" },
  { code: "kn", label: "ಕ" },
];

// ─────────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];

  const analytics = useAdminAnalytics();
  const moderation = useModeration();
  const support = useSupport();
  const config = useSystemConfig();

  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);

  const [reportQueued, setReportQueued] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState("daily_summary");

  const fetchAudit = async (search = "") => {
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?limit=30${search ? `&search=${search}` : ""}`);
      const data = await res.json();
      if (data.success) setAuditEntries(data.data.entries || []);
    } catch { /* silent */ }
    setAuditLoading(false);
  };

  // Auto-load on tab switch
  useEffect(() => {
    if (tab === "overview" || tab === "analytics" || tab === "revenue") analytics.fetchDashboard();
    if (tab === "moderation") moderation.fetchQueue();
    if (tab === "support") support.fetchTickets();
    if (tab === "config") config.fetchConfig();
    if (tab === "audit") fetchAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: selectedReport,
          periodStart: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
          periodEnd: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      if (data.success) setReportQueued(data.data.reportId);
    } catch { /* silent */ }
    setReportLoading(false);
  };

  const kpis = analytics.dashboard?.kpis;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #04040f 0%, #0d0d1e 40%, #050d1a 100%)", color: "#fff", fontFamily: "var(--font-inter, -apple-system, sans-serif)" }}>

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg, #7c3aed, #06b6d4, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            🏢 {t.title}
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{t.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Live pulse */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", display: "block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#10b981" }}>Live</span>
          </div>
          {/* Language switcher */}
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)} style={{ padding: "4px 10px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: lang === l.code ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.06)", color: lang === l.code ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.2s" }}>{l.label}</button>
          ))}
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", display: "flex", gap: 4, overflowX: "auto" }}>
        {TABS.map(({ key, icon }) => (
          <button
            key={key}
            id={`admin-tab-${key}`}
            onClick={() => setTab(key)}
            style={{
              padding: "12px 16px", border: "none", cursor: "pointer", background: "none", color: tab === key ? "#fff" : "rgba(255,255,255,0.4)",
              borderBottom: tab === key ? "2px solid #7c3aed" : "2px solid transparent",
              fontSize: 13, fontWeight: tab === key ? 700 : 400, whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {icon} {t[key]}
          </button>
        ))}
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>

        {/* ══════════════════════════════════════════════ OVERVIEW */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Platform Health</h2>
              <Button onClick={analytics.fetchDashboard} disabled={analytics.loading} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "#fff", borderRadius: 8, fontSize: 13 }}>
                {analytics.loading ? "Loading..." : `🔄 ${t.loadData}`}
              </Button>
            </div>

            {/* KPI Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: t.activeUsers, value: fmt(kpis?.activeUsers ?? 127438), icon: "👥", color: "#7c3aed", sub: `${fmt(kpis?.dailyActiveUsers ?? 18924)} DAU` },
                { label: t.onlineWorkers, value: fmt(kpis?.onlineWorkers ?? 3841), icon: "🔨", color: "#10b981", sub: "Accepting jobs" },
                { label: t.onlineEmployers, value: fmt(kpis?.onlineEmployers ?? 1204), icon: "🏢", color: "#06b6d4", sub: "Posting now" },
                { label: t.liveJobs, value: fmt(kpis?.liveJobs ?? 2318), icon: "⚡", color: "#f59e0b", sub: `${fmt(kpis?.activeOpportunities ?? 12607)} opportunities` },
                { label: t.dailyRevenue, value: fmtCurrency(kpis?.dailyRevenue ?? 284750), icon: "💹", color: "#10b981", sub: `${fmtCurrency(kpis?.monthlyRevenue ?? 6230000)} MTD` },
                { label: "Active Escrows", value: fmt(kpis?.activeEscrows ?? 4122), icon: "🔒", color: "#8b5cf6", sub: `${fmtCurrency(kpis?.totalWalletBalance ?? 18450000)} in wallets` },
                { label: t.fraudAlerts, value: kpis?.fraudAlerts ?? 23, icon: "🚨", color: "#ef4444", sub: `${kpis?.openDisputes ?? 134} open disputes` },
                { label: t.aiRequests, value: fmt(kpis?.aiRequestsToday ?? 34567), icon: "🧠", color: "#a78bfa", sub: `${kpis?.apiSuccessRate ?? 99.7}% API health` },
              ].map((item) => (
                <Card key={item.label} style={{ background: `${item.color}0d`, border: `1px solid ${item.color}33`, borderRadius: 14 }}>
                  <CardContent style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5 }}>{item.label}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 800, color: item.color }}>{item.value}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{item.sub}</p>
                      </div>
                      <span style={{ fontSize: 28 }}>{item.icon}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Growth Metrics */}
            {analytics.dashboard?.userGrowth && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {analytics.dashboard.userGrowth.map((g) => (
                  <div key={g.label} style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{g.label}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700, color: "#fff" }}>{typeof g.current === "number" && g.current > 100000 ? fmtCurrency(g.current) : fmt(g.current)}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: g.trend === "up" ? "#10b981" : g.trend === "down" ? "#ef4444" : "#94a3b8" }}>
                        {g.trend === "up" ? "↑" : g.trend === "down" ? "↓" : "→"} {Math.abs(g.changePercent).toFixed(1)}%
                      </span>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>vs last period</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════ ANALYTICS */}
        {tab === "analytics" && (
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>Business Analytics</h2>
            {!analytics.dashboard && <Button onClick={analytics.fetchDashboard} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "#fff", borderRadius: 8, marginBottom: 20 }}>{t.loadData}</Button>}

            {analytics.dashboard && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                {[
                  { label: t.conversionRate, value: `${analytics.dashboard.hireConversionRate}%`, color: "#10b981" },
                  { label: t.completionRate, value: `${analytics.dashboard.completionRate}%`, color: "#06b6d4" },
                  { label: t.cancellationRate, value: `${analytics.dashboard.cancellationRate}%`, color: "#ef4444" },
                  { label: "Avg Response", value: `${analytics.dashboard.avgResponseTimeMinutes}m`, color: "#f59e0b" },
                  { label: "Worker Retention", value: `${analytics.dashboard.workerRetentionRate}%`, color: "#7c3aed" },
                  { label: "Employer Retention", value: `${analytics.dashboard.employerRetentionRate}%`, color: "#8b5cf6" },
                  { label: "Avg Hire Time", value: `${analytics.dashboard.avgHireTimeHours}h`, color: "#06b6d4" },
                  { label: "Avg Completion", value: `${analytics.dashboard.avgCompletionTimeHours}h`, color: "#10b981" },
                ].map((m) => (
                  <div key={m.label} style={{ padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 10, border: `1px solid ${m.color}33`, textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{m.label}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color: m.color }}>{m.value}</p>
                  </div>
                ))}
              </div>
            )}

            {analytics.dashboard && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Top Skills */}
                <Card style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 14 }}>
                  <CardHeader><CardTitle style={{ color: "#c4b5fd" }}>🎯 {t.topSkills}</CardTitle></CardHeader>
                  <CardContent>
                    {analytics.dashboard.skillPopularity.slice(0, 8).map((s) => (
                      <div key={s.skill} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: "#e2e8f0" }}>{s.skill}</span>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{fmt(s.count)}</span>
                            <Badge style={{ background: s.trend === "rising" ? "rgba(16,185,129,0.2)" : s.trend === "declining" ? "rgba(239,68,68,0.2)" : "rgba(148,163,184,0.2)", color: s.trend === "rising" ? "#6ee7b7" : s.trend === "declining" ? "#fca5a5" : "#94a3b8", fontSize: 10 }}>
                              {s.trend === "rising" ? "📈" : s.trend === "declining" ? "📉" : "→"}
                            </Badge>
                          </div>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${(s.count / 15000) * 100}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Language + Village vs Urban */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Card style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 14 }}>
                    <CardHeader><CardTitle style={{ color: "#67e8f9", fontSize: 15 }}>🌐 {t.languageUsage}</CardTitle></CardHeader>
                    <CardContent>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {analytics.dashboard.languageUsage.map((l) => (
                          <div key={l.language} style={{ flex: "1 1 120px", padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 13, color: "#e2e8f0" }}>{l.language}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#06b6d4" }}>{l.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 14 }}>
                    <CardHeader><CardTitle style={{ color: "#6ee7b7", fontSize: 15 }}>🗺️ {t.villageCoverage}</CardTitle></CardHeader>
                    <CardContent>
                      {analytics.dashboard.villageVsUrban.map((v) => (
                        <div key={v.segment} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 13, color: "#d1fae5" }}>{v.segment}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{v.pct}%</span>
                          </div>
                          <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                            <div style={{ height: "100%", width: `${v.pct}%`, background: "linear-gradient(90deg,#059669,#10b981)", borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════ MODERATION */}
        {tab === "moderation" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Content Moderation Queue</h2>
              <Button onClick={moderation.fetchQueue} disabled={moderation.loading} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "#fff", borderRadius: 8, fontSize: 13 }}>
                {moderation.loading ? "Loading..." : `🔄 ${t.loadData}`}
              </Button>
            </div>

            {/* Stats */}
            {moderation.stats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: t.pending, value: moderation.stats.pending, color: "#f59e0b" },
                  { label: t.inReview, value: moderation.stats.inReview, color: "#06b6d4" },
                  { label: t.resolvedToday, value: moderation.stats.resolvedToday, color: "#10b981" },
                  { label: t.escalated, value: moderation.stats.escalated, color: "#ef4444" },
                  { label: "Avg Resolve", value: `${moderation.stats.avgResolutionHours}h`, color: "#a78bfa" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: 14, background: `${s.color}10`, border: `1px solid ${s.color}30`, borderRadius: 10, textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{s.label}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Queue Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {moderation.items.map((item) => (
                <div key={item.id} style={{ padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: `1px solid ${priorityColor(item.priority)}33`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center" }}>
                        <Badge style={{ background: `${priorityColor(item.priority)}20`, color: priorityColor(item.priority), fontSize: 10, textTransform: "uppercase" }}>{item.priority}</Badge>
                        <Badge style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 10 }}>{item.contentType}</Badge>
                        <Badge style={{ background: "rgba(255,255,255,0.05)", color: item.status === "in_review" ? "#06b6d4" : "#f59e0b", fontSize: 10 }}>{item.status}</Badge>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{item.reason || "No reason provided"}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Content ID: {item.contentId} · {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <Button onClick={() => moderation.takeAction(item.id, "approved")} disabled={moderation.actionLoading === item.id} style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#6ee7b7", borderRadius: 6, fontSize: 12, padding: "6px 12px" }}>
                      ✓ {t.approve}
                    </Button>
                    <Button onClick={() => moderation.takeAction(item.id, "rejected")} disabled={moderation.actionLoading === item.id} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", borderRadius: 6, fontSize: 12, padding: "6px 12px" }}>
                      ✗ {t.reject}
                    </Button>
                    <Button onClick={() => moderation.takeAction(item.id, "escalated")} disabled={moderation.actionLoading === item.id} style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#fcd34d", borderRadius: 6, fontSize: 12, padding: "6px 12px" }}>
                      ↑ {t.escalate}
                    </Button>
                  </div>
                </div>
              ))}
              {moderation.items.length === 0 && !moderation.loading && (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 40 }}>No items in queue. Click Load Data to fetch.</p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ SUPPORT */}
        {tab === "support" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Customer Support</h2>
              <Button onClick={support.fetchTickets} disabled={support.loading} style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)", border: "none", color: "#fff", borderRadius: 8, fontSize: 13 }}>
                {support.loading ? "Loading..." : `🔄 ${t.loadData}`}
              </Button>
            </div>

            {support.stats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: t.openTickets, value: support.stats.open, color: "#f59e0b" },
                  { label: "In Progress", value: support.stats.inProgress, color: "#06b6d4" },
                  { label: "Waiting User", value: support.stats.waitingOnUser, color: "#94a3b8" },
                  { label: t.escalated, value: support.stats.escalated, color: "#ef4444" },
                  { label: t.resolvedToday, value: support.stats.resolvedToday, color: "#10b981" },
                  { label: t.avgResponse, value: `${support.stats.avgResponseTimeMinutes}m`, color: "#a78bfa" },
                  { label: t.slaBreached, value: support.stats.slaBreachCount, color: "#ff1744" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: 12, background: `${s.color}10`, border: `1px solid ${s.color}30`, borderRadius: 10, textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{s.label}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {support.tickets.map((ticket) => (
                <div key={ticket.id} style={{ padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: `1px solid ${ticket.slaBreached ? "#ef4444" : priorityColor(ticket.priority)}33` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <Badge style={{ background: `${priorityColor(ticket.priority)}20`, color: priorityColor(ticket.priority), fontSize: 10, textTransform: "uppercase" }}>{ticket.priority}</Badge>
                        <Badge style={{ background: `${statusColor(ticket.status)}20`, color: statusColor(ticket.status), fontSize: 10 }}>{ticket.status}</Badge>
                        <Badge style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 10 }}>{ticket.category}</Badge>
                        {ticket.slaBreached && <Badge style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 10 }}>⚠️ SLA BREACHED</Badge>}
                        {!ticket.slaBreached && ticket.slaRemainingMinutes !== null && ticket.slaRemainingMinutes < 60 && (
                          <Badge style={{ background: "rgba(245,158,11,0.2)", color: "#fcd34d", fontSize: 10 }}>⏰ {ticket.slaRemainingMinutes}m remaining</Badge>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: "#e2e8f0", fontWeight: 600 }}>{ticket.subject}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>#{ticket.id} · {new Date(ticket.createdAt).toLocaleString()}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <Button onClick={() => support.updateStatus(ticket.id, "resolved")} style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7", borderRadius: 6, fontSize: 11, padding: "4px 10px" }}>
                        ✓ {t.resolve}
                      </Button>
                      <Button onClick={() => support.updateStatus(ticket.id, "closed")} style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.3)", color: "#94a3b8", borderRadius: 6, fontSize: 11, padding: "4px 10px" }}>
                        {t.close}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {support.tickets.length === 0 && !support.loading && (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 40 }}>No tickets loaded. Click Load Data to fetch.</p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ REVENUE */}
        {tab === "revenue" && (
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>Revenue & Financial Monitoring</h2>
            {!analytics.dashboard && <Button onClick={analytics.fetchDashboard} style={{ background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "#fff", borderRadius: 8, marginBottom: 20 }}>{t.loadData}</Button>}

            {analytics.dashboard && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                  {[
                    { label: "Daily Revenue", value: fmtCurrency(analytics.dashboard.kpis.dailyRevenue), icon: "📈", color: "#10b981" },
                    { label: "Monthly Revenue", value: fmtCurrency(analytics.dashboard.kpis.monthlyRevenue), icon: "💹", color: "#059669" },
                    { label: "Total Wallet Balance", value: fmtCurrency(analytics.dashboard.kpis.totalWalletBalance), icon: "👛", color: "#06b6d4" },
                    { label: "Active Escrows", value: fmt(analytics.dashboard.kpis.activeEscrows), icon: "🔒", color: "#7c3aed" },
                  ].map((m) => (
                    <Card key={m.label} style={{ background: `${m.color}0d`, border: `1px solid ${m.color}33`, borderRadius: 14 }}>
                      <CardContent style={{ padding: 20 }}>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{m.label}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, color: m.color }}>{m.value}</p>
                        <span style={{ fontSize: 24 }}>{m.icon}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Revenue sparkline */}
                <Card style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 14, marginBottom: 16 }}>
                  <CardHeader><CardTitle style={{ color: "#6ee7b7" }}>30-Day Revenue Trend</CardTitle></CardHeader>
                  <CardContent>
                    <svg viewBox={`0 0 600 80`} style={{ width: "100%", height: 80 }}>
                      {analytics.dashboard.revenueSeriesDaily.map((p, i) => {
                        const x = (i / (analytics.dashboard!.revenueSeriesDaily.length - 1)) * 590 + 5;
                        const minV = Math.min(...analytics.dashboard!.revenueSeriesDaily.map((d) => d.value));
                        const maxV = Math.max(...analytics.dashboard!.revenueSeriesDaily.map((d) => d.value));
                        const y = 75 - ((p.value - minV) / (maxV - minV)) * 65;
                        return <circle key={i} cx={x} cy={y} r={2} fill="#10b981" opacity={0.8} />;
                      })}
                      <polyline
                        fill="none"
                        stroke="url(#revGrad)"
                        strokeWidth={2}
                        points={analytics.dashboard.revenueSeriesDaily.map((p, i) => {
                          const x = (i / (analytics.dashboard!.revenueSeriesDaily.length - 1)) * 590 + 5;
                          const minV = Math.min(...analytics.dashboard!.revenueSeriesDaily.map((d) => d.value));
                          const maxV = Math.max(...analytics.dashboard!.revenueSeriesDaily.map((d) => d.value));
                          const y = 75 - ((p.value - minV) / (maxV - minV)) * 65;
                          return `${x},${y}`;
                        }).join(" ")}
                      />
                      <defs>
                        <linearGradient id="revGrad"><stop offset="0%" stopColor="#059669" /><stop offset="100%" stopColor="#10b981" /></linearGradient>
                      </defs>
                    </svg>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════ FRAUD */}
        {tab === "fraud" && (
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>Fraud Operations Center</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {FRAUD_CASES.map((fc) => (
                <div key={fc.id} style={{ padding: 18, background: "rgba(255,255,255,0.03)", borderRadius: 14, border: `1px solid ${severityColor(fc.severity)}44` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <Badge style={{ background: `${severityColor(fc.severity)}25`, color: severityColor(fc.severity), fontSize: 10, textTransform: "uppercase" }}>
                          {fc.severity}
                        </Badge>
                        <Badge style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 10 }}>
                          {fc.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fecaca" }}>{fc.title}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                        Suspect: {fc.suspect} · Opened {new Date(fc.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: 6, fontSize: 12, padding: "6px 12px" }}>
                        🔍 Investigate
                      </Button>
                      <Button style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.3)", color: "#94a3b8", borderRadius: 6, fontSize: 12, padding: "6px 12px" }}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ CONFIGURATION */}
        {tab === "config" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>System Configuration</h2>
              <Button onClick={config.fetchConfig} disabled={config.loading} style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", color: "#fff", borderRadius: 8, fontSize: 13 }}>
                {config.loading ? "Loading..." : `🔄 ${t.loadData}`}
              </Button>
            </div>

            {config.config && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Feature Flags */}
                <Card style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 14 }}>
                  <CardHeader>
                    <CardTitle style={{ color: "#fcd34d" }}>🚩 {t.featureFlags}</CardTitle>
                    <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>Live platform feature toggles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(config.config.flags).map(([key, enabled]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize: 13, color: "#e2e8f0", fontFamily: "monospace" }}>{key}</span>
                        <button
                          id={`flag-${key.replace(/\./g, "-")}`}
                          onClick={() => config.toggleFlag(key, !enabled)}
                          disabled={config.saving}
                          style={{
                            width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                            background: enabled ? "linear-gradient(90deg,#10b981,#059669)" : "rgba(255,255,255,0.1)",
                            position: "relative", transition: "background 0.3s",
                          }}
                        >
                          <span style={{
                            position: "absolute", top: 2, left: enabled ? 22 : 2,
                            width: 20, height: 20, borderRadius: "50%", background: "#fff",
                            transition: "left 0.3s", display: "block",
                          }} />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* System Settings */}
                <Card style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14 }}>
                  <CardHeader>
                    <CardTitle style={{ color: "#a5b4fc" }}>⚙️ {t.systemSettings}</CardTitle>
                    <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>Core platform parameters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {config.config.settings.map((s) => (
                      <div key={s.key} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 12, color: "#a5b4fc", fontFamily: "monospace" }}>{s.key}</span>
                          <Badge style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontSize: 9 }}>{s.category}</Badge>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{s.description}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "#c7d2fe" }}>{JSON.stringify(s.value)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════ AUDIT */}
        {tab === "audit" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Audit Center</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id="audit-search"
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  placeholder="Search actions..."
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13 }}
                />
                <Button onClick={() => fetchAudit(auditFilter)} disabled={auditLoading} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "#fff", borderRadius: 8, fontSize: 13 }}>
                  {auditLoading ? "..." : "Search"}
                </Button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {auditEntries.map((entry) => {
                const catColors: Record<string, string> = {
                  admin: "#7c3aed", security: "#ef4444", financial: "#10b981",
                  moderation: "#f59e0b", auth: "#06b6d4", kyc: "#a78bfa", support: "#06b6d4",
                };
                const color = catColors[entry.category] || "#94a3b8";
                return (
                  <div key={entry.id} style={{ padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid rgba(255,255,255,0.06)`, borderLeft: `3px solid ${color}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                        <Badge style={{ background: `${color}20`, color, fontSize: 10, textTransform: "uppercase" }}>{entry.category}</Badge>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{entry.action}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {entry.actor} · {entry.resource}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
              {auditEntries.length === 0 && !auditLoading && (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 40 }}>Loading audit log...</p>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ REPORTS */}
        {tab === "reports" && (
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>Report Generation Center</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Generate */}
              <Card style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 14 }}>
                <CardHeader>
                  <CardTitle style={{ color: "#6ee7b7" }}>📊 {t.generateReport}</CardTitle>
                  <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>Queue a new export</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <select
                      id="report-type-select"
                      value={selectedReport}
                      onChange={(e) => setSelectedReport(e.target.value)}
                      style={{ padding: "10px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, color: "#fff", fontSize: 13 }}
                    >
                      {REPORT_TYPES.map((r) => (
                        <option key={r.type} value={r.type} style={{ background: "#0d0d1e" }}>{r.label}</option>
                      ))}
                    </select>
                    <Button
                      id="generate-report-btn"
                      onClick={handleGenerateReport}
                      disabled={reportLoading}
                      style={{ background: "linear-gradient(135deg,#059669,#10b981)", border: "none", color: "#fff", borderRadius: 8, padding: "10px 20px", fontWeight: 700 }}
                    >
                      {reportLoading ? "Queuing..." : `⚡ ${t.generateReport}`}
                    </Button>

                    {reportQueued && (
                      <div style={{ padding: 12, background: "rgba(16,185,129,0.1)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.2)" }}>
                        <p style={{ margin: 0, fontSize: 12, color: "#6ee7b7" }}>✅ {t.reportQueued}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{reportQueued}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Available Reports */}
              <Card style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14 }}>
                <CardHeader>
                  <CardTitle style={{ color: "#a5b4fc" }}>📁 Available Reports</CardTitle>
                  <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>One-click generation</CardDescription>
                </CardHeader>
                <CardContent>
                  {REPORT_TYPES.map((r) => (
                    <div key={r.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 13, color: "#c7d2fe" }}>{r.label}</span>
                      <Button
                        onClick={() => { setSelectedReport(r.type); setTab("reports"); }}
                        style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", borderRadius: 6, fontSize: 11, padding: "4px 10px" }}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
