"use client";

import { useState } from "react";
import RegistrationForm from "@/components/RegistrationForm";
import VolunteerRegistrationForm from "@/components/VolunteerRegistrationForm";
import AwardeeRegistrationForm from "@/components/AwardeeRegistrationForm";
import GuestRegistrationForm from "@/components/GuestRegistrationForm";
import YesianRegistrationForm from "@/components/YesianRegistrationForm";
import LocalStaffRegistrationForm from "@/components/LocalStaffRegistrationForm";
import AlumniAchieverRegistrationForm from "@/components/AlumniAchieverRegistrationForm";
import { DriverStaffRegistrationForm } from "@/components/DriverStaffRegistrationForm";
import MediaRegistrationForm from "@/components/MediaRegistrationForm";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

const REGISTRATION_TYPES = [
  { id: "student", label: "Student", component: RegistrationForm },
  { id: "volunteer", label: "Volunteer", component: VolunteerRegistrationForm },
  { id: "awardee", label: "Awardee", component: AwardeeRegistrationForm },
  { id: "guest", label: "Guest", component: GuestRegistrationForm },
  { id: "yesian", label: "Yesian", component: YesianRegistrationForm },
  { id: "local-staff", label: "Local Staff", component: LocalStaffRegistrationForm },
  { id: "alumni", label: "Alumni Achiever", component: AlumniAchieverRegistrationForm },
  { id: "driver", label: "Driver & Staff", component: DriverStaffRegistrationForm },
  { id: "media", label: "Media", component: MediaRegistrationForm },
];

export default function AdminRegistrationPage() {
  const [selectedType, setSelectedType] = useState<string>("student");

  const ActiveForm = REGISTRATION_TYPES.find((t) => t.id === selectedType)?.component || RegistrationForm;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <UserPlus size={20} />
              </div>
              <div>
                <CardTitle className="text-lg font-normal">Registration Type</CardTitle>
                <CardDescription className="text-xs">Select who you are registering</CardDescription>
              </div>
            </div>

            <div className="md:ml-auto w-full md:w-64">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl focus:ring-indigo-500/20">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {REGISTRATION_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id} className="py-3 focus:bg-indigo-50 focus:text-indigo-600 rounded-lg mx-1">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-8">
          <div className="max-w-4xl mx-auto py-8">
            <ActiveForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
