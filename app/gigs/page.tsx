'use client';

import React, { useState } from 'react';
import { useJobNest } from '@/lib/context';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, ArrowUpRight } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { TranslationKey } from '@/lib/translations';
import { useRouter } from 'next/navigation';

export default function GigsPage() {
    const { user, jobs, t } = useJobNest();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'drafts'>('active');

    if (!user) {
        return (
            <div className="space-y-8 pb-24 animate-pulse">
                <header className="pt-6 space-y-2">
                    <div className="h-8 w-48 bg-slate-100 rounded-xl" />
                    <div className="h-4 w-32 bg-slate-100 rounded-lg" />
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-40 bg-slate-100 rounded-[36px]" />
                    <div className="h-40 bg-slate-100 rounded-[36px]" />
                </div>
            </div>
        );
    }

    const isEmployer = user.role === 'employer';

    return (
        <div className="space-y-8 pb-24">
            {/* Minimal Header */}
            <header className="pt-6 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-slate-800">{isEmployer ? 'Gig Dashboard' : 'My Career'}</h1>
                    {isEmployer && (
                        <button
                            onClick={() => router.push('/post-gig')}
                            className="px-6 h-12 bg-primary text-white rounded-2xl luxury-shadow active:scale-95 hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Post Mission</span>
                        </button>
                    )}
                </div>
                <p className="text-slate-400 text-sm font-medium">Manage your {activeTab} contracts and earnings.</p>
            </header>

            {/* Earnings Snapshot (Fiverr style) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-8 rounded-[36px] luxury-shadow border border-slate-50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Earned</p>
                        <div className="flex items-end gap-1">
                            <span className="text-3xl font-black text-slate-800">{formatCurrency(124500)}</span>
                            <span className="text-[10px] text-green-500 font-bold mb-1.5">+12%</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary">
                        <ArrowUpRight size={24} />
                    </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[36px] shadow-2xl relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Pending Clearance</p>
                        <p className="text-3xl font-black text-white">{formatCurrency(4500)}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-secondary relative z-10">
                        <Clock size={24} />
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                </div>
            </section>

            {/* Premium Gigs Tabs */}
            <div className="flex p-2 bg-slate-100/50 rounded-[28px] border border-slate-100/50 max-w-xl">
                {(['active', 'completed', 'drafts'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-500",
                            activeTab === tab
                                ? "bg-white text-primary luxury-shadow scale-[1.02]"
                                : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {t(tab as TranslationKey)}
                    </button>
                ))}
            </div>

            {/* Gigs Feed - Contract Focused Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {jobs.filter(j => activeTab === 'active' ? j.status !== 'Completed' : j.status === 'Completed').map((job) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            key={job.id}
                            className="bg-white p-7 rounded-[48px] luxury-shadow border border-slate-50 relative overflow-hidden group cursor-pointer hover:border-primary/20"
                        >
                            {/* Status Indicator */}
                            <div className={cn(
                                "absolute top-8 right-8 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                job.status === 'In Progress' ? "bg-amber-50 text-amber-500 border-amber-100" : "bg-indigo-50 text-primary border-indigo-100"
                            )}>
                                {job.status}
                            </div>

                            <div className="flex gap-5 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-800 text-xl group-hover:bg-primary/5 transition-colors">
                                    {job.employer[0]}
                                </div>
                                <div className="pr-12">
                                    <h3 className="font-black text-xl text-slate-800 leading-tight mb-1">{job.title}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        {job.type} Contract • {job.employer}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-8 border-b border-slate-50">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Budget Allocation</p>
                                    <p className="text-lg font-black text-slate-800">{formatCurrency(job.price)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Timeline</p>
                                    <p className="text-lg font-black text-slate-800">22 Oct</p>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 uppercase">
                                            {i}
                                        </div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[8px] font-black text-white">+5</div>
                                </div>
                                <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center gap-3">
                                    {isEmployer ? 'Manage' : 'Open Ticket'} <ArrowUpRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
