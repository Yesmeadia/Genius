"use client";

import RegistrationForm from "@/components/RegistrationForm";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 1 } });

    tl.from(".header-content > *", {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      delay: 0.3
    })
      .from(".form-container", {
        opacity: 0,
        y: 20,
        duration: 1
      }, "-=0.5");
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="min-h-screen bg-white font-sans">
      <div className="container mx-auto py-12 md:py-20 px-4">

        <header className="header-content flex flex-col items-center text-center mb-12">
          <div className="flex flex-col items-center gap-6">
            <img src="/yeslogo.png" alt="YES INDIA Logo" className="h-6 md:h-8 w-auto object-contain opacity-50" />
            <img src="/Genius.png" alt="Genius Jam Logo" className="h-16 md:h-24 w-auto object-contain" />
          </div>

          <div className="text-[10px] md:text-xs font-black tracking-[0.3em] text-gray-300 uppercase mt-8 mb-4">
            Official Registration Portal
          </div>

          <p className="max-w-xl text-base md:text-lg text-slate-500 font-medium leading-relaxed">
            Join the 2026 talent series. Please fill out the details below
            accurately to secure your participation.
          </p>
        </header>

        {/* Form Container */}
        <div className="form-container">
          <RegistrationForm />
        </div>

        {/* Compact Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-100 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <p>© 2026 YES INDIA FOUNDATION | All Rights Reserved</p>
            <div className="flex gap-8">
              <span className="cursor-pointer hover:text-slate-600 transition-colors">Designed & Developed by Cyberduce</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
