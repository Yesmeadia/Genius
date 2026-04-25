"use client";

import { useForm, Controller, useWatch, useFieldArray } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Zone, School } from "@/data/locations";
import { useLocations } from "@/hooks/useLocations";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Accompaniment {
  name: string;
  gender: string;
  relation: string;
}

interface FormData {
  studentName: string;
  parentage: string;
  className: string;
  gender: string;
  zone: string;
  school: string;
  mobileNumber: string;
  withParent: boolean;
  accompaniments: Accompaniment[];
  // Legacy fields
  parentName?: string;
  parentGender?: string;
  relation?: string;
  photo?: FileList;
}

export default function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const router = useRouter();
  const { zones, getSchoolsForZone } = useLocations();

  const containerRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      withParent: false,
      gender: "",
      zone: "",
      school: "",
      className: "",
      mobileNumber: "",
      accompaniments: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "accompaniments"
  });

  const withParent = useWatch({ control, name: "withParent" });
  const watchZone = useWatch({ control, name: "zone" });

  const schools = watchZone ? getSchoolsForZone(watchZone) : [];

  useEffect(() => {
    setValue("school", "");
  }, [watchZone, setValue]);

  useEffect(() => {
    if (withParent && fields.length === 0) {
      append({ name: "", gender: "", relation: "" });
    }
  }, [withParent, fields.length, append]);

  useGSAP(() => {
    gsap.from(".form-card", {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 0.8,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      let photoUrl = "";
      if (data.photo && data.photo[0]) {
        const file = data.photo[0];
        const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      // 2. Prepare Final Data
      const finalData = {
        ...data,
        photoUrl,
        studentName: data.studentName?.toUpperCase() || "",
        parentage: data.parentage?.toUpperCase() || "",
        // Map first accompaniment to legacy fields for backward compatibility
        parentName: data.accompaniments?.[0]?.name?.toUpperCase() || "",
        relation: data.accompaniments?.[0]?.relation?.toUpperCase() || "",
        parentGender: data.accompaniments?.[0]?.gender || "",
        accompaniments: data.accompaniments.map(a => ({
          name: a.name.toUpperCase(),
          gender: a.gender,
          relation: a.relation.toUpperCase()
        }))
      };
      // remove FileList object from finalData before saving
      delete (finalData as any).photo;

      // 3. Save to Firestore
      const docRef = await addDoc(collection(db, "registrations"), {
        ...finalData,
        createdAt: serverTimestamp(),
      });

      router.push(`/success?id=${docRef.id}&type=student`);
    } catch (error) {
      console.error("Error during submission: ", error);
      alert("Registration failed. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto px-2 md:px-4 pb-12 md:pb-20">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-8">


        {/* Section 1: Location */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-normal text-slate-900 tracking-tight">Location Details</CardTitle>
          </CardHeader>
          <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            <div className="space-y-2">
              <Label htmlFor="zone" className={`text-xs font-normal uppercase tracking-wider ${errors.zone ? "text-destructive" : "text-slate-500"}`}>Select Zone</Label>
              <Controller
                name="zone"
                control={control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={`h-10 md:h-12 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all ${errors.zone ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Choose Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.zone && <p className="text-xs text-destructive mt-1 font-medium">{errors.zone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="school" className={`text-xs font-normal uppercase tracking-wider ${errors.school ? "text-destructive" : "text-slate-500"}`}>Select School</Label>
              <Controller
                name="school"
                control={control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={!watchZone}>
                    <SelectTrigger className={`h-auto min-h-[3rem] py-3 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words [&>span]:text-left text-xs md:text-sm ${errors.school ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Choose School" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map(school => (
                        <SelectItem key={school.id} value={school.id}>
                          <div className="whitespace-normal break-words text-xs leading-snug md:text-sm md:leading-normal max-w-[75vw] md:max-w-none py-1">
                            {school.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.school && <p className="text-xs text-destructive mt-1 font-medium">{errors.school.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="h-px bg-slate-200/50" />

        {/* Section 2: Student Details */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-xl font-normal text-slate-900 tracking-tight">Student Details</CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-5 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="studentName" className={`text-xs font-normal uppercase tracking-wider ${errors.studentName ? "text-destructive" : "text-slate-500"}`}>Full Name</Label>
                <Input
                  {...register("studentName", {
                    required: "Name is required",
                    onChange: (e) => e.target.value = e.target.value.toUpperCase()
                  })}
                  placeholder="NAME AS PER SCHOOL RECORDS"
                  className={`h-12 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all uppercase placeholder:text-slate-300 ${errors.studentName ? "border-destructive" : ""}`}
                />
                {errors.studentName && <p className="text-xs text-destructive mt-1 font-medium">{errors.studentName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentage" className={`text-xs font-normal uppercase tracking-wider ${errors.parentage ? "text-destructive" : "text-slate-500"}`}>Parentage</Label>
                <Input
                  {...register("parentage", {
                    required: "Parentage is required",
                    onChange: (e) => e.target.value = e.target.value.toUpperCase()
                  })}
                  placeholder="FATHER'S / MOTHER'S NAME"
                  className={`h-12 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all uppercase placeholder:text-slate-300 ${errors.parentage ? "border-destructive" : ""}`}
                />
                {errors.parentage && <p className="text-xs text-destructive mt-1 font-medium">{errors.parentage.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="className" className={`text-xs font-normal uppercase tracking-wider ${errors.className ? "text-destructive" : "text-slate-500"}`}>Select Class</Label>
                <Controller
                  name="className"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={`h-12 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all ${errors.className ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="Choose Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {["3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.className && <p className="text-xs text-destructive mt-1 font-medium">{errors.className.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className={`text-xs font-normal uppercase tracking-wider ${errors.gender ? "text-destructive" : "text-slate-500"}`}>Gender</Label>
                <div className="flex gap-4 py-2">
                  {['Male', 'Female'].map(g => (
                    <label key={g} className="flex items-center space-x-2 cursor-pointer group/label">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          value={g}
                          {...register("gender", { required: "Required" })}
                          className="peer w-5 h-5 border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500/20 transition-all bg-white/50 cursor-pointer appearance-none rounded-full checked:border-indigo-500"
                        />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 scale-0 peer-checked:scale-100 transition-transform" />
                      </div>
                      <span className="text-sm font-normal text-slate-600 group-hover/label:text-slate-900 transition-colors">{g}</span>
                    </label>
                  ))}
                </div>
                {errors.gender && <p className="text-xs text-destructive mt-1 font-medium">{errors.gender.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="mobileNumber" className={`text-xs font-normal uppercase tracking-wider ${errors.mobileNumber ? "text-destructive" : "text-slate-500"}`}>Mobile Number</Label>
                <Input
                  type="tel"
                  {...register("mobileNumber", {
                    required: "Mobile number is required",
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: "Enter a valid 10-digit Indian mobile number"
                    }
                  })}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  className={`h-12 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300 ${errors.mobileNumber ? "border-destructive" : ""}`}
                />
                {errors.mobileNumber && <p className="text-xs text-destructive mt-1 font-medium">{errors.mobileNumber.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="h-px bg-slate-200/50" />

        {/* Section 3: Student Photo */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-xl font-normal text-slate-900 tracking-tight">Student Photo</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-3">
              <Label htmlFor="photo" className={`text-xs font-normal uppercase tracking-wider ${errors.photo ? "text-destructive" : "text-slate-500"}`}>Upload Passport Size Photo</Label>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    {...register("photo", {
                      validate: {
                        lessThan3MB: (files) => !files?.[0] || files[0].size <= 3 * 1024 * 1024 || "Maximum size is 3MB",
                        acceptedFormats: (files) => !files?.[0] || ['image/jpeg', 'image/png'].includes(files[0].type) || "Only JPG, JPEG, PNG are allowed"
                      },
                      onChange: (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotoPreview(URL.createObjectURL(file));
                        } else {
                          setPhotoPreview(null);
                        }
                      }
                    })}
                    className={`h-12 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-normal file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 ${errors.photo ? "border-destructive" : ""}`}
                  />
                </div>
                {photoPreview && (
                  <div className="w-20 md:w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-100 shadow-lg ring-4 ring-white/50 animate-in zoom-in-95 duration-300">
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Max size 3MB • JPG, JPEG, or PNG only</p>
              {errors.photo && <p className="text-xs text-destructive mt-1 font-medium">{errors.photo.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="h-px bg-slate-200/50" />

        {/* Section 4: Optional Parent Details */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-xl font-normal text-slate-900 tracking-tight cursor-pointer" htmlFor="withParent">
                Accompaniment
              </Label>
              <p className="text-xs text-slate-500 font-medium">Is anyone coming along?</p>
            </div>
            <Controller
              name="withParent"
              control={control}
              render={({ field }) => (
                <Switch
                  id="withParent"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-indigo-600"
                />
              )}
            />
          </div>

          {withParent && (
            <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-top-4 duration-500">
              {fields.map((field, index) => (
                <div key={field.id} className="relative p-4 md:p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600/70">Person {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="h-8 w-8 p-0 text-slate-300 hover:text-destructive transition-colors rounded-full"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-normal uppercase tracking-wider text-slate-500">Name</Label>
                      <Input
                        {...register(`accompaniments.${index}.name` as const, {
                          required: "Required",
                          onChange: (e) => e.target.value = e.target.value.toUpperCase()
                        })}
                        placeholder="FULL NAME"
                        className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all uppercase placeholder:text-slate-300 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-normal uppercase tracking-wider text-slate-500">Relation</Label>
                      <Input
                        {...register(`accompaniments.${index}.relation` as const, {
                          required: "Required",
                          onChange: (e) => e.target.value = e.target.value.toUpperCase()
                        })}
                        placeholder="E.G. FATHER, MOTHER"
                        className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all uppercase placeholder:text-slate-300 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-normal uppercase tracking-wider text-slate-500">Guardian Gender</Label>
                      <div className="flex gap-4 py-2">
                        {['Male', 'Female'].map(g => (
                          <label key={g} className="flex items-center space-x-2 cursor-pointer group/label">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="radio"
                                value={g}
                                {...register(`accompaniments.${index}.gender` as const, { required: "Required" })}
                                className="peer w-5 h-5 border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500/20 transition-all bg-white cursor-pointer appearance-none rounded-full checked:border-indigo-500"
                              />
                              <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 scale-0 peer-checked:scale-100 transition-transform" />
                            </div>
                            <span className="text-sm font-normal text-slate-600 group-hover/label:text-slate-900 transition-colors">{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {fields.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ name: "", gender: "", relation: "" })}
                  className="w-full h-12 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-500 hover:text-indigo-600 transition-all rounded-xl flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Add Another Person</span>
                </Button>
              )}
            </div>
          )}
        </Card>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-normal transition-all hover:scale-[1.01] bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-[0.982]"
        >
          {isSubmitting ? "Processing..." : "Complete Registration"}
        </Button>

      </form>
    </div>
  );
}
