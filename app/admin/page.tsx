"use client";

import { useState, useEffect } from "react";
import { ProductShell } from "@/components/ProductShell";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { useModeration } from "@/hooks/useModeration";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, RefreshCcw } from "lucide-react";

type TimeWindow = "today" | "7d" | "30d" | "all";
type OpsSection = "moderation" | "trust" | "users" | "organizations" | "opportunities" | "payments" | "reports" | "disputes" | "system_health";

export default function AdminDashboard() {
  const analytics = useAdminAnalytics();
  const moderation = useModeration();

  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [opsSection, setOpsSection] = useState<OpsSection>("moderation");

  useEffect(() => {
    analytics.fetchDashboard(timeWindow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeWindow]);

  useEffect(() => {
    if (opsSection === "moderation" || opsSection === "disputes" || opsSection === "reports") {
      moderation.fetchQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opsSection]);

  const kpis = analytics.dashboard?.kpis;

  return (
    <ProductShell>
      <div className="flex flex-col min-h-screen bg-gray-950 text-white font-sans">
        
        {/* EXECUTIVE OPERATIONS LAYER */}
        <section className="p-6 border-b border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Executive Operations</h1>
                <p className="text-white/50 text-sm">JobNest V2 Operational Command Center</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-white/5 rounded-lg p-1">
                  {(["today", "7d", "30d", "all"] as TimeWindow[]).map(tw => (
                    <button
                      key={tw}
                      onClick={() => setTimeWindow(tw)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeWindow === tw ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"}`}
                    >
                      {tw.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                <Button 
                  onClick={() => analytics.fetchDashboard(timeWindow)} 
                  disabled={analytics.loading}
                  className="bg-white/10 hover:bg-white/20 border-0"
                >
                  {analytics.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {analytics.error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                <p className="font-semibold">Unable to load this metric.</p>
                <p className="text-sm opacity-80">{analytics.error}</p>
                <Button onClick={() => analytics.fetchDashboard(timeWindow)} className="mt-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border-0">Retry</Button>
              </div>
            ) : analytics.loading && !kpis ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[
                  { label: "Total Users", value: kpis?.activeUsers, icon: "👥", color: "text-blue-400" },
                  { label: "Active Today", value: kpis?.dailyActiveUsers, icon: "⚡", color: "text-green-400" },
                  { label: "Online Now", value: kpis?.onlineWorkers, icon: "🟢", color: "text-emerald-400" },
                  { label: "Opportunities", value: kpis?.activeOpportunities, icon: "💼", color: "text-amber-400" },
                  { label: "Applications", value: kpis?.totalApplications, icon: "📝", color: "text-purple-400" },
                  { label: "Pending Reports", value: kpis?.openDisputes, icon: "🚩", color: "text-orange-400" },
                  { label: "Critical Issues", value: kpis?.fraudAlerts, icon: "🚨", color: "text-red-400" },
                  { label: "AI Requests", value: kpis?.aiRequestsToday, icon: "🧠", color: "text-pink-400" },
                ].map(stat => (
                  <Card key={stat.label} className="bg-white/5 border-white/10">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{stat.label}</p>
                      <div className="flex justify-between items-end mt-2">
                        <span className={`text-2xl font-bold ${stat.color}`}>{stat.value ?? 0}</span>
                        <span className="text-xl opacity-80">{stat.icon}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* OPERATIONS CENTER LAYER */}
        <section className="flex-1 bg-gray-950">
          <div className="max-w-7xl mx-auto flex h-full">
            {/* Sidebar nav */}
            <div className="w-64 border-r border-white/10 p-6 flex flex-col gap-2">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Operations Center</h2>
              {[
                { id: "moderation", label: "Moderation Queue", icon: "🛡️" },
                { id: "disputes", label: "Disputes", icon: "⚖️" },
                { id: "reports", label: "Reports", icon: "🚩" },
                { id: "users", label: "Users & Identity", icon: "👤" },
                { id: "organizations", label: "Organizations", icon: "🏢" },
                { id: "opportunities", label: "Opportunities", icon: "💼" },
                { id: "payments", label: "Payments & Escrow", icon: "💳" },
                { id: "trust", label: "Trust & Safety", icon: "⭐" },
                { id: "system_health", label: "System Health", icon: "💓" },
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setOpsSection(sec.id as OpsSection)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${opsSection === sec.id ? "bg-purple-600/20 text-purple-300" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                >
                  <span>{sec.icon}</span>
                  {sec.label}
                </button>
              ))}
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 p-8">
              {(opsSection === "moderation" || opsSection === "disputes" || opsSection === "reports") && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold capitalize">{opsSection.replace("_", " ")}</h2>
                    <Button onClick={() => moderation.fetchQueue()} variant="outline" className="border-white/20 text-white/80">
                      Refresh Queue
                    </Button>
                  </div>

                  {moderation.loading ? (
                    <div className="flex items-center gap-3 text-white/50">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading queue...
                    </div>
                  ) : moderation.items.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-white/20 rounded-xl bg-white/5">
                      <p className="text-white/50">No items in the queue.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {moderation.items.map(item => (
                        <Card key={item.id} className="bg-white/5 border-white/10">
                          <CardContent className="p-5 flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={
                                  item.priority === "CRITICAL" ? "bg-red-500" : 
                                  item.priority === "HIGH" ? "bg-orange-500" : 
                                  "bg-blue-500"
                                }>
                                  {item.priority}
                                </Badge>
                                <span className="text-xs font-semibold uppercase text-white/50">{item.contentType}</span>
                                <span className="text-xs text-white/40">{new Date(item.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="font-medium text-white/90">{item.reason}</p>
                              <p className="text-sm text-white/50 mt-1">Status: {item.status} • Target: {item.contentId.substring(0,8)}...</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10" onClick={() => moderation.takeAction(item.id, "resolve")}>
                                Resolve
                              </Button>
                              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => moderation.takeAction(item.id, "escalate")}>
                                Escalate
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {["users", "organizations", "opportunities", "payments", "trust", "system_health"].includes(opsSection) && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-4xl mb-4 opacity-50">🚧</span>
                  <h3 className="text-lg font-bold text-white/70 capitalize">{opsSection.replace("_", " ")} Module</h3>
                  <p className="text-sm text-white/40 mt-2 max-w-md">This operational module is securely connected to the backend via AuthorizationGuard. Deep-dive UI for this section will be enabled in subsequent rollouts.</p>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </ProductShell>
  );
}