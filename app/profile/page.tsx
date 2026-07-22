"use client";

import React, { useState } from "react";import { useI18n } from "@/lib/i18n/context";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Shield,
  Upload,
  Loader2,
  Award,
  CheckCircle,
  Clock } from
"lucide-react";

export default function ProfilePage() {const { t: i18nT } = useI18n();
  const { user, updateKycStatus } = useAuth();
  const [kycLoading, setKycLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleKycUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setKycLoading(true);
    setTimeout(() => {
      setKycLoading(false);
      updateKycStatus("verified");
      setSuccessMsg("Aadhaar Verification documents uploaded and verified instantly on trust ledger!");
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1500);
  };

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div>
          <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("My Profile Registry")}</Typography>
          <Typography variant="muted" className="text-xs">{i18nT("Manage your hyperlocal credentials, Aadhaar KYC verification, and trust score ledgers.")}

          </Typography>
        </div>

        {successMsg &&
        <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold">
            {successMsg}
          </div>
        }

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Main profile card */}
          <Card className="glass-card p-6 flex flex-col items-center gap-4 text-center md:col-span-1">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center font-extrabold text-2xl text-primary relative">
              {user.avatar}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center">
                {user.kycStatus === "verified" ?
                <CheckCircle className="w-4 h-4 text-emerald-400" /> :

                <Clock className="w-4 h-4 text-amber-400" />
                }
              </div>
            </div>

            <div>
              <Typography variant="h3" className="font-bold text-lg">{user.name}</Typography>
              <Typography variant="muted" className="text-xs capitalize">{user.role}{i18nT("Member")}</Typography>
            </div>

            <div className="flex flex-col gap-1 w-full text-xs text-muted-foreground border-t border-border/20 pt-4 mt-2">
              <div className="flex justify-between">
                <span>{i18nT("Email:")}</span>
                <span className="text-foreground truncate max-w-[150px]">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span>{i18nT("Rating:")}</span>
                <span className="text-amber-500 font-bold">{i18nT("4.9 ★ (12 jobs)")}</span>
              </div>
              <div className="flex justify-between">
                <span>{i18nT("Location:")}</span>
                <span className="text-foreground">{i18nT("Guntur, Andhra Pradesh")}</span>
              </div>
            </div>
          </Card>

          {/* Details & verification */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            {/* Identity validation status */}
            <Card className="glass-card p-6 flex flex-col gap-4">
              <Typography variant="h3" className="font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />{i18nT("Cryptographic Identity Validation")}

              </Typography>
              
              <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="text-xs font-semibold block">{i18nT("Aadhaar Validation Registry")}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {user.kycStatus === "verified" ?
                    "Aadhaar verified successfully. Your trust badge is published on-chain." :
                    user.kycStatus === "pending" ?
                    "Aadhaar document pending manual compliance check." :
                    "Please upload your Aadhaar document to activate full match recommendation access."
                    }
                  </p>
                </div>
                <Badge variant={user.kycStatus === "verified" ? "success" : user.kycStatus === "pending" ? "warning" : "danger"}>
                  {user.kycStatus.toUpperCase()}
                </Badge>
              </div>

              {user.kycStatus === "unverified" &&
              <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs font-semibold text-muted-foreground">{i18nT("Select Identity PDF / Scan Image")}</label>
                  <div className="border border-dashed border-border rounded-xl p-6 text-center cursor-pointer transition-all hover:border-primary/40 flex flex-col items-center justify-center gap-2">
                    {kycLoading ?
                  <Loader2 className="w-6 h-6 animate-spin text-primary" /> :

                  <Upload className="w-6 h-6 text-primary" />
                  }
                    <span className="text-xs text-muted-foreground">
                      {kycLoading ? "Uploading and verifying..." : "Click to upload Aadhaar or national ID file"}
                    </span>
                    <input type="file" id="onboard-kyc-upload-profile" accept="image/*,application/pdf" className="hidden" onChange={handleKycUpload} disabled={kycLoading} />
                    <label htmlFor="onboard-kyc-upload-profile" className="text-[10px] bg-secondary border border-border px-2.5 py-1.5 rounded-lg text-foreground font-semibold cursor-pointer mt-1">{i18nT("Select File")}</label>
                  </div>
                </div>
              }
            </Card>

            {/* Trust ledger parameters */}
            <Card className="glass-card p-6 flex flex-col gap-4">
              <Typography variant="h3" className="font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />{i18nT("Trust & Safety Score Ledger")}

              </Typography>
              <p className="text-xs text-muted-foreground">{i18nT("Your trust score is calculated based on completed work SLAs, response times, escrow releases, and peer ratings on the JobNest decentralised ledger.")}

              </p>

              <div className="grid grid-cols-3 gap-4 border border-border rounded-xl p-4 text-center bg-muted/20">
                <div>
                  <span className="text-xl font-bold text-primary">96%</span>
                  <span className="block text-[10px] text-muted-foreground uppercase mt-1">{i18nT("SLA Accuracy")}</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-emerald-400">100%</span>
                  <span className="block text-[10px] text-muted-foreground uppercase mt-1">{i18nT("Response Rate")}</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-foreground">0</span>
                  <span className="block text-[10px] text-muted-foreground uppercase mt-1">{i18nT("Disputes")}</span>
                </div>
              </div>
            </Card>

          </div>
        </div>

      </div>
    </ProductShell>);

}