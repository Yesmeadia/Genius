"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, where, documentId, limit } from "firebase/firestore";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Footer from "@/components/Footer";
import MathCanvas from "@/components/MathCanvas";
import { Search, CheckCircle2, User, School as SchoolIcon, Phone, Loader2, Tag, Sparkles } from "lucide-react";
import { locations } from "@/data/locations";

interface AttendanceRecord {
  id: string;
  name: string;
  type: string;
  collection: string;
  mobile?: string;
  school?: string;
  photoUrl?: string;
  attendance?: boolean;
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
    if (term.length === 8) {
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
          showWelcome(match);
        }
        setSearchTerm("");
      }
    } catch (error) {
      console.error("Auto-mark error:", error);
    } finally {
      setLoading(false);
    }
  };

  const showWelcome = (record: AttendanceRecord) => {
    setLastMarked(record);

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
    if (!searchTerm.trim()) return;

    setLoading(true);
    setResults([]);
    try {
      const allResults: AttendanceRecord[] = [];
      const term = searchTerm.toLowerCase();

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
    setMarkingId(record.id);
    try {
      const docRef = doc(db, record.collection, record.id);
      const isCurrentlyPresent = record.attendance === true;

      await updateDoc(docRef, {
        attendance: !isCurrentlyPresent,
        attendedAt: !isCurrentlyPresent ? serverTimestamp() : null
      });

      const updatedRecord = { ...record, attendance: !isCurrentlyPresent };

      if (!isAuto) {
        setResults(prev => prev.map(r => r.id === record.id ? updatedRecord : r));
      }

      if (!isCurrentlyPresent) {
        showWelcome(updatedRecord);
      }
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

      {/* Welcome Overlay */}
      {lastMarked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="welcome-card w-full max-w-lg bg-white rounded-[3.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden text-center border border-white/20">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse" />

            <div className="relative mb-10 flex justify-center">
              <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-white shadow-2xl ring-12 ring-red-50/30">
                {lastMarked.photoUrl ? (
                  <img src={lastMarked.photoUrl} alt={lastMarked.name} className="h-full w-full object-cover scale-110" />
                ) : (
                  <div className="h-full w-full bg-slate-50 flex items-center justify-center text-slate-200">
                    <User size={80} />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-4 rounded-full shadow-lg border-8 border-white">
                <CheckCircle2 size={32} />
              </div>
            </div>

            <div className="space-y-3 mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Welcome, <br />
                <span className="text-red-600">{lastMarked.name}</span>
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.3em] border border-red-100 shadow-sm">
                  {lastMarked.type} verified
                </span>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-3xl p-6 mb-10 border border-slate-100">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.1em] mb-1">
                {lastMarked.type === 'Yesian' ? 'Designation' : 
                 lastMarked.type === 'Guest' ? 'Address' : 
                 'School'}
              </p>
              <p className="text-lg font-bold text-slate-700 leading-tight">
                {lastMarked.school || "Genius Jam 2026"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto py-12 md:py-24 px-6 max-w-4xl">
        <header className="page-header flex flex-col items-center text-center mb-16">
          <div className="flex flex-col items-center gap-8 mb-10">
            <img src="/yeslogo.png" alt="YES INDIA" className="h-8 opacity-40 grayscale" />
            <img src="/Genius.png" alt="Genius Jam" className="h-20 md:h-24 object-contain" />
          </div>
          <div className="space-y-4">
            <h1 className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">
              Smart Attendance System
            </h1>
            <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
              Auto-Scan mode is active <span className="text-red-600 font-black">Scan the bar code </span>
            </p>
          </div>
        </header>

        {/* Search Section */}
        <div className="search-container mb-16">
          <form onSubmit={handleSearch} className="relative group">
            <input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="Scan 8-digit ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-24 pl-20 pr-40 rounded-[3rem] border-0 bg-white/70 backdrop-blur-2xl shadow-[0_32px_64px_-20px_rgba(0,0,0,0.1)] text-3xl font-black text-slate-900 focus:ring-12 focus:ring-red-500/5 transition-all placeholder:text-slate-200 placeholder:font-bold tracking-widest text-center md:text-left"
            />
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-red-500 transition-colors hidden md:block" size={32} />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-6 top-1/2 -translate-y-1/2 h-14 px-10 rounded-[1.5rem] bg-red-600 text-white font-black text-xs tracking-[0.2em] uppercase hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 active:scale-95 transition-all flex items-center gap-2 hidden md:flex"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : "Search"}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="space-y-6 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-8">
              <div className="relative">
                <div className="w-20 h-20 border-8 border-slate-50 border-t-red-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-red-500 rounded-full animate-pulse opacity-10" />
                </div>
              </div>
              <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Database Cluster</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid gap-6">
              {results.map((record) => (
                <div
                  key={record.id}
                  className="group bg-white/70 backdrop-blur-xl border border-slate-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-red-200 transition-all duration-700"
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="relative h-20 w-20 rounded-[1.5rem] overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 shadow-inner">
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
                    className={`w-full md:w-auto h-16 px-10 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${record.attendance
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                      : "bg-slate-900 text-white hover:bg-red-600 hover:shadow-2xl hover:shadow-red-500/30 active:scale-95"
                      }`}
                  >
                    {markingId === record.id ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : record.attendance ? (
                      <>
                        <CheckCircle2 size={20} />
                        Present
                      </>
                    ) : (
                      "Verify Check-in"
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : searchTerm && !loading && searchTerm.length !== 8 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-8 border border-slate-100">
                <Search size={40} className="text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">No Match Found</h3>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                We couldn't find anyone matching "{searchTerm}" in the registry cluster.
              </p>
            </div>
          ) : null}
        </div>

        <Footer />
      </div>
    </main>
  );
}
