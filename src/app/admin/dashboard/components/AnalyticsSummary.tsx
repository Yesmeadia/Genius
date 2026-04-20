"use client";

import { Card, CardContent } from "@/components/ui/card";
import { User, Archive, Zap, FileText, ShieldCheck, School, MapPin } from "lucide-react";

import { DashboardStats } from "../types";

interface AnalyticsSummaryProps {
  stats: DashboardStats;
}

export function AnalyticsSummary({ stats }: AnalyticsSummaryProps) {
  const statCards = [
    {
      label: "Total Registrations",
      value: stats.totalStudents,
      icon: <FileText size={20} />,
      color: "text-indigo-600 bg-indigo-50",
      glowColor: "bg-indigo-500",
      trend: `+${stats.todayCount} NEW TODAY`,
      trendColor: "bg-indigo-100 text-indigo-600"
    },
    {
      label: "Guest Observers",
      value: stats.totalGuests,
      icon: <User size={20} />,
      color: "text-emerald-600 bg-emerald-50",
      glowColor: "bg-emerald-500",
      trend: `VERIFIED LIST`,
      trendColor: "bg-emerald-100 text-emerald-600"
    },
    {
      label: "Yesian Members",
      value: stats.totalYesians,
      icon: <Zap size={20} />,
      color: "text-amber-600 bg-amber-50",
      glowColor: "bg-amber-500",
      trend: `INTERNAL TIER`,
      trendColor: "bg-amber-100 text-amber-600"
    },
    {
      label: "TOTAL SCHOOLS",
      value: `${stats.totalSchools} / ${stats.availableSchoolsCount}`,
      icon: <School size={20} />,
      color: "text-sky-600 bg-sky-50",
      glowColor: "bg-sky-500",
      trend: `${stats.totalSchools} PARTICIPATING`,
      trendColor: "bg-sky-100 text-sky-600"
    },
    {
      label: "Accompanied",
      value: stats.totalAccompanied ?? "—",
      icon: <ShieldCheck size={20} />,
      color: "text-purple-600 bg-purple-50",
      glowColor: "bg-purple-500",
      trend: `M: ${stats.malesCount} / F: ${stats.femalesCount}`,
      trendColor: "bg-purple-100 text-purple-600"
    },
    {
      label: "Unique Zones",
      value: `${stats.totalZones} / ${stats.availableZonesCount}`,
      icon: <MapPin size={20} />,
      color: "text-rose-600 bg-rose-50",
      glowColor: "bg-rose-500",
      trend: `${stats.totalZones} ACTIVE HUBS`,
      trendColor: "bg-rose-100 text-rose-600"
    },
    {
      label: "Total Participation",
      value: stats.totalParticipation,
      icon: <Archive size={20} />,
      color: "text-slate-600 bg-slate-50",
      glowColor: "bg-slate-500",
      trend: `M: ${stats.malesCount} / F: ${stats.femalesCount}`,
      trendColor: "bg-slate-100 text-slate-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {statCards.map((item, i) => (
        <Card key={i} className="border border-slate-100 shadow-sm rounded-[24px] overflow-hidden bg-white relative group transition-all duration-500 hover:shadow-lg hover:translate-y-[-2px]">
          {/* Dynamic Ambient Glow */}
          <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full ${item.glowColor} blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity duration-700`} />
          <div className="absolute inset-px rounded-[23px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-4 relative z-20">
            <div className="flex justify-between items-start mb-2">
              <div className="text-[9px] font-medium text-slate-400 uppercase tracking-widest leading-tight w-2/3">{item.label}</div>
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform duration-500`}>
                {item.icon}
              </div>
            </div>

            <div className="text-2xl lg:text-3xl font-normal text-slate-900 mb-2 tracking-tight drop-shadow-sm">
              {item.value}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${item.trendColor} shadow-sm`}>
                {item.trend}
              </span>
            </div>

          </CardContent>
        </Card>
      ))}
    </div>
  );
}
