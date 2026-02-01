'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SecurityPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
}

export default function SecurityPinModal({ isOpen, onClose, onSuccess, title = "Security Check" }: SecurityPinModalProps) {
    const [pin, setPin] = useState(['', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setPin(['', '', '', '']);
            setIsVerifying(false);
        }
    }, [isOpen]);

    const handleDigitInput = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        // Auto focus next input
        if (value && index < 3) {
            const nextInput = document.getElementById(`pin-${index + 1}`);
            nextInput?.focus();
        }

        // Auto verify if complete
        if (index === 3 && value && newPin.every(d => d !== '')) {
            verifyPin(newPin.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            const prevInput = document.getElementById(`pin-${index - 1}`);
            prevInput?.focus();
        }
    };

    const verifyPin = (enteredPin: string) => {
        setIsVerifying(true);
        // Simulate secure verification
        setTimeout(() => {
            if (enteredPin === '1234') { // Mock PIN for demo
                toast.success('Identity Verified', { icon: '🔐' });
                onSuccess();
            } else {
                toast.error('Incorrect PIN. Try 1234');
                setPin(['', '', '', '']);
                const firstInput = document.getElementById('pin-0');
                firstInput?.focus();
            }
            setIsVerifying(false);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl space-y-6 relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800">{title}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enter Payments PIN to proceed</p>
                    </div>

                    <div className="flex justify-center gap-3 py-4">
                        {pin.map((digit, idx) => (
                            <input
                                key={idx}
                                id={`pin-${idx}`}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleDigitInput(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                disabled={isVerifying}
                                className={cn(
                                    "w-12 h-16 rounded-xl border-2 text-center text-2xl font-black transition-all outline-none focus:scale-110",
                                    digit
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-slate-50 border-slate-100 focus:border-primary text-slate-800"
                                )}
                            />
                        ))}
                    </div>

                    <p className="text-[10px] text-center text-slate-400 font-bold">
                        {isVerifying ? "Verifying..." : "Secured by Bank-Grade Encryption"}
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
