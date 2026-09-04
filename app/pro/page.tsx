"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Search, Briefcase, Users, Building, Mic, ArrowRight, Sparkles, Loader2, UserPlus } from "lucide-react";
import { getNetworkDiscoveryFeedAction } from "@/features/network/actions";
import { EmptyState } from "@/components/ui/EmptyState";

import type { RecommendationCandidate } from "@/services/recommendation-engine";

interface FeedPost {
  id: string;
  content: string;
  post_type: string;
  created_at: string;
  attachment_url?: string | null;
  profiles?: { id: string; full_name: string; avatar_url: string; role: string } | null;
  organizations?: { id: string; name: string; logo_url: string } | null;
}

interface FeedCompany extends RecommendationCandidate {
  industry?: string;
}

interface ProFeedData {
  companies: FeedCompany[];
  connections: RecommendationCandidate[];
  events?: RecommendationCandidate[];
  posts: FeedPost[];
}

export default function ProHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState<ProFeedData>({ companies: [], posts: [], connections: [] });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getNetworkDiscoveryFeedAction();
        if (result.success && result.data) {
          setFeedData(result.data as unknown as ProFeedData);
        }
      } catch (err) {
        console.error("Failed to load Pro feed", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (!user) return null;

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
        
        {/* PRO HERO / COMMAND CENTER */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-linear-to-r from-slate-900 via-slate-900 to-indigo-950/30 border border-indigo-500/20 rounded-3xl p-6 md:p-8 shadow-luxury">
          <div className="flex flex-col gap-2 w-full md:w-2/3">
            <Typography variant="h2" className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              Good evening, {user.name}
            </Typography>
            <Typography variant="muted" className="text-sm">
              What are you looking for today?
            </Typography>
            
            {/* Command Search */}
            <div className="mt-4 flex items-center bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 shadow-inner w-full">
              <Search className="w-5 h-5 text-indigo-400 mr-3" />
              <input
                type="text"
                placeholder="Search jobs, people, companies..."
                className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="p-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white ml-2">
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             <Button variant="outline" className="bg-black/20 border-indigo-500/20 hover:border-indigo-500/50" onClick={() => router.push('/pro/jobs')}>
               <Briefcase className="w-4 h-4 mr-2 text-indigo-400" /> Jobs
             </Button>
             <Button variant="outline" className="bg-black/20 border-indigo-500/20 hover:border-indigo-500/50" onClick={() => router.push('/pro/network')}>
               <Users className="w-4 h-4 mr-2 text-indigo-400" /> Network
             </Button>
             <Button variant="outline" className="bg-black/20 border-indigo-500/20 hover:border-indigo-500/50" onClick={() => router.push('/pro/network')}>
               <Building className="w-4 h-4 mr-2 text-indigo-400" /> Companies
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Feed & Opportunities */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Recommended Opportunities */}
            <Card className="glass-panel border-indigo-500/20 shadow-luxury bg-black/20">
              <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-indigo-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Recommended for You
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-indigo-400" onClick={() => router.push('/pro/jobs')}>
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-3">
                <EmptyState
                  icon={<Briefcase className="w-6 h-6 text-indigo-400" />}
                  title="No Job Recommendations Yet"
                  description="Complete your profile skills and preferences to receive AI-matched career opportunities."
                  action={
                    <Button variant="outline" size="sm" className="text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20" onClick={() => router.push('/pro/jobs')}>
                      Browse All Jobs
                    </Button>
                  }
                  className="py-6 border-none bg-transparent"
                />
              </CardContent>
            </Card>

            {/* Professional Feed */}
            <div className="flex flex-col gap-4">
              <Typography variant="h3" className="font-bold text-lg px-1">Professional Feed</Typography>
              
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : feedData.posts.length > 0 ? (
                feedData.posts.map(post => (
                  <Card key={post.id} className="glass-panel border-white/10 shadow-sm bg-black/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-white/10">
                          {post.organizations ? (
                            <AvatarFallback className="bg-indigo-900/50 text-indigo-200 text-xs">{post.organizations.name[0]}</AvatarFallback>
                          ) : (
                            <AvatarFallback className="bg-slate-800 text-slate-300 text-xs">{post.profiles?.full_name?.[0] || 'U'}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-sm">{post.organizations?.name || post.profiles?.full_name || 'User'}</h4>
                          <p className="text-[10px] text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState
                  icon={<Sparkles className="w-8 h-8 text-indigo-400" />}
                  title="Your Feed is Empty"
                  description="Connect with professionals or follow companies to see updates, milestones, and announcements here."
                  action={
                    <Button variant="outline" className="mt-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20" onClick={() => router.push('/pro/network')}>
                      Discover Network
                    </Button>
                  }
                />
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Network & Companies */}
          <div className="flex flex-col gap-6">
            
            {/* People you may know */}
            <Card className="glass-panel border-white/10 shadow-luxury">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Your Network
                </CardTitle>
                <CardDescription className="text-xs">People you may know</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4">
                {feedData.connections && feedData.connections.length > 0 ? (
                  feedData.connections.slice(0, 3).map((person: RecommendationCandidate) => (
                    <div key={person.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Avatar className="w-8 h-8 border border-white/10">
                             <AvatarFallback className="bg-slate-800 text-xs text-slate-300">{(person.name || 'U')[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{person.name}</span>
                           <span className="text-[9px] text-muted-foreground">{person.title || "Professional"}</span>
                         </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors">
                        <UserPlus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={<Users className="w-6 h-6 text-indigo-400" />}
                    title="No Suggested Connections"
                    description="Explore verified professionals to grow your career network."
                    action={
                      <Button variant="outline" size="sm" className="text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20" onClick={() => router.push('/pro/network')}>
                        Discover Network
                      </Button>
                    }
                    className="py-4 px-2 border-none bg-transparent"
                  />
                )}
                
                <Button variant="ghost" className="w-full text-xs text-indigo-400 mt-1" onClick={() => router.push('/pro/network')}>
                  See all suggestions
                </Button>
              </CardContent>
            </Card>

            {/* Companies to Follow */}
            <Card className="glass-panel border-white/10 shadow-luxury">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-400" /> Companies to Follow
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4">
                 {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-indigo-500" /></div>
                 ) : (
                    feedData.companies.slice(0, 3).map(company => (
                      <div key={company.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold">
                             {company.name[0]}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold truncate max-w-30">{company.name}</span>
                             <span className="text-[9px] text-muted-foreground">{company.industry || "Company"}</span>
                           </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 text-[10px] px-2 py-0 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                        >
                          Follow
                        </Button>
                      </div>
                    ))
                 )}
                 {feedData.companies.length === 0 && !loading && (
                   <span className="text-xs text-muted-foreground text-center">No companies found</span>
                 )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </ProductShell>
  );
}
