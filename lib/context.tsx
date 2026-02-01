'use client';

import React, { createContext, useContext, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Language, translations, TranslationKey } from './translations';
import { toast } from 'react-hot-toast';


export type Role = 'jobseeker' | 'employer' | null;

export interface Project {
    id: string;
    title: string;
    date: string;
    imageUrl: string;
}

export interface User {
    id: string;
    name: string;
    role: Role;
    skills: string[];
    balance: number;
    avatar?: string;
    rating: number;
    completedGigs: number;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    verified: boolean;
    projects?: Project[];
}

export interface Job {
    id: string;
    title: string;
    employer: string;
    location: string;
    coordinates: { lat: number; lng: number };
    type: 'Hourly' | 'Daily' | 'Weekly' | 'Contract';
    price: number;
    tags: string[];
    status: 'Posted' | 'Accepted' | 'In Progress' | 'Completed';
    distance: number; // in km
    description: string;
    category: 'Blue Collar' | 'Professional' | 'Creative' | 'Technical';
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
}

export interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: 'credit' | 'debit';
    status: 'completed' | 'pending' | 'failed';
    date: string;
    method: string;
}

export interface JobNestContextType {
    user: User | null;
    jobs: Job[];
    transactions: Transaction[];
    language: Language;
    t: (key: TranslationKey) => string;
    setUser: (user: User | null) => void;
    setRole: (role: Role) => void;
    setLanguage: (lang: Language) => void;
    addJob: (job: Job) => void;
    updateJobStatus: (id: string, status: Job['status']) => void;
    refreshLocation: () => void;
    updateBalance: (amount: number) => void;
    addTransaction: (tx: Transaction) => void;
    toggleLike: (id: string) => void;
    updateUser: (data: Partial<User>) => void;
    addProject: (project: Omit<Project, 'id'>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: 'tx-1',
        title: 'Electrical Maintenance Payment',
        amount: 1250.00,
        type: 'credit',
        status: 'completed',
        date: '2026-01-28',
        method: 'UPI'
    },
    {
        id: 'tx-2',
        title: 'Platform Subscription',
        amount: -350.00,
        type: 'debit',
        status: 'completed',
        date: '2026-01-27',
        method: 'Wallet'
    },
    {
        id: 'tx-3',
        title: 'UI/UX Design Project',
        amount: 12500.00,
        type: 'credit',
        status: 'completed',
        date: '2026-01-25',
        method: 'Net Banking'
    },
    {
        id: 'tx-4',
        title: 'Delivery Service Payment',
        amount: 600.00,
        type: 'credit',
        status: 'completed',
        date: '2026-01-24',
        method: 'UPI'
    },
    {
        id: 'tx-5',
        title: 'Equipment Purchase',
        amount: -2500.00,
        type: 'debit',
        status: 'completed',
        date: '2026-01-22',
        method: 'Card'
    },
    {
        id: 'tx-6',
        title: 'Cooking Service - Festival',
        amount: 800.00,
        type: 'credit',
        status: 'completed',
        date: '2026-01-20',
        method: 'UPI'
    },
    {
        id: 'tx-7',
        title: 'React Native Bug Fixes',
        amount: 1500.00,
        type: 'credit',
        status: 'completed',
        date: '2026-01-18',
        method: 'Account Transfer'
    },
    {
        id: 'tx-8',
        title: 'Training Course Fee',
        amount: -1200.00,
        type: 'debit',
        status: 'completed',
        date: '2026-01-15',
        method: 'Wallet'
    },
    {
        id: 'tx-9',
        title: 'Plumbing Work Payment',
        amount: 950.00,
        type: 'credit',
        status: 'completed',
        date: '2026-01-12',
        method: 'QR Code'
    },
    {
        id: 'tx-10',
        title: 'Marketing Services',
        amount: 3500.00,
        type: 'credit',
        status: 'completed',
        date: '2026-01-10',
        method: 'UPI'
    }
];

const MOCK_PROJECTS: Project[] = [
    {
        id: 'p-1',
        title: 'Commercial Wiring Project',
        date: 'December 2025',
        imageUrl: 'https://picsum.photos/seed/wiring/400/300'
    },
    {
        id: 'p-2',
        title: 'Network Infrastructure Build',
        date: 'October 2025',
        imageUrl: 'https://picsum.photos/seed/network/400/300'
    }
];

