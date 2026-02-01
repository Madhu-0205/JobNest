'use client';

import React, { useState } from 'react';
import { useJobNest } from '@/lib/context';
import { motion } from 'framer-motion';
import { Search, Navigation, Map as MapIcon, Layers, Zap } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ExplorePage() {
    const router = useRouter();
    const { jobs, t, refreshLocation } = useJobNest();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="h-[90vh] lg:h-[84vh] -mx-4 sm:mx-0 flex flex-col lg:flex-row gap-6 relative animate-slide-up">
            {/* Desktop: Sidebar Search & List | Mobile: Floating Header */}
            <div className="w-full lg:w-[400px] flex flex-col gap-6 z-50">
                {/* Header & Search */}
                <div className="lg:bg-white lg:p-7 lg:rounded-[40px] lg:luxury-shadow lg:border lg:border-slate-50 space-y-6">
                    <header className="flex items-center justify-between">
                        <h1 className="text-2xl font-black text-slate-800">{t('explore_title')}</h1>
                        <button
                            onClick={refreshLocation}
                            className="lg:hidden p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20"
                        >
                            <Navigation size={20} />
                        </button>
                    </header>

                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Enter location or gig type..."
                            className="w-full pl-14 pr-5 py-5 bg-white lg:bg-slate-50 rounded-[28px] outline-none border border-slate-100 focus:border-primary/50 transition-all text-sm font-bold shadow-sm lg:shadow-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="hidden lg:grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 py-3 bg-indigo-50 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                            <MapIcon size={14} /> Terrain
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
                            <Layers size={14} /> Satellite
                        </button>
                    </div>
                </div>

                {/* Desktop List Results */}
                <div className="hidden lg:flex flex-1 flex-col gap-4 overflow-y-auto pr-2 ios-scrollbar">
                    {jobs.map((job) => (
                        <div
                            key={job.id}
                            onClick={() => router.push(`/gigs/${job.id}`)}
                            className="bg-white p-6 rounded-[32px] luxury-shadow border border-slate-50 hover:border-primary/30 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between mb-3">
                                <span className="px-2 py-0.5 bg-indigo-50 text-[8px] font-black text-primary uppercase rounded-md tracking-tighter">{job.category}</span>
                                <span className="text-sm font-black text-slate-800">{formatCurrency(job.price)}</span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-800 leading-tight group-hover:text-primary transition-colors">{job.title}</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{job.distance}km away • {job.type}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-slate-100 rounded-[48px] overflow-hidden luxury-shadow border border-slate-50">
                {/* Visual Map Background */}
                <div className="absolute inset-0 opacity-20 grayscale pointer-events-none">
                    <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
                        {Array.from({ length: 144 }).map((_, i) => (
                            <div key={i} className="border-[0.5px] border-slate-300" />
                        ))}
                    </div>
                </div>

                {/* Center Pulse (User Location) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-8 h-8 bg-primary rounded-full border-4 border-white shadow-2xl relative">
                        <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-30" />
                    </div>
                </div>

                {/* 10km Radius Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-2 border-primary/10 rounded-full bg-primary/2" />

                {/* Job Pins */}
                {jobs.map((job, idx) => {
                    const ang = (idx * 137.5) * (Math.PI / 180);
                    const dist = (job.distance * 35);
                    const x = Math.cos(ang) * dist;
                    const y = Math.sin(ang) * dist;

                    return (
                        <motion.div
                            key={job.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}
                            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                            className="absolute z-20"
                        >
                            <div className="relative group">
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white px-4 py-2 rounded-2xl shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 pointer-events-none z-30 min-w-[140px]">
                                    <p className="text-[10px] font-black text-slate-800 leading-tight">{job.title}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[9px] font-bold text-primary">{formatCurrency(job.price)}</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase">{job.distance}km</span>
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-slate-100" />
                                </div>
                                {/* Pin */}
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all cursor-pointer group-hover:scale-110 active:scale-95 border-2 border-white",
                                    job.category === 'Technical' ? "bg-indigo-600" :
                                        job.category === 'Blue Collar' ? "bg-amber-500" :
                                            "bg-slate-800"
                                )}>
                                    <Zap size={16} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Mobile: Radius Legend */}
                <div className="lg:hidden absolute left-6 bottom-6 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl z-40 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-primary">
                        <Zap size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-800 tracking-widest">Scanning 10km</p>
                    </div>
                </div>
            </div>

            {/* Mobile: Bottom Drawer Preview */}
            <div className="lg:hidden bg-white p-6 rounded-t-[40px] luxury-shadow border-t border-slate-50 z-50 -mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-800">Near You</h3>
                    <button className="text-xs font-black text-primary uppercase">See All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 ios-scrollbar">
                    {jobs.filter(j => j.distance < 3).map((job) => (
                        <div
                            key={job.id}
                            onClick={() => router.push(`/gigs/${job.id}`)}
                            className="min-w-[280px] bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-3"
                        >
                            <h4 className="font-bold text-sm">{job.title}</h4>
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                                <span>{job.distance}km away</span>
                                <span className="text-slate-800 font-black text-base">{formatCurrency(job.price)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
