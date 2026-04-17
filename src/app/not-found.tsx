"use client";
import Link from "next/link";
import { MoveLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-figtree">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Branding */}
        <div className="flex items-center justify-center gap-3 opacity-55">
          <img src="/yeslogo.png" alt="YES Logo" className="h-5 w-auto" />
          <div className="w-[1px] h-3.5 bg-slate-200" />
          <img src="/Genius.png" alt="Genius Logo" className="h-9 w-auto" />
        </div>

        {/* 404 Visual */}
        <div className="relative h-52 flex items-center justify-center">
          <span className="absolute inset-0 flex items-center justify-center text-[210px] font-normal text-slate-100 leading-none select-none tracking-[-8px]">
            404
          </span>
        </div>

        {/* Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 text-[11px] px-3 py-1 rounded-full">
            <AlertCircle size={11} />
            Page not found
          </span>
        </div>
        {/* CTA */}
        <div className="pt-2">
          <Link href="/" passHref>
            <Button className="h-12 px-8 bg-[#1a1440] text-white hover:bg-[#2d2460] rounded-2xl font-normal uppercase tracking-[0.18em] text-[12px] transition-all active:scale-[0.97]">
              <MoveLeft size={15} className="mr-2" />
              Return to Safety
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-8 text-[10px] font-normal text-slate-200 uppercase tracking-[0.3em]">
          Yes Genius Registration System
        </div>

      </div>
    </div>
  );
}