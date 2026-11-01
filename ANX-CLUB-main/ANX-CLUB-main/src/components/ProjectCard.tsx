"use client";

import Link from "next/link";
import { Card } from '@/components/ui/Card';
import { ArrowRight, Code } from "lucide-react";
import toast from 'react-hot-toast';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    status: string;
    images?: string[];
    techStack?: string[];
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="flex flex-col h-full group p-5">
      {project.images && project.images.length > 0 ? (
        <div 
          className="w-full h-40 rounded-2xl mb-4 bg-cover bg-center border border-white/5 shadow-lg relative overflow-hidden"
          style={{ backgroundImage: `url(${project.images[0]})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-40 rounded-2xl mb-4 bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-white/5 flex items-center justify-center relative overflow-hidden">
          <Code size={40} className="text-white/20" />
        </div>
      )}
      
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-3">
          <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">{project.name}</h3>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            project.status === "Launched" 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" 
              : "bg-blue-500/20 text-blue-400 border border-blue-500/20"
          }`}>
            {project.status}
          </span>
        </div>
        <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">{project.description}</p>
        
        <div className="mt-auto mb-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tech Stack</div>
          <div className="flex flex-wrap gap-2">
            {project.techStack?.slice(0, 4).map((tech: string) => (
              <span key={tech} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-slate-300">
                {tech}
              </span>
            ))}
            {project.techStack && project.techStack.length > 4 && (
              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-slate-500">
                +{project.techStack.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <Link href="#" onClick={(e) => { e.preventDefault(); toast.success('Project details coming soon!'); }} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400">
        View Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </Card>
  );
}
