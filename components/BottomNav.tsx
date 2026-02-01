'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, MessageCircle, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJobNest } from '@/lib/context';
import { motion } from 'framer-motion';

const BottomNav = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, t } = useJobNest();

    if (!user) return null;

    const navItems = [
        { icon: Home, label: t('nav_feed'), path: '/' },
        { icon: Search, label: t('nav_explore'), path: '/explore' },
        { icon: Zap, label: t('nav_gigs'), path: '/gigs' },
        { icon: MessageCircle, label: t('nav_chat'), path: '/chat' },
        { icon: User, label: t('nav_profile'), path: '/profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pointer-events-none">
            <nav className="max-w-lg mx-auto h-20 bg-slate-900/90 backdrop-blur-2xl rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between px-8 pointer-events-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={cn(
                                "relative flex flex-col items-center justify-center p-2 group transition-all duration-500",
                                isActive ? "scale-110" : "scale-100"
                            )}
                        >
                            {/* Active Indicator Glow */}
                            {isActive && (
                                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            )}

                            <item.icon
                                size={22}
                                className={cn(
                                    "transition-all duration-500",
                                    isActive ? "text-white stroke-[2.5px]" : "text-white/40 group-hover:text-white/60"
                                )}
                            />

                            {isActive && (
                                <motion.span
                                    layoutId="nav-dot"
                                    className="absolute -bottom-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_#4338CA]"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default BottomNav;
