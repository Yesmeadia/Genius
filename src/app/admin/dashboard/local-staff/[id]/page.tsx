"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { LocalStaffRegistration } from "../../types";
import { locations } from "@/data/locations";
import {
  ArrowLeft, Calendar, User, ShieldCheck, Phone,
  Pencil, X, Check, Loader2, UploadCloud,
  Moon, Bell, MapPin, Briefcase, Download, Trash2, CheckCircle2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { generateBatchAccessPasses } from "@/lib/exportUtils";
import { moveToRecycleBin } from "@/lib/deleteUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import JsBarcode from "jsbarcode";
import { TransferRegistration } from "../../components/TransferRegistration";
import { VoiceFeedbackCard } from "../../components/VoiceFeedbackCard";


interface LocalStaffEditForm {
  name: string;
  gender: string;
  whatsappNumber: string;
  zone: string;
  school: string;
  role: "Teaching" | "Non Teaching";
  attendance: boolean;
}

export default function LocalStaffProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true);
  const [registration, setRegistration] = useState<LocalStaffRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<LocalStaffEditForm | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    const fetchStaff = async () => {
      try {
        const docRef = doc(db, "local_staff_registrations", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRegistration({ id: docSnap.id, ...docSnap.data() } as LocalStaffRegistration);
        } else {
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Error fetching local staff:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id, user, router]);

  useGSAP(() => {
    if (!loading && registration) {
      gsap.from(".profile-card", {
        opacity: 0, y: 30, duration: 0.8, ease: "power3.out", stagger: 0.1
      });
    }
  }, { dependencies: [loading, registration], scope: containerRef });

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
      school: registration.school || "",
      role: (registration.role as any) || "Teaching",
      attendance: registration.attendance || false,
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

  const updateField = (field: keyof LocalStaffEditForm, value: any) => {
    setEditForm(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!editForm || !id) return;
    setSaving(true);
    try {
      let photoUrl = registration?.photoUrl || "";
      if (photoFile) {
        const storageRef = ref(storage, `photos/local_staff_${Date.now()}_${photoFile.name}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }
      const updateData = {
        name: editForm.name.toUpperCase(),
        gender: editForm.gender,
        whatsappNumber: editForm.whatsappNumber,
        zone: editForm.zone,
        school: editForm.school,
        role: editForm.role,
        photoUrl,
        attendance: editForm.attendance,
        attendedAt: editForm.attendance && !registration?.attendance ? new Date() : (editForm.attendance ? registration?.attendedAt : null)
      };
      await updateDoc(doc(db, "local_staff_registrations", id as string), updateData);
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
    
    const confirmDelete = window.confirm(`Are you sure you want to delete the record for ${registration.name}? This record will be moved to the Recycle Bin.`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await moveToRecycleBin(
        id as string,
        "local_staff_registrations",
        registration,
        "Local Staff"
      );
      router.push("/admin/dashboard/local-staff");
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
                <TransferRegistration 
                  sourceId={id as string} 
                  sourceType="local-staff" 
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
                  onClick={() => generateBatchAccessPasses([registration], `AccessPass_${registration.name.replace(/\s+/g, '_')}`, 'local-staff')}
                  className="h-10 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-normal uppercase text-[10px] tracking-widest shadow-lg shadow-sky-100"
                >
                  <Download className="mr-2 h-4 w-4" /> Download ID
                </Button>
              </>
            )}
          </div>
        </div>

        {editMode && (
          <div className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-2xl px-5 py-3">
            <Pencil size={14} className="text-sky-500 shrink-0" />
            <p className="text-[11px] font-normal text-sky-700 uppercase tracking-widest">
              Edit Mode Active — Update Staff details below
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
                        {["male", "female"].map(g => (
                          <label key={g} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value={g}
                              checked={editForm?.gender === g}
                              onChange={() => updateField("gender", g)}
                              className="w-4 h-4 text-sky-600"
                            />
                            <span className="text-sm font-medium text-slate-700 capitalize">{g}</span>
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
                      {registration.name}
                    </h2>
                    <p className="text-sm font-normal text-sky-600 uppercase tracking-[0.2em] mb-6">
                      LOCAL STAFF
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
                  <Briefcase className="text-sky-600" size={22} />
                  Professional & Contact Details
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-normal pt-1">Local staff assignment</CardDescription>
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
                    <div className="space-y-2">
                      <Label className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em]">Role</Label>
                      <Select value={editForm?.role || ""} onValueChange={v => updateField("role", v)}>
                        <SelectTrigger className="border-slate-100 bg-slate-50">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Teaching">Teaching</SelectItem>
                          <SelectItem value="Non Teaching">Non Teaching</SelectItem>
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
                        <div className="h-12 w-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Zone & School</div>
                          <div className="text-base font-normal text-slate-800 leading-snug">
                            {getZoneName(registration.zone)}
                            <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-tight">
                              {locations.find(z => z.id === registration.zone)?.schools.find(s => s.id === registration.school)?.name || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                          <Briefcase size={24} />
                        </div>
                        <div>
                          <div className="text-[11px] font-normal text-slate-300 uppercase tracking-[0.2em] mb-1">Staff Role</div>
                          <div className="text-base font-normal text-sky-600 leading-snug uppercase font-bold tracking-widest">
                            {registration.role || "N/A"}
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
            <VoiceFeedbackCard participantId={id as string} />
          </div>
        </div>
      </div>
    </div>
  );
}
