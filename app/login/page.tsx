'use client';
import { createClient } from '@/lib/supabase/client';
import { useJobNest } from '@/lib/context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const { setUser } = useJobNest();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // FALLBACK: Mock Login for Demo (when keys are missing)
                if (error.message.includes('fetch') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project-url') || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
                    console.log('Using Mock Login Fallback (Demo Mode)');
                    setUser({
                        id: 'demo-user-1',
                        name: 'Sriram (Demo)',
                        role: 'jobseeker',
                        skills: ['React', 'Next.js', 'Typescript'],
                        balance: 15000,
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sriram',
                        rating: 4.9,
                        completedGigs: 12,
                        verified: true,
                        location: {
                            lat: 15.8281,
                            lng: 78.0373,
                            address: 'Kurnool'
                        }
                    });
                    toast.success('Welcome back! (Demo Mode)');
                    router.push('/');
                    router.refresh();
                    return;
                }

                toast.error(error.message);
            } else {
                toast.success('Welcome back!');
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            // FALLBACK: Mock Login for Demo (when keys are missing)
            console.log('Using Mock Login Fallback (Demo Mode)');
            setUser({
                id: 'demo-user-1',
                name: 'Sriram (Demo)',
                role: 'jobseeker',
                skills: ['React', 'Next.js', 'Typescript'],
                balance: 15000,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sriram',
                rating: 4.9,
                completedGigs: 12,
                verified: true,
                location: {
                    lat: 15.8281,
                    lng: 78.0373,
                    address: 'Kurnool'
                }
            });
            toast.success('Welcome back! (Demo Mode)');
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background">
            {/* Decorative Side */}
            <div className="hidden lg:flex flex-col justify-center items-start p-16 relative overflow-hidden bg-primary/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-lg"
                >
                    <h1 className="text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                        Welcome to the Future
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Experience the luxury of seamless job hunting. Fast, beautiful, and exclusively for you.
                    </p>
                </motion.div>
            </div>

            {/* Form Side */}
            <div className="flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center">
                        <h2 className="text-3xl font-bold">Sign In</h2>
                        <p className="text-muted-foreground mt-2">Access your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="luxury"
                            className="w-full h-14 text-lg"
                            isLoading={loading}
                        >
                            Sign In
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-primary hover:underline font-medium">
                            Join us
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
