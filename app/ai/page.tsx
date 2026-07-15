"use client";

import { useState } from "react";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { useAiRecommendations } from "@/hooks/useAiRecommendations";
import { useProfileEnhancement } from "@/hooks/useProfileEnhancement";
import { useAiTranslation } from "@/hooks/useAiTranslation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";
import { logger } from "@/services/logger";

// ─────────────────────────────────────────────────────────────────
// Translation Dictionary
// ─────────────────────────────────────────────────────────────────

interface TranslationEntry {
  title: string;
  subtitle: string;
  semanticSearch: string;
  searchPlaceholder: string;
  recommendations: string;
  profileEnhancer: string;
  translation: string;
  salaryIntel: string;
  fraudMonitor: string;
  skillGap: string;
  search: string;
  generate: string;
  enhance: string;
  translate: string;
  analyze: string;
  rank: string;
  similarity: string;
  distance: string;
  score: string;
  enhanced: string;
  original: string;
  translated: string;
  low: string;
  median: string;
  high: string;
  matched: string;
  missing: string;
}

const TRANSLATIONS: Record<string, TranslationEntry> = {
  en: {
    title: "AI Intelligence Platform",
    subtitle: "Semantic Search · Recommendations · Profile AI · Translation · Salary Intelligence",
    semanticSearch: "Semantic Hybrid Search",
    searchPlaceholder: "Search opportunities in natural language...",
    recommendations: "AI Recommendations",
    profileEnhancer: "AI Profile Enhancer",
    translation: "Multilingual Translation",
    salaryIntel: "Salary Intelligence",
    fraudMonitor: "AI Fraud Monitor",
    skillGap: "Skill Gap Analysis",
    search: "Search",
    generate: "Generate",
    enhance: "Enhance",
    translate: "Translate",
    analyze: "Analyze",
    rank: "Rank",
    similarity: "Similarity",
    distance: "Distance",
    score: "Score",
    enhanced: "Enhanced",
    original: "Original",
    translated: "Translated",
    low: "Low",
    median: "Median",
    high: "High",
    matched: "Matched",
    missing: "Missing",
  },
  hi: {
    title: "एआई इंटेलिजेंस प्लेटफ़ॉर्म",
    subtitle: "सिमैंटिक सर्च · सिफ़ारिशें · प्रोफ़ाइल एआई · अनुवाद · वेतन बुद्धिमत्ता",
    semanticSearch: "सिमैंटिक हाइब्रिड सर्च",
    searchPlaceholder: "प्राकृतिक भाषा में अवसर खोजें...",
    recommendations: "एआई सिफ़ारिशें",
    profileEnhancer: "एआई प्रोफ़ाइल एन्हांसर",
    translation: "बहुभाषी अनुवाद",
    salaryIntel: "वेतन बुद्धिमत्ता",
    fraudMonitor: "एआई धोखाधड़ी मॉनिटर",
    skillGap: "कौशल अंतर विश्लेषण",
    search: "खोजें",
    generate: "उत्पन्न करें",
    enhance: "बेहतर करें",
    translate: "अनुवाद करें",
    analyze: "विश्लेषण",
    rank: "रैंक",
    similarity: "समानता",
    distance: "दूरी",
    score: "स्कोर",
    enhanced: "उन्नत",
    original: "मूल",
    translated: "अनुवादित",
    low: "कम",
    median: "मध्यम",
    high: "उच्च",
    matched: "मिलान",
    missing: "गायब",
  },
  te: {
    title: "AI ఇంటెలిజెన్స్ ప్లాట్‌ఫారం",
    subtitle: "సెమాంటిక్ సెర్చ్ · సిఫార్సులు · ప్రొఫైల్ AI · అనువాదం · జీతం తెలివి",
    semanticSearch: "సెమాంటిక్ హైబ్రిడ్ సెర్చ్",
    searchPlaceholder: "సహజ భాషలో అవకాశాలను శోధించండి...",
    recommendations: "AI సిఫార్సులు",
    profileEnhancer: "AI ప్రొఫైల్ ఎన్‌హాన్సర్",
    translation: "బహుభాషా అనువాదం",
    salaryIntel: "జీతం తెలివి",
    fraudMonitor: "AI మోసం మానిటర్",
    skillGap: "నైపుణ్య అంతర విశ్లేషణ",
    search: "శోధన",
    generate: "ఉత్పత్తి",
    enhance: "మెరుగుపరచు",
    translate: "అనువదించు",
    analyze: "విశ్లేషించు",
    rank: "ర్యాంక్",
    similarity: "సారూప్యత",
    distance: "దూరం",
    score: "స్కోర్",
    enhanced: "మెరుగైన",
    original: "అసలు",
    translated: "అనువదించబడింది",
    low: "తక్కువ",
    median: "మధ్యస్థ",
    high: "ఎక్కువ",
    matched: "సరిపోలింది",
    missing: "లేదు",
  },
  ta: {
    title: "AI நுண்ணறிவு தளம்",
    subtitle: "சிமாண்டிக் தேடல் · பரிந்துரைகள் · சுயவிவர AI · மொழிபெயர்ப்பு · சம்பள நுண்ணறிவு",
    semanticSearch: "சிமாண்டிக் ஹைப்ரிட் தேடல்",
    searchPlaceholder: "இயற்கை மொழியில் வாய்ப்புகளைத் தேடுங்கள்...",
    recommendations: "AI பரிந்துரைகள்",
    profileEnhancer: "AI சுயவிவர மேம்படுத்தி",
    translation: "பன்மொழி மொழிபெயர்ப்பு",
    salaryIntel: "சம்பள நுண்ணறிவு",
    fraudMonitor: "AI மோசடி கண்காணிப்பு",
    skillGap: "திறன் இடைவெளி பகுப்பாய்வு",
    search: "தேடு",
    generate: "உருவாக்கு",
    enhance: "மேம்படுத்து",
    translate: "மொழிபெயர்",
    analyze: "பகுப்பாய்வு",
    rank: "தரவரிசை",
    similarity: "ஒற்றுமை",
    distance: "தூரம்",
    score: "மதிப்பெண்",
    enhanced: "மேம்படுத்தப்பட்ட",
    original: "அசல்",
    translated: "மொழிபெயர்க்கப்பட்டது",
    low: "குறைவு",
    median: "நடுத்தர",
    high: "அதிகம்",
    matched: "பொருத்தம்",
    missing: "காணவில்லை",
  },
  kn: {
    title: "AI ಬುದ್ಧಿಮತ್ತೆ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್",
    subtitle: "ಸೆಮ್ಯಾಂಟಿಕ್ ಸರ್ಚ್ · ಶಿಫಾರಸುಗಳು · ಪ್ರೊಫೈಲ್ AI · ಅನುವಾದ · ಸಂಬಳ ಬುದ್ಧಿಮತ್ತೆ",
    semanticSearch: "ಸೆಮ್ಯಾಂಟಿಕ್ ಹೈಬ್ರಿಡ್ ಸರ್ಚ್",
    searchPlaceholder: "ನೈಸರ್ಗಿಕ ಭಾಷೆಯಲ್ಲಿ ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಿ...",
    recommendations: "AI ಶಿಫಾರಸುಗಳು",
    profileEnhancer: "AI ಪ್ರೊಫೈಲ್ ಎನ್‌ಹ್ಯಾನ್ಸರ್",
    translation: "ಬಹುಭಾಷಾ ಅನುವಾದ",
    salaryIntel: "ಸಂಬಳ ಬುದ್ಧಿಮತ್ತೆ",
    fraudMonitor: "AI ವಂಚನೆ ಮಾನಿಟರ್",
    skillGap: "ಕೌಶಲ್ಯ ಅಂತರ ವಿಶ್ಲೇಷಣೆ",
    search: "ಹುಡುಕು",
    generate: "ಉತ್ಪಾದಿಸು",
    enhance: "ಮೆರುಗುಗೊಳಿಸು",
    translate: "ಅನುವಾದಿಸು",
    analyze: "ವಿಶ್ಲೇಷಿಸು",
    rank: "ರ‍್ಯಾಂಕ್",
    similarity: "ಹೋಲಿಕೆ",
    distance: "ದೂರ",
    score: "ಅಂಕ",
    enhanced: "ಮೆರುಗಾದ",
    original: "ಮೂಲ",
    translated: "ಅನುವಾದಿಸಲಾಗಿದೆ",
    low: "ಕಡಿಮೆ",
    median: "ಮಧ್ಯಮ",
    high: "ಹೆಚ್ಚು",
    matched: "ಹೊಂದಾಣಿಕೆ",
    missing: "ಕಾಣೆ",
  },
};

