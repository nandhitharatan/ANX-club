"use client";

import Image from "next/image";
import { useState } from "react";
import RegisterModal from "./RegisterModal";
import { Event } from "@/types";
import { Card } from '@/components/ui/Card';
import { MapPin, Clock } from "lucide-react";
import Link from "next/link";

interface EventCardProps {
  event: Event;
  userRegisteredIds?: string[];
  onRegistered?: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleString("en-IN", { month: "short" }).toUpperCase(),
    year: d.getFullYear(),
    full: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function isPastDeadline(registrationDeadline?: string | null) {
  if (!registrationDeadline) return false;
  return new Date() > new Date(registrationDeadline);
}

function EventCard({ event, userRegisteredIds = [], onRegistered }: EventCardProps) {
  const [showModal, setShowModal] = useState(false);
  const { day, month, time } = formatDate(event.date);
  const isRegistered = userRegisteredIds.includes(event.id);
  const closed = isPastDeadline(event.registrationDeadline);
  const noSeats = event.seatsAvailable !== null && event.seatsAvailable !== undefined && (event.seatsBooked ?? 0) >= event.seatsAvailable;

  const isFree = event.eventType === "free" || event.price === 0;
  const isPremiumOnly = event.eventType === "member-only";

  return (
    <>
      <Card 
        className="flex flex-col h-full group p-0 overflow-hidden"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
      >
        {/* Poster */}
        <Link href={`/events/${event.id}`} className="block relative w-full h-48 bg-gradient-to-br from-indigo-900 to-slate-900 overflow-hidden">
          {event.posterUrl ? (
            <Image
              src={event.posterUrl}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-white/10 uppercase">{event.title.charAt(0)}</span>
            </div>
          )}

          {/* Date badge */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white rounded-xl px-3 py-2 flex flex-col items-center border border-white/10 shadow-lg">
            <span className="text-xl font-bold leading-none">{String(day).padStart(2, "0")}</span>
            <span className="text-xs font-semibold text-emerald-400 mt-1">{month}</span>
          </div>

          {/* Free / Paid badge */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-lg ${
            isFree ? "bg-emerald-500/80 text-white border-emerald-500/50" : 
            isPremiumOnly ? "bg-violet-500/80 text-white border-violet-500/50" : 
            "bg-amber-500/80 text-white border-amber-500/50"
          }`}>
            {isFree ? "Free" : isPremiumOnly ? "Members" : "Paid"}
          </div>
        </Link>

        {/* Body */}
        <div className="p-5 flex flex-col flex-1">
          <Link href={`/events/${event.id}`}>
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">{event.title}</h3>
          </Link>
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">{event.description}</p>

          {/* Meta */}
          <div className="flex flex-col gap-2 mt-auto mb-5">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Clock size={16} className="text-slate-500" />
              <span>{time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={16} className="text-slate-500" />
              <span className="truncate">{event.venue || event.location || "Online"}</span>
            </div>
          </div>

          {/* CTA */}
          <button
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              isRegistered 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-default"
                : closed || noSeats
                ? "bg-slate-500/20 text-slate-400 border border-slate-500/20 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
            }`}
            onClick={() => !isRegistered && !closed && !noSeats && setShowModal(true)}
            disabled={isRegistered || closed || noSeats}
          >
            {isRegistered
              ? "✓ Registered"
              : closed || noSeats
              ? "Registrations Closed"
              : event.price > 0
              ? `Register — ₹${event.price}`
              : "Register Now"}
          </button>
        </div>
      </Card>

      {showModal && (
        <RegisterModal
          event={event}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            onRegistered?.();
          }}
        />
      )}
    </>
  );
}

import React from 'react';
export default React.memo(EventCard, (prevProps, nextProps) => {
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.userRegisteredIds?.length === nextProps.userRegisteredIds?.length &&
    (prevProps.userRegisteredIds?.every(id => nextProps.userRegisteredIds?.includes(id)) ?? true)
  );
});
