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

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const { setUser } = useJobNest();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) {
                // FALLBACK: Mock Signup for Demo
                if (error.message.includes('fetch') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project-url') || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
                    setUser({
                        id: `demo-user-${Math.random()}`,
                        name: name,
                        role: 'jobseeker',
                        skills: [],
                        balance: 0,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                        rating: 5.0,
                        completedGigs: 0,
                        verified: false,
                        location: {
                            lat: 15.8281,
                            lng: 78.0373,
                            address: 'Kurnool'
                        }
                    });
                    toast.success('Account created! (Demo Mode)');
                    router.push('/');
                    return;
                }

                toast.error(error.message);
            } else {
                toast.success('Account created! Please check your email.');
                // Depending on Supabase settings, user might be logged in or need to confirm email.
                router.push('/');
            }
        } catch (err) {
            console.error(err);
            setUser({
                id: `demo-user-${Math.random()}`,
                name: name,
                role: 'jobseeker',
                skills: [],
                balance: 0,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                rating: 5.0,
                completedGigs: 0,
                verified: false,
                location: {
                    lat: 15.8281,
                    lng: 78.0373,
                    address: 'Kurnool'
                }
            });
            toast.success('Account created! (Demo Mode)');
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background">
            {/* Decorative Side */}
            <div className="hidden lg:flex flex-col justify-center items-end p-16 relative overflow-hidden bg-secondary/5 order-last">
                <div className="absolute inset-0 bg-gradient-to-bl from-secondary/10 via-transparent to-primary/10" />
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-lg text-right"
                >
                    <h1 className="text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-l from-secondary to-orange-500">
                        Join the Elite
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Begin your journey towards excellence. Craft your profile, shine bright, and succeed.
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
                        <h2 className="text-3xl font-bold">Create Account</h2>
                        <p className="text-muted-foreground mt-2">Start your new journey</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
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
                            Sign Up
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Sign In
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
