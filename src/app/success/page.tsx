"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, UserPlus } from "lucide-react";

export default function SuccessPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".success-header > *", {
      opacity: 0,
      y: -20,
      stagger: 0.1,
      duration: 0.8
    })
    .from(".checkmark-container", {
      scale: 0,
      opacity: 0,
      rotate: -45,
      duration: 1,
      ease: "back.out(1.7)"
    }, "-=0.4")
    .from(".success-content > *", {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 0.8
    }, "-=0.6")
    .from(".action-buttons > *", {
      opacity: 0,
      y: 10,
      stagger: 0.1,
      duration: 0.6
    }, "-=0.4");
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="min-h-screen bg-white font-figtree font-normal flex flex-col">
      <div className="container mx-auto py-12 px-4 flex-grow flex flex-col items-center">
        
        <header className="success-header flex flex-col items-center text-center mb-16">
          <div className="flex flex-col items-center gap-6 mb-8">
            <img src="/yeslogo.png" alt="YES INDIA Logo" className="h-6 md:h-8 w-auto object-contain opacity-50" />
            <img src="/Genius.png" alt="Genius Jam Logo" className="h-16 md:h-24 w-auto object-contain" />
          </div>
          <div className="text-[10px] md:text-xs font-normal tracking-[0.3em] text-gray-300 uppercase mt-4">
            Official Confirmation
          </div>
        </header>

        {/* Success Visual */}
        <div className="flex-grow flex flex-col items-center justify-center -mt-12">
          <div className="checkmark-container mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-50 rounded-full scale-150 blur-2xl opacity-50 animate-pulse" />
              <CheckCircle2 className="w-24 h-24 md:w-32 md:h-32 text-emerald-500 relative" strokeWidth={1.5} />
            </div>
          </div>

          <div className="success-content text-center max-w-lg">
            <h1 className="text-4xl md:text-6xl font-normal text-slate-900 tracking-tight mb-6">
              Registration Completed
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-normal leading-relaxed mb-12">
              The student's details have been successfully recorded. 
              We look forward to seeing the talent showcase!
            </p>

            <div className="action-buttons flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push("/")}
                className="h-12 px-8 font-normal text-base shadow-lg shadow-primary/10"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Register Another Student
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/")}
                className="h-12 px-8 font-normal text-base border-slate-100 text-slate-400 hover:text-slate-900"
              >
                <Home className="mr-2 h-5 w-5" />
                Go to Home
              </Button>
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <footer className="mt-20 pt-10 border-t border-slate-50 w-full text-center">
          <p className="text-slate-400 text-[10px] font-normal uppercase tracking-widest italic">
            Official YES India Document • 2026 Series
          </p>
        </footer>
      </div>
    </main>
  );
}
