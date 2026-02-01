'use client';

import React, { useState } from 'react';
import { useJobNest } from '@/lib/context';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Briefcase,
    ChevronLeft,
    CheckCircle2,
    Camera,
    FileText,
    UserCheck,
    Award,
    Zap,
    Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function VerificationHub() {
    const router = useRouter();
    const { user } = useJobNest();
    const [step, setStep] = useState<'overview' | 'identity' | 'skills'>('overview');

    if (!user) return null;

    return (
        <div className="space-y-8 pb-24 animate-slide-up">
            <header className="pt-6 flex items-center gap-4">
                <button
                    onClick={() => step === 'overview' ? router.push('/profile') : setStep('overview')}
                    className="p-3 bg-white rounded-2xl luxury-shadow border border-slate-50 text-slate-400 hover:text-primary transition-all"
                >
                    <ChevronLeft size={22} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Verification Hub</h1>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{step === 'overview' ? 'Trust & Safety' : `Step: ${step}`}</p>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {step === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Status Card */}
                        <section className="bg-slate-900 p-8 rounded-[48px] shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent opacity-50" />
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center text-white backdrop-blur-md border border-white/20">
                                    <ShieldCheck size={40} className="text-secondary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">Advanced Tier Status</h2>
                                    <p className="text-white/50 text-xs font-medium mt-1">Your profile is 85% verified. Complete all steps for priority matching.</p>
                                </div>
                            </div>
                        </section>

                        <div className="grid gap-4">
                            <VerificationItem
                                icon={UserCheck}
                                title="Identity Verification"
                                desc="Government ID & Aadhaar sync"
                                status="Verified"
                                onClick={() => setStep('identity')}
                            />
                            <VerificationItem
                                icon={Award}
                                title="Skill Certification"
                                desc="Professional trade certificates"
                                status="Pending"
                                color="amber"
                                onClick={() => setStep('skills')}
                            />
                            <VerificationItem
                                icon={Globe}
                                title="Background Check"
                                desc="Criminal & social record scan"
                                status="Locked"
                                color="slate"
                            />
                        </div>

                        <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100/50 space-y-3">
                            <div className="flex items-center gap-2 text-primary">
                                <Zap size={18} fill="currentColor" />
                                <span className="text-xs font-black uppercase tracking-widest">Premium Benefit</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                Verified professionals earn **2.4x more** on JobNest and get exclusive access to high-budget enterprise contracts.
                            </p>
                        </div>
                    </motion.div>
                )}

                {step === 'identity' && (
                    <motion.div
                        key="identity"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="bg-white p-8 rounded-[48px] luxury-shadow border border-slate-50 space-y-8">
                            <div className="space-y-2 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center text-primary">
                                    <Camera size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">Biometric Identity</h3>
                                <p className="text-xs text-slate-400 font-medium">Please capture a live photo to match your Government ID.</p>
                            </div>

                            <div className="aspect-video bg-slate-900 rounded-[32px] relative overflow-hidden flex items-center justify-center group cursor-pointer">
                                <div className="absolute inset-0 border-2 border-primary/20 m-6 rounded-2xl border-dashed" />
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Live Camera Feed</p>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                                    <div className="w-8 h-8 rounded-full border-4 border-slate-900" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button className="w-full py-5 bg-slate-50 rounded-2xl flex items-center px-6 gap-4 border border-slate-100 hover:border-primary/20 transition-all">
                                    <FileText className="text-slate-400" size={20} />
                                    <span className="text-xs font-bold text-slate-600">Passport / Aadhaar Card.pdf</span>
                                    <CheckCircle2 className="ml-auto text-green-500" size={18} />
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    toast.success('Identity submitted for review');
                                    setStep('overview');
                                }}
                                className="w-full py-5 bg-primary text-white rounded-[32px] text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                            >
                                Apply Verification
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'skills' && (
                    <motion.div
                        key="skills"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="bg-white p-8 rounded-[48px] luxury-shadow border border-slate-50 space-y-8">
                            <div className="space-y-2 text-center">
                                <div className="w-16 h-16 bg-amber-50 rounded-2xl mx-auto flex items-center justify-center text-amber-500">
                                    <Award size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">Professional Certification</h3>
                                <p className="text-xs text-slate-400 font-medium">Upload certificates for plumbing, electrical, or technical trades.</p>
                            </div>

                            <div className="grid gap-4">
                                {user.skills.map(skill => (
                                    <div key={skill} className="p-5 bg-slate-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-amber-200 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                                                <Briefcase size={20} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{skill}</span>
                                        </div>
                                        <button className="text-[10px] font-black text-primary uppercase underline">Upload</button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    toast.success('Skills submitted for review');
                                    setStep('overview');
                                }}
                                className="w-full py-5 bg-foreground text-white rounded-[32px] text-xs font-black uppercase tracking-widest shadow-2xl"
                            >
                                Submit Certifications
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface VerificationItemProps {
    icon: React.ElementType;
    title: string;
    desc: string;
    status: string;
    color?: 'indigo' | 'amber' | 'slate';
    onClick?: () => void;
}

function VerificationItem({ icon: Icon, title, desc, status, color = 'indigo', onClick }: VerificationItemProps) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-white p-6 rounded-[36px] luxury-shadow border border-slate-50 flex items-center gap-5 group transition-all hover:border-primary/20 active:scale-[0.98]"
        >
            <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                color === 'indigo' ? "bg-indigo-50 text-primary" :
                    color === 'amber' ? "bg-amber-50 text-amber-500" :
                        "bg-slate-50 text-slate-400"
            )}>
                <Icon size={24} />
            </div>
            <div className="flex-1 text-left">
                <h4 className="font-black text-base text-slate-800">{title}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{desc}</p>
            </div>
            <div className={cn(
                "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border",
                status === 'Verified' ? "bg-green-50 text-green-600 border-green-100" :
                    status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-slate-50 text-slate-400 border-slate-100"
            )}>
                {status}
            </div>
        </button>
    );
}
