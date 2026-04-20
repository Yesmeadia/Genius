"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { YesianRegistration } from "../../types";
import { locations } from "@/data/locations";
import {
  ArrowLeft, Calendar, User, ShieldCheck, Phone,
  Pencil, X, Check, Camera, Loader2, UploadCloud,
  Moon, Bell, MapPin, Briefcase, Download
} from "lucide-react";
import { generateBatchAccessPasses } from "@/lib/exportUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardSidebar } from "../../components/DashboardSidebar";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import JsBarcode from "jsbarcode";

interface YesianEditForm {
  name: string;
  gender: string;
  whatsappNumber: string;
  zone: string;
  designation: string;
}

export default function YesianProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true);
  const [registration, setRegistration] = useState<YesianRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sidebar state (inherited from dashboard context)
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<YesianEditForm | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    const fetchYesian = async () => {
      try {
        const docRef = doc(db, "yesian_registrations", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRegistration({ id: docSnap.id, ...docSnap.data() } as YesianRegistration);
        } else {
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Error fetching yesian:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchYesian();
  }, [id, user, router]);

  useGSAP(() => {
    if (!loading && registration) {
      gsap.from(".profile-card", {
        opacity: 0, y: 30, duration: 0.8, ease: "power3.out", stagger: 0.1
      });
    }
  }, { dependencies: [loading, registration], scope: containerRef });

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  const getZoneName = (zoneId: string) => {
    const zone = locations.find(z => z.id === zoneId);
    return zone ? zone.name : zoneId;
  };

  const enterEditMode = () => {
    if (!registration) return;
    setEditForm({
      name: registration.name || "",
      gender: registration.gender || "",
      whatsappNumber: registration.whatsappNumber || "",
      zone: registration.zone || "",
      designation: registration.designation || "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditForm(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const updateField = (field: keyof YesianEditForm, value: any) => {
    setEditForm(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!editForm || !id) return;
    setSaving(true);
    try {
      let photoUrl = registration?.photoUrl || "";
      if (photoFile) {
        const storageRef = ref(storage, `photos/yesian_${Date.now()}_${photoFile.name}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }
      const updateData: any = {
        name: editForm.name.toUpperCase(),
        gender: editForm.gender,
        whatsappNumber: editForm.whatsappNumber,
        zone: editForm.zone,
        designation: editForm.designation.toUpperCase(),
        photoUrl,
      };
      await updateDoc(doc(db, "yesian_registrations", id as string), updateData);
      setRegistration(prev => (prev ? { ...prev, ...updateData } : prev));
      setEditMode(false);
      setEditForm(null);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  if (authLoading || loading) {
    return (
      <div className="bg-slate-50 flex font-figtree font-normal">
        <DashboardSidebar
          sidebarOpen={true}
          setSidebarOpen={setSidebarOpen}
          activeTab="yesians"
          setActiveTab={() => router.push("/admin/dashboard")}
          onSignOut={handleSignOut}
        />
        <div className="flex-grow flex flex-col min-h-screen p-8 gap-6">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[500px] lg:col-span-1 rounded-3xl" />
            <Skeleton className="h-[500px] lg:col-span-2 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!registration) return null;

  const currentPhoto = photoPreview || registration.photoUrl;

  return (
    <div className="bg-slate-50 flex font-figtree font-normal">
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab="yesians"
        setActiveTab={(tab) => router.push("/admin/dashboard")}
        onSignOut={handleSignOut}
      />

      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="bg-white/70 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-0 border-b border-slate-100">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div>
              <h1 className="text-lg md:text-xl font-normal text-slate-900 leading-none">
                Yesian Profile
              </h1>
              <p className="text-[10px] font-normal text-slate-400 uppercase tracking-widest mt-1">
                {registration.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto justify-end">
             <div className="flex items-center gap-2 pr-4 lg:pr-6 border-r border-slate-100">
              <Button variant="ghost" size="icon" className="rounded-2xl h-10 w-10 text-slate-400 hover:bg-slate-50">
                <Moon size={20} />
              </Button>
              <div className="relative">
                <Button variant="ghost" size="icon" className="rounded-2xl h-10 w-10 text-slate-400 hover:bg-slate-50">
                  <Bell size={20} />
                </Button>
                <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-normal animate-pulse">1</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[13px] font-normal text-slate-900 leading-none">Administrator</div>
                <div className="text-[10px] font-normal text-slate-400 uppercase tracking-widest mt-1">Admin</div>
              </div>
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`} />
                <AvatarFallback className="bg-indigo-600 text-white font-normal text-xs">AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-10 flex-grow">
          <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="group h-10 px-4 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white transition-all border border-transparent hover:border-slate-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
              </Button>

              <div className="flex items-center gap-3">
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="h-10 rounded-xl border-slate-200 text-slate-600 font-normal uppercase text-[10px] tracking-widest"
                    >
                      <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-normal uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-100"
                    >
                      {saving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                      ) : (
                        <><Check className="mr-2 h-4 w-4" /> Save Changes</>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={enterEditMode}
                      className="h-10 rounded-xl border-slate-200 text-slate-600 font-normal uppercase text-[10px] tracking-widest hover:bg-slate-50"
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit Record
                    </Button>
                    <Button
                      onClick={() => generateBatchAccessPasses([registration], `AccessPass_${registration.name.replace(/\s+/g, '_')}`, 'yesian')}
                      className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-normal uppercase text-[10px] tracking-widest shadow-lg shadow-amber-100"
                    >
                      <Download className="mr-2 h-4 w-4" /> Download ID
                    </Button>
                  </>
                )}
              </div>
            </div>

            {editMode && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3">
                <Pencil size={14} className="text-amber-500 shrink-0" />
                <p className="text-[11px] font-normal text-amber-700 uppercase tracking-widest">
                  Edit Mode Active — Update Yesian details below
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Profile Photo */}
              <div className="lg:col-span-3 space-y-6">
                <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
                  <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 group">
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      {currentPhoto ? (
                        <img src={currentPhoto} alt={registration.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={64} strokeWidth={1} />
                      )}
                    </div>

                    {editMode && (
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <UploadCloud size={36} strokeWidth={1.5} />
                        <span className="text-xs font-normal uppercase tracking-widest">Change Photo</span>
                      </button>
                    )}

                    <input
                      ref={photoInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>

                  <CardContent className="p-8 text-center">
                    {editMode ? (
                      <div className="space-y-4 text-left">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Full Name</Label>
                          <Input
                            value={editForm?.name || ""}
                            onChange={e => updateField("name", e.target.value.toUpperCase())}
                            className="uppercase font-normal text-slate-900 border-slate-100 bg-slate-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Gender</Label>
                          <div className="flex gap-4 py-1">
                            {["male","female"].map(g => (
                              <label key={g} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  value={g}
                                  checked={editForm?.gender === g}
                                  onChange={() => updateField("gender", g)}
                                  className="w-4 h-4 text-amber-600"
                                />
                                <span className="text-sm font-medium text-slate-700 capitalize">{g}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-normal text-slate-900 leading-tight mb-2 tracking-tight">
                          {registration.name}
                        </h2>
                        <p className="text-sm font-normal text-amber-600 uppercase tracking-[0.2em] mb-6">
                          {registration.designation}
                        </p>
                        <div className="flex flex-col items-center gap-1.5 pt-4 border-t border-slate-50">
                          <canvas
                            ref={(canvas) => {
                              if (canvas && registration?.id) {
                                JsBarcode(canvas, registration.id, {
                                  format: "CODE128",
                                  lineColor: "#1e293b",
                                  width: 1.4,
                                  height: 44,
                                  displayValue: false,
                                  margin: 0,
                                });
                              }
                            }}
                            className="w-full max-w-[200px]"
                          />
                          <div className="text-[9px] font-mono font-normal text-slate-400 tracking-[0.18em] uppercase">
                            {registration.id.substring(0, 8)}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="profile-card border-none shadow-md rounded-2xl bg-white p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-normal uppercase text-slate-400 tracking-widest border-b border-slate-50 pb-3">
                      <span>Registration</span>
                      <span className="text-emerald-500 flex items-center gap-1">
                        <ShieldCheck size={14} /> Confirmed
                      </span>
                    </div>
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] font-normal text-slate-400 uppercase tracking-widest leading-none mb-1">Joined Date</div>
                        <div className="text-sm font-normal text-slate-700">{formatDate(registration.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Personal Details */}
              <div className="lg:col-span-9 space-y-8">
                <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
                  <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-3">
                      <Briefcase className="text-amber-600" size={22} />
                      Professional & Contact Details
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-normal pt-1">Yesian member assignment</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    {editMode ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Zone Assignment</Label>
                          <Select value={editForm?.zone || ""} onValueChange={v => updateField("zone", v)}>
                            <SelectTrigger className="border-slate-100 bg-slate-50">
                              <SelectValue placeholder="Select Zone" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map(z => (
                                <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Designation</Label>
                          <Input
                            value={editForm?.designation || ""}
                            onChange={e => updateField("designation", e.target.value.toUpperCase())}
                            className="uppercase border-slate-100 bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">WhatsApp Number</Label>
                          <Input
                            type="tel"
                            value={editForm?.whatsappNumber || ""}
                            onChange={e => updateField("whatsappNumber", e.target.value)}
                            className="border-slate-100 bg-slate-50"
                            maxLength={10}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-8">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                              <MapPin size={24} />
                            </div>
                            <div>
                              <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Zone Assignment</div>
                              <div className="text-base font-normal text-slate-800 leading-snug">{getZoneName(registration.zone)}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                              <Briefcase size={24} />
                            </div>
                            <div>
                              <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Designation</div>
                              <div className="text-base font-normal text-slate-800 leading-snug uppercase">{registration.designation}</div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-8">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                              <Phone size={24} />
                            </div>
                            <div>
                              <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">WhatsApp Number</div>
                              <div className="text-base font-normal text-slate-800 leading-snug">{registration.whatsappNumber}</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 font-normal uppercase tracking-widest gap-4">
              <div>&copy; {new Date().getFullYear()} YES INDIA FOUNDATION. ALL RIGHTS RESERVED.</div>
              <div>DESIGNED AND DEVELOPED BY CYBERDUCE</div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
