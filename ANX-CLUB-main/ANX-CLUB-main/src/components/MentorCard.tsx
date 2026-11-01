"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from '@/components/ui/Card';
import { ArrowRight, Star } from "lucide-react";
import toast from 'react-hot-toast';

interface MentorCardProps {
  mentor: {
    id: string;
    name: string;
    role: string;
    company: string;
    imageUrl?: string;
    topics: string[];
    rating?: number;
    reviewsCount?: number;
  };
}

export default function MentorCard({ mentor }: MentorCardProps) {
  return (
    <Card className="flex flex-col h-full group">
      <div className="flex-1">
        <div className="flex gap-4 items-center mb-4">
          {mentor.imageUrl ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <Image src={mentor.imageUrl} alt={mentor.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-500 to-blue-500 flex justify-center items-center text-2xl font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              {mentor.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{mentor.name}</h3>
            <div className="text-sm text-slate-400 truncate">{mentor.role} at <span className="text-emerald-400">{mentor.company}</span></div>
          </div>
        </div>
        
        <div className="mt-4 mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Expertise</div>
          <div className="flex flex-wrap gap-2">
            {mentor.topics.slice(0, 3).map((topic: string) => (
              <span key={topic} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300">
                {topic}
              </span>
            ))}
            {mentor.topics.length > 3 && (
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-500">
                +{mentor.topics.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
          <Star size={14} className="fill-yellow-400" /> 
          {mentor.rating ? mentor.rating.toFixed(1) : "New"}
        </div>
        <Link href="#" onClick={(e) => { e.preventDefault(); toast.success('Mentor profile coming soon!'); }} className="text-sm font-medium text-white group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
          View Profile <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  );
}
