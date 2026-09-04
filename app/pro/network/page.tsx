"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Users, UserPlus, Building, Search, Briefcase, Loader2, Sparkles } from "lucide-react";
import { getNetworkDiscoveryFeedAction } from "@/features/network/actions";
import { EmptyState } from "@/components/ui/EmptyState";

import type { RecommendationCandidate } from "@/services/recommendation-engine";

interface NetworkCompany extends RecommendationCandidate {
  industry?: string;
  description?: string;
  metrics?: { growthRate?: number; openRoles?: number };
}

export default function ProfessionalNetworkPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"grow" | "connections" | "following">("grow");
  const [loading, setLoading] = useState(true);
  const [discoverData, setDiscoverData] = useState<{
    companies: NetworkCompany[];
    people: RecommendationCandidate[];
    events: RecommendationCandidate[];
  }>({ companies: [], people: [], events: [] });

  useEffect(() => {
    async function loadNetwork() {
      try {
        const result = await getNetworkDiscoveryFeedAction();
        if (result.success) {
          setDiscoverData({
            companies: result.data.companies || [],
            people: result.data.connections || [],
            events: result.data.events || []
          });
        }
      } catch (err) {
        console.error("Failed to load network discovery", err);
      } finally {
        setLoading(false);
      }
    }
    loadNetwork();
  }, []);

  if (!user) return null;

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-border/40 pb-6">
          <div className="flex flex-col gap-1">
            <Typography variant="h2" className="text-2xl font-black text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-500" /> My Network
            </Typography>
            <Typography variant="muted" className="text-sm">
              Connect with professionals, follow startups, and grow your career graph.
            </Typography>
          </div>
          <div className="flex bg-black/20 border border-border/30 rounded-xl p-1">
            <button 
              onClick={() => setActiveTab("grow")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'grow' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Grow
            </button>
            <button 
              onClick={() => setActiveTab("connections")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'connections' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Connections <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">12</span>
            </button>
            <button 
              onClick={() => setActiveTab("following")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'following' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Following <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">4</span>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : activeTab === "grow" ? (
          <div className="flex flex-col gap-8">
            
            {/* Search Network */}
            <div className="flex items-center bg-black/20 border border-border/30 rounded-xl px-4 py-3 shadow-inner w-full md:w-1/2">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="text"
                placeholder="Search professionals, companies, or skills..."
                className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* People Discovery */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Typography variant="h3" className="text-lg font-bold">People you may know</Typography>
                <Button variant="ghost" size="sm" className="text-xs text-indigo-400">See all</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {discoverData.people.map(person => (
                  <Card key={person.id} className="glass-panel border-white/10 hover:border-indigo-500/30 transition-colors bg-black/10 text-center relative overflow-hidden group">
                    <div className="h-16 bg-linear-to-r from-indigo-900/40 to-slate-900/40 w-full absolute top-0 left-0 z-0"></div>
                    <CardContent className="pt-8 pb-5 flex flex-col items-center gap-3 relative z-10">
                      <Avatar className="w-16 h-16 border-2 border-background shadow-md">
                        <AvatarFallback className="bg-slate-800 text-slate-300 font-bold">{person.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm text-foreground hover:underline cursor-pointer" onClick={() => router.push('/profile')}>{person.name}</span>
                        <span className="text-xs text-muted-foreground">{person.title}</span>
                      </div>
                      
                      {person.explanation ? (
                        <div className="text-[10px] text-indigo-400 mt-2 bg-indigo-500/10 p-2 rounded text-left w-full line-clamp-2 shadow-inner border border-indigo-500/20">
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          {person.explanation}
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground mt-2 text-center line-clamp-1 w-full">
                          Match Score: {Math.round(person.compositeScore * 100)}%
                        </div>
                      )}
                      
                      <Button variant="outline" size="sm" className="w-full mt-2 rounded-full border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all">
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Company Discovery */}
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-between">
                <Typography variant="h3" className="text-lg font-bold">Startups & Companies to follow</Typography>
                <Button variant="ghost" size="sm" className="text-xs text-indigo-400">See all</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {discoverData.companies.map(company => (
                  <Card key={company.id} className="glass-panel border-white/10 hover:border-indigo-500/30 transition-colors bg-black/10">
                    <CardContent className="p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-lg shadow-inner">
                            {company.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">{company.name}</span>
                            <span className="text-xs text-muted-foreground">{company.industry || "Technology"}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs px-3 rounded-full">
                          Follow
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {company.title || "Company"}
                      </p>
                      {company.explanation ? (
                        <div className="text-[10px] text-indigo-400 mt-1 bg-indigo-500/10 p-2 rounded text-left w-full line-clamp-2 border border-indigo-500/20">
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          {company.explanation}
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground mt-1 text-left line-clamp-1 w-full">
                          Match Score: {Math.round(company.compositeScore * 100)}%
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-border/10 pt-3 mt-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                           <Users className="w-3 h-3" /> 144 followers
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                           <Briefcase className="w-3 h-3" /> Hiring (2)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        ) : activeTab === "connections" ? (
          <EmptyState
            icon={<Users className="w-10 h-10 text-indigo-400" />}
            title="No Direct Connections Yet"
            description="Build your verified professional network by connecting with peers, colleagues, and industry collaborators."
            action={
              <Button
                variant="outline"
                className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                onClick={() => setActiveTab("grow")}
              >
                Discover Professionals
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Building className="w-10 h-10 text-indigo-400" />}
            title="Not Following Any Organizations"
            description="Follow companies and startups to receive job openings, technology updates, and project announcements."
            action={
              <Button
                variant="outline"
                className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                onClick={() => setActiveTab("grow")}
              >
                Explore Companies
              </Button>
            }
          />
        )}

      </div>
    </ProductShell>
  );
}
