"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, School, UserCheck, MapPin, FileText, Zap, GraduationCap, Archive } from "lucide-react";

interface AnalyticsSummaryProps {
  stats: {
    total: number;
    withParent: number;
    uniqueSchools: number;
    uniqueZones: number;
  };
}

export function AnalyticsSummary({ stats }: AnalyticsSummaryProps) {
  const statCards = [
    { 
      label: "Total Applications", 
      value: stats.total, 
      icon: <FileText size={24} />, 
      color: "text-blue-600 bg-blue-50", 
      borderColor: "border-l-blue-500",
      trend: "+2 NEW TODAY",
      trendColor: "bg-blue-100 text-blue-600"
    },
    { 
      label: "Unique Schools", 
      value: stats.uniqueSchools, 
      icon: <Zap size={24} />, 
      color: "text-orange-600 bg-orange-50", 
      borderColor: "border-l-orange-500",
      trend: "8% WAITLIST",
      trendColor: "bg-orange-100 text-orange-600"
    },
    { 
      label: "Accompanied", 
      value: stats.withParent, 
      icon: <GraduationCap size={24} />, 
      color: "text-emerald-600 bg-emerald-50", 
      borderColor: "border-l-emerald-500",
      trend: "60% SUCCESS RATE",
      trendColor: "bg-emerald-100 text-emerald-600"
    },
    { 
      label: "Unique Zones", 
      value: stats.uniqueZones, 
      icon: <Archive size={24} />, 
      color: "text-rose-600 bg-rose-50", 
      borderColor: "border-l-rose-500",
      trend: "ARCHIVED FILES",
      trendColor: "bg-rose-100 text-rose-600"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {statCards.map((item, i) => (
        <Card key={i} className={`border-none shadow-sm shadow-slate-200/50 rounded-[32px] relative overflow-hidden bg-white border-l-4 ${item.borderColor}`}>
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                {item.icon}
              </div>
            </div>
            
            <div className="text-4xl font-extrabold text-slate-900 mb-6">{item.value}</div>
            
            <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${item.trendColor}`}>
                    {item.trend}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Registration flow</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
