'use client';

import React, { useState } from 'react';
import { useJobNest } from '@/lib/context';
import { motion } from 'framer-motion';
import {
  Briefcase,
  MapPin,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Bell,
  Navigation,
  ShieldCheck,
  Zap,
  Plus,
  Wrench,
  Heart,
  MessageCircle,
  Share2,
  Clock
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { TranslationKey } from '@/lib/translations';
import { useRouter } from 'next/navigation';

import { toast } from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const { user, jobs, language, t, setLanguage, refreshLocation, toggleLike } = useJobNest();
  const [activeTab, setActiveTab] = useState<'near' | 'professional' | 'blue-collar'>('near');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const handleShare = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://jobnest.app/gigs/${id}`); // Mock URL
    toast.success(t('share_toast'));
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    toast.success("Comment posted!");
    setCommentText('');
    setActiveCommentId(null);
    // In a real app, this would call an API/Context to add the comment
  };

  // AI Recommendation Engine
  const filteredJobs = React.useMemo(() => {
    if (!user) return [];

    // 1. First Layer: Strictly filter by 10km radius for "Recommended" tab
    let baseList = jobs;

    if (activeTab === 'near') {
      baseList = jobs.filter(job => job.distance <= 10);

      // 2. Second Layer: AI Scoring for "Netflix-style" matching
      return baseList.sort((a, b) => {
        const getScore = (job: typeof jobs[0]) => {
          let score = 0;

          // A. Skill Matching (Weight: 5)
          const userSkills = user.skills || [];
          const hasSkillMatch = job.tags.some(tag =>
            userSkills.some(skill => skill.toLowerCase().includes(tag.toLowerCase()))
          );
          if (hasSkillMatch) score += 20;

          // B. Category Preference (Weight: 3)
          // Simplified: Give boost if job category matches previous patterns (mocked)
          if (job.category === 'Technical' || job.category === 'Professional') score += 5;

          // C. Popularity / Social Proof (Weight: 1)
          score += (job.likes || 0) * 2;
          score += (job.isLiked ? 5 : 0);

          // D. Employer Trust (Weight: 4)
          // Boost verified employers
          if (job.employer.length > 5) score += 3; // Mock heuristics

          return score;
        };

        return getScore(b) - getScore(a);
      });
    }

    if (activeTab === 'professional') return jobs.filter(job => job.category === 'Technical' || job.category === 'Creative' || job.category === 'Professional');
    if (activeTab === 'blue-collar') return jobs.filter(job => job.category === 'Blue Collar');

    return baseList;
  }, [jobs, activeTab, user]);

  if (!user) {
    return (
      <OnboardingView
        language={language}
        t={t}
        setLanguage={setLanguage}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Premium Header */}
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-white luxury-shadow p-3 border border-slate-50 relative group cursor-pointer hover:scale-105 transition-transform">
            <Image src="/logo.png" alt="JobNest Logo" fill className="object-contain p-2" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-4 border-background rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white">JobNest</h1>
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-primary" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                {user.location.address} {t('radius_label')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2.5">
          {user.role === 'employer' && (
            <button
              onClick={() => router.push('/post-gig')}
              className="px-4 bg-slate-900 text-white rounded-2xl luxury-shadow active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} className="text-secondary" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{t('post')}</span>
            </button>
          )}
          <button
            onClick={() => router.push('/notifications')}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl luxury-shadow border border-slate-50 dark:border-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
          >
            <Bell size={20} />
          </button>
          <button
            onClick={refreshLocation}
            className="p-3 bg-primary text-white rounded-2xl luxury-shadow active:scale-95 transition-all"
          >
            <Navigation size={20} />
          </button>
        </div>
      </header>

      {/* LinkedIn-style Profile Bar */}
      <section
        onClick={() => router.push('/profile')}
        className="glass-card p-4 rounded-[28px] flex items-center gap-4 cursor-pointer hover:bg-white/90 transition-all border-none"
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-bold text-primary">
          {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-2xl" alt="Profile" /> : "User"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm">{user.name}</span>
            <ShieldCheck size={14} className="text-secondary fill-secondary/10" />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">{t('top_rated')} • {user.completedGigs} {t('completed')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-primary">{formatCurrency(user.balance)}</p>
          <p className="text-[8px] text-slate-400 uppercase font-black">{t('wallet_balance')}</p>
        </div>
      </section>

      {/* Rapido-style radius focus Hero */}
      <section className="relative h-44 rounded-[40px] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-900" />
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-6 grid-rows-4 h-full w-full">
            {Array.from({ length: 24 }).map((_, i) => <div key={i} className="border-[0.5px] border-white" />)}
          </div>
        </div>
        <div className="relative h-full p-8 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{t('nearby_results')}</span>
          </div>
          <h2 className="text-2xl font-black text-white leading-tight">
            {t('discover')} {jobs.length} <br /> {t('active_gigs_near')}
          </h2>
          <button className="w-max mt-2 text-primary bg-white px-6 py-2 rounded-xl text-xs font-black shadow-xl active:scale-95 transition-all">
            {t('view_all')}
          </button>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
      </section>

      {/* Fiverr-style Quick Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 ios-scrollbar">
        {[
          { id: 'near', label: t('active_gigs_near'), icon: Zap }, // Using dynamic translation for "Recommended/Nearby"
          { id: 'professional', label: 'Professional', icon: Briefcase },
          { id: 'blue-collar', label: 'Service Works', icon: Wrench },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'near' | 'professional' | 'blue-collar')}
            className={cn(
              "flex items-center gap-2 px-6 py-4 rounded-3xl whitespace-nowrap transition-all duration-300 font-bold text-sm",
              activeTab === tab.id
                ? "bg-foreground text-white shadow-2xl scale-105"
                : "bg-white luxury-shadow text-slate-500"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* The Global Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-slate-800">{activeTab === 'near' ? t('nearby_results') : t('featured_ops')}</h3>
          <button className="text-xs font-black text-primary uppercase tracking-wider">{t('sort_distance')}</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job, idx) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={job.id}
              onClick={() => router.push(`/gigs/${job.id}`)}
              className="bg-white p-6 rounded-[32px] luxury-shadow border border-slate-50 space-y-5 group cursor-pointer hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                    <Briefcase className="text-primary" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base">{job.title}</h4>
                      <span className="px-2 py-0.5 bg-green-50 text-[8px] font-black text-green-600 rounded-md border border-green-100 uppercase tracking-tighter">{t('verified_badge')}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{job.employer} • {job.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-800">{formatCurrency(job.price)}</p>
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">/ {job.type}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {job.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-3 py-1.5 bg-slate-50 rounded-xl text-slate-500 font-bold border border-slate-100/50">
                    {tag}
                  </span>
                ))}
                <span className="text-[10px] px-3 py-1.5 bg-indigo-50/50 rounded-xl text-primary font-bold ml-auto">
                  {job.distance}km
                </span>
              </div>

              <div className="pt-4 border-t border-slate-50 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike(job.id); }}
                      className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-110", job.isLiked ? "text-red-500" : "text-slate-400 hover:text-red-500")}
                    >
                      <Heart size={16} fill={job.isLiked ? "currentColor" : "none"} /> {job.likes}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCommentId(activeCommentId === job.id ? null : job.id);
                      }}
                      className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-110", activeCommentId === job.id ? "text-primary" : "text-slate-400 hover:text-primary")}
                    >
                      <MessageCircle size={16} /> {job.comments}
                    </button>
                    <button
                      onClick={(e) => handleShare(e, job.id)}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-500 transition-all hover:scale-110"
                    >
                      <Share2 size={16} /> {job.shares}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={12} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">{t('expires_in')} 4h</span>
                    </div>
                    <button className="text-xs font-black text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {t('apply_now')} <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {activeCommentId === job.id && (
                  <div className="flex gap-2 animate-in fade-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t('comment_placeholder')}
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-primary/30 transition-all"
                      autoFocus
                    />
                    <button
                      onClick={(e) => handleCommentSubmit(e)}
                      disabled={!commentText.trim()}
                      className="px-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      {t('post')}
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}



function OnboardingView({ language, t, setLanguage }: {
  language: string,
  t: (key: TranslationKey) => string,
  setLanguage: (lang: 'en' | 'te' | 'hi') => void
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col justify-center gap-12 py-12 animate-slide-up bg-background">
      {/* Language Luxury Toggle */}
      <div className="flex justify-center gap-4 px-6">
        {(['en', 'hi', 'te'] as const).map((langId) => (
          <button
            key={langId}
            onClick={() => setLanguage(langId)}
            className={cn(
              "flex-1 py-4 px-2 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all shadow-sm border",
              language === langId
                ? "bg-foreground text-white border-foreground scale-105 shadow-2xl"
                : "bg-white text-slate-400 border-slate-100 hover:border-primary/30"
            )}
          >
            {langId === 'en' ? 'English' : langId === 'hi' ? 'Hindi' : 'Telugu'}
          </button>
        ))}
      </div>

      <div className="text-center space-y-6">
        <div className="relative w-36 h-36 mx-auto mb-4 p-6 bg-white rounded-[48px] luxury-shadow border border-slate-50">
          <Image src="/logo.png" alt="JobNest Logo" fill className="object-contain p-6" priority />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">JobNest</h1>
          <p className="text-slate-400 max-w-[300px] mx-auto leading-relaxed text-sm font-medium">
            The bridge between verified talent and local opportunities.
          </p>
        </div>
      </div>

      <div className="grid gap-5 px-4">
        <button
          onClick={() => router.push('/signup?role=jobseeker')}
          className="bg-white p-7 flex items-center gap-6 rounded-[40px] border border-slate-100 luxury-shadow hover:border-primary/30 transition-all group active:scale-[0.98]"
        >
          <div className="w-16 h-16 bg-indigo-50/50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="text-left flex-1">
            <h3 className="font-black text-xl text-slate-800">{t('seeker_title')}</h3>
            <p className="text-xs text-slate-400 font-medium">{t('seeker_desc')}</p>
          </div>
          <ChevronRight className="text-slate-300 group-hover:translate-x-2 transition-transform" />
        </button>

        <button
          onClick={() => router.push('/signup?role=employer')}
          className="bg-foreground p-7 flex items-center gap-6 rounded-[40px] border border-foreground/5 shadow-2xl hover:bg-slate-800 transition-all group active:scale-[0.98]"
        >
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="w-10 h-10 bg-secondary rounded-2xl flex items-center justify-center text-black">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="text-left flex-1">
            <h3 className="font-black text-xl text-white">{t('employer_title')}</h3>
            <p className="text-xs text-white/50 font-medium">{t('employer_desc')}</p>
          </div>
          <ChevronRight className="text-white/30 group-hover:translate-x-2 transition-transform" />
        </button>
      </div>

      <div className="text-center pt-8">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          {t('login_cta')} <span className="text-primary cursor-pointer hover:underline" onClick={() => router.push('/login')}>Sign In</span>
        </p>
      </div>
    </div>
  );
}
