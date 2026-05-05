"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, UserPlus, CreditCard, Download } from "lucide-react";
import Footer from "@/components/Footer";
import MathCanvas from "@/components/MathCanvas";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { generateBatchAccessPasses } from "@/lib/exportUtils";

function SuccessContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth(false);

  const id = searchParams.get("id");
  const type = searchParams.get("type");





  useGSAP(() => {
    // Ambient Orbs
    gsap.to(".bg-orb", {
      y: "random(-30, 30)", x: "random(-30, 30)",
      duration: "random(8, 12)", repeat: -1, yoyo: true,
      ease: "sine.inOut", stagger: { each: 2, from: "random" },
    });

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(".success-card",
      { opacity: 0, scale: 0.9, y: 40, filter: "blur(15px)" },
      { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 1.2, delay: 0.2 }
    )
      .fromTo(".success-content > *",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(".action-buttons button",
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, stagger: 0.1, duration: 0.6 },
        "-=0.4"
      );

    // Success icon bounce
    gsap.to(".success-icon", {
      y: -10,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }, { scope: containerRef });



  return (
    <main
      ref={containerRef}
      className="relative min-h-screen font-sans overflow-hidden bg-white flex flex-col items-center justify-center py-12 px-6"
    >
      <MathCanvas />

      {/* Super Premium Ambient Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-orb absolute top-1/4 left-1/4 w-[50%] h-[50%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="bg-orb absolute bottom-1/4 right-1/4 w-[40%] h-[40%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Success Card */}
        <div className="success-card w-full rounded-[3.5rem] p-[2px] relative mb-12 glass-shimmer">
          {/* Border glow */}
          <div className="absolute inset-0 rounded-[3.5rem] bg-gradient-to-br from-emerald-500/20 via-transparent to-indigo-500/20 opacity-60" />

          <div className="relative rounded-[3.4rem] p-10 md:p-16 flex flex-col items-center text-center overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(50px)",
              WebkitBackdropFilter: "blur(50px)",
              boxShadow: "0 30px 70px -10px rgba(0,0,0,0.08), inset 0 0 30px 0 rgba(255,255,255,0.4)",
            }}>
            {/* Inner border line */}
            <div className="absolute inset-px rounded-[3.35rem] border border-white opacity-70 pointer-events-none" />

            <div className="success-content flex flex-col items-center">
              <div className="success-icon w-24 h-24 rounded-[2rem] bg-emerald-50 flex items-center justify-center mb-10 shadow-xl shadow-emerald-500/10 border border-emerald-100">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 stroke-[2.5]" />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-100 bg-emerald-50/50 mb-8 overflow-hidden">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-600">
                  Registration Successful
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                You're all set for <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">YES GENIUS</span>
              </h1>

              <p className="max-w-md text-base md:text-lg font-medium leading-relaxed text-slate-500 mb-8">
                Your registration has been recorded successfully.
              </p>



              <div className="action-buttons flex flex-wrap justify-center gap-4 w-full mt-4">
                {user ? (
                  <>
                    <Button
                      onClick={() => router.push("/admin/dashboard")}
                      className="h-14 px-8 rounded-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                      <Home className="w-4 h-4" />
                      Dashboard
                    </Button>
                    <Button
                      onClick={() => router.push("/admin/dashboard/registration")}
                      variant="outline"
                      className="h-14 px-8 rounded-full border-2 border-slate-100 bg-white/50 hover:bg-white text-slate-900 font-extrabold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                      <UserPlus className="w-4 h-4 text-indigo-500" />
                      New Registration
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => router.push("/")}
                      className="h-14 px-8 rounded-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                      <Home className="w-4 h-4" />
                      Return Home
                    </Button>

                    <Button
                      onClick={() => router.push("/")}
                      variant="outline"
                      className="h-14 px-8 rounded-full border-2 border-slate-100 bg-white/50 hover:bg-white text-slate-900 font-extrabold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                      <UserPlus className="w-4 h-4 text-indigo-500" />
                      New Registration
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-black uppercase tracking-widest text-slate-300">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
