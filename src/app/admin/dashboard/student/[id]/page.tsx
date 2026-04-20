"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { Registration } from "../../types";
import { locations } from "@/data/locations";
import {
  ArrowLeft, Calendar, User, BookOpen, MapPin,
  School, ShieldCheck, Phone, Download,
  Pencil, X, Check, Camera, Loader2, UploadCloud,
  Moon, Bell
} from "lucide-react";
import { generateBatchAccessPasses } from "@/lib/exportUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import JsBarcode from "jsbarcode";

interface EditForm {
  studentName: string;
  parentage: string;
  className: string;
  gender: string;
  zone: string;
  school: string;
  mobileNumber: string;
  withParent: boolean;
  parentName: string;
  parentGender: string;
  relation: string;
}

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    const fetchStudent = async () => {
      try {
        const docRef = doc(db, "registrations", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRegistration({ id: docSnap.id, ...docSnap.data() } as Registration);
        } else {
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
        opacity: 0, y: 30, duration: 0.8, ease: "power3.out", stagger: 0.1
      });
    }
  }, { dependencies: [loading, registration], scope: containerRef });

  // Locations helpers
  const schoolsForZone = useMemo(() => {
    if (!editForm?.zone) return [];
    const zone = locations.find(z => z.id === editForm.zone);
    return zone ? zone.schools : [];
  }, [editForm?.zone]);

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find(s => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  const getZoneName = (zoneId: string) => {
    const zone = locations.find(z => z.id === zoneId);
    return zone ? zone.name : zoneId;
  };

  const enterEditMode = () => {
    if (!registration) return;
    setEditForm({
      studentName: registration.studentName || "",
      parentage: registration.parentage || "",
      className: registration.className || "",
      gender: registration.gender || "",
      zone: registration.zone || "",
      school: registration.school || "",
      mobileNumber: registration.mobileNumber || "",
      withParent: registration.withParent || false,
      parentName: registration.parentName || "",
      parentGender: registration.parentGender || "",
      relation: registration.relation || "",
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

  const updateField = (field: keyof EditForm, value: string | boolean) => {
    setEditForm(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      if (field === "zone") updated.school = "";
      return updated;
    });
  };

  const handleSave = async () => {
    if (!editForm || !id) return;
    setSaving(true);
    try {
      let photoUrl = registration?.photoUrl || "";
      if (photoFile) {
        const storageRef = ref(storage, `photos/${Date.now()}_${photoFile.name}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }
      const updateData = {
        studentName: editForm.studentName.toUpperCase(),
        parentage: editForm.parentage.toUpperCase(),
        className: editForm.className,
        gender: editForm.gender,
        zone: editForm.zone,
        school: editForm.school,
        mobileNumber: editForm.mobileNumber,
        withParent: editForm.withParent,
        parentName: editForm.withParent ? editForm.parentName.toUpperCase() : "",
        parentGender: editForm.withParent ? editForm.parentGender : "",
        relation: editForm.withParent ? editForm.relation.toUpperCase() : "",
        photoUrl,
      };
      await updateDoc(doc(db, "registrations", id as string), updateData);
      setRegistration(prev => prev ? { ...prev, ...updateData } : prev);
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">

        {/* Sub-header: Back + Action Buttons */}
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
                  onClick={() => generateBatchAccessPasses([registration], `AccessPass_${registration.studentName.replace(/\s+/g, '_')}`, 'student')}
                  className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-normal uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100"
                >
                  <Download className="mr-2 h-4 w-4" /> Download ID
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Edit Mode Banner */}
        {editMode && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3">
            <Pencil size={14} className="text-amber-500 shrink-0" />
            <p className="text-[11px] font-normal text-amber-700 uppercase tracking-widest">
              Edit Mode Active — Make your changes below, then click Save Changes
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Photo & Quick Info */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
              <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 group">
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  {currentPhoto ? (
                    <img src={currentPhoto} alt={registration.studentName} className="w-full h-full object-cover" />
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

                <div className="absolute top-4 right-4">
                  {editMode ? (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-1.5 bg-white/90 backdrop-blur text-slate-700 border-none shadow-sm px-3 py-1.5 rounded-xl font-normal text-[10px] uppercase tracking-tighter hover:bg-white transition-colors"
                    >
                      <Camera size={12} /> Upload
                    </button>
                  ) : (
                    <Badge className="bg-white/90 backdrop-blur text-slate-900 border-none shadow-sm px-3 py-1.5 rounded-xl font-normal text-[10px] uppercase tracking-tighter">
                      {registration.gender}
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-8 text-center">
                {editMode ? (
                  <div className="space-y-3 text-left">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Full Name</Label>
                      <Input
                        value={editForm?.studentName || ""}
                        onChange={e => updateField("studentName", e.target.value.toUpperCase())}
                        className="uppercase font-normal text-center text-slate-900 border-slate-100 bg-slate-50 focus-visible:ring-indigo-200"
                        placeholder="Student Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Class</Label>
                      <Select value={editForm?.className || ""} onValueChange={v => updateField("className", v)}>
                        <SelectTrigger className="border-slate-100 bg-slate-50">
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {["3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"].map(cls => (
                            <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Gender</Label>
                      <div className="flex gap-4 py-1">
                        {["Male","Female"].map(g => (
                          <label key={g} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value={g}
                              checked={editForm?.gender === g}
                              onChange={() => updateField("gender", g)}
                              className="w-4 h-4 text-indigo-600"
                            />
                            <span className="text-sm font-medium text-slate-700">{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-normal text-slate-900 leading-tight mb-2 tracking-tight">
                      {registration.studentName}
                    </h2>
                    <p className="text-sm font-normal text-indigo-600 uppercase tracking-[0.2em] mb-4">
                      Class {registration.className}
                    </p>
                    <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-slate-50">
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
                              background: "#ffffff",
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

            {/* Status Card */}
            <Card className="profile-card border-none shadow-md rounded-2xl bg-white p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] font-normal uppercase text-slate-400 tracking-widest border-b border-slate-50 pb-3">
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
                    <div className="text-[10px] font-normal text-slate-400 uppercase tracking-widest leading-none mb-1">Created At</div>
                    <div className="text-sm font-normal text-slate-700">{formatDate(registration.createdAt)}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-9 space-y-8">

            {/* Academic & Location Details */}
            <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-3">
                  <BookOpen className="text-indigo-600" size={22} />
                  Academic & Location Details
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-normal pt-1">Primary registration information</CardDescription>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                {editMode ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                          <MapPin size={20} />
                        </div>
                        <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Zone Assignment</Label>
                      </div>
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
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <School size={20} />
                        </div>
                        <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Educational Institution</Label>
                      </div>
                      <Select value={editForm?.school || ""} onValueChange={v => updateField("school", v)} disabled={!editForm?.zone}>
                        <SelectTrigger className="border-slate-100 bg-slate-50">
                          <SelectValue placeholder={editForm?.zone ? "Select School" : "Select Zone first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolsForZone.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                          <User size={20} />
                        </div>
                        <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Parentage</Label>
                      </div>
                      <Input
                        value={editForm?.parentage || ""}
                        onChange={e => updateField("parentage", e.target.value.toUpperCase())}
                        className="uppercase border-slate-100 bg-slate-50"
                        placeholder="Father's / Mother's Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                          <Phone size={20} />
                        </div>
                        <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Mobile Number</Label>
                      </div>
                      <Input
                        type="tel"
                        value={editForm?.mobileNumber || ""}
                        onChange={e => updateField("mobileNumber", e.target.value)}
                        className="border-slate-100 bg-slate-50"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <School size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Educational Institution</div>
                          <div className="text-base font-normal text-slate-800 leading-snug">{getSchoolName(registration.school)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Zone Assignment</div>
                          <div className="text-base font-normal text-slate-800 leading-snug">{getZoneName(registration.zone)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                          <User size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Parentage</div>
                          <div className="text-base font-normal text-slate-800 leading-snug uppercase">{registration.parentage}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                          <Phone size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Mobile Number</div>
                          <div className="text-base font-normal text-slate-800 leading-snug">
                            {registration.mobileNumber || <span className="text-slate-300 font-normal">Not provided</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Guardian Accompaniment */}
            <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-3">
                      <ShieldCheck className="text-emerald-600" size={22} />
                      Guardian Accompaniment
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-normal pt-1">Details for event access card generation</CardDescription>
                  </div>
                  {editMode && (
                    <div className="flex items-center gap-3">
                      <Label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                        {editForm?.withParent ? "Accompanied" : "Individual"}
                      </Label>
                      <Switch
                        checked={editForm?.withParent || false}
                        onCheckedChange={v => updateField("withParent", v)}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {editMode ? (
                  editForm?.withParent ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <User size={18} />
                          </div>
                          <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Guardian Name</Label>
                        </div>
                        <Input
                          value={editForm.parentName}
                          onChange={e => updateField("parentName", e.target.value.toUpperCase())}
                          className="uppercase border-slate-100 bg-slate-50"
                          placeholder="Guardian Full Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <ShieldCheck size={18} />
                          </div>
                          <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Relation</Label>
                        </div>
                        <Input
                          value={editForm.relation}
                          onChange={e => updateField("relation", e.target.value.toUpperCase())}
                          className="uppercase border-slate-100 bg-slate-50"
                          placeholder="e.g. Father, Mother"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Guardian Gender</Label>
                        <div className="flex gap-4 py-2">
                          {["Male","Female"].map(g => (
                            <label key={g} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value={g}
                                checked={editForm.parentGender === g}
                                onChange={() => updateField("parentGender", g)}
                                className="w-4 h-4 text-indigo-600"
                              />
                              <span className="text-sm font-medium text-slate-700">{g}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center">
                      <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                        <User size={28} />
                      </div>
                      <p className="text-slate-400 text-sm">Toggle the switch above to add guardian details</p>
                    </div>
                  )
                ) : (
                  registration.withParent ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <User size={24} />
                          </div>
                          <div>
                            <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Guardian Name</div>
                            <div className="text-base font-normal text-slate-800 leading-snug uppercase">{registration.parentName}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <ShieldCheck size={24} />
                          </div>
                          <div>
                            <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Relation</div>
                            <div className="text-base font-normal text-slate-800 leading-snug uppercase">{registration.relation}</div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                            <User size={24} />
                          </div>
                          <div>
                            <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Guardian Gender</div>
                            <div className="text-base font-normal text-slate-800 leading-snug uppercase">{registration.parentGender}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                      <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                        <User size={32} />
                      </div>
                      <h3 className="text-slate-900 font-normal mb-1">Individual Participation</h3>
                      <p className="text-slate-400 text-sm max-w-xs">This student is registered as an individual and will not be accompanied by a guardian.</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
