"use client";

import Link from "next/link";
import { MoveLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-figtree">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        {/* Branding & Visual Account */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
             <img src="/yeslogo.png" alt="YES Logo" className="h-6 w-auto opacity-30" />
             <div className="w-[1px] h-4 bg-slate-200" />
             <img src="/Genius.png" alt="Genius Logo" className="h-10 w-auto" />
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
            <div className="relative bg-white border border-slate-100 shadow-2xl shadow-blue-500/10 w-32 h-32 rounded-[40px] flex items-center justify-center">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">404</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white p-2 rounded-2xl shadow-lg border-4 border-white">
               <AlertCircle size={20} />
            </div>
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-3">
          <h1 className="text-2xl font-normal text-slate-900 tracking-tight">Page Not Found</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
            The resource you are looking for has been moved or does not exist.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4">
          <Link href="/" passHref>
            <Button className="h-12 px-8 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold uppercase tracking-widest text-[10px]">
              <MoveLeft size={16} className="mr-3" />
              Return to Safety
            </Button>
          </Link>
        </div>

        {/* Footer Subtle Branding */}
        <div className="pt-12 text-[10px] font-black text-slate-200 uppercase tracking-[0.3em]">
           Yes Genius Registration System
        </div>
      </div>
    </div>
  );
}