// ─────────────────────────────────────────────────────────────────
// Simulated Data
// ─────────────────────────────────────────────────────────────────

interface SalaryBand {
  category: string;
  region: string;
  low: number;
  median: number;
  high: number;
  trend: string;
  sampleSize: number;
}

const SALARY_DATA: SalaryBand[] = [
  { category: "Plumbing", region: "Bangalore Urban", low: 500, median: 800, high: 1200, trend: "rising", sampleSize: 342 },
  { category: "House Cleaning", region: "Bangalore Urban", low: 400, median: 650, high: 1000, trend: "rising", sampleSize: 567 },
  { category: "Carpentry", region: "Bangalore Urban", low: 600, median: 900, high: 1500, trend: "rising", sampleSize: 198 },
  { category: "Electrical", region: "Bangalore Urban", low: 550, median: 850, high: 1400, trend: "rising", sampleSize: 276 },
  { category: "Delivery", region: "Bangalore Urban", low: 400, median: 700, high: 1100, trend: "stable", sampleSize: 634 },
];

interface FraudAlert {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: string;
  userId: string;
}

const FRAUD_ALERTS: FraudAlert[] = [
  { id: "fa1", type: "Spam Profile", severity: "high", description: "Duplicate profile detected with identical bio text across 3 accounts.", detectedAt: "2026-07-15T14:23:00Z", userId: "user-x1" },
  { id: "fa2", type: "Bot Activity", severity: "critical", description: "Automated application pattern: 47 applications in 2 minutes.", detectedAt: "2026-07-15T13:45:00Z", userId: "user-x2" },
  { id: "fa3", type: "Fake Review", severity: "medium", description: "Identical 5-star reviews submitted from same IP address cluster.", detectedAt: "2026-07-15T12:10:00Z", userId: "user-x3" },
  { id: "fa4", type: "GPS Spoofing", severity: "high", description: "Impossible travel speed detected: 850 km/h between check-ins.", detectedAt: "2026-07-15T11:30:00Z", userId: "user-x4" },
];

