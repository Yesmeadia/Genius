"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useState, useRef, useMemo } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { locations } from "@/data/locations";

interface AlumniRegistrationData {
  name: string;
  gender: string;
  whatsappNumber: string;
  zone: string;
  school: string;
  category: string;
  className: string;
  photo?: FileList;
  withParent: boolean;
  accompaniments: { name: string; gender: string; relation: string; }[];
}

export default function AlumniRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AlumniRegistrationData>({
    defaultValues: {
      name: "",
      gender: "",
      whatsappNumber: "",
      zone: "",
      school: "",
      category: "",
      className: "",
      withParent: false,
      accompaniments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "accompaniments"
  });

  const withParent = watch("withParent");

  // Add initial accompaniment field when withParent is toggled on
  useGSAP(() => {
    if (withParent && fields.length === 0) {
      append({ name: "", gender: "MALE", relation: "" });
    }
  }, { dependencies: [withParent], scope: containerRef });

  const selectedZone = watch("zone");
  const selectedCategory = watch("category");

  const schoolsForZone = useMemo(() => {
    if (!selectedZone) return [];
    return locations.find((l) => l.name === selectedZone)?.schools || [];
  }, [selectedZone]);

  const classesForCategory = useMemo(() => {
    switch (selectedCategory) {
      case "Rainbow":
        return ["3rd", "4th", "5th"];
      case "Planets":
        return ["6th", "7th", "8th"];
      case "Galaxy":
        return ["9th", "10th", "11th", "12th"];
      default:
        return [];
    }
  }, [selectedCategory]);

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

  const onSubmit = async (data: AlumniRegistrationData) => {
    setIsSubmitting(true);
    try {
      let photoUrl = "";
      if (data.photo && data.photo[0]) {
        const file = data.photo[0];
        const storageRef = ref(storage, `photos/alumni/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      const finalData = {
        ...data,
        photoUrl,
        name: data.name.toUpperCase(),
        registrationType: "alumni-achiever",
        withParent: data.withParent,
        accompaniments: data.withParent ? data.accompaniments.map(a => ({
          ...a,
          name: a.name.toUpperCase(),
          relation: a.relation.toUpperCase()
        })) : []
      };
      // remove FileList object before saving
      delete (finalData as any).photo;

      const docRef = await addDoc(collection(db, "alumni_registrations"), {
        ...finalData,
        createdAt: serverTimestamp(),
      });
      router.push(`/success?id=${docRef.id}&type=alumni-achiever`);
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
        
        {/* Personal Details Card */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-normal text-slate-900 tracking-tight">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label className={`text-xs font-normal uppercase tracking-wider ${errors.name ? "text-destructive" : "text-slate-500"}`}>
                Full Name
              </Label>
              <Input
                {...register("name", {
                  required: "Name is required",
                  onChange: (e) => (e.target.value = e.target.value.toUpperCase()),
                })}
                placeholder="ENTER YOUR FULL NAME"
                className={`h-10 md:h-12 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all uppercase placeholder:text-slate-300 ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && <p className="text-xs text-destructive mt-1 font-medium">{errors.name.message}</p>}
            </div>

            <div className="space-y-3">
              <Label className={`text-xs font-normal uppercase tracking-wider ${errors.gender ? "text-destructive" : "text-slate-500"}`}>
                Gender
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {["MALE", "FEMALE"].map((option) => {
                  const isSelected = watch("gender") === option.toUpperCase();
                  return (
                    <label
                      key={option}
                      className={`relative flex items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300
                        ${isSelected ? "border-indigo-500 bg-indigo-50/50 shadow-sm" : "border-slate-100 bg-white/50 hover:border-slate-200"}`}
                    >
                      <input
                        type="radio"
                        value={option.toUpperCase()}
                        {...register("gender", { required: "Gender is required" })}
                        className="absolute opacity-0"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-indigo-500" : "border-slate-300"}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                        </div>
                        <span className={`text-xs font-normal tracking-widest ${isSelected ? "text-indigo-700" : "text-slate-400"}`}>
                          {option}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.gender && <p className="text-xs text-destructive mt-1 font-medium">{errors.gender.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-normal uppercase tracking-wider ${errors.whatsappNumber ? "text-destructive" : "text-slate-500"}`}>
                WhatsApp Number
              </Label>
              <Input
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
                className={`h-12 bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300 ${errors.whatsappNumber ? "border-destructive" : ""}`}
              />
              {errors.whatsappNumber && <p className="text-xs text-destructive mt-1 font-medium">{errors.whatsappNumber.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Academic Details Card */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-normal text-slate-900 tracking-tight">
              Educational Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label className={`text-xs font-normal uppercase tracking-wider ${errors.zone ? "text-destructive" : "text-slate-500"}`}>
                  Zone
                </Label>
                <Controller
                  name="zone"
                  control={control}
                  rules={{ required: "Zone is required" }}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        setValue("school", ""); 
                      }}
                      value={field.value}
                    >
                      <SelectTrigger className={`h-10 md:h-12 bg-white/50 focus:ring-indigo-500/20 uppercase ${errors.zone ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="SELECT ZONE" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((zone) => (
                          <SelectItem key={zone.id} value={zone.name} className="uppercase">
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.zone && <p className="text-xs text-destructive mt-1 font-medium">{errors.zone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className={`text-xs font-normal uppercase tracking-wider ${errors.school ? "text-destructive" : "text-slate-500"}`}>
                  School
                </Label>
                <Controller
                  name="school"
                  control={control}
                  rules={{ required: "School is required" }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedZone || schoolsForZone.length === 0}
                    >
                      <SelectTrigger className={`h-10 md:h-12 bg-white/50 focus:ring-indigo-500/20 uppercase ${errors.school ? "border-destructive" : ""}`}>
                        <SelectValue placeholder={!selectedZone ? "SELECT ZONE FIRST" : "SELECT SCHOOL"} />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolsForZone.map((school) => (
                          <SelectItem key={school.id} value={school.name} className="uppercase text-xs">
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.school && <p className="text-xs text-destructive mt-1 font-medium">{errors.school.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label className={`text-xs font-normal uppercase tracking-wider ${errors.category ? "text-destructive" : "text-slate-500"}`}>
                  Category
                </Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        setValue("className", "");
                      }}
                      value={field.value}
                    >
                      <SelectTrigger className={`h-10 md:h-12 bg-white/50 focus:ring-indigo-500/20 uppercase ${errors.category ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="SELECT CATEGORY" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Rainbow", "Planets", "Galaxy"].map((cat) => (
                          <SelectItem key={cat} value={cat} className="uppercase">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-xs text-destructive mt-1 font-medium">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className={`text-xs font-normal uppercase tracking-wider ${errors.className ? "text-destructive" : "text-slate-500"}`}>
                  Class
                </Label>
                <Controller
                  name="className"
                  control={control}
                  rules={{ required: "Class is required" }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedCategory || classesForCategory.length === 0}
                    >
                      <SelectTrigger className={`h-10 md:h-12 bg-white/50 focus:ring-indigo-500/20 uppercase ${errors.className ? "border-destructive" : ""}`}>
                        <SelectValue placeholder={!selectedCategory ? "SELECT CATEGORY FIRST" : "SELECT CLASS"} />
                      </SelectTrigger>
                      <SelectContent>
                        {classesForCategory.map((cls) => (
                          <SelectItem key={cls} value={cls} className="uppercase">
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.className && <p className="text-xs text-destructive mt-1 font-medium">{errors.className.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Alumni Photo */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-xl font-normal text-slate-900 tracking-tight">Alumni Photo</CardTitle>
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

        <div className="h-px bg-slate-200/20" />

        {/* Section: Accompaniment */}
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
                <div key={field.id} className="relative p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-normal uppercase tracking-wider text-slate-500">Name</Label>
                      <Input
                        {...register(`accompaniments.${index}.name` as const, {
                          required: "Required",
                          onChange: (e) => (e.target.value = e.target.value.toUpperCase()),
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
                          onChange: (e) => (e.target.value = e.target.value.toUpperCase()),
                        })}
                        placeholder="E.G. FATHER"
                        className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all uppercase placeholder:text-slate-300 shadow-sm"
                      />
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-xs font-normal uppercase tracking-wider text-slate-500">Gender</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {["MALE", "FEMALE"].map((option) => {
                          const isSelected = watch(`accompaniments.${index}.gender`) === option;
                          return (
                            <label
                              key={option}
                              className={`relative flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-300
                                ${isSelected ? "border-indigo-500 bg-indigo-50/30 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200"}`}
                            >
                              <input
                                type="radio"
                                value={option}
                                {...register(`accompaniments.${index}.gender` as const, { required: true })}
                                className="absolute opacity-0"
                              />
                              <span className={`text-[10px] font-bold tracking-widest ${isSelected ? "text-indigo-700" : "text-slate-400"}`}>
                                {option}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {fields.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ name: "", gender: "MALE", relation: "" })}
                  className="w-full h-12 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-500 hover:text-indigo-600 transition-all rounded-2xl flex items-center justify-center gap-2"
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
