"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { storage, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { locations } from "@/data/locations";

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

interface LocalStaffFormData {
  name: string;
  gender: string;
  whatsappNumber: string;
  zone: string;
  school: string;
  role: "Teaching" | "Non Teaching";
  photo?: FileList;
}

export default function LocalStaffRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<LocalStaffFormData>({
    defaultValues: {
      name: "",
      gender: "",
      whatsappNumber: "",
      zone: "",
      school: "",
      role: "Teaching",
    },
  });

  const watchZone = watch("zone");
  const schools = locations.find(z => z.id === watchZone)?.schools || [];

  useGSAP(
    () => {
      gsap.from(".form-card", {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  const onSubmit = async (data: LocalStaffFormData) => {
    setIsSubmitting(true);
    try {
      let photoUrl = "";
      if (data.photo && data.photo[0]) {
        const file = data.photo[0];
        const storageRef = ref(storage, `photos/local_staff_${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      // Prepare final data to avoid Firestore error with FileList
      const { photo, ...restData } = data;

      await addDoc(collection(db, "local_staff_registrations"), {
        ...restData,
        photoUrl,
        name: data.name.toUpperCase(),
        registrationType: "local-staff",
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-8">
        {/* Local Staff Details Card */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
              Local Staff Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4 md:space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className={`text-xs font-bold uppercase tracking-wider ${errors.name ? "text-destructive" : "text-slate-500"}`}
              >
                Full Name
              </Label>
              <Input
                id="name"
                {...register("name", {
                  required: "Name is required",
                  onChange: (e) =>
                    (e.target.value = e.target.value.toUpperCase()),
                })}
                placeholder="ENTER YOUR FULL NAME"
                className={`h-10 md:h-12 bg-white/50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 transition-all uppercase placeholder:text-slate-300 ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Gender Selection */}
            <div className="space-y-3">
              <Label className={`text-xs font-bold uppercase tracking-wider ${errors.gender ? "text-destructive" : "text-slate-500"}`}>
                Gender
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {["MALE", "FEMALE"].map((option) => {
                  const isSelected = watch("gender") === option.toLowerCase();
                  return (
                    <label
                      key={option}
                      className={`
                        relative flex items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300
                        ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/50 shadow-sm"
                            : "border-slate-100 bg-white/50 hover:border-slate-200"
                        }
                      `}
                    >
                      <input
                        type="radio"
                        value={option.toLowerCase()}
                        {...register("gender", { required: "Gender is required" })}
                        className="absolute opacity-0"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-sky-500" : "border-slate-300"}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
                        </div>
                        <span className={`text-xs font-black tracking-widest ${isSelected ? "text-sky-700" : "text-slate-400"}`}>
                          {option}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.gender && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.gender.message}
                </p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2">
              <Label
                htmlFor="whatsappNumber"
                className={`text-xs font-bold uppercase tracking-wider ${errors.whatsappNumber ? "text-destructive" : "text-slate-500"}`}
              >
                WhatsApp Number
              </Label>
              <Input
                id="whatsappNumber"
                type="tel"
                {...register("whatsappNumber", {
                  required: "WhatsApp number is required",
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: "Enter a valid 10-digit Indian mobile number",
                  },
                })}
                placeholder="e.g. 9876543210"
                maxLength={10}
                className={`h-12 bg-white/50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 transition-all placeholder:text-slate-300 ${errors.whatsappNumber ? "border-destructive" : ""}`}
              />
              {errors.whatsappNumber && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.whatsappNumber.message}
                </p>
              )}
            </div>

            {/* Zone Dropdown */}
            <div className="space-y-2">
              <Label
                htmlFor="zone"
                className={`text-xs font-bold uppercase tracking-wider ${errors.zone ? "text-destructive" : "text-slate-500"}`}
              >
                Select Zone
              </Label>
              <Controller
                name="zone"
                control={control}
                rules={{ required: "Zone is required" }}
                render={({ field }) => (
                  <Select onValueChange={(val) => { field.onChange(val); control._reset({ ...control._formValues, school: "" }); }} value={field.value}>
                    <SelectTrigger
                      className={`h-12 bg-white/50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 transition-all ${errors.zone ? "border-destructive" : ""}`}
                    >
                      <SelectValue placeholder="Choose your Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.zone && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.zone.message}
                </p>
              )}
            </div>

            {/* School Dropdown */}
            <div className="space-y-2">
              <Label
                htmlFor="school"
                className={`text-xs font-bold uppercase tracking-wider ${errors.school ? "text-destructive" : "text-slate-500"}`}
              >
                Select School
              </Label>
              <Controller
                name="school"
                control={control}
                rules={{ required: "School is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={!watchZone}>
                    <SelectTrigger
                      className={`h-auto min-h-[3rem] py-3 bg-white/50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 transition-all [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words [&>span]:text-left ${errors.school ? "border-destructive" : ""}`}
                    >
                      <SelectValue placeholder={watchZone ? "Choose School" : "Select Zone First"} />
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
              {errors.school && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.school.message}
                </p>
              )}
            </div>

            {/* Role Dropdown */}
            <div className="space-y-2">
              <Label
                className={`text-xs font-bold uppercase tracking-wider ${errors.role ? "text-destructive" : "text-slate-500"}`}
              >
                Role
              </Label>
              <Controller
                name="role"
                control={control}
                rules={{ required: "Role is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={`h-12 bg-white/50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 transition-all ${errors.role ? "border-destructive" : ""}`}
                    >
                      <SelectValue placeholder="Choose Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Teaching">Teaching</SelectItem>
                      <SelectItem value="Non Teaching">Non Teaching</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.role.message}
                </p>
              )}
            </div>


            {/* Photo Upload Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <Label
                htmlFor="photo"
                className={`text-xs font-bold uppercase tracking-wider ${errors.photo ? "text-destructive" : "text-slate-500"}`}
              >
                Upload Passport Size Photo
              </Label>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Input
                    id="photo"
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
                    className={`h-12 bg-white/50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 transition-all cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 ${errors.photo ? "border-destructive" : ""}`}
                  />
                </div>
                {photoPreview && (
                  <div className="w-20 md:w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-100 shadow-lg ring-4 ring-white/50 animate-in zoom-in-95 duration-300">
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Max size 3MB • JPG, JPEG, or PNG only</p>
              {errors.photo && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.photo.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-extrabold transition-all hover:scale-[1.01] bg-sky-500 hover:bg-sky-600 shadow-xl shadow-sky-500/20 active:scale-[0.982] text-white"
        >
          {isSubmitting ? "Processing..." : "Complete Registration"}
        </Button>
      </form>
    </div>
  );
}
