"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Registration } from "../../types";
import {
  ArrowLeft, Calendar, User, BookOpen, MapPin,
  School, ShieldCheck, Mail, Phone, Download, Printer, CreditCard
} from "lucide-react";
import { generateAccessPass } from "@/lib/exportUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchStudent = async () => {
      try {
        const docRef = doc(db, "registrations", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRegistration({ id: docSnap.id, ...docSnap.data() } as Registration);
        } else {
          console.error("No such document!");
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Error fetching student:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, user, router]);

  useGSAP(() => {
    if (!loading && registration) {
      gsap.from(".profile-card", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1
      });
    }
  }, { dependencies: [loading, registration], scope: containerRef });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col gap-6">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-50 font-figtree">
          <Skeleton className="h-[500px] lg:col-span-1 rounded-3xl" />
          <Skeleton className="h-[500px] lg:col-span-2 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!registration) return null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-figtree">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="group h-10 px-4 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white transition-all border border-transparent hover:border-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-10 rounded-xl border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest">
              <Printer className="mr-2 h-4 w-4" /> Print Entry
            </Button>
            <Button 
              onClick={() => generateAccessPass(registration)}
              className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100"
            >
              <Download className="mr-2 h-4 w-4" /> Download ID
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Photo & Quick Info */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
              <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 group">
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  {registration.photoUrl ? (
                    <img src={registration.photoUrl} alt={registration.studentName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} strokeWidth={1} />
                  )}
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/90 backdrop-blur text-slate-900 border-none shadow-sm px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-tighter">
                    {registration.gender}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-8 text-center">
                <h1 className="text-2xl font-black text-slate-900 leading-tight mb-2 tracking-tight">
                  {registration.studentName}
                </h1>
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-[0.2em] mb-6">
                  Class {registration.className}
                </p>

                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-none px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight">
                    Ref ID: {registration.id.substring(0, 8)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="profile-card border-none shadow-md rounded-2xl bg-white p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-50 pb-3">
                  <span>Registration Status</span>
                  <span className="text-emerald-500 flex items-center gap-1">
                    <ShieldCheck size={14} /> Confirmed
                  </span>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Created At</div>
                    <div className="text-sm font-bold text-slate-700">{formatDate(registration.createdAt)}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Detailed Info */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-3">
                  <BookOpen className="text-indigo-600" size={22} />
                  Academic & Location Details
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-bold pt-1">Primary registration information</CardDescription>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <School size={24} />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Educational Institution</div>
                      <div className="text-base font-bold text-slate-800 leading-snug">{registration.schoolName || registration.school}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Zone Assignment</div>
                      <div className="text-base font-bold text-slate-800 leading-snug">{registration.zone}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Parentage</div>
                      <div className="text-base font-bold text-slate-800 leading-snug uppercase">{registration.parentage}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-3">
                  <ShieldCheck className="text-emerald-600" size={22} />
                  Guardian Accompaniment
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-bold pt-1">Details for event access card generation</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {registration.withParent ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                          <User size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Guardian Name</div>
                          <div className="text-base font-bold text-slate-800 leading-snug uppercase">{registration.parentName}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Relation</div>
                          <div className="text-base font-bold text-slate-800 leading-snug uppercase">{registration.relation}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                          <User size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Guardian Gender</div>
                          <div className="text-base font-bold text-slate-800 leading-snug uppercase">{registration.parentGender}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                      <User size={32} />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">Individual Participation</h3>
                    <p className="text-slate-400 text-sm max-w-xs">This student is registered as an individual and will not be accompanied by a guardian.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
