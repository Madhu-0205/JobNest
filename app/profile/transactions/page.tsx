'use client';

import React from 'react';
import { useJobNest } from '@/lib/context';
import { motion } from 'framer-motion';
import {
    ArrowUpRight,
    ArrowDownLeft,
    ChevronLeft,
    Search,
    Filter,
    Download,
    Wallet,
    Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function TransactionsPage() {
    const router = useRouter();
    const { user, transactions, t, updateBalance, addTransaction } = useJobNest();

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-slate-100 rounded-full mb-4" />
                <div className="h-4 w-32 bg-slate-100 rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24 animate-slide-up">
            <header className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/profile')}
                        className="p-3 bg-white rounded-2xl luxury-shadow border border-slate-50 text-slate-400 hover:text-primary transition-all"
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <h1 className="text-2xl font-black text-slate-800">{t('trans_history')}</h1>
                </div>
                <button
                    onClick={() => toast.success('Report downloaded!')}
                    className="p-3 bg-white rounded-2xl luxury-shadow border border-slate-50 text-slate-400">
                    <Download size={20} />
                </button>
            </header>

            {/* Premium Wallet Summary */}
            <section className="bg-white p-7 rounded-[40px] luxury-shadow border border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary">
                        <Wallet size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Payout</p>
                        <p className="text-2xl font-black text-slate-800">{formatCurrency(user.balance)}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (user.balance < 1000) {
                            toast.error('Minimum withdrawal: ₹1000');
                        } else {
                            const amt = 1000;
                            updateBalance(-amt);
                            addTransaction({
                                id: `tx-wd-${Math.random().toString(36).substr(2, 5)}`,
                                title: 'Wallet Withdrawal',
                                amount: -amt,
                                type: 'debit',
                                status: 'completed',
                                date: new Date().toISOString().split('T')[0],
                                method: 'Bank Transfer'
                            });
                            toast.success('Withdrawal of ₹1000 initiated!');
                        }
                    }}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                    Withdraw
                </button>
            </section>

            {/* Search/Filter Bar */}
            <div className="flex gap-3">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-primary/20 transition-all text-xs font-bold"
                    />
                </div>
                <button className="p-4 bg-white rounded-2xl luxury-shadow border border-slate-50 text-slate-400">
                    <Filter size={20} />
                </button>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
                {transactions.map((tx, idx) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={tx.id}
                        className="bg-white p-5 rounded-[32px] luxury-shadow border border-slate-50 flex items-center gap-4 group cursor-pointer hover:border-primary/20 transition-all"
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                            tx.type === 'credit' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                        )}>
                            {tx.type === 'credit' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-slate-800 leading-tight">{tx.title}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{tx.method}</span>
                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-[9px] font-bold text-slate-400">{tx.date}</span>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            <span className={cn(
                                "font-black text-sm",
                                tx.type === 'credit' ? "text-green-600" : "text-slate-800"
                            )}>
                                {tx.type === 'credit' ? '+' : ''}{tx.amount.toFixed(2)}
                            </span>
                            <div className={cn(
                                "px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter border",
                                tx.status === 'completed' ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                                {tx.status}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="py-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-[28px] mx-auto flex items-center justify-center text-slate-300 mb-4">
                    <Clock size={28} />
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Showing all transactions</p>
            </div>
        </div>
    );
}
