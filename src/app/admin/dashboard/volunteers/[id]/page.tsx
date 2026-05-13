"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { VolunteerRegistration } from "../../types";
import { locations } from "@/data/locations";
import {
  ArrowLeft, Calendar, User, ShieldCheck, Phone,
  Pencil, X, Check, Loader2, UploadCloud,
  MapPin, GraduationCap, Download, Trash2, CheckCircle2,
  Plus, MoreHorizontal
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateBatchAccessPasses } from "@/lib/exportUtils";
import { moveToRecycleBin } from "@/lib/deleteUtils";
import { generateVolunteerCertificate } from "@/lib/volunteerCertificateUtils";
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
import { TransferRegistration } from "../../components/TransferRegistration";
import { VoiceFeedbackCard } from "../../components/VoiceFeedbackCard";


interface VolunteerEditForm {
  volunteerName: string;
  parentage: string;
  gender: string;
  mobileNumber: string;
  zone: string;
  school: string;
  className: string;
  attendance: boolean;
  withParent: boolean;
  accompaniments: { name: string; gender: string; relation: string; }[];
}

export default function VolunteerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true);
  const [registration, setRegistration] = useState<VolunteerRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<VolunteerEditForm | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    const fetchVolunteer = async () => {
      try {
        const docRef = doc(db, "volunteer_registrations", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRegistration({ id: docSnap.id, ...docSnap.data() } as VolunteerRegistration);
        } else {
          router.push("/admin/dashboard/volunteers");
        }
      } catch (error) {
        console.error("Error fetching volunteer:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVolunteer();
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
      volunteerName: registration.volunteerName || "",
      parentage: registration.parentage || "",
      gender: registration.gender || "",
      mobileNumber: registration.mobileNumber || "",
      zone: registration.zone || "",
      school: registration.school || "",
      className: registration.className || "",
      attendance: registration.attendance || false,
      withParent: registration.withParent || false,
      accompaniments: registration.accompaniments || [],
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

  const updateField = (field: keyof VolunteerEditForm, value: any) => {
    setEditForm(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      if (field === "zone") updated.school = "";
      if (field === "withParent" && value === true && updated.accompaniments.length === 0) {
        updated.accompaniments = [{ name: "", gender: "Male", relation: "" }];
      }
      return updated;
    });
  };

  const updateAccompaniment = (index: number, field: string, value: string) => {
    setEditForm(prev => {
      if (!prev) return prev;
      const newAccs = [...prev.accompaniments];
      newAccs[index] = { ...newAccs[index], [field]: value };
      return { ...prev, accompaniments: newAccs };
    });
  };

  const addAccompaniment = () => {
    setEditForm(prev => {
      if (!prev || prev.accompaniments.length >= 3) return prev;
      return {
        ...prev,
        accompaniments: [...prev.accompaniments, { name: "", gender: "Male", relation: "" }]
      };
    });
  };

  const removeAccompaniment = (index: number) => {
    setEditForm(prev => {
      if (!prev) return prev;
      const newAccs = prev.accompaniments.filter((_, i) => i !== index);
      return { ...prev, accompaniments: newAccs };
    });
  };

  const handleSave = async () => {
    if (!editForm || !id) return;
    setSaving(true);
    try {
      let photoUrl = registration?.photoUrl || "";
      if (photoFile) {
        const storageRef = ref(storage, `photos/volunteer_${Date.now()}_${photoFile.name}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }
      const updateData = {
        volunteerName: editForm.volunteerName.toUpperCase(),
        parentage: editForm.parentage.toUpperCase(),
        gender: editForm.gender,
        mobileNumber: editForm.mobileNumber,
        zone: editForm.zone,
        school: editForm.school,
        className: editForm.className,
        photoUrl,
        attendance: editForm.attendance,
        attendedAt: editForm.attendance && !registration?.attendance ? new Date() : (editForm.attendance ? registration?.attendedAt : null),
        withParent: editForm.withParent,
        accompaniments: editForm.withParent ? editForm.accompaniments.map(a => ({
          name: a.name.toUpperCase(),
          gender: a.gender,
          relation: a.relation.toUpperCase()
        })) : []
      };
      await updateDoc(doc(db, "volunteer_registrations", id as string), updateData);
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

  const handleDelete = async () => {
    if (!id || !registration) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete the record for ${registration.volunteerName}? This record will be moved to the Recycle Bin.`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await moveToRecycleBin(
        id as string,
        "volunteer_registrations",
        registration,
        "Volunteer"
      );
      router.push("/admin/dashboard/volunteers");
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record. Please try again.");
      setIsDeleting(false);
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
                  className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-normal uppercase text-[10px] tracking-widest shadow-lg shadow-amber-100"
                >
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="mr-2 h-4 w-4" /> Save Changes</>
                  )}
                </Button>
              </>
            ) : (
              !showActions ? (
                <Button
                  onClick={() => setShowActions(true)}
                  className="h-10 rounded-xl bg-slate-900 text-white font-normal uppercase text-[10px] tracking-widest hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
                >
                  <MoreHorizontal className="mr-2 h-4 w-4" /> Actions
                </Button>
              ) : (
                <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
                  <Button
                    variant="outline"
                    onClick={enterEditMode}
                    className="h-10 rounded-xl border-slate-200 text-slate-600 font-normal uppercase text-[10px] tracking-widest hover:bg-slate-50"
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit Record
                  </Button>

                  <TransferRegistration 
                    sourceId={id as string} 
                    sourceType="volunteer" 
                    currentData={registration} 
                  />

                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-10 rounded-xl border-red-100 text-red-500 font-normal uppercase text-[10px] tracking-widest hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    {isDeleting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                    ) : (
                      <><Trash2 className="mr-2 h-4 w-4" /> Delete</>
                    )}
                  </Button>

                  <Button
                    onClick={() => generateBatchAccessPasses([registration as any], `AccessPass_${registration.volunteerName.replace(/\s+/g, '_')}`, 'volunteer')}
                    className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-normal uppercase text-[10px] tracking-widest shadow-lg shadow-amber-100"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download ID
                  </Button>

                  <Button
                    onClick={() => generateVolunteerCertificate([registration], `Certificate_${registration.volunteerName.replace(/\s+/g, '_')}`)}
                    className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-normal uppercase text-[10px] tracking-widest shadow-lg shadow-rose-100"
                  >
                    <Download className="mr-2 h-4 w-4" /> Certificate
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => setShowActions(false)}
                    className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X size={18} />
                  </Button>
                </div>
              )
            )}
          </div>
        </div>

        {editMode && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3">
            <Pencil size={14} className="text-amber-500 shrink-0" />
            <p className="text-[11px] font-normal text-amber-700 uppercase tracking-widest">
              Edit Mode Active — Update details below
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
                    <img src={currentPhoto} alt={registration.volunteerName} className="w-full h-full object-cover" />
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
                        value={editForm?.volunteerName || ""}
                        onChange={e => updateField("volunteerName", e.target.value.toUpperCase())}
                        className="uppercase font-normal text-slate-900 border-slate-100 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Gender</Label>
                      <div className="flex gap-4 py-1">
                        {["Male", "Female"].map(g => (
                          <label key={g} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value={g}
                              checked={editForm?.gender === g}
                              onChange={() => updateField("gender", g)}
                              className="w-4 h-4 text-amber-600"
                            />
                            <span className="text-sm font-medium text-slate-700 capitalize">{g.toLowerCase()}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Attendance</Label>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase ${editForm?.attendance ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {editForm?.attendance ? 'Present' : 'Absent'}
                          </span>
                          <Switch
                            checked={editForm?.attendance || false}
                            onCheckedChange={v => updateField("attendance", v)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-normal text-slate-900 leading-tight mb-2 tracking-tight">
                      {registration.volunteerName}
                    </h2>
                    <p className="text-sm font-normal text-amber-600 uppercase tracking-[0.2em] mb-6">
                      VOLUNTEER
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
                <div className="flex items-center justify-between text-[11px] font-normal uppercase text-slate-400 tracking-widest border-b border-slate-50 pt-3 pb-3">
                  <span>Attendance Status</span>
                  {registration.attendance ? (
                    <span className="text-emerald-500 flex items-center gap-1 font-bold">
                      <CheckCircle2 size={14} /> Present
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 font-bold">
                      <X size={14} /> Absent
                    </span>
                  )}
                </div>
                {registration.attendance && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-normal text-slate-400 uppercase tracking-widest leading-none mb-1">Check-in Time</div>
                      <div className="text-sm font-normal text-slate-700">{formatDate(registration.attendedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Personal Details */}
          <div className="lg:col-span-9 space-y-8">
            <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-3">
                  <GraduationCap className="text-amber-600" size={22} />
                  Academic & Contact Details
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-normal pt-1">Volunteer Information</CardDescription>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                {editMode ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Father's / Mother's Name</Label>
                      <Input
                        value={editForm?.parentage || ""}
                        onChange={e => updateField("parentage", e.target.value.toUpperCase())}
                        className="uppercase font-normal text-slate-900 border-slate-100 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Class</Label>
                      <Select
                        value={editForm?.className || ""}
                        onValueChange={v => updateField("className", v)}
                      >
                        <SelectTrigger className="border-slate-100 bg-slate-50">
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {["6th", "7th", "8th", "9th", "10th", "11th", "12th", "UG", "PG"].map(cls => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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
                            <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
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
                          {locations.find(z => z.id === editForm?.zone)?.schools.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Mobile Number</Label>
                      <Input
                        type="tel"
                        value={editForm?.mobileNumber || ""}
                        onChange={e => updateField("mobileNumber", e.target.value)}
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
                          <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Class & Detail</div>
                          <div className="text-base font-normal text-slate-800 leading-snug uppercase font-bold tracking-widest">
                            {registration.className || "N/A"}
                            <div className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-tight">
                              {registration.parentage || "N/A"}
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
                          <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Mobile Number</div>
                          <div className="text-base font-normal text-slate-800 leading-snug">{registration.mobileNumber}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Guardian Accompaniment */}
            <Card className="profile-card border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden transition-all">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-3">
                      <ShieldCheck className="text-amber-600" size={22} />
                      Accompaniment
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-normal pt-1">
                      {!registration.withParent && !editMode ? 'No accompaniment registered' : 'Guardian details for access pass'}
                    </CardDescription>
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
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      {editForm.accompaniments.map((acc, index) => (
                        <div key={index} className="relative p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70">Person {index + 1}</span>
                            {editForm.accompaniments.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAccompaniment(index)}
                                className="h-7 w-7 p-0 text-slate-300 hover:text-destructive rounded-full"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Name</Label>
                              <Input
                                value={acc.name}
                                onChange={e => updateAccompaniment(index, "name", e.target.value.toUpperCase())}
                                className="uppercase border-slate-100 bg-white"
                                placeholder="Full Name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Relation</Label>
                              <Input
                                value={acc.relation}
                                onChange={e => updateAccompaniment(index, "relation", e.target.value.toUpperCase())}
                                className="uppercase border-slate-100 bg-white"
                                placeholder="e.g. Father, Mother"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Gender</Label>
                              <div className="flex gap-4 py-2">
                                {["Male","Female"].map(g => (
                                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      value={g}
                                      checked={acc.gender === g}
                                      onChange={() => updateAccompaniment(index, "gender", g)}
                                      className="w-4 h-4 text-amber-600"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{g}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {editForm.accompaniments.length < 3 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addAccompaniment}
                          className="w-full h-11 border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 text-slate-500 hover:text-amber-600 transition-all rounded-xl flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          <span className="text-xs font-bold uppercase tracking-widest">Add Another Person</span>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center">
                      <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                        <User size={28} />
                      </div>
                      <p className="text-slate-400 text-sm font-normal">No accompaniments registered</p>
                    </div>
                  )
                ) : (
                  (registration.withParent && registration.accompaniments && registration.accompaniments.length > 0) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {registration.accompaniments.map((acc, idx) => (
                        <div key={idx} className="p-6 rounded-[24px] bg-slate-50/50 border border-slate-100/50 hover:border-amber-100 transition-all group">
                          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100/50">
                            <Avatar className="h-12 w-12 rounded-2xl border-0 bg-white shadow-sm ring-4 ring-slate-100/30">
                              <AvatarFallback className="bg-amber-50 text-amber-600">
                                <User size={20} />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow min-w-0">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Person {idx + 1}</div>
                              <div className="text-base font-bold text-slate-900 uppercase tracking-tight truncate">{acc.name}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                <ShieldCheck size={12} className="text-amber-500" />
                                Relation
                              </div>
                              <div className="text-sm font-semibold text-slate-700 uppercase">{acc.relation}</div>
                            </div>
                            <div className="space-y-1 text-right">
                              <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                <User size={12} className="text-slate-400" />
                                Gender
                              </div>
                              <div className="text-sm font-semibold text-slate-700 uppercase">{acc.gender}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-3 px-4 flex items-center gap-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-300 shadow-sm shrink-0">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-slate-600 text-[11px] font-bold uppercase tracking-widest">Individual Participation</h3>
                        <p className="text-slate-400 text-[10px] uppercase tracking-tight mt-0.5">This volunteer is attending individually</p>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
            <VoiceFeedbackCard participantId={id as string} />
          </div>
        </div>
      </div>
    </div>
  );
}
