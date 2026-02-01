'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronLeft, RefreshCcw } from 'lucide-react';

export default function AuthCodeErrorPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white p-8 rounded-[40px] luxury-shadow border border-slate-100/50 text-center"
            >
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
                    <AlertCircle size={40} />
                </div>

                <h1 className="text-2xl font-black text-slate-800 mb-2">Authentication Error</h1>
                <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
                    We couldn&apos;t verify your login request. The link might have expired or was already used.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full py-5 bg-primary text-white rounded-[28px] text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <RefreshCcw size={16} /> Try Login Again
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-5 bg-white border border-slate-100 text-slate-400 rounded-[28px] text-xs font-black uppercase tracking-widest hover:border-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <ChevronLeft size={16} /> Return to Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
