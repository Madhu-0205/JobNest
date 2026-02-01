'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    CreditCard,
    Smartphone,
    Home,
    ShieldCheck,
    CheckCircle2,
    Building,
    QrCode,
    ArrowRight
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import { useJobNest } from '@/lib/context';
import toast from 'react-hot-toast';

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'qrcode' | 'account';

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('jobId');
    const { user, jobs, updateBalance, addTransaction, updateJobStatus } = useJobNest();

    const targetJob = jobs.find(j => j.id === jobId) || jobs[0]; // Fallback for demo

    const [method, setMethod] = useState<PaymentMethod>('upi');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const price = targetJob ? targetJob.price : 850.00;
    const fee = price * 0.10; // 10% platform fee
    const total = price + fee;

    const handlePayment = () => {
        if (method === 'wallet' && user && user.balance < total) {
            toast.error('Insufficient wallet balance');
            return;
        }

        setIsProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
            if (method === 'wallet') {
                updateBalance(-total);
            }

            addTransaction({
                id: `tx-${Math.random().toString(36).substr(2, 9)}`,
                title: `Application Fee: ${targetJob.title}`,
                amount: -total,
                type: 'debit',
                status: 'completed',
                date: new Date().toISOString().split('T')[0],
                method: method.toUpperCase()
            });

            if (jobId) {
                updateJobStatus(jobId, 'Accepted');
            }

            setIsProcessing(false);
            setIsSuccess(true);
            toast.success('Payment Successful!');
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-slide-up">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 relative">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 bg-green-100 rounded-full"
                    />
                    <CheckCircle2 size={48} className="text-green-600 relative z-10" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">Payment Confirmed</h1>
                <p className="text-slate-400 font-bold mb-10 max-w-xs">Your booking for &apos;{targetJob.title}&apos; has been successfully processed.</p>

                <div className="w-full bg-white p-6 rounded-[32px] luxury-shadow border border-slate-50 mb-10 text-left">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</span>
                        <span className="text-xs font-bold text-slate-800">#TXN-8829410</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                        <span className="text-lg font-black text-primary">{formatCurrency(total)}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-5 bg-primary text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                    >
                        Back to Feed
                    </button>
                    <button
                        onClick={() => router.push('/profile/transactions')}
                        className="w-full py-5 bg-white border border-slate-100 text-slate-400 rounded-3xl font-black uppercase tracking-widest"
                    >
                        View Receipt
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-slide-up pb-20">
            <header className="flex items-center justify-between pt-4">
                <button
                    onClick={() => router.back()}
                    className="p-3 bg-white rounded-2xl luxury-shadow border border-slate-50 text-slate-400 hover:text-primary transition-all"
                >
                    <ChevronLeft size={22} />
                </button>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Checkout</h1>
                <div className="w-10" />
            </header>

            {/* Price Preview */}
            <section className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Total Amount</p>
                    <h2 className="text-4xl font-black">{formatCurrency(total)}</h2>
                    <div className="mt-6 flex items-center gap-3">
                        <div className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest backdrop-blur-md">
                            Escrow Protected
                        </div>
                        <ShieldCheck size={16} className="text-primary" />
                    </div>
                </div>
            </section>

            {/* Payment Method Selection */}
            <section className="space-y-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Payment Mode</h3>

                <div className="grid grid-cols-1 gap-3">
                    <PaymentOption
                        title="JobNest Wallet"
                        subtitle={`Available: ${formatCurrency(user?.balance || 0)}`}
                        icon={<Home className="text-primary" size={20} />}
                        active={method === 'wallet'}
                        onClick={() => setMethod('wallet')}
                    />
                    <PaymentOption
                        title="UPI Payment"
                        subtitle="Google Pay, PhonePe, Paytm"
                        icon={<Smartphone className="text-indigo-500" size={20} />}
                        active={method === 'upi'}
                        onClick={() => setMethod('upi')}
                    />
                    <PaymentOption
                        title="QR Code"
                        subtitle="Scan & Pay with any UPI app"
                        icon={<QrCode className="text-green-600" size={20} />}
                        active={method === 'qrcode'}
                        onClick={() => setMethod('qrcode')}
                    />
                    <PaymentOption
                        title="Credit / Debit Card"
                        subtitle="Visa, Mastercard, RuPay"
                        icon={<CreditCard className="text-secondary" size={20} />}
                        active={method === 'card'}
                        onClick={() => setMethod('card')}
                    />
                    <PaymentOption
                        title="Net Banking"
                        subtitle="All major Indian banks"
                        icon={<Building className="text-slate-400" size={20} />}
                        active={method === 'netbanking'}
                        onClick={() => setMethod('netbanking')}
                    />
                    <PaymentOption
                        title="Account Transfer"
                        subtitle="Direct bank account transfer"
                        icon={<Building className="text-blue-600" size={20} />}
                        active={method === 'account'}
                        onClick={() => setMethod('account')}
                    />
                </div>
            </section>

            {/* Dynamic Card/UPI Input Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={method}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white p-7 rounded-[40px] luxury-shadow border border-slate-50"
                >
                    {method === 'wallet' && (
                        <div className="space-y-4 text-center py-4">
                            <div className="w-16 h-16 bg-green-50 rounded-full mx-auto flex items-center justify-center text-green-600">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800">Secure Internal Payment</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Funds will be locked in Escrow</p>
                            </div>
                        </div>
                    )}

                    {method === 'upi' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                <QrCode className="text-primary" size={24} />
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Connect VPA</p>
                                    <p className="text-xs font-bold text-slate-600">Enter your UPI ID to proceed</p>
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="example@oksbi"
                                className="w-full px-6 py-5 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                            />
                        </div>
                    )}

                    {method === 'card' && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Number</label>
                                <input
                                    type="text"
                                    placeholder="0000 0000 0000 0000"
                                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry</label>
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CVV</label>
                                    <input
                                        type="password"
                                        placeholder="•••"
                                        className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {method === 'netbanking' && (
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Bank</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['SBI', 'HDFC', 'ICICI', 'Axis'].map(bank => (
                                    <button key={bank} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 hover:border-primary/50 transition-all">
                                        {bank}
                                    </button>
                                ))}
                                <button className="col-span-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    View Other Banks
                                </button>
                            </div>
                        </div>
                    )}

                    {method === 'qrcode' && (
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                                <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                    <QrCode size={120} className="text-slate-300" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Scan with any UPI app</p>
                                <p className="text-xs font-bold text-slate-600 mt-2">UPI ID: jobnest@paytm</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
                                <CheckCircle2 className="text-green-600" size={24} />
                                <div>
                                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Instant Payment</p>
                                    <p className="text-xs font-bold text-slate-600">Payment will be verified automatically</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {method === 'account' && (
                        <div className="space-y-5">
                            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-3">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Bank Account Details</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Account Name</span>
                                        <span className="text-xs font-black text-slate-800">JobNest Pvt Ltd</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Account Number</span>
                                        <span className="text-xs font-black text-slate-800">1234567890123</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">IFSC Code</span>
                                        <span className="text-xs font-black text-slate-800">SBIN0001234</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Bank Name</span>
                                        <span className="text-xs font-black text-slate-800">State Bank of India</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Transaction Reference Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter UTR/Reference Number"
                                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                                <ShieldCheck className="text-amber-600" size={20} />
                                <p className="text-[9px] font-bold text-slate-600">Payment will be verified within 24 hours</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Action Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 lg:relative lg:bg-transparent lg:border-none lg:p-0">
                <button
                    disabled={isProcessing}
                    onClick={handlePayment}
                    className={cn(
                        "w-full py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl",
                        isProcessing ? "bg-slate-200 text-slate-400" : "bg-primary text-white shadow-primary/30"
                    )}
                >
                    {isProcessing ? (
                        <>Processing Payment <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /></>
                    ) : (
                        <>Pay {formatCurrency(total)} <ArrowRight size={16} /></>
                    )}
                </button>
            </div>
        </div>
    );
}

function PaymentOption({ title, subtitle, icon, active, onClick }: {
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    active: boolean,
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-5 rounded-[32px] border-2 transition-all flex items-center gap-4 text-left group",
                active ? "bg-white border-primary luxury-shadow scale-[1.02]" : "bg-white border-slate-100 hover:border-slate-200"
            )}
        >
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                active ? "bg-primary/10" : "bg-slate-50 group-hover:bg-indigo-50"
            )}>
                {icon}
            </div>
            <div className="flex-1">
                <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{title}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{subtitle}</p>
            </div>
            <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                active ? "border-primary bg-primary" : "border-slate-200"
            )}>
                {active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
        </button>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
