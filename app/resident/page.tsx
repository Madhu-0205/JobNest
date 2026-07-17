"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  Map as MapIcon,
  Award,
  Shield,
  Lock,
  AlertTriangle
} from "lucide-react";

const MapView = dynamic(
  () => import("@/components/maps/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[550px] rounded-3xl overflow-hidden border border-primary/10 shadow-xl bg-card flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Loading interactive neighborhood map...</span>
      </div>
    ),
  }
);

import { Loader2 } from "lucide-react";

export default function ResidentDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!user) return null;

  return (
    <ProductShell>
      <div className="flex flex-col gap-6">
        <Typography variant="h2" className="font-bold gold-gradient-text">Book Local Services</Typography>
        
        {/* Categories Grid */}
        <div id="book-services" className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
          {["Plumber", "Electrician", "Farmer Help", "Carpenter"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                router.push(`/ai?q=${encodeURIComponent(`Find me a ${cat.toLowerCase()} within 3 km`)}`);
              }}
              className="p-5 bg-card/50 border border-border rounded-xl text-center hover:border-primary/30 transition-all hover:scale-102 flex flex-col items-center justify-center gap-3 cursor-pointer"
            >
              <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-sm font-semibold">{cat}</span>
            </button>
          ))}
        </div>

        {/* Resident Home Help Map */}
        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-primary" />
            Home Help & Services Map
          </Typography>
          <MapView mode="resident" />
        </div>

        {successMessage && (
          <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold">
            {successMessage}
          </div>
        )}

        {/* Nearby Service Providers Cards List */}
        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Nearby Available Handymen & Service Providers
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col justify-between gap-3 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">AK</div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">Arun Kumar</span>
                    <span className="text-[10px] text-muted-foreground">Carpenter • 1.2 km away</span>
                  </div>
                </div>
                <Badge variant="primary" className="text-[9px]">96% Trust</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Expert in wood joinery, tables assembly, and home repairs.</p>
              <div className="flex justify-between items-center mt-1 border-t border-border/40 pt-2">
                <span className="text-xs font-mono font-bold text-emerald-400">₹400/day</span>
                <Button variant="primary" size="sm" className="h-7 px-3 text-[10px] rounded-lg" onClick={() => { setSuccessMessage("Booking request sent to Arun Kumar!"); setTimeout(() => setSuccessMessage(null), 3000); }}>Book Now</Button>
              </div>
            </div>

            <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col justify-between gap-3 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">SP</div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">Suresh Prasad</span>
                    <span className="text-[10px] text-muted-foreground">Electrician • 1.5 km away</span>
                  </div>
                </div>
                <Badge variant="primary" className="text-[9px]">98% Trust</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Expert in household wiring, fuse joints, and fan installs.</p>
              <div className="flex justify-between items-center mt-1 border-t border-border/40 pt-2">
                <span className="text-xs font-mono font-bold text-emerald-400">₹500/day</span>
                <Button variant="primary" size="sm" className="h-7 px-3 text-[10px] rounded-lg" onClick={() => { setSuccessMessage("Booking request sent to Suresh Prasad!"); setTimeout(() => setSuccessMessage(null), 3000); }}>Book Now</Button>
              </div>
            </div>

            <div className="p-4 bg-card/60 border border-border rounded-xl flex flex-col justify-between gap-3 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">KR</div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">Kiran Rao</span>
                    <span className="text-[10px] text-muted-foreground">Plumber • 3.2 km away</span>
                  </div>
                </div>
                <Badge variant="primary" className="text-[9px]">92% Trust</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Expert in pipe leak fix, drain cleaning, and bathroom fittings.</p>
              <div className="flex justify-between items-center mt-1 border-t border-border/40 pt-2">
                <span className="text-xs font-mono font-bold text-emerald-400">₹450/day</span>
                <Button variant="primary" size="sm" className="h-7 px-3 text-[10px] rounded-lg" onClick={() => { setSuccessMessage("Booking request sent to Kiran Rao!"); setTimeout(() => setSuccessMessage(null), 3000); }}>Book Now</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Resident Bookings & Escrow Manager */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch my-4">
          <Card className="glass-card p-5 lg:col-span-2 flex flex-col justify-between">
            <div>
              <Typography variant="h3" className="font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Active Escrow Safety Manager
              </Typography>
              <Typography variant="muted" className="text-xs mt-1">
                Protect payments. Funds are locked securely in the escrow ledger and released only after you verify the completed task.
              </Typography>
            </div>

            <div className="my-6 p-4 bg-secondary/40 border border-border rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs font-bold block">Job: Leak joint repair in Guntur</span>
                  <span className="text-[10px] text-muted">Contractor: Arun Kumar • Locked: ₹1,500</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSuccessMessage("Dispute raised. Safety audit initiated."); setTimeout(() => setSuccessMessage(null), 3000); }}>Raise Dispute</Button>
                <Button variant="primary" size="sm" onClick={() => { setSuccessMessage("Escrow funds released to worker balance!"); setTimeout(() => setSuccessMessage(null), 3000); }}>Release Payout</Button>
              </div>
            </div>

            <div className="text-[10px] text-muted flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-primary" />
              <span>JobNest guarantees 100% resolution checks under SLA protocols.</span>
            </div>
          </Card>

          <Card className="glass-card p-5 flex flex-col justify-between">
            <Typography variant="h4" className="font-bold">Bookings History</Typography>
            <div className="flex flex-col gap-3 my-4">
              <div className="flex justify-between items-center text-xs pb-1 border-b border-border">
                <span>Wiring Fix</span>
                <span className="font-semibold text-emerald-400">Completed</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-1 border-b border-border">
                <span>Paddy Harvester</span>
                <span className="font-semibold text-emerald-400">Completed</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Table Assembly</span>
                <span className="font-semibold text-emerald-400">Completed</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">View Receipts Ledger</Button>
          </Card>
        </div>
      </div>
    </ProductShell>
  );
}
