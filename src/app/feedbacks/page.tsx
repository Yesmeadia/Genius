"use client";

import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, orderBy, addDoc, serverTimestamp, where, limit, documentId } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Footer from "@/components/Footer";
import MathCanvas from "@/components/MathCanvas";
import { Search, Mic, Square, Play, Pause, Trash2, CheckCircle2, User, Loader2, Scan, MessageSquare, Volume2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { locations } from "@/data/locations";

interface Participant {
  id: string;
  name: string;
  type: string;
  collection: string;
  photoUrl?: string;
  studentName?: string;
}

export default function FeedbackPage() {
  const [schoolSearch, setSchoolSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null); // zone id when searching by zone
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [isFetchingNames, setIsFetchingNames] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);
  const [textFeedback, setTextFeedback] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasExistingFeedback, setHasExistingFeedback] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Proactively request mic permission on mount
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
          setMicPermission(result.state as "granted" | "denied" | "prompt");
          result.onchange = () => setMicPermission(result.state as "granted" | "denied" | "prompt");
        }
      } catch {
        setMicPermission("unknown");
      }
    };
    checkMicPermission();
  }, []);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // just checking permission, stop immediately
      setMicPermission("granted");
    } catch {
      setMicPermission("denied");
    }
  };

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
    { name: "media_registrations", label: "Media", field: "name" },
  ];



  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Header Animation
    const headerElements = gsap.utils.toArray(".page-header > *");
    if (headerElements.length > 0) {
      tl.fromTo(headerElements,
        { opacity: 0, y: 30, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.15, duration: 1.2 }
      );
    }

    // Search Container Animation
    const searchContainer = gsap.utils.toArray(".search-container");
    if (searchContainer.length > 0) {
      tl.fromTo(searchContainer,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8 },
        "-=0.6"
      );
    }

    // Ambient Orbs Animation
    const orbs = gsap.utils.toArray(".bg-orb");
    if (orbs.length > 0) {
      gsap.to(orbs, {
        y: "random(-30, 30)", x: "random(-30, 30)",
        duration: "random(8, 12)", repeat: -1, yoyo: true,
        ease: "sine.inOut", stagger: { each: 2, from: "random" },
      });
    }
  }, { scope: containerRef, dependencies: [participant, isSubmitted] });

  // Proactively request mic permission on mount (not needed for text, but keeping it simple for now)

  const allSchools = React.useMemo(() => {
    return locations.flatMap(z => z.schools.map(s => s.name));
  }, []);

  // Zone names for Yesian search
  const allZones = React.useMemo(() => {
    return locations.map(z => ({ id: z.id, name: z.name }));
  }, []);

  const filteredSchools = React.useMemo(() => {
    if (!schoolSearch || selectedSchool === schoolSearch) return [];
    const term = schoolSearch.toLowerCase();
    const matchedSchools = allSchools
      .filter(s => s.toLowerCase().includes(term))
      .map(s => ({ label: s, isZone: false, zoneId: null as string | null }));
    const matchedZones = allZones
      .filter(z => z.name.toLowerCase().includes(term))
      .map(z => ({ label: `${z.name} (Zone - for yesians)`, isZone: true, zoneId: z.id }));
    return [...matchedSchools, ...matchedZones].slice(0, 8);
  }, [schoolSearch, allSchools, allZones, selectedSchool]);

  const filteredNames = React.useMemo(() => {
    if (!nameSearch || (!selectedSchool && !selectedZone)) return [];
    return availableParticipants.filter(p =>
      p.name.toLowerCase().includes(nameSearch.toLowerCase())
    ).slice(0, 5);
  }, [nameSearch, availableParticipants, selectedSchool, selectedZone]);

  useEffect(() => {
    if (filteredSchools.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [filteredSchools]);

  useEffect(() => {
    if (filteredNames.length > 0 && !participant) {
      setShowNameSuggestions(true);
    } else {
      setShowNameSuggestions(false);
    }
  }, [filteredNames, participant]);

  useEffect(() => {
    if (selectedSchool) {
      fetchParticipantsForSchool(selectedSchool);
    } else if (selectedZone) {
      fetchParticipantsForZone(selectedZone);
    } else {
      setAvailableParticipants([]);
    }
  }, [selectedSchool, selectedZone]);

  const fetchParticipantsForSchool = async (schoolName: string) => {
    setIsFetchingNames(true);
    setAvailableParticipants([]);
    const results: Participant[] = [];

    // Find the school ID for this name
    const schoolObj = locations.flatMap(z => z.schools).find(s => s.name === schoolName);
    const schoolId = schoolObj?.id;

    try {
      for (const coll of collections) {
        const queries = [];

        // Search by school name and ID variants
        queries.push(query(collection(db, coll.name), where("school", "==", schoolName)));
        queries.push(query(collection(db, coll.name), where("schoolName", "==", schoolName)));
        queries.push(query(collection(db, coll.name), where("institution", "==", schoolName)));
        if (schoolId) {
          queries.push(query(collection(db, coll.name), where("school", "==", schoolId)));
          queries.push(query(collection(db, coll.name), where("schoolName", "==", schoolId)));
        }

        const snapshots = await Promise.all(queries.map(q => getDocs(q)));

        snapshots.forEach(snap => {
          snap.docs.forEach(docMatch => {
            const data = docMatch.data();

            // Regular participant entry
            if (!results.find(r => r.id === docMatch.id)) {
              results.push({
                id: docMatch.id,
                name: data[coll.field] || data.name || "Unknown",
                type: coll.label,
                collection: coll.name,
                photoUrl: data.photoUrl,
              });
            }

            // Extract guardian(s) inline — no extra query needed.
            // Guardians are embedded in docs where withParent === true.
            if (data.withParent === true) {
              if (data.accompaniments && data.accompaniments.length > 0) {
                data.accompaniments.forEach((acc: any, i: number) => {
                  const guardianId = `${docMatch.id}_acc_${i}`;
                  if (acc.name && !results.find(r => r.id === guardianId)) {
                    results.push({
                      id: guardianId,
                      name: acc.name,
                      type: "Guardian",
                      collection: coll.name,
                      photoUrl: data.photoUrl,
                      studentName: data[coll.field] || data.name || data.studentName || "Student",
                    });
                  }
                });
              } else if (data.parentName) {
                const guardianId = `${docMatch.id}_guardian`;
                if (!results.find(r => r.id === guardianId)) {
                  results.push({
                    id: guardianId,
                    name: data.parentName,
                    type: "Guardian",
                    collection: coll.name,
                    photoUrl: data.photoUrl,
                    studentName: data[coll.field] || data.name || data.studentName || "Student",
                  });
                }
              }
            }
          });
        });
      }

      setAvailableParticipants(results);
      if (results.length === 0) {
        console.warn("No participants found for school:", schoolName, "(ID:", schoolId, ")");
      }
    } catch (error) {
      console.error("Error fetching names:", error);
    } finally {
      setIsFetchingNames(false);
    }
  };

  // Fetch Yesians by zone (zone id stored in their 'zone' field)
  const fetchParticipantsForZone = async (zoneId: string) => {
    setIsFetchingNames(true);
    setAvailableParticipants([]);
    const results: Participant[] = [];
    try {
      // Yesians store zone as zone id (e.g. "Srinagar", "Poonch")
      const yesianQuery = query(
        collection(db, "yesian_registrations"),
        where("zone", "==", zoneId)
      );
      const snap = await getDocs(yesianQuery);
      snap.docs.forEach(docMatch => {
        const data = docMatch.data();
        results.push({
          id: docMatch.id,
          name: data.name || "Unknown",
          type: "Yesian",
          collection: "yesian_registrations",
          photoUrl: data.photoUrl,
        });
      });
      setAvailableParticipants(results);
      if (results.length === 0) {
        console.warn("No Yesians found for zone:", zoneId);
      }
    } catch (error) {
      console.error("Error fetching Yesians by zone:", error);
    } finally {
      setIsFetchingNames(false);
    }
  };

  const lookupParticipant = async () => {
    const sSchool = schoolSearch.trim().toLowerCase();
    const sName = nameSearch.trim().toLowerCase();

    if (!sSchool || !sName) {
      alert("Please enter both School and Name to search.");
      return;
    }

    setLoading(true);
    setParticipant(null);
    try {
      for (const coll of collections) {
        // Query by name (prefix match)
        const nameQuery = query(
          collection(db, coll.name),
          where(coll.field, ">=", nameSearch.trim()),
          where(coll.field, "<=", nameSearch.trim() + "\uf8ff"),
          limit(50) // Fetch more to find the right school
        );

        const snap = await getDocs(nameQuery);

        for (const docMatch of snap.docs) {
          const data = docMatch.data();
          const pName = (data[coll.field] || data.name || data.studentName || "").toString().toLowerCase();
          const pSchool = (data.school || data.schoolName || data.institution || "").toString().toLowerCase();

          // Check if both match (simple inclusion/equality)
          if (pName.includes(sName) && (pSchool.includes(sSchool) || sSchool === "any")) {
            setParticipant({
              id: docMatch.id,
              name: data[coll.field] || data.name || data.studentName || "Unknown",
              type: coll.label,
              collection: coll.name,
              photoUrl: data.photoUrl,
            });
            setShowSuggestions(false);
            setLoading(false);
            return;
          }
        }
      }
      alert("No matching participant found in the specified school.");
    } catch (error) {
      console.error("Lookup error:", error);
      alert("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkExistingFeedback = async (participantId: string) => {
    try {
      const q = query(
        collection(db, "feedback"),
        where("participantId", "==", participantId)
      );
      const snap = await getDocs(q);
      setHasExistingFeedback(!snap.empty);
    } catch (error) {
      console.error("Error checking feedback:", error);
    }
  };

  useEffect(() => {
    if (participant) {
      checkExistingFeedback(participant.id);
    } else {
      setHasExistingFeedback(false);
    }
  }, [participant]);

  const submitTextFeedback = async () => {
    if (!textFeedback.trim() || !participant) return;
    setIsUploading(true);
    try {
      await addDoc(collection(db, "feedback"), {
        participantId: participant.id,
        participantName: participant.name,
        participantType: participant.type,
        textFeedback: textFeedback.trim(),
        createdAt: serverTimestamp(),
        status: 'new'
      });

      setIsSubmitted(true);
      setTextFeedback("");
      setParticipant(null);
      setSchoolSearch("");
      setNameSearch("");
      setSelectedZone(null);

      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);

    } catch (error) {
      console.error("Text submission error:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <main ref={containerRef} className="min-h-screen bg-white relative overflow-hidden font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
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

      {/* Navigation Header */}
      <header className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 md:py-5 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 md:gap-6">
          <img src="/yeslogo.png" alt="YES INDIA" className="h-5 md:h-6 opacity-40 grayscale transition-all duration-700" />
          <div className="w-px h-6 bg-slate-200 hidden md:block" />
          <img src="/Genius.png" alt="Genius Jam" className="h-8 md:h-10 object-contain drop-shadow-sm" />
        </div>
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-900 animate-pulse" />
            <h1 className="text-[9px] md:text-[10px] font-black tracking-[0.3em] md:tracking-[0.4em] text-slate-400 uppercase">
              Text Feedback
            </h1>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto min-h-screen flex flex-col justify-center items-center pt-28 pb-6 px-4 sm:px-6 max-w-3xl">
        <div className="text-center mb-8">
          <p className="text-slate-500 text-sm md:text-base font-medium">
            Share your experience with us.
          </p>
        </div>

        {!participant && !isSubmitted && (
          <div className="search-container w-full max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-20">
            <div className="space-y-4">
              <div className="relative z-30">
                <div className="relative bg-white rounded-2xl flex items-center px-5 py-1 shadow-sm border border-slate-100 focus-within:border-indigo-200 transition-all duration-200">
                  <input
                    type="text"
                    placeholder="Search School or Zone Name"
                    value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value);
                      setSelectedSchool(null);
                      setSelectedZone(null);
                    }}
                    onFocus={() => setShowSuggestions(filteredSchools.length > 0)}
                    className="w-full h-12 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm font-medium px-2 text-slate-700 placeholder:text-slate-400"
                  />
                  <Search size={18} className="text-slate-300 mr-2" />
                </div>

                {showSuggestions && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredSchools.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSchoolSearch(item.label);
                          if (item.isZone && item.zoneId) {
                            setSelectedZone(item.zoneId);
                            setSelectedSchool(null);
                          } else {
                            setSelectedSchool(item.label);
                            setSelectedZone(null);
                          }
                          setShowSuggestions(false);
                        }}
                        className="w-full px-6 py-3 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center gap-3 transition-colors"
                      >
                        <div className={`h-2 w-2 rounded-full ${item.isZone ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {(selectedSchool || selectedZone || schoolSearch.length > 3) && (
                <div className="relative z-20">
                  <div className="relative bg-white rounded-2xl flex items-center px-5 py-1 shadow-sm border border-slate-100 focus-within:border-indigo-200 transition-all duration-200 animate-in slide-in-from-top-4 duration-500">
                    <input
                      type="text"
                      placeholder={isFetchingNames ? "Loading school records..." : "Type your name..."}
                      value={nameSearch}
                      onChange={(e) => {
                        setNameSearch(e.target.value);
                      }}
                      onFocus={() => setShowNameSuggestions(filteredNames.length > 0)}
                      disabled={isFetchingNames}
                      className="w-full h-12 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm font-medium px-2 text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
                      autoFocus
                    />
                    {isFetchingNames ? <Loader2 size={18} className="text-indigo-400 animate-spin mr-2" /> : <User size={18} className="text-slate-300 mr-2" />}
                  </div>

                  {isFetchingNames && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-4 animate-pulse">
                      Synchronizing with database...
                    </p>
                  )}

                  {showNameSuggestions && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {filteredNames.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setParticipant(p);
                            setNameSearch(p.name);
                            setShowNameSuggestions(false);
                          }}
                          className="w-full px-6 py-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                              {p.photoUrl && p.type !== "Guardian" ? <img src={p.photoUrl} className="h-full w-full rounded-full object-cover" /> : <User size={14} />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700 uppercase">{p.name}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.type}{p.type === "Guardian" && p.studentName ? ` - Parent of ${p.studentName}` : ""}</span>
                            </div>
                          </div>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={lookupParticipant}
              disabled={loading || !schoolSearch || !nameSearch}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? <Loader2 className="animate-spin mr-3" size={18} /> : <CheckCircle2 className="mr-3" size={18} />}
              {loading ? "Searching..." : "Verify Identity"}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-slate-500">Looking up...</p>
          </div>
        )}

        {participant && (
          <div className="participant-card w-full max-w-xl bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/40 p-6 md:p-10 shadow-2xl shadow-slate-200/40 animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                {participant?.photoUrl && participant?.type !== "Guardian" ? (
                  <img src={participant.photoUrl} alt={participant?.name} className="h-full w-full object-cover" />
                ) : (
                  <User size={32} className="text-slate-300" strokeWidth={1.5} />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-normal text-slate-900">{participant?.name}</h3>
                <p className="text-sm text-slate-500 font-medium">{participant?.type}{participant?.type === "Guardian" && participant?.studentName ? ` - Parent of ${participant.studentName}` : ""}</p>
              </div>
            </div>



            {hasExistingFeedback ? (
              <div className="flex flex-col items-center gap-6 py-4 text-center animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-2">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-normal text-slate-900">Feedback Received</p>
                  <p className="text-sm text-slate-500 font-medium max-w-[280px]">
                    You have already submitted your feedback. Thank you!
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setParticipant(null);
                    setSchoolSearch("");
                    setNameSearch("");
                  }}
                  variant="outline"
                  className="h-11 px-8 rounded-full border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                >
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
                  <textarea
                    placeholder="Type your feedback here..."
                    value={textFeedback}
                    onChange={(e) => setTextFeedback(e.target.value)}
                    className="w-full min-h-[160px] p-6 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-50 transition-all outline-none resize-none text-slate-700 placeholder:text-slate-400 text-base"
                  />
                  <Button
                    onClick={submitTextFeedback}
                    disabled={!textFeedback.trim() || isUploading}
                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="animate-spin mr-3" size={18} />
                    ) : (
                      <CheckCircle2 className="mr-3" size={18} />
                    )}
                    {isUploading ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isSubmitted && (
          <div className="success-message w-full max-w-sm mx-auto bg-white border border-slate-200 rounded-[24px] p-10 text-center space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mx-auto h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-normal text-slate-900">Sent!</h3>
              <p className="text-slate-500 text-sm font-medium">Your feedback has been submitted.</p>
            </div>
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="mt-4 h-10 px-8 rounded-full text-slate-600 font-medium"
            >
              Done
            </Button>
          </div>
        )}

        <Footer />
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes wave {
          0% { height: 10px; opacity: 0.3; }
          100% { height: 60px; opacity: 1; }
        }
      `}</style>
    </main>
  );
}
