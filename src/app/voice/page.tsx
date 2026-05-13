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
}

export default function FeedbackPage() {
  const [schoolSearch, setSchoolSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [isFetchingNames, setIsFetchingNames] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
    { name: "awardee_registrations", label: "Awardee", field: "name" },
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

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const allSchools = React.useMemo(() => {
    return locations.flatMap(z => z.schools.map(s => s.name));
  }, []);

  const filteredSchools = React.useMemo(() => {
    if (!schoolSearch || selectedSchool === schoolSearch) return [];
    return allSchools.filter(s => s.toLowerCase().includes(schoolSearch.toLowerCase())).slice(0, 5);
  }, [schoolSearch, allSchools, selectedSchool]);

  const filteredNames = React.useMemo(() => {
    if (!nameSearch || !selectedSchool) return [];
    return availableParticipants.filter(p => 
      p.name.toLowerCase().includes(nameSearch.toLowerCase())
    ).slice(0, 5);
  }, [nameSearch, availableParticipants, selectedSchool]);

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
    } else {
      setAvailableParticipants([]);
    }
  }, [selectedSchool]);

  const fetchParticipantsForSchool = async (schoolName: string) => {
    setIsFetchingNames(true);
    setAvailableParticipants([]);
    const results: Participant[] = [];
    
    // Find the school ID for this name
    const schoolObj = locations.flatMap(z => z.schools).find(s => s.name === schoolName);
    const schoolId = schoolObj?.id;

    try {
      // Awardees Only for Voice feedback
      const coll = { name: "awardee_registrations", label: "Awardee", field: "name" };
      const queries = [];
      
      // Search by Name
      queries.push(query(collection(db, coll.name), where("school", "==", schoolName)));
      queries.push(query(collection(db, coll.name), where("schoolName", "==", schoolName)));
      
      // Search by ID (if available)
      if (schoolId) {
        queries.push(query(collection(db, coll.name), where("school", "==", schoolId)));
        queries.push(query(collection(db, coll.name), where("schoolName", "==", schoolId)));
      }
      
      const snapshots = await Promise.all(queries.map(q => getDocs(q)));
      
      snapshots.forEach(snap => {
        snap.docs.forEach(docMatch => {
          const data = docMatch.data();
          if (!results.find(r => r.id === docMatch.id)) {
            results.push({
              id: docMatch.id,
              name: data[coll.field] || data.name || "Unknown",
              type: coll.label,
              collection: coll.name,
              photoUrl: data.photoUrl,
            });
          }
        });
      });
      setAvailableParticipants(results);
    } catch (error) {
      console.error("Error fetching names:", error);
    } finally {
      setIsFetchingNames(false);
    }
  };

  const lookupParticipant = async () => {
    const sSchool = schoolSearch.trim().toLowerCase();
    const sName = nameSearch.trim().toLowerCase();
    
    if (!sSchool || !sName) return;

    setLoading(true);
    setParticipant(null);
    try {
      // We already have availableParticipants, check if one matches exactly or find in DB
      const match = availableParticipants.find(p => p.name.toLowerCase() === sName);
      if (match) {
        setParticipant(match);
        setLoading(false);
        return;
      }
      
      // Fallback direct query (Awardees only)
      const coll = { name: "awardee_registrations", label: "Awardee", field: "name" };
      const nameQuery = query(
        collection(db, coll.name),
        where(coll.field, ">=", nameSearch.trim()),
        where(coll.field, "<=", nameSearch.trim() + "\uf8ff"),
        limit(20)
      );
      
      const snap = await getDocs(nameQuery);
      for (const docMatch of snap.docs) {
        const data = docMatch.data();
        const pSchool = (data.school || data.schoolName || "").toString().toLowerCase();
        if (pSchool.includes(sSchool) || sSchool === "any") {
          setParticipant({
            id: docMatch.id,
            name: data[coll.field] || data.name || "Unknown",
            type: coll.label,
            collection: coll.name,
            photoUrl: data.photoUrl,
          });
          setLoading(false);
          return;
        }
      }
      alert("No awardee found for this name and school.");
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

  const performUpload = async (blob: Blob) => {
    if (!participant) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `feedback/${participant.id}_${Date.now()}.webm`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, "feedback"), {
        participantId: participant.id,
        participantName: participant.name,
        participantType: participant.type,
        audioUrl: downloadUrl,
        createdAt: serverTimestamp(),
        status: 'new'
      });

      setIsSubmitted(true);
      setAudioBlob(null);
      setAudioUrl(null);
      setParticipant(null);
      setSchoolSearch("");
      setNameSearch("");

      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);

    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        performUpload(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to record feedback.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsSubmitted(false);
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
              Voice Feedback
            </h1>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto min-h-screen flex flex-col justify-center items-center pt-28 pb-6 px-4 sm:px-6 max-w-3xl">
        <div className="text-center mb-8">
          <p className="text-slate-500 text-sm md:text-base font-medium">
            Share your experience with us (Exclusively for Awardees).
          </p>
        </div>

        {!participant && !isSubmitted && (
          <div className="search-container w-full max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-20">
            <div className="space-y-4">
              <div className="relative z-30">
                <div className="relative bg-white rounded-2xl flex items-center px-5 py-1 shadow-sm border border-slate-100 focus-within:border-indigo-200 transition-all duration-200">
                  <input
                    type="text"
                    placeholder="Search School Name"
                    value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value);
                      setSelectedSchool(null);
                    }}
                    onFocus={() => setShowSuggestions(filteredSchools.length > 0)}
                    className="w-full h-12 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm font-medium px-2 text-slate-700 placeholder:text-slate-400"
                  />
                  <Search size={18} className="text-slate-300 mr-2" />
                </div>
                
                {showSuggestions && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredSchools.map((school, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSchoolSearch(school);
                          setSelectedSchool(school);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-6 py-3 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center gap-3 transition-colors"
                      >
                        <div className="h-2 w-2 rounded-full bg-indigo-400" />
                        {school}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {(selectedSchool || schoolSearch.length > 3) && (
                <div className="relative z-20">
                  <div className="relative bg-white rounded-2xl flex items-center px-5 py-1 shadow-sm border border-slate-100 focus-within:border-indigo-200 transition-all duration-200 animate-in slide-in-from-top-4 duration-500">
                    <input
                      type="text"
                      placeholder={isFetchingNames ? "Loading awardee records..." : "Type your name..."}
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
                              {p.photoUrl ? <img src={p.photoUrl} className="h-full w-full rounded-full object-cover" /> : <User size={14} />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700 uppercase">{p.name}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.type}</span>
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
                {participant?.photoUrl ? (
                  <img src={participant.photoUrl} alt={participant?.name} className="h-full w-full object-cover" />
                ) : (
                  <User size={32} className="text-slate-300" strokeWidth={1.5} />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-normal text-slate-900">{participant?.name}</h3>
                <p className="text-sm text-slate-500 font-medium">{participant?.type}</p>
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
                    You have already submitted your voice feedback. Thank you!
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setParticipant(null);
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
                <div className="flex flex-col items-center gap-8 relative">
                  {!audioUrl ? (
                    <div className="flex flex-col items-center gap-6 relative z-10 w-full mt-2">
                      {isRecording ? (
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-full h-16 px-4 flex items-center justify-between shadow-sm animate-in zoom-in-95 duration-300">
                          <div className="flex items-center gap-2 w-20 shrink-0">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-sm font-medium text-slate-700 tabular-nums">
                              {formatTime(recordingTime)}
                            </span>
                          </div>

                          <div className="flex-grow flex items-center justify-center gap-0.5 sm:gap-1 mx-2 sm:mx-4 h-full overflow-hidden">
                            {[...Array(16)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-red-400 rounded-full opacity-80 shrink-0"
                                style={{
                                  height: '12px',
                                  animation: `wave ${0.3 + Math.random() * 0.4}s ease-in-out infinite alternate`,
                                  animationDelay: `${Math.random()}s`
                                }}
                              />
                            ))}
                          </div>

                          <button
                            onClick={stopRecording}
                            className="h-10 w-10 shrink-0 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors border border-red-100"
                            title="Pause Recording"
                          >
                            <Pause size={16} fill="currentColor" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {micPermission === "denied" ? (
                            <div className="flex flex-col items-center gap-4 text-center w-full">
                              <div className="h-16 w-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                                <Mic size={28} className="text-red-400" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-800">Microphone Blocked</p>
                                <p className="text-xs text-slate-500 max-w-[220px] leading-relaxed">
                                  Please allow microphone access in your browser settings.
                                </p>
                              </div>
                              <button
                                onClick={requestMicPermission}
                                className="h-10 px-6 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                              >
                                Allow Microphone
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={startRecording}
                              className="relative h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md bg-white text-slate-600 border border-slate-100 hover:bg-slate-50 hover:scale-105 active:scale-95"
                            >
                              <Mic size={32} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                      <div className="relative w-full rounded-[28px] overflow-hidden bg-white border border-slate-100 shadow-xl shadow-slate-200/20 p-6 mb-6 group transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-500/5 opacity-50" />
                        <div className="relative flex items-center gap-4 mb-6">
                          <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform duration-500">
                            <Volume2 size={24} />
                          </div>
                          <div className="flex-grow">
                            <p className="text-slate-900 font-bold text-base tracking-tight">Recorded Feedback</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">{formatTime(recordingTime)} length</p>
                            </div>
                          </div>
                        </div>
                        <div className="relative h-16 w-full flex items-center justify-center gap-1.5 px-2 mb-2">
                          {[...Array(40)].map((_, i) => (
                            <div key={i} className="w-1 bg-slate-200 rounded-full" style={{ height: `${[30, 50, 40, 70, 90, 60, 45, 80, 55, 40, 70, 85, 50, 60, 40, 75, 95, 60, 50, 80, 70, 90, 55, 65, 40, 85, 75, 50, 60, 45, 80, 65, 55, 40, 70, 85, 60, 45, 55, 30][i]}%`, opacity: 0.5 }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center py-4">
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                             <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                             <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Uploading Feedback...</p>
                          </div>
                        ) : !isSubmitted && audioBlob && (
                          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                            <p className="text-xs text-rose-500 font-medium">Upload failed or interrupted</p>
                            <div className="flex gap-3">
                              <Button onClick={() => performUpload(audioBlob)} className="h-10 px-6 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">Retry Upload</Button>
                              <Button onClick={resetRecording} variant="outline" className="h-10 px-6 rounded-xl border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Discard</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