const MOCK_JOBS: Job[] = [
    {
        id: '1',
        title: 'Electrical Maintenance - Apartment',
        employer: 'Skyline Residencies',
        location: 'Kurnool City, AP',
        coordinates: { lat: 15.8281, lng: 78.0373 },
        type: 'Hourly',
        price: 250,
        tags: ['Electrician', 'On-site', 'Immediate'],
        status: 'Posted',
        distance: 1.2,
        description: 'Need help fixing central wiring issues. Equipment provided.',
        category: 'Blue Collar',
        likes: 24,
        comments: 5,
        shares: 2,
        isLiked: false
    },
    {
        id: '2',
        title: 'UI/UX Design for Local SaaS',
        employer: 'Elite Tech',
        location: 'Warangal, TS',
        coordinates: { lat: 17.9689, lng: 79.5941 },
        type: 'Contract',
        price: 12500,
        tags: ['Figma', 'Remote', '2 Weeks'],
        status: 'Posted',
        distance: 4.5,
        description: 'Redesigning landing page for a tier-2 city fintech product.',
        category: 'Creative',
        likes: 156,
        comments: 32,
        shares: 15,
        isLiked: true
    },
    {
        id: '3',
        title: 'Home Chef for Festival Catering',
        employer: 'Family Kitchen',
        location: 'Tier 2 Town, UP',
        coordinates: { lat: 15.8200, lng: 78.0300 },
        type: 'Daily',
        price: 800,
        tags: ['Cooking', 'Traditional', 'One Day'],
        status: 'Posted',
        distance: 0.5,
        description: 'Need extra hands for Pongal festival catering orders.',
        category: 'Blue Collar',
        likes: 45,
        comments: 8,
        shares: 12,
        isLiked: false
    },
    {
        id: '4',
        title: 'Delivery Partner - Local Logistics',
        employer: 'SwiftHub',
        location: 'Kurnool Main',
        coordinates: { lat: 15.8350, lng: 78.0450 },
        type: 'Daily',
        price: 600,
        tags: ['Biking', 'Delivery', 'Flexible'],
        status: 'Posted',
        distance: 2.8,
        description: 'Looking for reliable delivery partners for last-mile delivery.',
        category: 'Blue Collar',
        likes: 12,
        comments: 2,
        shares: 0,
        isLiked: false
    },
    {
        id: '5',
        title: 'React Native Expert - Bug Fixes',
        employer: 'StartupX',
        location: 'Hyderabad/Remote',
        coordinates: { lat: 15.8400, lng: 78.0500 },
        type: 'Hourly',
        price: 1500,
        tags: ['React Native', 'Urgent', 'iOS/Android'],
        status: 'Posted',
        distance: 9.8,
        description: 'Deep-dive session to fix push notification synchronization issues.',
        category: 'Technical',
        likes: 89,
        comments: 14,
        shares: 6,
        isLiked: true
    }
];

const JobNestContext = createContext<JobNestContextType | undefined>(undefined);

