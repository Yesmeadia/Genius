"use client";

import { CheckCircle2, User } from "lucide-react";
import { AttendanceRecord } from "../page";

interface WelcomeOverlayProps {
  record: AttendanceRecord;
}

export default function WelcomeOverlay({ record }: WelcomeOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="welcome-card w-full max-w-lg bg-white rounded-3xl p-1 shadow-[0_64px_128px_-32px_rgba(239,68,68,0.3)] relative overflow-hidden text-center">
        {/* Neural Scanner Pattern Backdrop */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ef4444 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="relative bg-white rounded-[1.4rem] p-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-6 py-2 bg-red-600 rounded-b-2xl shadow-lg shadow-red-500/20">
            <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Verified</span>
          </div>

          <div className="relative mb-10 mt-4 flex justify-center">
            <div className="relative">
              <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-2xl relative z-10">
                {record.photoUrl ? (
                  <img src={record.photoUrl} alt={record.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-slate-50 flex items-center justify-center text-slate-200">
                    <User size={80} strokeWidth={1} />
                  </div>
                )}
              </div>
              {/* Glowing Ring */}
              <div className="absolute -inset-4 border border-red-500/20 rounded-3xl animate-pulse" />
              
              <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white p-3.5 rounded-xl shadow-xl shadow-emerald-500/20 z-20 border-4 border-white transform rotate-3">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.6em]">Identification Confirmed</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {record.name}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="px-4 py-1.5 rounded-lg bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-[0.3em] border border-red-100">
                {record.type}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
