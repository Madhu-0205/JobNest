'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageCircle, User, Zap } from 'lucide-react';
import { useJobNest } from '@/lib/context';
import { cn } from '@/lib/utils';

export default function Sidebar() {
    const { user, t } = useJobNest();
    const pathname = usePathname();

    if (!user) return null;

    return (
        <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-50 p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl">J</div>
                <span className="text-xl font-black text-slate-800 tracking-tighter">JobNest</span>
            </div>

            <nav className="flex-1 space-y-2">
                <SidebarItem href="/" icon={<Home size={20} />} label={t('nav_feed')} active={pathname === '/'} />
                <SidebarItem href="/explore" icon={<Search size={20} />} label={t('nav_explore')} active={pathname === '/explore'} />
                <SidebarItem href="/gigs" icon={<Zap size={20} />} label={t('nav_gigs')} active={pathname === '/gigs'} />
                <SidebarItem href="/chat" icon={<MessageCircle size={20} />} label={t('nav_chat')} active={pathname === '/chat'} />
                <SidebarItem href="/profile" icon={<User size={20} />} label={t('nav_profile')} active={pathname === '/profile'} />
            </nav>

            <div className="pt-6 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-primary font-bold">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt="Profile" /> : "S"}
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-800">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Pro Member</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function SidebarItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all group",
                active ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-400 hover:bg-slate-50 hover:text-primary"
            )}
        >
            <span className={cn("transition-transform group-hover:scale-110", active && "scale-110")}>{icon}</span>
            <span className="text-sm">{label}</span>
        </Link>
    );
}
