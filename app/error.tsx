'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 space-y-6 text-center">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900">Something went wrong!</h2>
                <p className="text-slate-500 font-medium">We apologize for the inconvenience.</p>
            </div>
            <button
                onClick={() => reset()}
                className="px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
            >
                Try again
            </button>
        </div>
    );
}
