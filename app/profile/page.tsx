'use client';

import React from 'react';
import { useJobNest } from '@/lib/context';
import {
    User,
    ShieldCheck,
    Star,
    Clock,
    Plus,
    ChevronRight,
    LogOut,
    Award,
    MapPin,
    Wallet
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const router = useRouter();
    const { user, setRole, t, language, setLanguage, updateUser, addProject, deleteProject } = useJobNest();
    const [isEditing, setIsEditing] = React.useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);
    const [editForm, setEditForm] = React.useState({
        name: '',
        address: ''
    });
    const [projectForm, setProjectForm] = React.useState({
        title: '',
        date: '',
        image: ''
    });

    React.useEffect(() => {
        if (user) {
            setEditForm({
                name: user.name,
                address: user.location.address
            });
        }
    }, [user]);

    const handleSave = () => {
        updateUser({
            name: editForm.name,
            location: user ? { ...user.location, address: editForm.address } : undefined
        });
        setIsEditing(false);
    };

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectForm.title || !projectForm.date) {
            toast.error('Please fill in all details');
            return;
        }

        const projectData = {
            title: projectForm.title,
            date: projectForm.date,
            imageUrl: projectForm.image || `https://picsum.photos/seed/${Math.random()}/400/300`
        };

        await addProject(projectData);
        toast.success('Project added to portfolio!');
        setIsProjectModalOpen(false);
        setProjectForm({ title: '', date: '', image: '' });
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Don't open project details if any
        if (confirm("Are you sure you want to delete this project?")) {
            await deleteProject(id);
            toast.success("Project removed successfully");
        }
    };

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-slate-100 rounded-full mb-4" />
                <div className="h-4 w-32 bg-slate-100 rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-24 animate-slide-up">
            <header className="pt-6 flex items-center justify-between">
                <h1 className="text-3xl font-black text-slate-800">{t('account_title')}</h1>
                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={cn(
                        "px-6 py-3 rounded-2xl luxury-shadow border text-xs font-black uppercase tracking-widest transition-all",
                        isEditing
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                            : "bg-white border-slate-50 text-slate-400 hover:text-primary"
                    )}
                >
                    {isEditing ? 'Save Changes' : t('edit_profile')}
                </button>
            </header>

            {/* LinkedIn-style Pro Showcase */}
            <section className="bg-white p-8 rounded-[48px] luxury-shadow border border-slate-50 relative overflow-hidden text-center space-y-6">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-indigo-500 to-primary opacity-10" />

                <div className="relative pt-4 inline-block">
                    <div className="w-32 h-32 rounded-[48px] bg-white p-1 luxury-shadow">
                        <div className="w-full h-full rounded-[44px] bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" /> : <User size={64} className="text-slate-300" />}
                        </div>
                    </div>
                    {user.verified && (
                        <div className="absolute -right-3 -bottom-1 bg-secondary text-black p-2 rounded-2xl shadow-xl border-4 border-white">
                            <ShieldCheck size={22} fill="currentColor" className="text-white" />
                        </div>
                    )}
                </div>

                <div className="space-y-2 max-w-sm mx-auto">
                    {isEditing ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('full_name')}</label>
                                <input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full text-center text-xl font-bold bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('location')}</label>
                                <input
                                    value={editForm.address}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full text-center text-xs font-bold bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-center gap-2">
                                <h2 className="text-2xl font-black text-slate-800">{user.name}</h2>
                                {user.verified && <Award size={20} className="text-primary" />}
                            </div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                                {t('job_title_default')}
                            </p>
                            <div className="flex items-center justify-center gap-1.5 text-slate-400 mt-1">
                                <MapPin size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">{user.location.address}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-center gap-8 pt-4">
                    <div className="text-center">
                        <p className="text-xl font-black text-slate-800">{user.rating}</p>
                        <div className="flex gap-0.5 text-secondary">
                            <Star size={10} fill="currentColor" />
                            <Star size={10} fill="currentColor" />
                            <Star size={10} fill="currentColor" />
                            <Star size={10} fill="currentColor" />
                            <Star size={10} fill="currentColor" />
                        </div>
                    </div>
                    <div className="w-px h-10 bg-slate-100" />
                    <div className="text-center">
                        <p className="text-xl font-black text-slate-800">{user.completedGigs}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{t('contracts')}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-100" />
                    <div className="text-center">
                        <p className="text-xl font-black text-slate-800">98%</p>
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{t('success_rate')}</p>
                    </div>
                </div>
            </section>

            {/* Luxury Wallet Card */}
            <section className="bg-slate-900 p-8 rounded-[48px] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-50" />
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/80">
                                <Award size={20} />
                            </div>
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{t('avail_balance')}</span>
                        </div>
                        <span className="text-[10px] font-black text-white px-3 py-1 bg-white/10 rounded-lg">INR</span>
                    </div>
                    <p className="text-5xl font-black text-white tracking-tighter">{formatCurrency(user.balance)}</p>
                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={() => router.push('/profile/payments')}
                            className="flex-1 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            {t('withdraw')}
                        </button>
                        <button
                            onClick={() => router.push('/profile/payments')}
                            className="flex-1 py-4 bg-white/10 text-white backdrop-blur-md border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                        >
                            {t('wallet_hub')}
                        </button>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
            </section>

            {/* Language Selection - High End */}
            <section className="space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h3 className="font-black text-xl text-slate-800">{t('interface_lang')}</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'en', label: 'English' },
                        { id: 'te', label: 'తెలుగు' },
                        { id: 'hi', label: 'हिन्दी' },
                    ].map((lang) => (
                        <button
                            key={lang.id}
                            onClick={() => setLanguage(lang.id as 'en' | 'te' | 'hi')}
                            className={cn(
                                "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border",
                                language === lang.id
                                    ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-105"
                                    : "bg-white text-slate-400 border-slate-100 hover:border-primary/20"
                            )}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Pro Skills - LinkedIn style */}
            <section className="space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-secondary rounded-full" />
                        <h3 className="font-black text-xl text-slate-800">{t('endorsed_skills')}</h3>
                    </div>
                    <button className="w-10 h-10 bg-slate-50 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                        <Plus size={20} />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {user.skills.map(skill => (
                        <div key={skill} className="px-5 py-2.5 bg-white luxury-shadow border border-slate-50 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            {skill}
                        </div>
                    ))}
                </div>
            </section>

            {/* Portfolio Section */}
            <section className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                            <h3 className="font-black text-xl text-slate-800">{t('portfolio_title')}</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-4.5">
                            {t('portfolio_desc')}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsProjectModalOpen(true)}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl"
                    >
                        <Plus size={14} /> {t('add_portfolio')}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {user.projects?.map((project) => (
                        <div key={project.id} className="aspect-video bg-slate-100 rounded-3xl relative group overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500">
                            <img
                                src={project.imageUrl}
                                alt={project.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Actions Overlay */}
                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                    className="p-2.5 bg-white/20 hover:bg-red-500 backdrop-blur-md rounded-xl text-white transition-all shadow-xl"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                                <h4 className="text-white font-black text-sm tracking-tight">{project.title}</h4>
                                <p className="text-white/60 text-[10px] uppercase font-black tracking-widest mt-0.5">{project.date}</p>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => setIsProjectModalOpen(true)}
                        className="aspect-video rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                            <Plus size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('add_portfolio')}</span>
                    </button>
                </div>
            </section>

            {/* Add Project Modal */}
            <AnimatePresence>
                {isProjectModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsProjectModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[40px] luxury-shadow overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-800">Add to Portfolio</h3>
                                    <button onClick={() => setIsProjectModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleAddProject} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Title</label>
                                        <input
                                            required
                                            value={projectForm.title}
                                            onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="e.g. Modern Villa Wiring"
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                            <input
                                                required
                                                type="text"
                                                value={projectForm.date}
                                                onChange={(e) => setProjectForm(prev => ({ ...prev, date: e.target.value }))}
                                                placeholder="e.g. June 2025"
                                                className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Image (URL)</label>
                                            <div className="relative">
                                                <input
                                                    value={projectForm.image}
                                                    onChange={(e) => setProjectForm(prev => ({ ...prev, image: e.target.value }))}
                                                    placeholder="Optional"
                                                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                                                />
                                                <Camera size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4"
                                    >
                                        Post to Portfolio
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Profile Action Links */}
            <section className="grid md:grid-cols-2 gap-4">
                <button
                    onClick={() => router.push('/profile/payments')}
                    className="bg-white p-6 rounded-[32px] luxury-shadow border border-slate-50 flex items-center gap-5 hover:border-primary/20 transition-all group"
                >
                    <div className="w-14 h-14 bg-blue-50/50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <Wallet size={24} />
                    </div>
                    <div className="text-left flex-1">
                        <h4 className="font-black text-base text-slate-800">{t('payments_wallet')}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('payments_desc')}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                    onClick={() => router.push('/profile/analytics')}
                    className="bg-white p-6 rounded-[32px] luxury-shadow border border-slate-50 flex items-center gap-5 hover:border-primary/20 transition-all group"
                >
                    <div className="w-14 h-14 bg-green-50/50 rounded-2xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                        <Award size={24} />
                    </div>
                    <div className="text-left flex-1">
                        <h4 className="font-black text-base text-slate-800">{t('financial_analytics')}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('analytics_desc')}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                    onClick={() => router.push('/profile/transactions')}
                    className="bg-white p-6 rounded-[32px] luxury-shadow border border-slate-50 flex items-center gap-5 hover:border-primary/20 transition-all group"
                >
                    <div className="w-14 h-14 bg-indigo-50/50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                    </div>
                    <div className="text-left flex-1">
                        <h4 className="font-black text-base text-slate-800">{t('trans_history')}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('history_desc')}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                    onClick={() => router.push('/profile/verification')}
                    className="bg-white p-6 rounded-[32px] luxury-shadow border border-slate-50 flex items-center gap-5 hover:border-primary/20 transition-all group"
                >
                    <div className="w-14 h-14 bg-amber-50/50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24} />
                    </div>
                    <div className="text-left flex-1">
                        <h4 className="font-black text-base text-slate-800">{t('verification_hub')}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('verification_desc')}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
            </section>

            <button
                onClick={() => setRole(null)}
                className="w-full py-5 rounded-[32px] border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
            >
                <LogOut size={16} /> {t('logout')}
            </button>
        </div>
    );
}
