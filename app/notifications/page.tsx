'use client';

import React from 'react';
import { useJobNest } from '@/lib/context';
import { motion } from 'framer-motion';
import { Bell, Briefcase, Star, MessageCircle, X, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const NOTIFICATIONS = [
    {
        id: '1',
        title: 'New Opportunity Near You',
        desc: 'Electrical Maintenance gig found within 1.2km of your location.',
        time: '2m ago',
        icon: Briefcase,
        color: 'text-primary',
        bg: 'bg-indigo-50/50'
    },
    {
        id: '2',
        title: 'Payment Secured',
        desc: '₹45,000.00 has been added to your vault from Skyline Residencies.',
        time: '1h ago',
        icon: ShieldCheck,
        color: 'text-green-500',
        bg: 'bg-green-50/50'
    },
    {
        id: '3',
        title: 'Message from Employer',
        desc: 'Alex Rivera sent you a contract update for the UI/UX gig.',
        time: '3h ago',
        icon: MessageCircle,
        color: 'text-indigo-400',
        bg: 'bg-slate-50'
    },
    {
        id: '4',
        title: 'Verified 5-Star Review',
        desc: 'Congratulations! You received a 5-star rating for the last task.',
        time: 'Yesterday',
        icon: Star,
        color: 'text-secondary',
        bg: 'bg-amber-50/50'
    },
];

export default function NotificationsPage() {
    const { t } = useJobNest();

    return (
        <div className="space-y-8 pb-24">
            <header className="pt-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">{t('notifications_title')}</h1>
                    <p className="text-slate-400 text-sm font-medium">Stay updated with your local activities.</p>
                </div>
                <button className="text-[10px] font-black text-primary uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl">
                    Clear All
                </button>
            </header>

            <div className="space-y-4">
                {NOTIFICATIONS.map((notif, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={notif.id}
                        className="bg-white p-6 rounded-[32px] luxury-shadow border border-slate-50 flex gap-5 items-start group relative hover:border-primary/20 transition-all cursor-pointer"
                    >
                        <div className={cn("w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center transition-all group-hover:scale-110 shadow-sm", notif.bg, notif.color)}>
                            <notif.icon size={24} />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-sm text-slate-800">{notif.title}</h3>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{notif.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{notif.desc}</p>
                        </div>
                        <button className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all absolute top-2 right-2">
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-[32px] mx-auto flex items-center justify-center text-slate-300 border border-slate-100 luxury-shadow">
                    <Bell size={32} />
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">End of activities</p>
            </div>
        </div>
    );
}
