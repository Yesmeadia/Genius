"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, Volume2, Calendar, Play, Pause, Waves, Loader2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Feedback {
  id: string;
  participantId: string;
  participantName: string;
  participantType: string;
  audioUrl?: string;
  textFeedback?: string;
  createdAt: Timestamp | Date;
  status: string;
}

interface VoiceFeedbackCardProps {
  participantId: string;
}

export function VoiceFeedbackCard({ participantId }: VoiceFeedbackCardProps) {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const q = query(
          collection(db, "feedback"),
          where("participantId", "==", participantId)
        );
        const querySnapshot = await getDocs(q);
        const feedbackData: Feedback[] = [];
        querySnapshot.forEach((doc) => {
          feedbackData.push({ id: doc.id, ...doc.data() } as Feedback);
        });

        // Sort by createdAt descending in memory to avoid index requirement
        feedbackData.sort((a, b) => {
          const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
          const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });

        setFeedbackList(feedbackData);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      } finally {
        setLoading(false);
      }
    };

    if (participantId) {
      fetchFeedback();
    }
  }, [participantId]);

  const markReviewed = async (id: string) => {
    try {
      import("firebase/firestore").then(async ({ doc, updateDoc }) => {
        await updateDoc(doc(db, "feedback", id), { status: 'reviewed' });
        setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: 'reviewed' } : f));
      });
    } catch (error) {
      console.error("Mark error:", error);
    }
  };

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      audio?.pause();
      markReviewed(id);
      setPlayingId(null);
    } else {
      if (audio) {
        audio.pause();
      }
      const newAudio = new Audio(url);
      newAudio.play();
      newAudio.onended = () => {
        markReviewed(id);
        setPlayingId(null);
      };
      setAudio(newAudio);
      setPlayingId(id);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    let date: Date;
    if (typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <Card className="border-none shadow-md rounded-3xl bg-white overflow-hidden animate-pulse">
        <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400">Loading feedback...</p>
        </CardContent>
      </Card>
    );
  }

  if (feedbackList.length === 0) {
    return null; // Don't show anything if there's no feedback
  }

  return (
    <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden transition-all duration-500">
      <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
        <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <MessageSquare size={22} />
          </div>
          Participant Feedback
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-normal pt-1">
          Most recent feedback entry
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {feedbackList.map((feedback) => (
          <div key={feedback.id} className="relative group">
            <div className="relative w-full rounded-[24px] overflow-hidden bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border border-slate-100 p-5 transition-all duration-300">
              {feedback.audioUrl ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => togglePlay(feedback.id, feedback.audioUrl!)}
                    className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
                  >
                    {playingId === feedback.id ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                  </button>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800">Voice Note</span>
                      <Badge variant="outline" className="text-[9px] h-4 uppercase tracking-tighter border-indigo-100 bg-indigo-50/30 text-indigo-600">
                        {feedback.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(feedback.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 h-8 px-2">
                     {[...Array(12)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-0.5 rounded-full transition-all duration-500 ${playingId === feedback.id ? 'bg-indigo-500 animate-wave' : 'bg-indigo-200'}`}
                        style={{ 
                          height: playingId === feedback.id ? `${20 + Math.random() * 80}%` : '40%',
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.4s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : feedback.textFeedback ? (
                <div className="space-y-3" onClick={() => feedback.status === 'new' && markReviewed(feedback.id)}>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <MessageSquare size={16} className="text-indigo-500" />
                       <span className="text-sm font-semibold text-slate-800">Text Feedback</span>
                     </div>
                     <Badge variant="outline" className="text-[9px] h-4 uppercase tracking-tighter border-indigo-100 bg-indigo-50/30 text-indigo-600">
                       {feedback.status}
                     </Badge>
                   </div>
                   <p className="text-sm text-slate-600 leading-relaxed italic">
                     "{feedback.textFeedback}"
                   </p>
                   <div className="flex items-center gap-1 text-xs text-slate-400 font-medium pt-1">
                      <Calendar size={12} />
                      {formatDate(feedback.createdAt)}
                   </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
      <style jsx>{`
        @keyframes wave {
          0% { height: 20%; }
          100% { height: 100%; }
        }
        .animate-wave {
          animation: wave 0.4s ease-in-out infinite alternate;
        }
      `}</style>
    </Card>
  );
}
