"use client";

import { useState } from "react";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { useI18n } from "@/lib/i18n/context";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Sliders,
  Globe,
  Check
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { locale, setLocale } = useI18n();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Feature Flag State Toggles
  const [semanticSearch, setSemanticSearch] = useState(true);
  const [escrowRouting, setEscrowRouting] = useState(true);
  const [liveTracking, setLiveTracking] = useState(true);
  const [faceKyc, setFaceKyc] = useState(false);

  // Preferences Toggles
  const [pushNotif, setPushNotif] = useState(true);

  if (!user) return null;

  const handleSaveSettings = () => {
    setSuccessMsg("Settings and Feature Flag overrides saved successfully!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div>
          <Typography variant="h2" className="font-bold gold-gradient-text">Account Settings</Typography>
          <Typography variant="muted" className="text-xs">
            Manage your regional application parameters, live telemetry configurations, and feature flags.
          </Typography>
        </div>

        {successMsg && (
          <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold">
            {successMsg}
          </div>
        )}

        <div className="flex flex-col gap-6">
          
          {/* Feature Flags Overrides */}
          <Card className="glass-card p-6 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Feature Flags & System Overrides
            </Typography>
            <p className="text-xs text-muted-foreground">
              Toggle specific hyperlocal marketplace engine features on or off. Note that some features are restricted by your user role.
            </p>

            <div className="flex flex-col gap-3.5 mt-2">
              <div className="flex justify-between items-center pb-3 border-b border-border/20">
                <div>
                  <span className="text-xs font-bold block text-foreground">Semantic Hybrid Search</span>
                  <span className="text-[10px] text-muted-foreground">Enables natural query understanding for AI search.</span>
                </div>
                <button
                  onClick={() => setSemanticSearch(!semanticSearch)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                    semanticSearch ? "bg-primary justify-end" : "bg-muted justify-start"
                  }`}
                  aria-label="Toggle Semantic Hybrid Search"
                >
                  <span className="w-5 h-5 rounded-full bg-background shadow-md" />
                </button>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border/20">
                <div>
                  <span className="text-xs font-bold block text-foreground">Escrow Payment Routing</span>
                  <span className="text-[10px] text-muted-foreground">Enforce smart escrow deposits before gig starts.</span>
                </div>
                <button
                  onClick={() => setEscrowRouting(!escrowRouting)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                    escrowRouting ? "bg-primary justify-end" : "bg-muted justify-start"
                  }`}
                  aria-label="Toggle Escrow Payment Routing"
                >
                  <span className="w-5 h-5 rounded-full bg-background shadow-md" />
                </button>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border/20">
                <div>
                  <span className="text-xs font-bold block text-foreground">Live Telemetry Tracking</span>
                  <span className="text-[10px] text-muted-foreground">Broadcast coordinates update in background.</span>
                </div>
                <button
                  onClick={() => setLiveTracking(!liveTracking)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                    liveTracking ? "bg-primary justify-end" : "bg-muted justify-start"
                  }`}
                  aria-label="Toggle Live Telemetry Tracking"
                >
                  <span className="w-5 h-5 rounded-full bg-background shadow-md" />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold block text-foreground">KYC Face Verification</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    Requires verification API active.
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3 flex items-center border-none">Beta</Badge>
                  </span>
                </div>
                <button
                  onClick={() => setFaceKyc(!faceKyc)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                    faceKyc ? "bg-primary justify-end" : "bg-muted justify-start"
                  }`}
                  aria-label="Toggle KYC Face Verification"
                >
                  <span className="w-5 h-5 rounded-full bg-background shadow-md" />
                </button>
              </div>
            </div>
          </Card>

          {/* Regional Localization Preference */}
          <Card className="glass-card p-6 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Regional & Language Preferences
            </Typography>

            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Language selection</label>
                <div className="grid grid-cols-3 gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/40 text-xs">
                  {["en", "hi", "te"].map((code) => (
                    <button
                      key={code}
                      onClick={() => setLocale(code as "en" | "hi" | "te")}
                      className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        locale === code ? "bg-background text-foreground shadow-sm border border-border/20" : "text-muted-foreground"
                      }`}
                    >
                      {locale === code && <Check className="w-3.5 h-3.5 text-primary" />}
                      <span>{code === "en" ? "English" : code === "hi" ? "हिंदी" : "తెలుగు"}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mt-2 border-t border-border/20 pt-4">
                <div>
                  <span className="text-xs font-bold block text-foreground">Push Notifications</span>
                  <span className="text-[10px] text-muted-foreground">Receive push notification alerts for nearby opportunities.</span>
                </div>
                <button
                  onClick={() => setPushNotif(!pushNotif)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                    pushNotif ? "bg-primary justify-end" : "bg-muted justify-start"
                  }`}
                  aria-label="Toggle Push Notifications"
                >
                  <span className="w-5 h-5 rounded-full bg-background shadow-md" />
                </button>
              </div>
            </div>
          </Card>

          <Button variant="primary" onClick={handleSaveSettings} className="w-full mt-2">
            Save All Configurations
          </Button>

        </div>
      </div>
    </ProductShell>
  );
}
