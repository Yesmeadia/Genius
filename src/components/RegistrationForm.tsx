"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
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

interface FormData {
  studentName: string;
  parentage: string;
  className: string;
  gender: string;
  zone: string;
  school: string;
  withParent: boolean;
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
      className: ""
    }
  });

  const withParent = useWatch({ control, name: "withParent" });
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
        parentName: data.parentName?.toUpperCase() || "",
        relation: data.relation?.toUpperCase() || "",
      };
      // remove FileList object from finalData before saving
      delete (finalData as any).photo;

      // 3. Save to Firestore
      await addDoc(collection(db, "registrations"), {
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
    <div ref={containerRef} className="w-full max-w-2xl mx-auto px-4 pb-20">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">


        {/* Section 1: Location */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-lg font-bold text-foreground">Location</CardTitle>
          </CardHeader>
          <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="zone" className={errors.zone ? "text-destructive" : ""}>Select Zone</Label>
              <Controller
                name="zone"
                control={control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.zone ? "border-destructive" : ""}>
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
              {errors.zone && <p className="text-xs text-destructive mt-1">{errors.zone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="school" className={errors.school ? "text-destructive" : ""}>Select School</Label>
              <Controller
                name="school"
                control={control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={!watchZone}>
                    <SelectTrigger className={errors.school ? "border-destructive" : ""}>
                      <SelectValue placeholder="Choose School" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map(school => (
                        <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.school && <p className="text-xs text-destructive mt-1">{errors.school.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="h-px bg-gray-100" />

        {/* Section 2: Student Details */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-lg font-bold text-foreground">Student Details</CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="studentName" className={errors.studentName ? "text-destructive" : ""}>Full Name</Label>
                <Input
                  {...register("studentName", {
                    required: "Name is required",
                    onChange: (e) => e.target.value = e.target.value.toUpperCase()
                  })}
                  placeholder="Name as per school records"
                  className={`uppercase ${errors.studentName ? "border-destructive" : ""}`}
                />
                {errors.studentName && <p className="text-xs text-destructive mt-1">{errors.studentName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentage" className={errors.parentage ? "text-destructive" : ""}>Parentage</Label>
                <Input
                  {...register("parentage", {
                    required: "Parentage is required",
                    onChange: (e) => e.target.value = e.target.value.toUpperCase()
                  })}
                  placeholder="Father's / Mother's Name"
                  className={`uppercase ${errors.parentage ? "border-destructive" : ""}`}
                />
                {errors.parentage && <p className="text-xs text-destructive mt-1">{errors.parentage.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="className" className={errors.className ? "text-destructive" : ""}>Select Class</Label>
                <Controller
                  name="className"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={errors.className ? "border-destructive" : ""}>
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
                {errors.className && <p className="text-xs text-destructive mt-1">{errors.className.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className={errors.gender ? "text-destructive" : ""}>Gender</Label>
                <div className="flex gap-4 py-2">
                  {['Male', 'Female'].map(g => (
                    <label key={g} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value={g}
                        {...register("gender", { required: "Required" })}
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="text-sm font-medium">{g}</span>
                    </label>
                  ))}
                </div>
                {errors.gender && <p className="text-xs text-destructive mt-1">{errors.gender.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="h-px bg-gray-100" />

        {/* Section 3: Student Photo */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-lg font-bold text-foreground">Student Photo</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-2">
              <Label htmlFor="photo" className={errors.photo ? "text-destructive" : ""}>Upload Passport Size Photo</Label>
              <div className="flex flex-col gap-4">
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
                  className="cursor-pointer"
                />
                {photoPreview && (
                  <div className="w-32 md:w-40 aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Max size 3MB. JPG, JPEG, or PNG format only.</p>
              {errors.photo && <p className="text-xs text-destructive mt-1">{errors.photo.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="h-px bg-gray-100" />

        {/* Section 4: Optional Parent Details */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <div className="flex items-center justify-between py-4">
            <Label className="text-lg font-bold text-foreground cursor-pointer" htmlFor="withParent">
              Guardian Accompaniment
            </Label>
            <Controller
              name="withParent"
              control={control}
              render={({ field }) => (
                <Switch
                  id="withParent"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {withParent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label htmlFor="parentName">Guardian Name</Label>
                <Input
                  {...register("parentName", {
                    required: withParent ? "Required" : false,
                    onChange: (e) => e.target.value = e.target.value.toUpperCase()
                  })}
                  placeholder="Accompanying Parent Name"
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relation">Relation</Label>
                <Input
                  {...register("relation", {
                    required: withParent ? "Required" : false,
                    onChange: (e) => e.target.value = e.target.value.toUpperCase()
                  })}
                  placeholder="e.g. Father, Mother"
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label>Guardian Gender</Label>
                <div className="flex gap-4 py-2">
                  {['Male', 'Female'].map(g => (
                    <label key={g} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value={g}
                        {...register("parentGender", { required: withParent ? "Required" : false })}
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="text-sm font-medium">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base font-bold transition-all hover:scale-[1.01]"
        >
          {isSubmitting ? "Submitting..." : "Complete Registration"}
        </Button>

      </form>
    </div>
  );
}
