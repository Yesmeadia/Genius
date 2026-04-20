"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AlumniRegistration } from "../../types";
import { locations } from "@/data/locations";
import {
  ArrowLeft, Calendar, User, ShieldCheck, Phone,
  Pencil, X, Check, Loader2, UploadCloud,
  MapPin, GraduationCap, Download
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
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import JsBarcode from "jsbarcode";

interface AlumniEditForm {
  name: string;
  gender: string;
  whatsappNumber: string;
  zone: string;
  school: string;
  category: string;
  className: string;
}

export default function AlumniProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true);
  const [registration, setRegistration] = useState<AlumniRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<AlumniEditForm | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    const fetchAlumni = async () => {
      try {
        const docRef = doc(db, "alumni_registrations", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRegistration({ id: docSnap.id, ...docSnap.data() } as AlumniRegistration);
        } else {
          router.push("/admin/dashboard/alumni-achievers");
        }
      } catch (error) {
        console.error("Error fetching alumni:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlumni();
  }, [id, user, router]);

  useGSAP(() => {
    if (!loading && registration) {
      gsap.from(".profile-card", {
        opacity: 0, y: 30, duration: 0.8, ease: "power3.out", stagger: 0.1
      });
    }
  }, { dependencies: [loading, registration], scope: containerRef });

  const getZoneName = (zoneId: string) => {
    const zone = locations.find(z => z.id === zoneId || z.name === zoneId);
    return zone ? zone.name : zoneId;
  };

  const getSchoolName = (zoneId: string, schoolIdOrName: string) => {
    const zone = locations.find(z => z.id === zoneId || z.name === zoneId);
    if (!zone) return schoolIdOrName;
    const school = zone.schools.find(s => s.id === schoolIdOrName || s.name === schoolIdOrName);
    return school ? school.name : schoolIdOrName;
  };

  const enterEditMode = () => {
    if (!registration) return;
    setEditForm({
      name: registration.name || "",
      gender: registration.gender || "",
      whatsappNumber: registration.whatsappNumber || "",
      zone: registration.zone || "",
      school: registration.school || "",
      category: registration.category || "",
      className: registration.className || "",
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

  const updateField = (field: keyof AlumniEditForm, value: string) => {
    setEditForm(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!editForm || !id) return;
    setSaving(true);
    try {
      let photoUrl = registration?.photoUrl || "";
      if (photoFile) {
        const storageRef = ref(storage, `photos/alumni/${Date.now()}_${photoFile.name}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }
      const updateData = {
        name: editForm.name.toUpperCase(),
        gender: editForm.gender,
        whatsappNumber: editForm.whatsappNumber,
        zone: editForm.zone,
        school: editForm.school,
        category: editForm.category,
        className: editForm.className,
        photoUrl,
      };
      await updateDoc(doc(db, "alumni_registrations", id as string), updateData);
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
    let date: Date;
    if (typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col p-8 gap-6 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[500px] lg:col-span-1 rounded-3xl" />
          <Skeleton className="h-[500px] lg:col-span-2 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!registration) return null;

  const currentPhoto = photoPreview || registration.photoUrl;

  const classesForCategory = (cat: string) => {
    switch (cat) {
      case "Rainbow": return ["3rd", "4th", "5th"];
      case "Planets": return ["6th", "7th", "8th"];
      case "Galaxy": return ["9th", "10th", "11th", "12th"];
      default: return [];
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="group h-10 px-4 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white transition-all border border-transparent hover:border-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Database
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
                  className="h-10 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-normal uppercase text-[10px] tracking-widest shadow-lg shadow-pink-100"
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
                  onClick={() => generateBatchAccessPasses([registration as any], `AccessPass_${registration.name.replace(/\s+/g, '_')}`, 'alumni-achiever')}
                  className="h-10 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-normal uppercase text-[10px] tracking-widest shadow-lg shadow-pink-100"
                >
                  <Download className="mr-2 h-4 w-4" /> Download ID
                </Button>
              </>
            )}
          </div>
        </div>

        {editMode && (
          <div className="flex items-center gap-3 bg-pink-50 border border-pink-100 rounded-2xl px-5 py-3">
            <Pencil size={14} className="text-pink-500 shrink-0" />
            <p className="text-[11px] font-normal text-pink-700 uppercase tracking-widest">
              Edit Mode Active — Update Alumni details below
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
                        {["MALE", "FEMALE"].map(g => (
                          <label key={g} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value={g}
                              checked={editForm?.gender === g}
                              onChange={() => updateField("gender", g)}
                              className="w-4 h-4 text-pink-600"
                            />
                            <span className="text-sm font-medium text-slate-700 capitalize">{g.toLowerCase()}</span>
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
                    <p className="text-sm font-normal text-pink-600 uppercase tracking-[0.2em] mb-6">
                      ALUMNI ACHIEVER
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
                  <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
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
                  <GraduationCap className="text-pink-600" size={22} />
                  Academic & Contact Details
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-normal pt-1">Alumni Academic Information</CardDescription>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                {editMode ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Zone Assignment</Label>
                      <Select
                        value={editForm?.zone || ""}
                        onValueChange={v => {
                          updateField("zone", v);
                          updateField("school", "");
                        }}
                      >
                        <SelectTrigger className="border-slate-100 bg-slate-50">
                          <SelectValue placeholder="Select Zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(z => (
                            <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Select School</Label>
                      <Select
                        value={editForm?.school || ""}
                        onValueChange={v => updateField("school", v)}
                        disabled={!editForm?.zone}
                      >
                        <SelectTrigger className="border-slate-100 bg-slate-50 [&>span]:line-clamp-none">
                          <SelectValue placeholder={editForm?.zone ? "Select School" : "Select Zone First"} />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.find(z => z.name === editForm?.zone)?.schools.map(s => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Category</Label>
                      <Select
                        value={editForm?.category || ""}
                        onValueChange={v => {
                          updateField("category", v);
                          updateField("className", "");
                        }}
                      >
                        <SelectTrigger className="border-slate-100 bg-slate-50">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Rainbow">Rainbow</SelectItem>
                          <SelectItem value="Planets">Planets</SelectItem>
                          <SelectItem value="Galaxy">Galaxy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Class</Label>
                      <Select
                        value={editForm?.className || ""}
                        onValueChange={v => updateField("className", v)}
                        disabled={!editForm?.category}
                      >
                        <SelectTrigger className="border-slate-100 bg-slate-50">
                          <SelectValue placeholder={editForm?.category ? "Select Class" : "Select Category First"} />
                        </SelectTrigger>
                        <SelectContent>
                          {classesForCategory(editForm?.category || "").map(cls => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <div className="h-12 w-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Zone & School</div>
                          <div className="text-base font-normal text-slate-800 leading-snug">
                            {getZoneName(registration.zone)}
                            <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-tight">
                              {getSchoolName(registration.zone, registration.school)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                          <GraduationCap size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Class & Category</div>
                          <div className="text-base font-normal text-slate-800 leading-snug uppercase font-bold tracking-widest">
                            {registration.className || "N/A"}
                            <div className="text-[11px] text-pink-600 font-medium mt-1 uppercase tracking-tight">
                              {registration.category || "N/A"}
                            </div>
                          </div>
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
      </div>
    </div>
  );
}
