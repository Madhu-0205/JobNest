'use client';

import React, { useState } from 'react';
import { useJobNest } from '@/lib/context';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Wallet,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    Smartphone,
    Building,
    QrCode,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import SecurityPinModal from '@/components/ui/SecurityPinModal';

type PaymentTab = 'wallet' | 'add' | 'withdraw';

export default function PaymentsHub() {
    const router = useRouter();
    const { user, transactions, updateBalance, addTransaction } = useJobNest();
    const [activeTab, setActiveTab] = useState<PaymentTab>('wallet');
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-slate-100 rounded-full mb-4" />
                <div className="h-4 w-32 bg-slate-100 rounded-full" />
            </div>
        );
    }

    const [isPinOpen, setIsPinOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'add' | 'withdraw', amount: number } | null>(null);

    const initiateTransaction = (type: 'add' | 'withdraw') => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (type === 'withdraw') {
            if (numAmount > user.balance) {
                toast.error('Insufficient balance');
                return;
            }
            if (numAmount < 1000) {
                toast.error('Minimum withdrawal is ₹1,000');
                return;
            }
        }

        setPendingAction({ type, amount: numAmount });
        setIsPinOpen(true);
    };

    const processTransaction = () => {
        if (!pendingAction) return;

        setIsProcessing(true);
        setIsPinOpen(false);

        const { type, amount } = pendingAction;

        setTimeout(() => {
            if (type === 'add') {
                updateBalance(amount);
                addTransaction({
                    id: `tx-add-${Math.random().toString(36).substr(2, 5)}`,
                    title: 'Wallet Recharge',
                    amount: amount,
                    type: 'credit',
                    status: 'completed',
                    date: new Date().toISOString().split('T')[0],
                    method: 'UPI/Card'
                });
                toast.success(`${formatCurrency(amount)} added to your wallet!`);
            } else {
                updateBalance(-amount);
                addTransaction({
                    id: `tx-wd-${Math.random().toString(36).substr(2, 5)}`,
                    title: 'Bank Withdrawal',
                    amount: -amount,
                    type: 'debit',
                    status: 'completed',
                    date: new Date().toISOString().split('T')[0],
                    method: 'Bank Transfer'
                });
                toast.success(`${formatCurrency(amount)} withdrawal initiated!`);
            }

            setIsProcessing(false);
            setAmount('');
            setActiveTab('wallet');
            setPendingAction(null);
        }, 1500);
    };

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
                    <h1 className="text-2xl font-black text-slate-800">Payments Hub</h1>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-primary">
                    <ShieldCheck size={20} />
                </div>
            </header>

            {/* Main Balance Card */}
            <section className="bg-slate-900 p-8 rounded-[48px] shadow-2xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Wallet size={16} className="text-white/60" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Total Balance</span>
                        </div>
                        <span className="text-[10px] font-black px-3 py-1 bg-white/10 rounded-lg">Verified</span>
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(user.balance)}</h2>
                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={() => setActiveTab('add')}
                            className={cn(
                                "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                activeTab === 'add' ? "bg-white text-slate-900" : "bg-white/10 text-white backdrop-blur-md border border-white/10"
                            )}
                        >
                            <Plus size={14} /> Add Funds
                        </button>
                        <button
                            onClick={() => setActiveTab('withdraw')}
                            className={cn(
                                "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                activeTab === 'withdraw' ? "bg-white text-slate-900" : "bg-white/10 text-white backdrop-blur-md border border-white/10"
                            )}
                        >
                            <ArrowUpRight size={14} /> Withdraw
                        </button>
                    </div>
                </div>
            </section>

            {/* Interactive Section Container */}
            <AnimatePresence mode="wait">
                {activeTab === 'wallet' ? (
                    <motion.div
                        key="wallet-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => router.push('/profile/analytics')}
                                className="bg-white p-6 rounded-[32px] luxury-shadow border border-slate-50 flex flex-col items-center gap-3 text-center"
                            >
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <ArrowDownLeft size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800">Analytics</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">View Trends</p>
                                </div>
                            </button>
                            <button
                                onClick={() => router.push('/profile/transactions')}
                                className="bg-white p-6 rounded-[32px] luxury-shadow border border-slate-50 flex flex-col items-center gap-3 text-center"
                            >
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                                    <ArrowUpRight size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800">History</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Transactions</p>
                                </div>
                            </button>
                        </div>

                        {/* Recent Activity Mini List */}
                        <div className="bg-white p-7 rounded-[40px] luxury-shadow border border-slate-50 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-slate-800">Recent Activity</h3>
                                <button
                                    onClick={() => router.push('/profile/transactions')}
                                    className="text-[9px] font-black text-primary uppercase tracking-widest"
                                >
                                    See All
                                </button>
                            </div>
                            <div className="space-y-4">
                                {transactions.slice(0, 3).map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                tx.type === 'credit' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {tx.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{tx.title}</p>
                                                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">{tx.date}</p>
                                            </div>
                                        </div>
                                        <p className={cn(
                                            "text-sm font-black",
                                            tx.type === 'credit' ? "text-green-600" : "text-red-600"
                                        )}>
                                            {tx.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="payment-action"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white p-7 rounded-[40px] luxury-shadow border border-slate-50 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-slate-800">{activeTab === 'add' ? 'Recharge Wallet' : 'Withdraw Funds'}</h3>
                            <button
                                onClick={() => setActiveTab('wallet')}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"
                            >
                                <Plus size={16} className="rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enter Amount</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-12 pr-6 py-6 bg-slate-50 border border-transparent focus:border-primary/20 rounded-[28px] outline-none font-black text-2xl transition-all"
                                />
                            </div>
                            <div className="flex gap-2 pt-2 overflow-x-auto pb-2 ios-scrollbar">
                                {[1000, 2000, 5000, 10000].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(val.toString())}
                                        className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-primary hover:text-white transition-all whitespace-nowrap"
                                    >
                                        + ₹{val.toLocaleString('en-IN')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {activeTab === 'add' ? (
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Payment Method</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <PaymentMethodBtn icon={<Smartphone size={18} />} label="UPI" active />
                                    <PaymentMethodBtn icon={<CreditCard size={18} />} label="Cards" />
                                    <PaymentMethodBtn icon={<Building size={18} />} label="Banking" />
                                    <PaymentMethodBtn icon={<QrCode size={18} />} label="QR Scan" />
                                </div>
                                <button
                                    disabled={isProcessing}
                                    onClick={() => initiateTransaction('add')}
                                    className={cn(
                                        "w-full py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 mt-4",
                                        isProcessing ? "bg-slate-100 text-slate-400" : "bg-primary text-white shadow-xl shadow-primary/20"
                                    )}
                                >
                                    {isProcessing ? "Processing..." : "Secure Recharge"}
                                    {!isProcessing && <CheckCircle2 size={16} />}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-3">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Withdrawal Destination</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Building size={20} className="text-slate-400" />
                                            <div>
                                                <p className="text-xs font-black text-slate-800">State Bank of India</p>
                                                <p className="text-[9px] font-bold text-slate-400">A/C: ****1234</p>
                                            </div>
                                        </div>
                                        <button className="text-[9px] font-black text-primary uppercase">Edit</button>
                                    </div>
                                </div>
                                <button
                                    disabled={isProcessing}
                                    onClick={() => initiateTransaction('withdraw')}
                                    className={cn(
                                        "w-full py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 mt-4",
                                        isProcessing ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                                    )}
                                >
                                    {isProcessing ? "Processing..." : "Initiate Withdrawal"}
                                    {!isProcessing && <ArrowUpRight size={16} />}
                                </button>
                                <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest">Funds reach bank in 24-48 hours</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Support Section */}
            <section className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 luxury-shadow">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-800">Escrow Security</p>
                        <p className="text-[9px] font-bold text-slate-400">Payments are 100% protected</p>
                    </div>
                </div>
                <button className="text-[9px] font-black text-primary uppercase tracking-widest">Learn More</button>
            </section>

            <SecurityPinModal
                isOpen={isPinOpen}
                onClose={() => setIsPinOpen(false)}
                onSuccess={processTransaction}
                title={pendingAction?.type === 'add' ? "Confirm Recharge" : "Confirm Withdrawal"}
            />
        </div>
    );
}

function PaymentMethodBtn({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <button className={cn(
            "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
            active ? "bg-indigo-50 border-primary/30 text-primary shadow-sm" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
        )}>
            {icon}
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}