// ─────────────────────────────────────────────────────────────────
// Dashboard Component
// ─────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "en", label: "English" }, { code: "hi", label: "हिन्दी" },
  { code: "te", label: "తెలుగు" }, { code: "ta", label: "தமிழ்" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

const TARGET_LANGUAGES = [
  { code: "hi", label: "Hindi" }, { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" }, { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" }, { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" }, { code: "pa", label: "Punjabi" },
  { code: "bn", label: "Bengali" }, { code: "od", label: "Odia" },
  { code: "en", label: "English" },
];

export default function AIDashboard() {
  const [lang, setLang] = useState("en");
  const t = TRANSLATIONS[lang] || TRANSLATIONS["en"];

  // Semantic Search
  const semanticSearch = useSemanticSearch();
  const [searchQuery, setSearchQuery] = useState("");

  // Recommendations
  const recommendations = useAiRecommendations();

  // Profile Enhancer
  const profileAi = useProfileEnhancement();
  const [enhanceName, setEnhanceName] = useState("Rajesh Kumar");
  const [enhanceDesc, setEnhanceDesc] = useState("I do plumbing and electrical work");
  const [enhanceSkills, setEnhanceSkills] = useState("plumbing, electrical, pipe fitting");

  // Translation
  const translation = useAiTranslation();
  const [translateText, setTranslateText] = useState("Looking for experienced house cleaner for 3BHK apartment in Koramangala.");
  const [targetLang, setTargetLang] = useState("hi");

  // Skill Gap
  const [profileSkills] = useState(["plumbing", "pipe fitting", "welding"]);
  const [requiredSkills] = useState(["plumbing", "pipe fitting", "electrical wiring", "safety certification", "welding"]);
  const matchedSkills = requiredSkills.filter((s) => profileSkills.includes(s));
  const missingSkills = requiredSkills.filter((s) => !profileSkills.includes(s));
  const matchPct = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      semanticSearch.search(searchQuery, 12.9716, 77.5946, 10000);
      logger.info(`[AIDashboard] Semantic search: "${searchQuery}"`);
    }
  };

  const handleEnhance = () => {
    profileAi.enhance(enhanceName, enhanceDesc, enhanceSkills.split(",").map((s) => s.trim()));
  };

  const handleTranslate = () => {
    if (translateText.trim()) {
      translation.translate(translateText, targetLang);
    }
  };

  const severityColor = (s: string) => {
    if (s === "critical") return "#ff1744";
    if (s === "high") return "#ff6d00";
    if (s === "medium") return "#ffc400";
    return "#69f0ae";
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 30%, #0d1b2a 70%, #0a0a1a 100%)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                style={{
                  padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: lang === l.code ? "linear-gradient(135deg, #7c3aed, #06b6d4)" : "rgba(255,255,255,0.06)",
                  color: lang === l.code ? "#fff" : "rgba(255,255,255,0.5)",
                  transition: "all 0.3s ease",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Typography variant="h1" style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
            🧠 {t.title}
          </Typography>
          <Typography variant="muted" style={{ color: "rgba(255,255,255,0.5)", marginTop: 8, fontSize: 14 }}>
            {t.subtitle}
          </Typography>
        </div>

        {/* Row 1: Semantic Search + Recommendations */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

          {/* Semantic Search */}
          <Card style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16 }}>
            <CardHeader>
              <CardTitle style={{ color: "#c4b5fd" }}>🔍 {t.semanticSearch}</CardTitle>
              <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>pgvector + PostGIS hybrid</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <Input
                  id="semantic-query"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)", color: "#fff", flex: 1 }}
                />
                <Button onClick={handleSearch} disabled={semanticSearch.loading} style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none", color: "#fff", borderRadius: 8 }}>
                  {semanticSearch.loading ? "..." : t.search}
                </Button>
              </div>

              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {semanticSearch.results.map((r) => (
                  <div key={r.id} style={{ padding: "12px 16px", marginBottom: 8, background: "rgba(255,255,255,0.04)", borderRadius: 10, borderLeft: "3px solid #7c3aed" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ color: "#e0d4fc", fontWeight: 600, fontSize: 14 }}>{r.title}</span>
                      <Badge style={{ background: `rgba(124,58,237,${r.similarity})`, color: "#fff", fontSize: 11 }}>
                        {t.similarity}: {(r.similarity * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>{r.description}</p>
                    {r.distance != null && (
                      <span style={{ color: "#06b6d4", fontSize: 11 }}>📍 {t.distance}: {r.distance >= 1000 ? `${(r.distance / 1000).toFixed(1)} km` : `${r.distance}m`}</span>
                    )}
                  </div>
                ))}
                {semanticSearch.results.length === 0 && !semanticSearch.loading && (
                  <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", fontSize: 13, padding: 20 }}>
                    Enter a natural language query to search opportunities...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 16 }}>
            <CardHeader>
              <CardTitle style={{ color: "#67e8f9" }}>⚡ {t.recommendations}</CardTitle>
              <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>Composite weighted ranking</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <Button onClick={() => recommendations.fetchRecommendations("worker")} disabled={recommendations.loading} style={{ background: "linear-gradient(135deg, #0891b2, #06b6d4)", border: "none", color: "#fff", borderRadius: 8, flex: 1 }}>
                  {recommendations.loading ? "..." : `${t.generate} Workers`}
                </Button>
              </div>

              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {recommendations.recommendation?.candidates.map((c, i) => (
                  <div key={c.id} style={{ padding: "12px 16px", marginBottom: 8, background: "rgba(255,255,255,0.04)", borderRadius: 10, borderLeft: `3px solid ${i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "#06b6d4"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ color: "#e0f2fe", fontWeight: 600, fontSize: 14 }}>
                        {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`} {c.name}
                      </span>
                      <Badge style={{ background: `rgba(6,182,212,${c.compositeScore})`, color: "#fff", fontSize: 11 }}>
                        {t.score}: {(c.compositeScore * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 6px" }}>{c.title}</p>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {[
                        { label: "Skills", value: c.skillScore, color: "#7c3aed" },
                        { label: "Trust", value: c.trustScore, color: "#10b981" },
                        { label: "Distance", value: c.distanceScore, color: "#06b6d4" },
                        { label: "Rating", value: c.ratingScore, color: "#f59e0b" },
                      ].map((d) => (
                        <span key={d.label} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${d.color}22`, color: d.color }}>
                          {d.label}: {(d.value * 100).toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {!recommendations.recommendation && !recommendations.loading && (
                  <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", fontSize: 13, padding: 20 }}>
                    Click Generate to compute ranked recommendations...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Profile Enhancer + Translation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

          {/* Profile Enhancer */}
          <Card style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16 }}>
            <CardHeader>
              <CardTitle style={{ color: "#6ee7b7" }}>✨ {t.profileEnhancer}</CardTitle>
              <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>Ollama-powered profile optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                <Input id="enhance-name" value={enhanceName} onChange={(e) => setEnhanceName(e.target.value)} placeholder="Full Name" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(16,185,129,0.3)", color: "#fff" }} />
                <Input id="enhance-desc" value={enhanceDesc} onChange={(e) => setEnhanceDesc(e.target.value)} placeholder="Current Description" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(16,185,129,0.3)", color: "#fff" }} />
                <Input id="enhance-skills" value={enhanceSkills} onChange={(e) => setEnhanceSkills(e.target.value)} placeholder="Skills (comma separated)" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(16,185,129,0.3)", color: "#fff" }} />
                <Button onClick={handleEnhance} disabled={profileAi.loading} style={{ background: "linear-gradient(135deg, #059669, #10b981)", border: "none", color: "#fff", borderRadius: 8 }}>
                  {profileAi.loading ? "Enhancing..." : `${t.enhance} Profile`}
                </Button>
              </div>

              {profileAi.result && (
                <div style={{ padding: 16, background: "rgba(16,185,129,0.1)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.2)" }}>
                  <p style={{ color: "#6ee7b7", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{t.enhanced} Description</p>
                  <p style={{ color: "#d1fae5", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{profileAi.result.enhanced}</p>
                  <div style={{ marginTop: 10, display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {profileAi.result.suggestions.map((s, i) => (
                      <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#6ee7b7" }}>💡 {s}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Translation */}
          <Card style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 16 }}>
            <CardHeader>
              <CardTitle style={{ color: "#fcd34d" }}>🌐 {t.translation}</CardTitle>
              <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>11 Indian languages</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                id="translate-input"
                value={translateText}
                onChange={(e) => setTranslateText(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: "#fff", fontSize: 13, resize: "vertical", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
                <select
                  id="target-lang"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  style={{ flex: 1, padding: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: "#fff", fontSize: 13 }}
                >
                  {TARGET_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} style={{ background: "#1a1a2e" }}>{l.label}</option>
                  ))}
                </select>
                <Button onClick={handleTranslate} disabled={translation.loading} style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", border: "none", color: "#fff", borderRadius: 8 }}>
                  {translation.loading ? "..." : t.translate}
                </Button>
              </div>

              {translation.result && (
                <div style={{ padding: 16, background: "rgba(245,158,11,0.1)", borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p style={{ color: "#fcd34d", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                    {t.translated} ({translation.result.targetLanguageName})
                  </p>
                  <p style={{ color: "#fef3c7", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{translation.result.translated}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Salary Intelligence + Skill Gap + Fraud */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>

          {/* Salary Intelligence */}
          <Card style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16 }}>
            <CardHeader>
              <CardTitle style={{ color: "#a5b4fc" }}>💰 {t.salaryIntel}</CardTitle>
              <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>Regional wage bands (INR/day)</CardDescription>
            </CardHeader>
            <CardContent>
              {SALARY_DATA.map((s) => (
                <div key={s.category} style={{ padding: "10px 12px", marginBottom: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#c7d2fe", fontWeight: 600, fontSize: 13 }}>{s.category}</span>
                    <Badge style={{ background: s.trend === "rising" ? "rgba(16,185,129,0.2)" : "rgba(148,163,184,0.2)", color: s.trend === "rising" ? "#6ee7b7" : "#94a3b8", fontSize: 10 }}>
                      {s.trend === "rising" ? "📈" : "➡️"} {s.trend}
                    </Badge>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, position: "relative" }}>
                      <div style={{
                        position: "absolute", left: `${(s.low / s.high) * 100}%`,
                        width: `${((s.median - s.low) / s.high) * 100}%`,
                        height: "100%", background: "linear-gradient(90deg, #6366f1, #818cf8)", borderRadius: 3,
                      }} />
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, whiteSpace: "nowrap" }}>
                      ₹{s.low}–₹{s.high}
                    </span>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{s.sampleSize} samples</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skill Gap */}
          <Card style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 16 }}>
            <CardHeader>
              <CardTitle style={{ color: "#f9a8d4" }}>🎯 {t.skillGap}</CardTitle>
              <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>Profile vs. Opportunity</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto" }}>
                  <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: "rotate(-90deg)" }}>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#skillGrad)" strokeWidth="3" strokeDasharray={`${matchPct} ${100 - matchPct}`} strokeLinecap="round" />
                    <defs><linearGradient id="skillGrad"><stop offset="0%" stopColor="#ec4899" /><stop offset="100%" stopColor="#f472b6" /></linearGradient></defs>
                  </svg>
                  <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#f9a8d4", fontWeight: 800, fontSize: 22 }}>{matchPct}%</span>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <p style={{ color: "#6ee7b7", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>✅ {t.matched}</p>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {matchedSkills.map((s) => (
                    <Badge key={s} style={{ background: "rgba(16,185,129,0.15)", color: "#6ee7b7", fontSize: 11 }}>{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ color: "#fca5a5", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>❌ {t.missing}</p>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {missingSkills.map((s) => (
                    <Badge key={s} style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", fontSize: 11 }}>{s}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fraud Monitor */}
          <Card style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16 }}>
            <CardHeader>
              <CardTitle style={{ color: "#fca5a5" }}>🛡️ {t.fraudMonitor}</CardTitle>
              <CardDescription style={{ color: "rgba(255,255,255,0.4)" }}>Real-time threat detection</CardDescription>
            </CardHeader>
            <CardContent>
              {FRAUD_ALERTS.map((f) => (
                <div key={f.id} style={{ padding: "10px 12px", marginBottom: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, borderLeft: `3px solid ${severityColor(f.severity)}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#fecaca", fontWeight: 600, fontSize: 12 }}>{f.type}</span>
                    <Badge style={{ background: `${severityColor(f.severity)}22`, color: severityColor(f.severity), fontSize: 10, textTransform: "uppercase" }}>{f.severity}</Badge>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>{f.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
