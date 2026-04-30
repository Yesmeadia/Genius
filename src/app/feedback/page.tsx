"use client";

import { useState, useEffect, useRef } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Footer from "@/components/Footer";
import MathCanvas from "@/components/MathCanvas";
import { Search, Mic, Square, Play, Trash2, CheckCircle2, User, Loader2, Scan, MessageSquare, Volume2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Participant {
  id: string;
  name: string;
  type: string;
  collection: string;
  photoUrl?: string;
}

export default function FeedbackPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) return;
    // Debounce: barcode scanners type very fast, so wait 300ms after last char
    const timer = setTimeout(() => {
      lookupParticipant(term);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const lookupParticipant = async (id: string) => {
    const searchId = id.trim();
    if (!searchId) return;
    setLoading(true);
    setParticipant(null);
    try {
      for (const coll of collections) {
        // 1. Try direct document ID match first (fast path)
        const directRef = doc(db, coll.name, searchId);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
          const data = directSnap.data();
          setParticipant({
            id: directSnap.id,
            name: data[coll.field] || data.name || data.studentName || "Unknown",
            type: coll.label,
            collection: coll.name,
            photoUrl: data.photoUrl,
          });
          setLoading(false);
          return;
        }

        // 2. Full collection scan — find doc whose ID contains the search string
        const snap = await getDocs(query(collection(db, coll.name), orderBy("createdAt", "desc")));
        const match = snap.docs.find(d =>
          d.id === searchId ||
          d.id.toLowerCase().includes(searchId.toLowerCase()) ||
          (d.data()[coll.field] || "").toLowerCase().includes(searchId.toLowerCase())
        );
        if (match) {
          const data = match.data();
          setParticipant({
            id: match.id,
            name: data[coll.field] || data.name || data.studentName || "Unknown",
            type: coll.label,
            collection: coll.name,
            photoUrl: data.photoUrl,
          });
          setLoading(false);
          return;
        }
      }
      alert("No participant found. Please check the ID and try again.");
    } catch (error) {
      console.error("Lookup error:", error);
      alert("Connection error. Please try again.");
    } finally {
      setLoading(false);
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

  const submitFeedback = async () => {
    if (!audioBlob || !participant) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `feedback/${participant.id}_${Date.now()}.webm`);
      await uploadBytes(storageRef, audioBlob);
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
      setSearchTerm("");

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

      <div className="relative z-10 container mx-auto min-h-screen flex flex-col justify-center items-center py-6 px-4 sm:px-6 max-w-3xl">
        <header className="page-header flex flex-col items-center text-center mb-10">
          <div className="flex flex-col items-center gap-6 mb-8">
            <img src="/yeslogo.png" alt="YES INDIA" className="h-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-700" />
            <img src="/Genius.png" alt="Genius Jam" className="h-20 md:h-28 object-contain" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <h1 className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">
                Participant Feedback
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              Share your experience with us.
            </p>
          </div>
        </header>

        {!participant && !isSubmitted && (
          <div className="search-container w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={(e) => { e.preventDefault(); if (searchTerm.trim()) lookupParticipant(searchTerm.trim()); }} className="relative">
              <div className="relative bg-white rounded-full flex items-center px-6 py-2 shadow-[0_2px_5px_0_rgba(0,0,0,0.16),0_2px_10px_0_rgba(0,0,0,0.12)] hover:shadow-[0_2px_8px_1px_rgba(0,0,0,0.2)] focus-within:shadow-[0_2px_8px_1px_rgba(0,0,0,0.2)] transition-shadow duration-200">
                <div className="text-slate-400 shrink-0">
                  <Search size={22} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  placeholder="Enter ID to continue"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 bg-transparent border-0 text-base sm:text-lg font-normal px-4 text-slate-700 focus:ring-0 placeholder:text-slate-400"
                  autoFocus
                />
                <button type="submit" className="shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors hidden sm:block">
                  <CheckCircle2 size={24} strokeWidth={1.5} />
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-slate-500">Looking up...</p>
          </div>
        )}

        {participant && (
          <div className="participant-card w-full max-w-xl bg-white rounded-[24px] border border-slate-200 p-8 md:p-12 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-10">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                {participant?.photoUrl ? (
                  <img src={participant.photoUrl} alt={participant?.name} className="h-full w-full object-cover" />
                ) : (
                  <User size={40} className="text-slate-400" strokeWidth={1.5} />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-normal text-slate-900">{participant?.name}</h3>
                <p className="text-sm text-slate-500 font-medium">{participant?.type}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col items-center gap-8 relative">

                {!audioUrl ? (
                  <div className="flex flex-col items-center gap-6 relative z-10 w-full mt-2">
                    {isRecording ? (
                      <div className="w-full bg-slate-50 border border-slate-200 rounded-full h-16 px-4 flex items-center justify-between shadow-sm animate-in zoom-in-95 duration-300">
                        {/* Recording Timer & Indicator */}
                        <div className="flex items-center gap-2 w-20 shrink-0">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm font-medium text-slate-700 tabular-nums">
                            {formatTime(recordingTime)}
                          </span>
                        </div>

                        {/* Central Waveform Visualizer */}
                        <div className="flex-grow flex items-center justify-center gap-1 mx-4 h-full">
                          {[...Array(24)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 bg-red-400 rounded-full opacity-80"
                              style={{
                                height: '10px',
                                animation: `wave ${0.3 + Math.random() * 0.4}s ease-in-out infinite alternate`,
                                animationDelay: `${Math.random()}s`
                              }}
                            />
                          ))}
                        </div>

                        {/* Stop Button */}
                        <button
                          onClick={stopRecording}
                          className="h-10 w-10 shrink-0 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors border border-red-100"
                          title="Stop Recording"
                        >
                          <Square size={16} fill="currentColor" />
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
                                Please allow microphone access in your browser settings, then tap below.
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
                            className="relative h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md bg-white text-blue-600 border border-slate-100 hover:bg-slate-50 hover:scale-105 active:scale-95"
                          >
                            <Mic size={32} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                    {/* Voice Memo Card */}
                    <div className="relative w-full rounded-[24px] overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 p-6 shadow-xl shadow-indigo-500/20 mb-5">
                      {/* Decorative blurred orb inside card */}
                      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

                      <div className="relative flex items-center gap-4 mb-5">
                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                          <Waves size={22} className="text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">Voice Feedback</p>
                          <p className="text-indigo-200 text-xs font-medium">{formatTime(recordingTime)} recorded</p>
                        </div>
                        <button
                          onClick={resetRecording}
                          className="ml-auto h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                          title="Discard"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Waveform Visualizer (static preview) */}
                      <div className="flex items-center gap-1 h-10 mb-5">
                        {[...Array(36)].map((_, i) => {
                          const heights = [30, 55, 40, 80, 60, 45, 70, 35, 90, 50, 65, 40, 75, 45, 55, 85, 40, 60, 35, 70, 55, 80, 45, 65, 50, 40, 75, 30, 60, 85, 50, 40, 65, 45, 55, 70];
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-white/50 rounded-full"
                              style={{ height: `${heights[i] ?? 40}%` }}
                            />
                          );
                        })}
                      </div>

                      {/* Playback Progress */}
                      <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-white/80 rounded-full" />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={resetRecording}
                        variant="outline"
                        className="flex-1 h-12 rounded-full border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                      >
                        Re-record
                      </Button>
                      <Button
                        onClick={submitFeedback}
                        disabled={isUploading}
                        className="flex-[2] h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all"
                      >
                        {isUploading ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle2 className="mr-2" size={18} />}
                        {isUploading ? "Submitting..." : "Submit Feedback"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
