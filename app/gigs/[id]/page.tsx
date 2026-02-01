'use client';

import React from 'react';
import { useJobNest } from '@/lib/context';
import {
    ChevronLeft,
    Clock,
    ShieldCheck,
    CheckCircle2,
    Navigation,
    MessageCircle,
    Share2
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

export default function GigDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { jobs } = useJobNest();

    const job = jobs.find(j => j.id === params.id) || jobs[0]; // Fallback for demo

    return (
        <div className="space-y-8 pb-32 animate-slide-up relative">
            {/* Minimal Header */}
            <div className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between pointer-events-none">
                <button
                    onClick={() => router.back()}
                    className="p-3 bg-white/80 backdrop-blur-md rounded-2xl luxury-shadow border border-white/40 text-slate-400 hover:text-primary transition-all pointer-events-auto"
                >
                    <ChevronLeft size={22} />
                </button>
                <div className="flex gap-2 pointer-events-auto">
                    <button className="p-3 bg-white/80 backdrop-blur-md rounded-2xl luxury-shadow border border-white/40 text-slate-400">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Visual Hero - Map or Image Focus */}
            <div className="h-64 rounded-b-[48px] -mx-4 overflow-hidden relative group">
                <div className="absolute inset-0 bg-slate-100">
                    {/* Map Simulation - Rapido style focus */}
                    <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=15.8281,78.0373&zoom=14&size=600x400&scale=2&key=YOUR_API_KEY')] bg-cover bg-center grayscale opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary rounded-full border-4 border-white shadow-2xl">
                    <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-30" />
                </div>
            </div>

            {/* Content Section */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-indigo-50 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100/50">
                            {job.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Navigation size={12} className="text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{job.distance}km away</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 leading-tight">{job.title}</h1>
                </div>

                {/* Employer Card */}
                <section className="bg-white p-6 rounded-[36px] luxury-shadow border border-slate-50 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-primary text-xl">
                        {job.employer[0]}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-slate-800">{job.employer}</h4>
                            <ShieldCheck size={14} className="text-secondary" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Employer • 4.9 Rating</p>
                    </div>
                    <button className="p-3 bg-slate-50 rounded-xl text-primary hover:bg-primary hover:text-white transition-all">
                        <MessageCircle size={20} />
                    </button>
                </section>

                {/* Gig Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col gap-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estimated Pay</p>
                        <p className="text-2xl font-black text-slate-800">{formatCurrency(job.price)}</p>
                        <p className="text-[8px] text-slate-400 font-bold">/ {job.type}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col gap-1 justify-center">
                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                            <Clock size={16} className="text-primary" />
                            <span className="text-sm">4 Hours Ago</span>
                        </div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Post Duration</p>
                    </div>
                </div>

                {/* Description */}
                <section className="space-y-3">
                    <h3 className="font-bold text-base text-slate-800 ml-1">The Mission</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium bg-white p-6 rounded-[32px] border border-slate-50 luxury-shadow">
                        {job.description || "We are looking for a professional to assist with local service delivery. High quality standards and immediate availability required. Travel expenses within Kurnool are covered."}
                    </p>
                </section>

                {/* Requirements */}
                <section className="space-y-3 pb-4">
                    <h3 className="font-bold text-base text-slate-800 ml-1">Required Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                        {job.tags.map(tag => (
                            <span key={tag} className="px-5 py-3 bg-white luxury-shadow border border-slate-50 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                {tag}
                            </span>
                        ))}
                    </div>
                </section>
            </div>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex gap-4 z-50">
                <button className="flex-1 py-5 bg-white border border-slate-200 rounded-[28px] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                    Save Gig
                </button>
                <button
                    onClick={() => router.push(`/checkout?jobId=${job.id}`)}
                    className="flex-[2] py-5 bg-primary text-white rounded-[28px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    Proceed to Apply <CheckCircle2 size={16} />
                </button>
            </div>
        </div>
    );
}