export function JobNestProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
    const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
    const [language, setLanguage] = useState<Language>('en');

    const supabase = createClient();

    // Sync with Supabase Auth
    React.useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // In a real app, fetch from 'profiles' table here
                setUser({
                    id: session.user.id,
                    name: session.user.user_metadata.full_name || 'User',
                    role: (session.user.user_metadata.role as Role) || 'jobseeker',
                    skills: ['React', 'TypeScript'], // Default/Mock
                    balance: 0,
                    avatar: session.user.user_metadata.avatar_url,
                    rating: 5.0,
                    completedGigs: 0,
                    verified: false,
                    location: {
                        lat: 15.8281,
                        lng: 78.0373,
                        address: 'Kurnool'
                    },
                    projects: MOCK_PROJECTS
                });
            }
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    name: session.user.user_metadata.full_name || 'User',
                    role: (session.user.user_metadata.role as Role) || 'jobseeker',
                    skills: ['React', 'TypeScript'],
                    balance: 0,
                    avatar: session.user.user_metadata.avatar_url,
                    rating: 5.0,
                    completedGigs: 0,
                    verified: false,
                    location: {
                        lat: 15.8281,
                        lng: 78.0373,
                        address: 'Kurnool'
                    },
                    projects: MOCK_PROJECTS
                });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch projects from DB when user changes
    React.useEffect(() => {
        const fetchProjects = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) {
                    setUser(prev => prev ? { ...prev, projects: data } : null);
                }
            } catch (error) {
                console.error("Database status: 'projects' table might not exist yet. Using local state.");
                // Ensure initial projects are there for demo
                if (user && (!user.projects || user.projects.length === 0)) {
                    setUser(prev => prev ? { ...prev, projects: MOCK_PROJECTS } : null);
                }
            }
        };

        fetchProjects();
    }, [user?.id, supabase]);

    const t = (key: TranslationKey) => {
        return translations[language][key] || translations.en[key];
    };

    const updateBalance = (amount: number) => {
        if (!user) return;
        setUser(prev => prev ? { ...prev, balance: prev.balance + amount } : null);
    };

    const addTransaction = (tx: Transaction) => {
        setTransactions(prev => [tx, ...prev]);
    };

    const innerSetRole = (role: Role) => {
        if (role) {
            setUser({
                id: 'user-1',
                name: 'Sriram',
                role,
                skills: ['React', 'TypeScript', 'Node.js', 'Maintenance'],
                balance: 28450.50,
                rating: 4.8,
                completedGigs: 32,
                verified: true,
                location: {
                    lat: 15.8281,
                    lng: 78.0373,
                    address: 'Park Avenue, Kurnool'
                },
                projects: MOCK_PROJECTS
            });
        } else {
            setUser(null);
        }
    };

    const setRole = (role: Role) => {
        if (role) {
            localStorage.setItem('jobnest_role', role);
        } else {
            localStorage.removeItem('jobnest_role');
        }
        innerSetRole(role);
    };

    const addJob = (job: Job) => {
        setJobs(prev => [job, ...prev]);
    };

    const updateJobStatus = (id: string, status: Job['status']) => {
        setJobs(prev => prev.map(job => job.id === id ? { ...job, status } : job));
    };

    const refreshLocation = () => {
        // Mocking location refresh
        toast.success("Scanning for local missions...");
        console.log("Refreshing location and scanning for gigs in 10km radius...");
    };

    const toggleLike = (id: string) => {
        setJobs(prev => prev.map(job => {
            if (job.id === id) {
                return {
                    ...job,
                    isLiked: !job.isLiked,
                    likes: job.isLiked ? job.likes - 1 : job.likes + 1
                };
            }
            return job;
        }));
    };

    const updateUser = (data: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...data } : null);
    };

    const addProject = async (projectData: Omit<Project, 'id'>) => {
        if (!user?.id) {
            toast.error("You must be logged in to add projects");
            return;
        }

        const { data, error } = await supabase
            .from('projects')
            .insert([{ ...projectData, user_id: user.id }])
            .select()
            .single();

        if (error) {
            console.error("Error adding project:", error);
            // Fallback for demo/dev if table doesn't exist yet
            const mockProj = { ...projectData, id: Math.random().toString(36).substr(2, 9) };
            setUser(prev => prev ? { ...prev, projects: [mockProj, ...(prev.projects || [])] } : null);
            return;
        }

        if (data) {
            setUser(prev => prev ? {
                ...prev,
                projects: [data, ...(prev.projects || [])]
            } : null);
        }
    };

    const deleteProject = async (projectId: string) => {
        if (!user?.id) return;

        // Optimistic update
        const previousProjects = user.projects || [];
        setUser(prev => prev ? {
            ...prev,
            projects: (prev.projects || []).filter(p => p.id !== projectId)
        } : null);

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('user_id', user.id);

        if (error) {
            console.error("Error deleting project:", error);
            toast.error("Failed to delete project from database");
            // Rollback optimistic update
            setUser(prev => prev ? { ...prev, projects: previousProjects } : null);
        }
    };

    return (
        <JobNestContext.Provider value={{
            user,
            jobs,
            transactions,
            language,
            t,
            setUser,
            setRole,
            setLanguage,
            addJob,
            updateJobStatus,
            refreshLocation,
            updateBalance,
            addTransaction,
            toggleLike,
            updateUser,
            addProject,
            deleteProject
        }}>
            {children}
        </JobNestContext.Provider>
    );
}

export function useJobNest() {
    const context = useContext(JobNestContext);
    if (context === undefined) {
        throw new Error('useJobNest must be used within a JobNestProvider');
    }
    return context;
}
