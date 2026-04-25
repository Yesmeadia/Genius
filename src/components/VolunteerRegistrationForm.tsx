"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VolunteerFormData {
  volunteerName: string;
  parentage: string;
  className: string;
  gender: string;
  zone: string;
  school: string;
  mobileNumber: string;
  photo?: FileList;
}

export default function VolunteerRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const router = useRouter();
  const { zones, getSchoolsForZone } = useLocations();
  const containerRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<VolunteerFormData>({
    defaultValues: {
      volunteerName: "",
      parentage: "",
      gender: "",
      zone: "",
      school: "",
      className: "",
      mobileNumber: ""
    }
  });

  const watchZone = useWatch({ control, name: "zone" });
  const schools = watchZone ? getSchoolsForZone(watchZone) : [];

  useEffect(() => {
    setValue("school", "");
  }, [watchZone, setValue]);

  useGSAP(() => {
    gsap.from(".form-card", {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 0.8,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  const onSubmit = async (data: VolunteerFormData) => {
    setIsSubmitting(true);

    try {
      let photoUrl = "";
      if (data.photo && data.photo[0]) {
        const file = data.photo[0];
        const storageRef = ref(storage, `photos/volunteers/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      const finalData = {
        ...data,
        photoUrl,
        volunteerName: data.volunteerName?.toUpperCase() || "",
        parentage: data.parentage?.toUpperCase() || "",
        registrationType: "volunteer",
      };
      // remove FileList object from finalData before saving
      delete (finalData as any).photo;

      await addDoc(collection(db, "volunteer_registrations"), {
        ...finalData,
        createdAt: serverTimestamp(),
      });

      router.push("/success");
    } catch (error) {
      console.error("Error during submission: ", error);
      alert("Registration failed. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto px-2 md:px-4 pb-12 md:pb-20">
      
      <div className="mb-6 form-card bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-4">
        <div className="bg-amber-100 text-amber-600 rounded-full p-2 mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-900 tracking-tight uppercase mb-1">Important Notice</h3>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            If you are already registered as a <span className="font-bold">Student Participant</span>, please <span className="font-bold uppercase underline">do not</span> register again here as a volunteer. This form is strictly for dedicated volunteers who are not participating in the main events.
          </p>
        </div>
      </div>

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

        {/* Section 2: Volunteer Details */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-xl font-normal text-slate-900 tracking-tight">Volunteer Details</CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-5 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="volunteerName" className={`text-xs font-normal uppercase tracking-wider ${errors.volunteerName ? "text-destructive" : "text-slate-500"}`}>Full Name</Label>
                <Input
                  {...register("volunteerName", {
                    required: "Name is required",
                    onChange: (e) => e.target.value = e.target.value.toUpperCase()
                  })}
                  placeholder="NAME AS PER SCHOOL RECORDS"
                  className={`h-12 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all uppercase placeholder:text-slate-300 ${errors.volunteerName ? "border-destructive" : ""}`}
                />
                {errors.volunteerName && <p className="text-xs text-destructive mt-1 font-medium">{errors.volunteerName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentage" className={`text-xs font-normal uppercase tracking-wider ${errors.parentage ? "text-destructive" : "text-slate-500"}`}>Father's / Mother's Name</Label>
                <Input
                  {...register("parentage", {
                    required: "Guardian's name is required",
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
                        {["6th", "7th", "8th", "9th", "10th", "11th", "12th", "UG", "PG"].map(cls => (
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
                          className="peer w-5 h-5 border-2 border-slate-200 text-amber-600 focus:ring-amber-500/20 transition-all bg-white/50 cursor-pointer appearance-none rounded-full checked:border-amber-500"
                        />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-500 scale-0 peer-checked:scale-100 transition-transform" />
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

        {/* Section 3: Volunteer Photo */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-xl font-normal text-slate-900 tracking-tight">Volunteer Photo</CardTitle>
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
                    className={`h-12 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-normal file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 ${errors.photo ? "border-destructive" : ""}`}
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

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-normal transition-all hover:scale-[1.01] bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-600/20 active:scale-[0.982]"
        >
          {isSubmitting ? "Processing..." : "Complete Registration"}
        </Button>

      </form>
    </div>
  );
}
