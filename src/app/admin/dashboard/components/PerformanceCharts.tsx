"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Users,
    Activity,
    PieChart as PieIcon,
    BarChart3
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";

interface PerformanceChartsProps {
  genderData: any[];
  zoneData: any[];
  accompanimentData: any[];
  relationData: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export function PerformanceCharts({ genderData, zoneData, accompanimentData, relationData }: PerformanceChartsProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8 bg-slate-50 animate-pulse rounded-[32px] h-[450px]" />
        <div className="lg:col-span-4 bg-slate-50 animate-pulse rounded-[32px] h-[450px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
      {/* 1. Registration Trend (Main Bar Chart) */}
      <Card className="lg:col-span-8 border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div>
            <CardTitle className="text-xl font-normal text-slate-900">Registration Trend</CardTitle>
            <p className="text-xs font-normal text-slate-400 uppercase tracking-widest mt-1">Daily registration flow volume</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button className="px-4 py-1.5 text-[10px] font-normal uppercase text-slate-400">Monthly</button>
             <button className="px-4 py-1.5 text-[10px] font-normal uppercase bg-blue-600 text-white rounded-lg shadow-sm">Daily</button>
          </div>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zoneData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="zone" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 400}} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 400}} />
              <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.05)'}} />
              <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Application Sources (The Donut Chart) */}
      <Card className="lg:col-span-4 border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />
        <CardHeader className="pb-6 relative">
          <CardTitle className="text-xl font-normal text-slate-900">Student Sources</CardTitle>
          <p className="text-xs font-normal text-slate-400 uppercase tracking-widest mt-1">Submissions by gender</p>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={genderData} 
                  innerRadius={65} 
                  outerRadius={85} 
                  paddingAngle={8} 
                  dataKey="value"
                  stroke="none"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {genderData.map((item, i) => {
              const total = genderData.reduce((acc, curr) => acc + curr.value, 0);
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                    <span className="text-[13px] font-normal text-slate-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-normal text-slate-900">{item.value}</div>
                    <div className="text-[10px] font-normal text-slate-400">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Guardian Relation & Accompaniment (Side-by-side smaller charts) */}
      <Card className="lg:col-span-6 border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
            <CardTitle className="text-lg font-normal text-slate-900">Guardian Relation</CardTitle>
            <Users size={20} className="text-slate-200" />
        </CardHeader>
        <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={relationData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="relation" type="category" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 400}} />
                    <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.05)'}} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 10, 10, 0]} barSize={20}>
                        <LabelList dataKey="count" position="right" fontSize={10} fill="#475569" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-6 border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
            <CardTitle className="text-lg font-normal text-slate-900">Accompaniment Status</CardTitle>
            <Activity size={20} className="text-slate-200" />
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={accompanimentData} 
                cx="50%" cy="50%" 
                innerRadius={50} outerRadius={70} 
                dataKey="value" stroke="none"
                label={({ name, value }) => `${name} (${value})`}
                labelLine={false}
              >
                {accompanimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
