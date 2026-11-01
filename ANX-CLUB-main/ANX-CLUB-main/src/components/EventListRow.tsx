"use client";

import { useState } from "react";
import RegisterModal from "./RegisterModal";
import { Event } from "@/types";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, CheckCircle2 } from "lucide-react";

interface EventListRowProps {
  event: Event;
  index: number;
  userRegisteredIds?: string[];
  onRegistered?: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isPastDeadline(deadline?: string | null) {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

export default function EventListRow({ event, index, userRegisteredIds = [], onRegistered }: EventListRowProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const isRegistered = userRegisteredIds.includes(event.id);
  const closed = isPastDeadline(event.registrationDeadline);
  const noSeats = event.seatsAvailable !== null && event.seatsAvailable !== undefined && (event.seatsBooked ?? 0) >= event.seatsAvailable;
  const canRegister = !isRegistered && !closed && !noSeats;

  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
        <td className="p-4 text-sm text-slate-500 font-medium">{index}</td>
        <td className="p-4">
          <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors cursor-pointer" onClick={() => router.push(`/events/${event.id}`)}>
            {event.title}
          </div>
        </td>
        <td className="p-4 text-sm text-slate-400 hidden md:table-cell max-w-xs truncate">
          {event.description}
        </td>
        <td className="p-4 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-emerald-400" />
            {formatDate(event.date)}
          </div>
        </td>
        <td className="p-4">
          <button
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              isRegistered 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-default" 
                : canRegister 
                  ? "bg-white/10 hover:bg-white/20 text-white border border-white/10" 
                  : "bg-slate-500/20 text-slate-400 border border-slate-500/20 cursor-not-allowed"
            }`}
            onClick={() => canRegister && setShowModal(true)}
            disabled={!canRegister}
          >
            {isRegistered ? <><CheckCircle2 size={12} /> Registered</> : canRegister ? "Register" : "Closed"}
          </button>
        </td>
        <td className="p-4 text-right">
          <button 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-emerald-500 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-white/10 hover:border-emerald-400" 
            title="View Details" 
            onClick={() => router.push(`/events/${event.id}`)}
          >
            <ArrowRight size={14} />
          </button>
        </td>
      </tr>

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
