'use client';

import React, { useState } from 'react';
import {
    ChevronLeft,
    Zap,
    MapPin,
    IndianRupee,
    Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useJobNest } from '@/lib/context';
import toast from 'react-hot-toast';

export default function PostGigPage() {
    const router = useRouter();
    const { addJob } = useJobNest();
    const [formData, setFormData] = useState({
        title: '',
        category: 'Blue Collar',
        price: '',
        type: 'Hourly',
        description: '',
        location: 'Kurnool City, AP',
        tags: [] as string[]
    });

    const [currentTag, setCurrentTag] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.price) {
            toast.error('Please fill in required fields');
            return;
        }

        const newJob = {
            id: Math.random().toString(36).substr(2, 9),
            title: formData.title,
            employer: 'Sriram (You)',
            location: formData.location,
            coordinates: { lat: 15.8281, lng: 78.0373 },
            type: formData.type as 'Hourly' | 'Daily' | 'Weekly' | 'Contract',
            price: parseFloat(formData.price),
            tags: formData.tags.length > 0 ? formData.tags : ['Immediate'],
            status: 'Posted' as const,
            distance: 0,
            description: formData.description,
            category: formData.category as 'Blue Collar' | 'Professional' | 'Creative' | 'Technical',
            likes: 0,
            comments: 0,
            shares: 0,
            isLiked: false
        };

        addJob(newJob);
        toast.success('Gig posted successfully!');
        router.push('/');
    };

    const addTag = () => {
        if (currentTag && !formData.tags.includes(currentTag)) {
            setFormData({ ...formData, tags: [...formData.tags, currentTag] });
            setCurrentTag('');
        }
    };

    return (
        <div className="space-y-8 animate-slide-up pb-24">
            <header className="flex items-center gap-4 pt-4">
                <button
                    onClick={() => router.back()}
                    className="p-3 bg-white rounded-2xl luxury-shadow border border-slate-50 text-slate-400 hover:text-primary transition-all"
                >
                    <ChevronLeft size={22} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Post a Mission</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Global Marketplace</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title Section */}
                <div className="bg-white p-7 rounded-[40px] luxury-shadow border border-slate-50 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gig Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Urgent Electrical Repair"
                            className="w-full px-6 py-5 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all text-slate-800"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                            <select
                                className="w-full px-5 py-5 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-xs appearance-none"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option>Blue Collar</option>
                                <option>Technical</option>
                                <option>Creative</option>
                                <option>Professional</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Type</label>
                            <select
                                className="w-full px-5 py-5 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-xs appearance-none"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option>Hourly</option>
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Contract</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Price & Location */}
                <div className="bg-white p-7 rounded-[40px] luxury-shadow border border-slate-50 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price Offer</label>
                            <div className="relative">
                                <IndianRupee size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    required
                                    placeholder="500"
                                    className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                                <input
                                    type="text"
                                    placeholder="Kurnool City"
                                    className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags & Description */}
                <div className="bg-white p-7 rounded-[40px] luxury-shadow border border-slate-50 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Required Skills</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add skill..."
                                className="flex-1 px-6 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="p-4 bg-primary text-white rounded-2xl"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.map(tag => (
                                <span key={tag} className="px-4 py-2 bg-indigo-50 text-primary text-[10px] font-black uppercase rounded-xl flex items-center gap-2">
                                    {tag}
                                    <button type="button" onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}>×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                        <textarea
                            rows={4}
                            placeholder="Describe the mission details, expectations and any specific requirements..."
                            className="w-full px-6 py-5 bg-slate-50 border border-transparent focus:border-primary/20 rounded-3xl outline-none font-medium text-sm transition-all resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    Launch Gig <Zap size={18} className="text-secondary" />
                </button>
            </form>
        </div>
    );
}
