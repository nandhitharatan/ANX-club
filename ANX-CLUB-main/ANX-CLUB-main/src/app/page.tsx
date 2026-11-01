'use client';

import React from 'react';
import { motion, useTransform, useMotionValue } from 'framer-motion';
import { ChevronRight, Sparkles, Shield, Zap, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/modules/module3/components/AuthContext';

const HeroSection = () => {
  const { user } = useAuth();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 md:pt-25 text-center overflow-hidden group bg-[#070814]"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 max-w-5xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex flex-col items-center gap-4 mb-12"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-6">
              <img src="/logo.jpeg" alt="A.N.X" className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-2xl shadow-[0_0_30px_rgba(139,44,245,0.4)]" />
              <div className="text-2xl md:text-3xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400 drop-shadow-[0_0_30px_rgba(139,44,245,0.3)]">
                Alliance for NextGen Excellence
              </div>
            </div>
            <div className="text-[10px] md:text-[25px] font-black tracking-[0.3em] text-slate-500 uppercase opacity-70">
              The Builder's Ecosystem
            </div>
          </div>
        </motion.div>

        <h1 className="text-6xl sm:text-7xl md:text-[8rem] font-black tracking-tight mb-8 leading-[0.9] text-white select-none">
          Where Students <br />
          Become <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400 drop-shadow-[0_0_30px_rgba(139,44,245,0.3)]">Builders.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300/70 max-w-[700px] mx-auto mb-14 leading-relaxed font-medium">
          A real industry simulation ecosystem designed to transform students into 
          developers, founders, leaders, and innovators.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(139, 44, 245, 0.9)' }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-[#8b2cf5] text-white rounded-full font-bold text-[15px] tracking-wide shadow-[0_0_40px_rgba(139,44,245,0.4)] transition-all flex items-center gap-3"
            >
              Join as a Member
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </Link>
          
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-transparent border border-white/10 text-cyan-400 hover:text-cyan-300 rounded-full font-bold text-[15px] tracking-wide transition-all backdrop-blur-sm"
            >
              Sign In
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Interactive Flashlight Effect */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(circle 400px at ${x}px ${y}px, rgba(0, 229, 255, 0.05), transparent 80%)`
          )
        }}
      />
    </section>
  );
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070814] text-white">
      <HeroSection />
    </main>
  );
}
