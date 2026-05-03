"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, where, documentId, limit } from "firebase/firestore";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Footer from "@/components/Footer";
import MathCanvas from "@/components/MathCanvas";
import { Search, CheckCircle2, User, School as SchoolIcon, Phone, Loader2, Tag, Sparkles, Scan, Zap, ShieldCheck } from "lucide-react";
import { locations } from "@/data/locations";
import WelcomeOverlay from "./components/WelcomeOverlay";

export interface AttendanceRecord {
  id: string;
  name: string;
  type: string;
  collection: string;
  mobile?: string;
  school?: string;
  photoUrl?: string;
  attendance?: boolean;
  alreadyMarked?: boolean;
}

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [lastMarked, setLastMarked] = useState<AttendanceRecord | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const collections = [
    { name: "registrations", label: "Student", field: "studentName" },
    { name: "guest_registrations", label: "Guest", field: "name" },
    { name: "yesian_registrations", label: "Yesian", field: "name" },
    { name: "local_staff_registrations", label: "Local Staff", field: "name" },
    { name: "alumni_registrations", label: "Alumni", field: "name" },
    { name: "volunteer_registrations", label: "Volunteer", field: "volunteerName" },
    { name: "awardee_registrations", label: "Awardee", field: "name" },
    { name: "driver_staff_registrations", label: "Driver Staff", field: "name" },
    { name: "qiraath_registrations", label: "Qiraath", field: "name" },
    { name: "scout_team_registrations", label: "Scout Team", field: "name" },
  ];

  useGSAP(() => {
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
    tl.fromTo(".page-header > *",
      { opacity: 0, y: 30, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.15, duration: 1.2, delay: 0.2 }
    );
    tl.fromTo(".search-container",
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8 },
      "-=0.6"
    );
  }, { scope: containerRef });

  // Auto-search and mark logic
  useEffect(() => {
    const term = searchTerm.trim();
    // Validate: Exactly 8 chars, only alphanumeric (Firestore IDs)
    if (term.length === 8 && /^[a-zA-Z0-9]+$/.test(term)) {
      autoMarkAttendance(term);
    }
  }, [searchTerm]);

  const autoMarkAttendance = async (idPrefix: string) => {
    setLoading(true);
    try {
      let match: AttendanceRecord | null = null;
      const term = idPrefix; // Case sensitive for ID query in Firestore? 
      // Actually Firestore IDs are usually mixed case, but the query is case sensitive.
      // However, if the user typed it, we should try a few variants or assume they scanned it.

      // Optimized search using documentId prefix query
      for (const coll of collections) {
        // Firestore prefix query for document IDs
        const q = query(
          collection(db, coll.name),
          where(documentId(), ">=", term),
          where(documentId(), "<=", term + "\uf8ff"),
          limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const found = snapshot.docs[0];
          const data = found.data();
          const rawSchool = data.schoolName || data.school || data.designation || data.address || "";
          let displaySchool = rawSchool;

          if (rawSchool.startsWith("sch-")) {
            for (const zone of locations) {
              const sch = zone.schools.find(s => s.id === rawSchool);
              if (sch) {
                displaySchool = sch.name;
                break;
              }
            }
          }

          match = {
            id: found.id,
            name: data[coll.field] || "Unknown",
            type: coll.label,
            collection: coll.name,
            mobile: data.mobileNumber || data.whatsappNumber || "",
            school: displaySchool,
            photoUrl: data.photoUrl,
            attendance: data.attendance || false
          };
          break;
        }
      }

      if (match) {
        if (!match.attendance) {
          await markAttendance(match, true);
        } else {
          showWelcome({ ...match, alreadyMarked: true });
        }
        setSearchTerm("");
      }
    } catch (error) {
      console.error("Auto-mark error:", error);
    } finally {
      setLoading(false);
    }
  };

  const speakWelcome = (name: string) => {
    if (typeof window !== "undefined" && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Welcome ${name}, to the Genius jam 3.0`);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const showWelcome = (record: AttendanceRecord) => {
    setLastMarked(record);
    speakWelcome(record.name);

    // Play success animation
    setTimeout(() => {
      gsap.fromTo(".welcome-card",
        { opacity: 0, scale: 0.8, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
      );
    }, 100);

    // Auto hide after 5 seconds
    setTimeout(() => {
      setLastMarked(null);
    }, 5000);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const rawTerm = searchTerm.trim();
    if (!rawTerm) return;

    // Validate input to prevent Firestore query injection/errors
    if (rawTerm.includes('/') || rawTerm.includes('\\') || rawTerm.length < 3) {
      alert("Invalid search term. Please enter at least 3 characters and avoid special characters.");
      return;
    }

    setLoading(true);
    setResults([]);
    try {
      const allResults: AttendanceRecord[] = [];
      const term = rawTerm.toLowerCase();

      // For manual search, we still fetch more docs to allow name/mobile search
      await Promise.all(collections.map(async (coll) => {
        const q = collection(db, coll.name);
        const snapshot = await getDocs(q);

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const id = doc.id;
          const name = (data[coll.field] || "").toLowerCase();
          const mobile = data.mobileNumber || data.whatsappNumber || "";

          if (name.includes(term) || mobile.includes(term) || id.toLowerCase().startsWith(term)) {
            allResults.push({
              id,
              name: data[coll.field] || "Unknown",
              type: coll.label,
              collection: coll.name,
              mobile,
              school: data.schoolName || data.school || "",
              photoUrl: data.photoUrl,
              attendance: data.attendance || false
            });
          }
        });
      }));

      setResults(allResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (record: AttendanceRecord, isAuto: boolean = false) => {
    if (record.attendance) {
      if (!isAuto) alert("Participant is already marked present.");
      return;
    }

    setMarkingId(record.id);
    try {
      const docRef = doc(db, record.collection, record.id);

      await updateDoc(docRef, {
        attendance: true,
        attendedAt: serverTimestamp()
      });

      const updatedRecord = { ...record, attendance: true };

      if (!isAuto) {
        setResults(prev => prev.map(r => r.id === record.id ? updatedRecord : r));
      }

      showWelcome(updatedRecord);
    } catch (error) {
      console.error("Marking error:", error);
      alert("Failed to update attendance.");
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <main ref={containerRef} className="relative min-h-screen font-sans overflow-hidden bg-white">
      <MathCanvas />

      {/* Ambient Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-orb absolute top-[-5%] right-[-5%] w-[50%] h-[50%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="bg-orb absolute bottom-0 -left-10 w-[40%] h-[40%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(248,113,113,0.05) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {lastMarked && <WelcomeOverlay record={lastMarked} />}

      {/* Navigation Header */}
      <header className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 md:py-5 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 md:gap-6">
          <img src="/yeslogo.png" alt="YES INDIA" className="h-5 md:h-6 opacity-40 grayscale transition-all duration-700" />
          <div className="w-px h-6 bg-slate-200 hidden md:block" />
          <img src="/Genius.png" alt="Genius Jam" className="h-8 md:h-10 object-contain drop-shadow-sm" />
        </div>
        <div className="flex items-center">
          <div className="hidden md:flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-[9px] md:text-[10px] font-black tracking-[0.3em] md:tracking-[0.4em] text-slate-400 uppercase">
              Neural Scanning Terminal
            </h1>
          </div>
        </div>
      </header>

      <div className="relative z-10 w-full container mx-auto min-h-[calc(100vh-80px)] mt-20 flex flex-col justify-center items-center py-10 px-6 max-w-4xl">
        <div className="page-header text-center w-full mb-10">
          <p className="text-slate-500 text-sm font-medium">
            System is primed and ready for <span className="text-red-600 font-black uppercase tracking-wider text-[10px]">Rapid Check-in</span>
          </p>
        </div>

        {/* Scanner Visualization */}
        <div className="search-container w-full mb-12 relative">
          <div className="relative w-full max-w-2xl mx-auto group">
            {/* Viewfinder Corners */}
            <div className="absolute -top-4 -left-4 w-12 h-12 border-t-4 border-l-4 border-red-600 rounded-tl-xl opacity-20 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-4 -right-4 w-12 h-12 border-t-4 border-r-4 border-red-600 rounded-tr-xl opacity-20 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-4 border-l-4 border-red-600 rounded-bl-xl opacity-20 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-4 border-r-4 border-red-600 rounded-br-xl opacity-20 group-focus-within:opacity-100 transition-opacity duration-500" />

            <form onSubmit={handleSearch} className="relative z-10">
              <div className="relative overflow-hidden rounded-2xl bg-transparent">
                {/* Scanning Laser Animation */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent absolute top-0 animate-[scan_3s_ease-in-out_infinite]"
                    style={{
                      boxShadow: '0 0 15px 2px rgba(239, 68, 68, 0.4)',
                    }}
                  />
                </div>

                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-32 pl-12 pr-12 bg-transparent border-0 text-4xl font-black text-slate-900 focus:ring-0 transition-all placeholder:text-slate-200 placeholder:font-bold tracking-[0.2em] text-center"
                />

                {/* Scanner Interface Elements */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-4 text-slate-300 pointer-events-none transition-opacity duration-300 group-focus-within:opacity-0 hidden lg:flex">
                  <Scan size={24} className="animate-pulse" />
                </div>

                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 hidden lg:flex group-focus-within:opacity-0 transition-opacity">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Auto</span>
                  <Zap size={14} className="text-amber-400 fill-amber-400" />
                </div>
              </div>
            </form>
          </div>

          {/* Quick Stats/Indicators below scanner */}
          <div className="flex justify-center gap-8 mt-12 opacity-40">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">ID Verification Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Real-time Sync</span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="w-full max-w-2xl space-y-6 mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-8">
              <div className="relative">
                <div className="w-20 h-20 border-8 border-slate-50 border-t-red-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-red-500 rounded-full animate-pulse opacity-10" />
                </div>
              </div>
              <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Querying Registry Hub</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid gap-6 animate-in slide-in-from-bottom-8 duration-700">
              {results.map((record) => (
                <div
                  key={record.id}
                  className="group bg-white/70 backdrop-blur-xl border border-slate-100 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-red-200 transition-all duration-700 overflow-hidden relative"
                >
                  <div className="flex items-center gap-6 w-full md:w-auto relative z-10">
                    <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 shadow-inner">
                      {record.photoUrl ? (
                        <img src={record.photoUrl} alt={record.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-200">
                          <User size={40} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-red-600 transition-colors leading-tight">{record.name}</h3>
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5 border border-slate-200/50">
                          <Tag size={10} className="text-slate-300" />
                          {record.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-tight">
                          <SchoolIcon size={14} className="text-red-400/50" />
                          {record.school || "Genius Jam 2026"}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-slate-500 font-bold tracking-wide">
                          <Phone size={14} className="text-red-400/50" />
                          {record.mobile || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => markAttendance(record)}
                    disabled={markingId === record.id}
                    className={`relative z-10 w-full md:w-auto h-16 px-10 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${record.attendance
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                      : "bg-slate-900 text-white hover:bg-red-600 hover:shadow-2xl hover:shadow-red-500/30 active:scale-95"
                      }`}
                  >
                    {markingId === record.id ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : record.attendance ? (
                      <>
                        <CheckCircle2 size={20} />
                        Verified
                      </>
                    ) : (
                      "Confirm Entry"
                    )}
                  </button>

                  {/* Decorative element for card */}
                  <div className="absolute right-0 top-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
              ))}
            </div>
          ) : searchTerm && !loading && searchTerm.length !== 8 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-700">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-8 border border-slate-100">
                <Scan size={32} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Access Denied</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-xs leading-relaxed">
                ID Hash "{searchTerm}" not recognized
              </p>
            </div>
          ) : null}
        </div>

        <Footer />
      </div>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </main>
  );
}
