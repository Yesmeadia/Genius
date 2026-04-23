"use client";

import YesianRegistrationForm from "@/components/YesianRegistrationForm";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import MathCanvas from "@/components/MathCanvas";
import { useFormSettings, isFormActive, useAutoRefresh } from "@/hooks/useFormSettings";
import ClosingPopup from "@/components/ClosingPopup";

export default function YesianRegistrationPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { forms, loading: settingsLoading } = useFormSettings();
  const formSettings = forms.find(f => f.id === "yesian");
  const isEnabled = isFormActive(formSettings);
  useAutoRefresh(formSettings);

  useGSAP(() => {
    if (settingsLoading) return;

    // Ambient Orbs
    const orbs = gsap.utils.toArray(".bg-orb");
    if (orbs.length > 0) {
      gsap.to(orbs, {
        y: "random(-30, 30)", x: "random(-30, 30)",
        duration: "random(8, 12)", repeat: -1, yoyo: true,
        ease: "sine.inOut", stagger: { each: 2, from: "random" },
      });
    }

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    const headerItems = gsap.utils.toArray(".page-header > *");
    if (headerItems.length > 0) {
      tl.fromTo(headerItems,
        { opacity: 0, y: 30, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.15, duration: 1.2, delay: 0.2 }
      );
    }

    if (isEnabled) {
      const formContainer = gsap.utils.toArray(".form-container");
      if (formContainer.length > 0) {
        tl.fromTo(formContainer,
          { opacity: 0, scale: 0.96, y: 40 },
          { opacity: 1, scale: 1, y: 0, duration: 1, ease: "back.out(1.2)" },
          "-=0.6"
        );
      }
    }
  }, { scope: containerRef, dependencies: [settingsLoading, isEnabled] });

  return (
    <main
      ref={containerRef}
      className="relative min-h-screen font-sans overflow-hidden bg-white"
    >
      <MathCanvas />

      {/* Super Premium Ambient Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-orb absolute top-[-5%] right-[10%] w-[50%] h-[50%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(217,119,6,0.12) 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="bg-orb absolute bottom-0 left-[-5%] w-[40%] h-[40%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10 container mx-auto py-12 md:py-20 px-6 max-w-7xl">


        <header className="page-header flex flex-col items-center text-center mb-4 px-4">
          <div className="flex flex-col items-center gap-8 mb-10">
            <img src="/yeslogo.png" alt="YES INDIA" className="h-6 opacity-30 grayscale" />
            <img src="/Genius.png" alt="Genius Jam" className="h-20 md:h-28 object-contain" />
          </div>

          <h1 className="text-xs font-black tracking-[0.25em] text-slate-400 uppercase mt-2 mb-2">
            Official Registration Portal
          </h1>
        </header>

        {settingsLoading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !isEnabled ? (
          <div className="flex flex-col items-center gap-6 py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Registration Closed</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">This registration portal is closed. Please Visit again later!</p>
            </div>
          </div>
        ) : (
          <div className="form-container max-w-3xl mx-auto">
            <ClosingPopup formId="yesian" />
            <YesianRegistrationForm />
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] group py-2 px-6 rounded-full border border-slate-100 bg-white/50 backdrop-blur-md shadow-sm transition-all hover:gap-4 hover:bg-white hover:border-slate-200"
            style={{ color: "#d97706" }}
          >
            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <Footer />
      </div>
    </main>
  );
}
