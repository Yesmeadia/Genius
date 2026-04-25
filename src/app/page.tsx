"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import MathCanvas from "@/components/MathCanvas";
import { useFormSettings, isFormActive } from "@/hooks/useFormSettings";
import CountdownDisplay from "@/components/CountdownDisplay";

/* ─── Registration card data ───────────────────────────────────────────── */
const registrationTypes = [
  {
    id: "student",
    title: "Student Registration",
    subtitle: "For YES INDIA School Students",
    description:
      "Register as a student participant competing in the Genius Jam 2026 national talent series.",
    href: "/register/student",
    accentHex: "#4f46e5", // Indigo
    glow: "rgba(79,70,229,0.1)",
    border: "rgba(79,70,229,0.12)",
    badge: "Students",
    badgeBg: "rgba(79,70,229,0.06)",
    badgeText: "#4f46e5",
    cardBg: "rgba(255,255,255,0.45)",
    orbColor: "rgba(99,102,241,0.08)",
  },
  {
    id: "guest",
    title: "Guest Registration",
    subtitle: "For Visitors & Observers",
    description:
      "Register as a guest observer to witness Genius Jam 2026 and celebrate excellence in education.",
    href: "/register/guest",
    accentHex: "#059669", // Emerald
    glow: "rgba(5,150,105,0.1)",
    border: "rgba(16,185,129,0.12)",
    badge: "Guest",
    badgeBg: "rgba(5,150,105,0.06)",
    badgeText: "#059669",
    cardBg: "rgba(255,255,255,0.45)",
    orbColor: "rgba(16,185,129,0.08)",
  },
  {
    id: "yesian",
    title: "Yesian Registration",
    subtitle: "For YES INDIA Members",
    description:
      "Register as a Yesian member representing your zone and designation at this landmark event.",
    href: "/register/yesian",
    accentHex: "#d97706", // Amber
    glow: "rgba(217,119,6,0.1)",
    border: "rgba(217,119,6,0.12)",
    badge: "Yesians",
    badgeBg: "rgba(217,119,6,0.06)",
    badgeText: "#d97706",
    cardBg: "rgba(255,255,255,0.45)",
    orbColor: "rgba(245,158,11,0.08)",
  },
  {
    id: "local-staff",
    title: "Staff Registration",
    subtitle: "For YES INDIA School Staffs",
    description:
      "Register as a staff member providing essential support for Genius Jam 2026 operations.",
    href: "/register/local-staff",
    accentHex: "#0ea5e9", // Sky
    glow: "rgba(14,165,233,0.1)",
    border: "rgba(14,165,233,0.12)",
    badge: "Staff",
    badgeBg: "rgba(14,165,233,0.06)",
    badgeText: "#0ea5e9",
    cardBg: "rgba(255,255,255,0.45)",
    orbColor: "rgba(56,189,248,0.08)",
  },
  {
    id: "alumni-achiever",
    title: "Alumni Achiever",
    subtitle: "For Past YES INDIA Achievers",
    description:
      "Register as an Alumni Achiever, representing the proud legacy of YES INDIA members.",
    href: "/register/alumni-achiever",
    accentHex: "#ec4899", // Pink
    glow: "rgba(236,72,153,0.1)",
    border: "rgba(236,72,153,0.12)",
    badge: "Alumni",
    badgeBg: "rgba(236,72,153,0.06)",
    badgeText: "#ec4899",
    cardBg: "rgba(255,255,255,0.45)",
    orbColor: "rgba(244,114,182,0.08)",
  },
  {
    id: "volunteer",
    title: "Volunteer",
    subtitle: "For Dedicated Volunteers",
    description:
      "Register to lend a hand and volunteer for YES INDIA events and programs.",
    href: "/register/volunteer",
    accentHex: "#d97706", // Amber
    glow: "rgba(217,119,6,0.1)",
    border: "rgba(217,119,6,0.12)",
    badge: "Volunteer",
    badgeBg: "rgba(217,119,6,0.06)",
    badgeText: "#d97706",
    cardBg: "rgba(255,255,255,0.45)",
    orbColor: "rgba(217,119,6,0.08)",
  },
  {
    id: "awardee",
    title: "Awardee Registration",
    subtitle: "For Award Recipients",
    description:
      "Register as an Awardee to be recognized at the Genius Jam 2026 event.",
    href: "/register/awardee",
    accentHex: "#8b5cf6", // Violet
    glow: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.12)",
    badge: "Awardee",
    badgeBg: "rgba(139,92,246,0.06)",
    badgeText: "#8b5cf6",
    cardBg: "rgba(255,255,255,0.45)",
    orbColor: "rgba(139,92,246,0.08)",
  },
  {
    id: "driver-staff",
    title: "Drivers & Support",
    subtitle: "For Transport & Support",
    description:
      "Register as a driver or support staff to manage logistics and transportation for Genius Jam 2026.",
    href: "/register/driver-staff",
    accentHex: "#4f46e5", // Indigo
    glow: "rgba(79,70,229,0.1)",
    border: "rgba(79,70,229,0.12)",
    badge: "Transport",
    badgeBg: "rgba(79,70,229,0.06)",
    badgeText: "#4f46e5",
    cardBg: "rgba(255,255,255,0.45)",
    orbColor: "rgba(79,70,229,0.08)",
  },
  {
    id: "qiraath",
    title: "QIRA'A",
    subtitle: "Qira'ath Competition",
    description:
      "Register for the Qira'ath contest to showcase your recitation skills at Genius Jam 2026.",
    href: "/register/qiraath",
    accentHex: "#10b981", // Emerald/Teal
    glow: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.12)",
    badge: "Contest",
    badgeBg: "rgba(16,185,129,0.06)",
    badgeText: "#10b981",
    cardBg: "rgba(255,255,255,0.45)",
    orbColor: "rgba(16,185,129,0.08)",
  },
];

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { forms, loading: settingsLoading } = useFormSettings();

  // Filter and sort the hardcoded registrationTypes data based on Firestore settings
  const visibleRegistrationTypes = registrationTypes
    .filter(type => {
      const setting = forms.find(f => f.id === type.id);
      return isFormActive(setting);
    })
    .sort((a, b) => {
      const settingA = forms.find(f => f.id === a.id);
      const settingB = forms.find(f => f.id === b.id);
      return (settingA?.order ?? 0) - (settingB?.order ?? 0);
    });

  useGSAP(
    () => {
      if (settingsLoading) return;

      // Background Ambient Glows
      const orbs = gsap.utils.toArray(".bg-orb");
      if (orbs.length > 0) {
        gsap.to(orbs, {
          x: "random(-40, 40)",
          y: "random(-40, 40)",
          duration: "random(8, 12)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: { each: 2, from: "random" },
        });
      }

      // Entrance sequence
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      const heroElements = gsap.utils.toArray(".hero-elements > *");
      if (heroElements.length > 0) {
        tl.fromTo(heroElements,
          { opacity: 0, y: 30, filter: "blur(10px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.15, duration: 1.2, delay: 0.2 }
        );
      }

      // Animation for cards
      const cards = gsap.utils.toArray(".reg-card");
      if (cards.length > 0) {
        tl.fromTo(cards,
          { opacity: 0, scale: 0.92, y: 40 },
          { opacity: 1, scale: 1, y: 0, stagger: 0.1, duration: 1, ease: "back.out(1.2)" },
          "-=0.6"
        );

        // Card tilt effect on mouse move
        cards.forEach((card: any) => {
          card.addEventListener("mousemove", (e: any) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const tiltX = (y - centerY) / 12;
            const tiltY = (centerX - x) / 12;

            gsap.to(card, {
              rotateX: tiltX,
              rotateY: tiltY,
              scale: 1.02,
              duration: 0.4,
              ease: "power2.out",
              overwrite: true,
            });
          });

          card.addEventListener("mouseleave", () => {
            gsap.to(card, {
              rotateX: 0,
              rotateY: 0,
              scale: 1,
              duration: 0.6,
              ease: "elastic.out(1, 0.5)",
              overwrite: true,
            });
          });
        });
      }
    },
    { scope: containerRef, dependencies: [settingsLoading, visibleRegistrationTypes.length] }
  );

  return (
    <main
      ref={containerRef}
      className="relative min-h-screen font-normal overflow-hidden bg-white selection:bg-indigo-100 selection:text-indigo-900"
      style={{ perspective: "1000px" }}
    >
      {/* Dynamic Math Background */}
      <MathCanvas />

      {/* Super Premium Ambient Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-orb absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="bg-orb absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)", filter: "blur(100px)" }} />

        {/* Fine grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10 container mx-auto py-16 md:py-24 px-6 max-w-7xl">

        {/* Header Section */}
        <header className="hero-elements flex flex-col items-center text-center mb-16 md:mb-24">
          <div className="flex flex-col items-center gap-8 mb-10">
            <img src="/yeslogo.png" alt="YES INDIA" className="h-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700" />
            <div className="relative">
              <div className="absolute -inset-4 bg-indigo-500/5 blur-3xl rounded-full" />
              <img src="/Genius.png" alt="Genius Jam" className="h-32 md:h-44 object-contain relative drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
            </div>
          </div>
          <h1 className="text-xs font-normal tracking-[0.25em] text-slate-400 uppercase mt-2 mb-2">
            Official Registration Portal
          </h1>
        </header>

        {settingsLoading ? (
          /* Premium Loading State */
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-100" />
            <p className="text-[10px] font-normal uppercase tracking-[0.3em] text-slate-400 animate-pulse">Synchronizing Portal</p>
          </div>
        ) : visibleRegistrationTypes.length === 0 ? (
          /* No Forms Available State */
          <div className="flex flex-col items-center gap-6 py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-11a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-normal text-slate-900 tracking-tight">Registrations Closed</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">All registration portals are currently offline. Check back soon!</p>
            </div>
          </div>
        ) : (
          /* Improved Glass Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-20 w-full">
            {visibleRegistrationTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => router.push(type.href)}
                className="reg-card group relative flex flex-col p-4 md:p-10 cursor-pointer rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 preserve-3d glass-shimmer"
                style={{
                  background: type.cardBg,
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                  border: "1px solid rgba(0,0,0,0.04)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05), inset 0 0 20px 0 rgba(255,255,255,0.4)",
                }}
              >
                {/* Inner Glow Border */}
                <div className="absolute inset-px rounded-[2.4rem] border border-white opacity-40 pointer-events-none" />

                {/* Theme Orb Background */}
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700"
                  style={{ background: `radial-gradient(circle, ${type.accentHex} 0%, transparent 70%)` }} />

                {/* Header (Countdown + Badge) */}
                <div className="flex justify-between items-start mb-10 relative z-10 transition-transform duration-500 group-hover:translate-z-10">
                  {(() => {
                    const setting = forms.find(f => f.id === type.id);
                    if (setting?.autoClose && setting.closingDate && setting.closingTime) {
                      return <CountdownDisplay closingDate={setting.closingDate} closingTime={setting.closingTime} />;
                    }
                    return <div />;
                  })()}
                  <span className="px-3.5 py-1.5 rounded-full text-[10px] font-normal uppercase tracking-widest"
                    style={{ background: type.badgeBg, color: type.badgeText, border: `1px solid ${type.accentHex}15` }}>
                    {type.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="relative z-10 transition-transform duration-500 group-hover:translate-z-14">
                  <h2 className="text-2xl font-normal text-slate-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {type.title}
                  </h2>
                  <p className="text-sm font-normal uppercase tracking-wider mb-4" style={{ color: `${type.accentHex}cc` }}>
                    {type.subtitle}
                  </p>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium line-clamp-3">
                    {type.description}
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-auto pt-8 flex items-center gap-3 text-sm font-normal transition-all duration-300 relative z-10 group-hover:gap-5"
                  style={{ color: type.accentHex }}>
                  <span className="relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[2px] after:bg-current after:transition-all after:duration-300 group-hover:after:w-full">
                    Get Started
                  </span>
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        <Footer />
      </div>

    </main>
  );
}
