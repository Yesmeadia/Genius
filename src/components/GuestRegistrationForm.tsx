"use client";

import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GuestFormData {
  name: string;
  gender: string;
  whatsappNumber: string;
  address: string;
}

export default function GuestRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GuestFormData>({
    defaultValues: {
      name: "",
      gender: "",
      whatsappNumber: "",
      address: "",
    },
  });

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

  const onSubmit = async (data: GuestFormData) => {
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "guest_registrations"), {
        ...data,
        name: data.name.toUpperCase(),
        address: data.address.toUpperCase(),
        registrationType: "guest",
        createdAt: serverTimestamp(),
      });
      router.push(`/success?id=${docRef.id}&type=guest`);
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
        {/* Guest Details Card */}
        <Card className="form-card border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-normal text-slate-900 tracking-tight">
              Guest Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4 md:space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className={`text-xs font-normal uppercase tracking-wider ${errors.name ? "text-destructive" : "text-slate-500"}`}
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
                className={`h-10 md:h-12 bg-white/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all uppercase placeholder:text-slate-300 ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Gender Selection */}
            <div className="space-y-3">
              <Label className={`text-xs font-normal uppercase tracking-wider ${errors.gender ? "text-destructive" : "text-slate-500"}`}>
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
                            ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
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
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-emerald-500" : "border-slate-300"}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </div>
                        <span className={`text-xs font-normal tracking-widest ${isSelected ? "text-emerald-700" : "text-slate-400"}`}>
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
                className={`text-xs font-normal uppercase tracking-wider ${errors.whatsappNumber ? "text-destructive" : "text-slate-500"}`}
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
                className={`h-12 bg-white/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300 ${errors.whatsappNumber ? "border-destructive" : ""}`}
              />
              {errors.whatsappNumber && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.whatsappNumber.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label
                htmlFor="address"
                className={`text-xs font-normal uppercase tracking-wider ${errors.address ? "text-destructive" : "text-slate-500"}`}
              >
                Address
              </Label>
              <textarea
                id="address"
                {...register("address", {
                  required: "Address is required",
                  onChange: (e) =>
                    (e.target.value = e.target.value.toUpperCase()),
                })}
                placeholder="ENTER YOUR FULL ADDRESS"
                rows={3}
                className={`flex min-h-[100px] w-full rounded-md border bg-white/50 px-3 py-2 text-sm ring-offset-background placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 uppercase resize-none transition-all ${
                  errors.address
                    ? "border-destructive focus-visible:ring-destructive/20 border-destructive"
                    : "border-slate-200"
                }`}
              />
              {errors.address && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {errors.address.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-normal transition-all hover:scale-[1.01] bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-[0.982]"
        >
          {isSubmitting ? "Processing..." : "Complete Registration"}
        </Button>
      </form>
    </div>
  );
}
