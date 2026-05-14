"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  MessageSquare, Play, Pause, Trash2, Calendar, User,
  Tag, Download, Loader2, CheckCircle2, Clock, Volume2, Search, Filter, RefreshCcw, Waves, Mic
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDashboardData } from "../components/DashboardDataContext";
import { locations } from "@/data/locations";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Feedback {
  id: string;
  participantId: string;
  participantName: string;
  participantType: string;
  audioUrl?: string;
  textFeedback?: string;
  createdAt: any;
  status: 'new' | 'reviewed';
}

export default function FeedbackAdminPage() {
  const router = useRouter();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [guardianRegistrations, setGuardianRegistrations] = useState<any[]>([]);

  const {
    registrations,
    guestRegistrations,
    yesianRegistrations,
    localStaffRegistrations,
    alumniRegistrations,
    volunteerRegistrations,
    awardeeRegistrations,
    qiraathRegistrations,
    driverStaffRegistrations,
    scoutTeamRegistrations,
  } = useDashboardData();

  const participantMap = React.useMemo(() => {
    const all = [
      ...registrations,
      ...guestRegistrations,
      ...yesianRegistrations,
      ...localStaffRegistrations,
      ...alumniRegistrations,
      ...volunteerRegistrations,
      ...awardeeRegistrations,
      ...qiraathRegistrations,
      ...driverStaffRegistrations,
      ...scoutTeamRegistrations,
      ...guardianRegistrations,
    ];
    return new Map(all.map(r => [r.id, r]));
  }, [
    registrations, guestRegistrations, yesianRegistrations, localStaffRegistrations,
    alumniRegistrations, volunteerRegistrations, awardeeRegistrations, qiraathRegistrations,
    driverStaffRegistrations, scoutTeamRegistrations, guardianRegistrations
  ]);

  const getSchoolName = (schoolId: string) => {
    if (!schoolId) return "-";
    for (const zone of locations) {
      const school = zone.schools.find((s) => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  useEffect(() => {
    fetchFeedback();
    fetchGuardians();
  }, []);

  const fetchGuardians = async () => {
    try {
      const snap = await getDocs(collection(db, "guardian_data"));
      setGuardianRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Guardian fetch error:", e);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
      setFeedbackList(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      markReviewed(id);
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingId(id);
      }
    }
  };

  const markReviewed = async (id: string) => {
    try {
      await updateDoc(doc(db, "feedback", id), { status: 'reviewed' });
      setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: 'reviewed' } : f));
    } catch (error) {
      console.error("Mark error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    try {
      await deleteDoc(doc(db, "feedback", id));
      setFeedbackList(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    }).format(date);
  };

  const downloadExcel = () => {
    const exportData = filteredFeedback.map(f => {
      const pData: any = participantMap.get(f.participantId);
      const zone = pData?.zone || "-";
      const rawSchool = pData?.school || pData?.schoolName || pData?.designation || pData?.address || "-";
      const displaySchool = getSchoolName(rawSchool) !== rawSchool ? getSchoolName(rawSchool) : rawSchool;

      return {
        'Timestamp': formatDate(f.createdAt),
        'Participant Name': f.participantName,
        'Category': f.participantType,
        'Campus/School': displaySchool,
        'Zone': zone,
        'Designation/Class': pData?.designation || pData?.className || "-",
        'Feedback Type': f.audioUrl ? 'Voice' : 'Text',
        'Feedback Content': f.audioUrl || f.textFeedback || "-",
        'Status': f.status,
        'Attendance': pData?.attendance ? 'Present' : 'Absent'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `GeniusJam_Feedback_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredFeedback = feedbackList.filter(f => {
    const matchesSearch = f.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.participantType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'voice' ? !!f.audioUrl : !!f.textFeedback;
    return matchesSearch && matchesTab;
  });

  return (
    <div ref={containerRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">

        {/* Header Controls */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-50 bg-white">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <Input
              placeholder="Quick search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 rounded-xl border-none bg-slate-50 text-sm focus-visible:ring-1 focus-visible:ring-slate-200"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                onClick={() => setActiveTab('voice')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'voice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Voice
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Text
              </button>
            </div>
            <Button onClick={downloadExcel} variant="outline" className="h-10 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-indigo-600 transition-all shadow-sm flex items-center gap-2">
              <Download size={14} />
              Export Excel
            </Button>
            <Button onClick={fetchFeedback} variant="outline" className="h-10 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-600 transition-all shadow-sm flex items-center gap-2">
              <RefreshCcw size={14} className={`${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <audio
          ref={audioRef}
          onEnded={() => {
            if (playingId) markReviewed(playingId);
            setPlayingId(null);
          }}
          className="hidden"
        />

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Records...</p>
          </div>
        ) : filteredFeedback.length > 0 ? (
          <div className="overflow-x-auto w-full bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8 h-auto align-bottom pb-4">
                    Participant
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-auto align-bottom pb-4">
                    Campus & Zone
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-auto align-bottom pb-4">
                    Designation
                  </TableHead>
                  {activeTab === 'voice' && (
                    <TableHead className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[240px] h-auto align-bottom pb-4">
                      Audio Player
                    </TableHead>
                  )}
                  <TableHead className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-auto align-bottom pb-4">
                    Attendance
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-auto align-bottom pb-4">
                    Status
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-auto align-bottom pb-4 text-center">
                    Action
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right pr-8 h-auto align-bottom pb-4">
                    Timestamp
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.map((f) => {
                  const pData: any = participantMap.get(f.participantId);
                  const isAttended = pData?.attendance === true;
                  const zone = pData?.zone || "-";
                  const rawSchool = pData?.school || pData?.schoolName || pData?.designation || pData?.address || "-";
                  const displaySchool = getSchoolName(rawSchool) !== rawSchool ? getSchoolName(rawSchool) : rawSchool;
                  const isYesian = f.participantType.toLowerCase().includes('yesian');

                  return (
                    <TableRow key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border-0 bg-slate-50">
                            <AvatarImage src={pData?.photoUrl} />
                            <AvatarFallback className="bg-slate-100 text-slate-400">
                              <User size={18} />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-sm uppercase">{f.participantName}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{f.participantType}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700 text-xs uppercase truncate max-w-[200px]" title={displaySchool}>
                            {displaySchool}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                            {isYesian ? 'YESIAN ZONE' : zone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {pData?.designation || pData?.className || "-"}
                        </span>
                      </TableCell>
                      {activeTab === 'voice' && (
                        <TableCell className="py-5">
                          <div className="flex items-center gap-3 max-w-[200px]">
                            <button
                              onClick={() => togglePlay(f.id, f.audioUrl!)}
                              className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all ${playingId === f.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            >
                              {playingId === f.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                            </button>
                            <div className="flex-grow h-1 bg-slate-100 rounded-full overflow-hidden flex items-center">
                              {playingId === f.id ? (
                                <div className="flex items-center h-full w-full gap-[2px]">
                                  {[...Array(12)].map((_, i) => (
                                    <div key={i} className="flex-1 bg-indigo-400 rounded-full" style={{ height: `${Math.max(20, Math.random() * 100)}%`, animation: `pulse-wave ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate` }} />
                                  ))}
                                </div>
                              ) : (
                                <div className="h-full w-0 bg-slate-300" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="py-5">
                        {isAttended ? (
                          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                            <span className="text-[9px] font-black uppercase tracking-widest">Present</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                            <span className="text-[9px] font-black uppercase tracking-widest">Absent</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-5">
                        {f.status === 'new' ? (
                          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                            <span className="text-[9px] font-black uppercase tracking-widest">New</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                            <span className="text-[9px] font-black uppercase tracking-widest">Reviewed</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-5 text-center flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const type = f.participantType.toLowerCase();
                            let route = 'student';
                            if (type.includes('guest')) route = 'guest';
                            else if (type.includes('yesian')) route = 'yesian';
                            else if (type.includes('local staff')) route = 'local-staff';
                            else if (type.includes('alumni')) route = 'alumni-achievers';
                            else if (type.includes('volunteer')) route = 'volunteers';
                            else if (type.includes('awardee')) route = 'awardee';
                            else if (type.includes('qiraath')) route = 'qiraath';
                            else if (type.includes('driver')) route = 'driver-staff';
                            else if (type.includes('scout')) route = 'scout-team';
                            else if (type.includes('media')) route = 'media';
                            else if (type.includes('guardian')) {
                              router.push(`/admin/dashboard/guardian-data`);
                              return;
                            }
                            
                            router.push(`/admin/dashboard/${route}/${f.participantId}`);
                          }}
                          className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-[10px] font-bold uppercase"
                        >
                          View Profile
                        </Button>
                        <button onClick={() => handleDelete(f.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors inline-flex">
                          <Trash2 size={16} />
                        </button>
                      </TableCell>
                      <TableCell className="py-5 text-right pr-8">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                          {formatDate(f.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
              <MessageSquare size={32} className="text-slate-300" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">No records found</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                No feedback matches your search criteria.
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-wave {
          0% { transform: scaleY(0.3); opacity: 0.5; }
          100% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
