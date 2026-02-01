'use client';

import React, { useState } from 'react';
import { useJobNest } from '@/lib/context';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Download,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    PieChart,
    BarChart3
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';

type TimeRange = 'weekly' | 'monthly' | 'yearly';

interface AnalyticsData {
    revenue: number;
    spent: number;
    gained: number;
    transactions: number;
    avgTransaction: number;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const { user, transactions } = useJobNest();
    const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-slate-100 rounded-full mb-4" />
                <div className="h-4 w-32 bg-slate-100 rounded-full" />
            </div>
        );
    }

    // Calculate analytics based on time range
    const getAnalytics = (): AnalyticsData => {
        const now = new Date();
        let filteredTransactions = transactions;

        if (timeRange === 'weekly') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredTransactions = transactions.filter(t => new Date(t.date) >= weekAgo);
        } else if (timeRange === 'monthly') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredTransactions = transactions.filter(t => new Date(t.date) >= monthAgo);
        } else {
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            filteredTransactions = transactions.filter(t => new Date(t.date) >= yearAgo);
        }

        const revenue = filteredTransactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);

        const spent = Math.abs(filteredTransactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0));

        const gained = revenue - spent;
        const avgTransaction = filteredTransactions.length > 0
            ? Math.abs(filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / filteredTransactions.length)
            : 0;

        return {
            revenue,
            spent,
            gained,
            transactions: filteredTransactions.length,
            avgTransaction
        };
    };

    const analytics = getAnalytics();

    // Mock data for charts (weekly breakdown)
    const getChartData = () => {
        if (timeRange === 'weekly') {
            return [
                { label: 'Mon', revenue: 2500, spent: 500 },
                { label: 'Tue', revenue: 1800, spent: 300 },
                { label: 'Wed', revenue: 3200, spent: 800 },
                { label: 'Thu', revenue: 2100, spent: 400 },
                { label: 'Fri', revenue: 4500, spent: 1200 },
                { label: 'Sat', revenue: 3800, spent: 600 },
                { label: 'Sun', revenue: 2900, spent: 350 }
            ];
        } else if (timeRange === 'monthly') {
            return [
                { label: 'Week 1', revenue: 12500, spent: 3500 },
                { label: 'Week 2', revenue: 15800, spent: 4200 },
                { label: 'Week 3', revenue: 18200, spent: 5100 },
                { label: 'Week 4', revenue: 21500, spent: 6800 }
            ];
        } else {
            return [
                { label: 'Jan', revenue: 45000, spent: 12000 },
                { label: 'Feb', revenue: 52000, spent: 15000 },
                { label: 'Mar', revenue: 48000, spent: 13500 },
                { label: 'Apr', revenue: 61000, spent: 18000 },
                { label: 'May', revenue: 58000, spent: 16500 },
                { label: 'Jun', revenue: 72000, spent: 21000 },
                { label: 'Jul', revenue: 68000, spent: 19500 },
                { label: 'Aug', revenue: 75000, spent: 22000 },
                { label: 'Sep', revenue: 82000, spent: 24500 },
                { label: 'Oct', revenue: 78000, spent: 23000 },
                { label: 'Nov', revenue: 85000, spent: 25500 },
                { label: 'Dec', revenue: 92000, spent: 28000 }
            ];
        }
    };

    const chartData = getChartData();
    const maxValue = Math.max(...chartData.map(d => Math.max(d.revenue, d.spent)));

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
                    <h1 className="text-2xl font-black text-slate-800">Financial Analytics</h1>
                </div>
                <button className="p-3 bg-white rounded-2xl luxury-shadow border border-slate-50 text-slate-400">
                    <Download size={20} />
                </button>
            </header>

            {/* Time Range Selector */}
            <div className="flex gap-3">
                {(['weekly', 'monthly', 'yearly'] as TimeRange[]).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={cn(
                            "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            timeRange === range
                                ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                                : "bg-white text-slate-400 border-slate-100 hover:border-primary/20"
                        )}
                    >
                        {range}
                    </button>
                ))}
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-[32px] text-white shadow-2xl shadow-green-500/20"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Revenue</span>
                    </div>
                    <p className="text-3xl font-black">{formatCurrency(analytics.revenue)}</p>
                    <p className="text-[9px] font-bold mt-2 opacity-70">Total earnings received</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-[32px] text-white shadow-2xl shadow-red-500/20"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <TrendingDown size={20} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Spent</span>
                    </div>
                    <p className="text-3xl font-black">{formatCurrency(analytics.spent)}</p>
                    <p className="text-[9px] font-bold mt-2 opacity-70">Total expenses paid</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-[32px] text-white shadow-2xl shadow-blue-500/20"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Wallet size={20} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Net Gained</span>
                    </div>
                    <p className="text-3xl font-black">{formatCurrency(analytics.gained)}</p>
                    <p className="text-[9px] font-bold mt-2 opacity-70">Revenue minus expenses</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-500 to-violet-600 p-6 rounded-[32px] text-white shadow-2xl shadow-purple-500/20"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Avg Transaction</span>
                    </div>
                    <p className="text-3xl font-black">{formatCurrency(analytics.avgTransaction)}</p>
                    <p className="text-[9px] font-bold mt-2 opacity-70">{analytics.transactions} transactions</p>
                </motion.div>
            </div>

            {/* Bar Chart */}
            <section className="bg-white p-7 rounded-[40px] luxury-shadow border border-slate-50">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-primary">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800">Performance Chart</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Revenue vs Spending</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-[9px] font-bold text-slate-600">Revenue</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-[9px] font-bold text-slate-600">Spent</span>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="space-y-4">
                    {chartData.map((data, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">{data.label}</span>
                                <div className="flex-1 flex gap-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(data.revenue / maxValue) * 100}%` }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                        className="h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-xl relative group"
                                    >
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            {formatCurrency(data.revenue)}
                                        </span>
                                    </motion.div>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(data.spent / maxValue) * 100}%` }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                        className="h-8 bg-gradient-to-r from-red-400 to-red-600 rounded-xl relative group"
                                    >
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            {formatCurrency(data.spent)}
                                        </span>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Summary Stats */}
            <section className="bg-white p-7 rounded-[40px] luxury-shadow border border-slate-50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <PieChart size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800">Financial Summary</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Detailed breakdown</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                <ArrowDownLeft size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800">Total Credits</p>
                                <p className="text-[9px] font-bold text-slate-400">Money received</p>
                            </div>
                        </div>
                        <p className="text-lg font-black text-green-600">{formatCurrency(analytics.revenue)}</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                                <ArrowUpRight size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800">Total Debits</p>
                                <p className="text-[9px] font-bold text-slate-400">Money spent</p>
                            </div>
                        </div>
                        <p className="text-lg font-black text-red-600">{formatCurrency(analytics.spent)}</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                <Wallet size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800">Net Balance Change</p>
                                <p className="text-[9px] font-bold text-slate-400">Overall profit/loss</p>
                            </div>
                        </div>
                        <p className={cn(
                            "text-lg font-black",
                            analytics.gained >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                            {analytics.gained >= 0 ? '+' : ''}{formatCurrency(analytics.gained)}
                        </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800">Transaction Count</p>
                                <p className="text-[9px] font-bold text-slate-400">Total activities</p>
                            </div>
                        </div>
                        <p className="text-lg font-black text-slate-800">{analytics.transactions}</p>
                    </div>
                </div>
            </section>

            {/* Export Options */}
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Export Reports</p>
                <div className="flex gap-3">
                    <button className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-primary/50 transition-all">
                        PDF Report
                    </button>
                    <button className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-primary/50 transition-all">
                        Excel Sheet
                    </button>
                </div>
            </div>
        </div>
    );
}
