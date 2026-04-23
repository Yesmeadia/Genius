"use client";

import { Card, CardContent } from "@/components/ui/card";
import { User, Archive, Zap, FileText, ShieldCheck, School, MapPin, Truck, ChevronUp } from "lucide-react";
import Link from "next/link";
import { DashboardStats } from "../types";

interface AnalyticsSummaryProps {
  stats: DashboardStats;
}

export function AnalyticsSummary({ stats }: AnalyticsSummaryProps) {
  const statCards = [
    { label: "Students", value: stats.totalStudents, icon: <FileText />, color: "indigo", trend: `+${stats.todayCount}`, href: "/admin/dashboard/students-data" },
    { label: "Guests", value: stats.totalGuests, icon: <User />, color: "emerald", trend: "Live", href: "/admin/dashboard/guest-registry" },
    { label: "Yesians", value: stats.totalYesians, icon: <Zap />, color: "amber", trend: "Internal", href: "/admin/dashboard/yesian-network" },
    { label: "Staff", value: stats.totalStaff, icon: <User />, color: "sky", trend: "Support", href: "/admin/dashboard/local-staff" },
    { label: "Alumni", value: stats.totalAlumni, icon: <Archive />, color: "orange", trend: "Alumni", href: "/admin/dashboard/alumni-achievers" },
    { label: "Volunteers", value: stats.totalVolunteers, icon: <ShieldCheck />, color: "blue", trend: "Crew", href: "/admin/dashboard/volunteers" },
    { label: "Awardees", value: stats.totalAwardees, icon: <Zap />, color: "yellow", trend: "Rankers", href: "/admin/dashboard/awardee" },
    { label: "Transport & Support", value: stats.totalDriverStaff, icon: <Truck />, color: "indigo", trend: "Active", href: "/admin/dashboard/driver-staff" },
    { label: "Schools", value: stats.totalSchools, icon: <School />, color: "cyan", trend: "Synced" },
    { label: "Zones", value: stats.totalZones, icon: <MapPin />, color: "rose", trend: "Active" },
    { label: "Accompanied", value: stats.totalAccompanied, icon: <ShieldCheck />, color: "purple", trend: "Parents" },
    { label: "Total Data", value: stats.totalParticipation, icon: <Archive />, color: "slate", trend: "Global", href: "/admin/dashboard/reports" }
  ];

  const colorMap: Record<string, string> = {
    indigo: "text-indigo-600 bg-indigo-50/40 border-indigo-100/50",
    emerald: "text-emerald-600 bg-emerald-50/40 border-emerald-100/50",
    amber: "text-amber-600 bg-amber-50/40 border-amber-100/50",
    sky: "text-sky-600 bg-sky-50/40 border-sky-100/50",
    orange: "text-orange-600 bg-orange-50/40 border-orange-100/50",
    blue: "text-blue-600 bg-blue-50/40 border-blue-100/50",
    yellow: "text-yellow-600 bg-yellow-50/40 border-yellow-100/50",
    cyan: "text-cyan-600 bg-cyan-50/40 border-cyan-100/50",
    rose: "text-rose-600 bg-rose-50/40 border-rose-100/50",
    purple: "text-purple-600 bg-purple-50/40 border-purple-100/50",
    slate: "text-slate-600 bg-slate-50/40 border-slate-100/50",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
      {statCards.map((item, i) => {
        const CardWrapper = item.href ? Link : 'div';
        return (
          <CardWrapper key={i} href={item.href || '#'} className="group relative block">
            {/* Ambient Hover Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-slate-100 to-transparent rounded-[28px] opacity-0 group-hover:opacity-100 blur transition duration-500" />

            <Card className="relative h-full border border-slate-100 shadow-sm rounded-[24px] bg-white transition-all duration-300 hover:shadow-indigo-100/50 hover:border-slate-200">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-2xl ${colorMap[item.color] || colorMap.indigo} border transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                    {cloneElementWithProps(item.icon, { size: 18 })}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-50/50 px-2 py-1 rounded-full uppercase tracking-tighter">
                    <ChevronUp size={10} />
                    {item.trend}
                  </div>
                </div>

                <div className="mt-auto">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-600 transition-colors">
                    {item.label}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-normal text-slate-900 tracking-tight tabular-nums">
                      {item.value}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardWrapper>
        );
      })}
    </div>
  );
}

// Helper to add props to icons without complex logic
function cloneElementWithProps(element: any, props: any) {
  return <element.type {...element.props} {...props} />;
}
