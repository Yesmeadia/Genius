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
  stats: any; // Using stats directly for trend and platform data
  relationData: any[];
  accompanimentData: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export function PerformanceCharts({ stats, relationData, accompanimentData }: PerformanceChartsProps) {
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-6 items-start">
      {/* 1. Registration Trend (Main Bar Chart) */}
      <Card className="lg:col-span-8 border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-8 group transition-all duration-500 hover:shadow-lg">
        <div className="flex flex-row items-center justify-between pb-6">
          <div>
            <h3 className="text-xl font-normal text-slate-900 tracking-tight">Registration Trend</h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em] mt-1.5 opacity-80">Daily registration flow volume</p>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 400 }} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 400 }} />
              <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
          <span className="text-[7.5px] text-slate-300 font-black tracking-[0.1em] uppercase">Scale: Dynamic</span>
          <span className="text-[7.5px] text-slate-400 font-medium tracking-tighter tabular-nums uppercase">Synced {stats.lastUpdated}</span>
        </div>
      </Card>

      {/* 2. Application Sources (The Donut Chart) */}
      <Card className="lg:col-span-4 border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />
        <CardHeader className="pb-6 relative">
          <CardTitle className="text-xl font-normal text-slate-900">Platform Distribution</CardTitle>
          <p className="text-xs font-normal text-slate-400 uppercase tracking-widest mt-1">Growth across all forms</p>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-[180px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.platformData}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.platformData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {stats.platformData.map((item: any, i: number) => {
              const total = stats.platformData.reduce((acc: any, curr: any) => acc + curr.value, 0);
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
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

          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[8px] text-slate-300 font-black tracking-[0.1em] uppercase">System: Live</span>
            <span className="text-[8px] text-slate-400 font-medium tracking-tighter tabular-nums uppercase">Synced {stats.lastUpdated}</span>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* 3. Guardian Relation & Accompaniment (Side-by-side smaller charts) */}
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <CardTitle className="text-lg font-normal text-slate-900">Guardian Relation</CardTitle>
            <Users size={20} className="text-slate-200" />
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={relationData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="relation" type="category" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontWeight: 400 }} />
                <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 10, 10, 0]} barSize={20}>
                  <LabelList dataKey="count" position="right" fontSize={10} fill="#475569" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
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
    </div>
  );
}
