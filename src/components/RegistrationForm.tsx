"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { Zone, School } from "@/data/locations";
import { useLocations } from "@/hooks/useLocations";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
}

export default function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const router = useRouter();
  const { zones, getSchoolsForZone } = useLocations();

  const containerRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      withParent: false,
      gender: "",
      zone: "",
      school: ""
    }
  });

  const withParent = watch("withParent");
  const watchZone = watch("zone");

  useEffect(() => {
    if (watchZone) {
      const schoolsForZone = getSchoolsForZone(watchZone);
      setSchools(schoolsForZone);
      setValue("school", "");
    } else {
      setSchools([]);
    }
  }, [watchZone, setValue, getSchoolsForZone]);

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
      await addDoc(collection(db, "registrations"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      router.push("/success");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Registration failed. Please try again.");
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
          <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="studentName" className={errors.studentName ? "text-destructive" : ""}>Full Name</Label>
              <Input
                {...register("studentName", { required: "Name is required" })}
                placeholder="Name as per school records"
                className={errors.studentName ? "border-destructive" : ""}
              />
              {errors.studentName && <p className="text-xs text-destructive mt-1">{errors.studentName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentage" className={errors.parentage ? "text-destructive" : ""}>Parentage</Label>
              <Input
                {...register("parentage", { required: "Parentage is required" })}
                placeholder="Father's / Mother's Name"
                className={errors.parentage ? "border-destructive" : ""}
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
          </CardContent>
        </Card>

        <div className="h-px bg-gray-100" />

        {/* Section 3: Optional Parent Details */}
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
                  {...register("parentName", { required: withParent ? "Required" : false })}
                  placeholder="Accompanying Parent Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relation">Relation</Label>
                <Input
                  {...register("relation", { required: withParent ? "Required" : false })}
                  placeholder="e.g. Father, Mother"
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
