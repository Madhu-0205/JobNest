'use client';

import React, { useState } from 'react';
import { useJobNest } from '@/lib/context';
import { motion } from 'framer-motion';
import { Search, Send, Plus, ChevronLeft, MoreVertical, CheckCheck, ShieldCheck, MapPin } from 'lucide-react';

const MOCK_CHATS = [
    { id: '1', name: 'Alex Rivera', role: 'Employer', lastMsg: 'I have reviewed your portfolio.', time: '10:24 AM', unread: 2, online: true },
    { id: '2', name: 'Skyline Residencies', role: 'Property Manager', lastMsg: 'The gig has been completed.', time: 'Yesterday', unread: 0, online: false },
    { id: '3', name: 'Sarah Jenkins', role: 'Freelancer', lastMsg: 'Can you start on Monday?', time: '2 days ago', unread: 0, online: true },
];

export default function ChatPage() {
    const { t } = useJobNest();
    const [activeChat, setActiveChat] = useState<string | null>(null);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col -mx-4">
            {!activeChat ? (
                <div className="flex-1 flex flex-col px-4 gap-6 overflow-y-auto pb-24 animate-slide-up">
                    <header className="pt-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800">{t('messages_title')}</h1>
                            <p className="text-slate-400 text-sm font-medium">Coordinate with your local contacts.</p>
                        </div>
                        <button className="w-12 h-12 bg-primary text-white rounded-2xl luxury-shadow flex items-center justify-center active:scale-90 transition-all">
                            <Plus size={24} />
                        </button>
                    </header>

                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Find conversations..."
                            className="w-full pl-14 pr-5 py-5 bg-white rounded-[28px] luxury-shadow border border-slate-50 outline-none focus:border-primary/20 transition-all font-bold text-sm"
                        />
                    </div>

                    <div className="space-y-3">
                        {MOCK_CHATS.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => setActiveChat(chat.id)}
                                className="w-full bg-white p-5 rounded-[36px] luxury-shadow border border-slate-50 flex gap-4 items-center group active:scale-[0.98] transition-all hover:border-primary/20"
                            >
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center font-black text-primary text-xl border border-slate-100 group-hover:bg-primary/5 transition-colors">
                                        {chat.name[0]}
                                    </div>
                                    {chat.online && (
                                        <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white" />
                                    )}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="font-bold text-base text-slate-800">{chat.name}</h3>
                                            <ShieldCheck size={14} className="text-secondary" />
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{chat.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium line-clamp-1">{chat.lastMsg}</p>
                                </div>
                                {chat.unread > 0 && (
                                    <div className="w-6 h-6 bg-primary text-white rounded-xl flex items-center justify-center text-[10px] font-black shadow-lg shadow-primary/20">
                                        {chat.unread}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col bg-slate-50/50">
                    {/* Chat Detail Header */}
                    <div className="px-6 py-5 bg-white luxury-shadow border-b border-slate-100 flex items-center gap-4 z-10">
                        <button onClick={() => setActiveChat(null)} className="p-2 -ml-2 text-slate-400 hover:text-primary transition-all">
                            <ChevronLeft size={28} />
                        </button>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-primary text-lg">
                            {MOCK_CHATS.find(c => c.id === activeChat)?.name[0]}
                        </div>
                        <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-base text-slate-800">{MOCK_CHATS.find(c => c.id === activeChat)?.name}</h3>
                                <ShieldCheck size={14} className="text-secondary" />
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Active Now</p>
                            </div>
                        </div>
                        <button className="p-3 bg-slate-50 rounded-xl text-slate-400"><MoreVertical size={20} /></button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="flex justify-center">
                            <span className="px-4 py-1 bg-white border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest luxury-shadow">Today</span>
                        </div>

                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 max-w-[85%]">
                            <div className="bg-white p-5 rounded-[28px] rounded-tl-none luxury-shadow border border-slate-50">
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">Hello! I&apos;ve seen your application for the electrical maintenance position. Are you available for a quick local visit?</p>
                                <p className="text-[8px] text-slate-400 mt-2 font-black uppercase tracking-tighter text-right">10:24 AM</p>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                            <div className="bg-primary p-5 rounded-[28px] rounded-tr-none shadow-xl shadow-primary/20">
                                <p className="text-sm text-white leading-relaxed font-medium">Hi! Yes, I&apos;m within 2km of the site. I can head over in about 20 minutes.</p>
                                <div className="flex items-center justify-end gap-1.5 mt-2">
                                    <p className="text-[8px] text-white/70 font-black uppercase tracking-tighter">10:26 AM</p>
                                    <CheckCheck size={12} className="text-white" />
                                </div>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-2 pt-4 justify-center opacity-50">
                            <MapPin size={10} className="text-primary" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Location Shared within Contract Radius</span>
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="p-6 bg-white border-t border-slate-100 flex gap-3 items-center pb-10">
                        <button className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-all">
                            <Plus size={24} />
                        </button>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Write your message..."
                                className="w-full bg-slate-50 p-5 rounded-2xl outline-none text-sm font-bold border border-transparent focus:border-primary/10 transition-all"
                            />
                        </div>
                        <button className="w-14 h-14 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center active:scale-90 transition-all">
                            <Send size={22} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
