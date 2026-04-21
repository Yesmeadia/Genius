"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Activity,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Globe
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
  AreaChart,
  Area,
  TooltipProps
} from "recharts";

interface PerformanceChartsProps {
  stats: any;
  relationData: any[];
  accompanimentData: any[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9'];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-3 rounded-2xl shadow-xl shadow-indigo-100/20">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-normal text-slate-900">
          <span className="text-indigo-600 font-bold">{payload[0].value}</span> Registrations
        </p>
      </div>
    );
  }
  return null;
};

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

  const totalRegistrations = stats.platformData.reduce((acc: any, curr: any) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-6 items-start">
      {/* 1. Registration Trend (Redesigned as Area Chart) */}
      <Card className="lg:col-span-8 border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="flex flex-row items-center justify-between pb-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-indigo-500" />
              <h3 className="text-xl font-normal text-slate-900 tracking-tight">Registration Trend</h3>
            </div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em] opacity-80">Daily synchronized enrollment activity</p>
          </div>
        </div>

        <div className="h-[300px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                fontSize={10} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontWeight: 400 }}
                dy={10}
              />
              <YAxis 
                fontSize={10} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontWeight: 400 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between opacity-50 relative z-10">
          <span className="text-[7px] text-slate-400 font-bold tracking-[0.2em] uppercase">Metric: Growth Velocity</span>
          <span className="text-[7px] text-slate-400 font-medium tracking-tighter tabular-nums uppercase">Auto-synced {stats.lastUpdated}</span>
        </div>
      </Card>

      {/* 2. Platform Distribution (Redesigned with Center Label) */}
      <Card className="lg:col-span-4 border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6 relative overflow-hidden flex flex-col h-full">
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50/50 rounded-full -ml-16 -mb-16 blur-3xl" />
        
        <CardHeader className="pb-4 relative px-2">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={16} className="text-emerald-500" />
            <CardTitle className="text-xl font-normal text-slate-900 tracking-tight">Distribution</CardTitle>
          </div>
          <p className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Platform-wide participation</p>
        </CardHeader>

        <CardContent className="pb-4 relative z-10 flex-grow px-2">
          <div className="h-[220px] mb-6 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.platformData}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                >
                  {stats.platformData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-lg text-xs font-normal">
                        {payload[0].name}: <span className="font-bold text-indigo-600">{payload[0].value}</span>
                      </div>
                    );
                  }
                  return null;
                }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
              <span className="text-3xl font-normal text-slate-900 tracking-tighter">{totalRegistrations}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-[135px] overflow-y-auto pr-2 custom-scrollbar">
            {stats.platformData.map((item: any, i: number) => {
              const percentage = totalRegistrations > 0 ? ((item.value / totalRegistrations) * 100).toFixed(1) : 0;
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/30 hover:bg-slate-50 transition-all duration-300 border border-transparent hover:border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full transition-transform group-hover:scale-150" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-normal text-slate-600 uppercase tracking-wider">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-normal text-slate-900 tabular-nums">{item.value}</span>
                    <span className="text-[10px] font-normal text-slate-400 ml-2">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* 3. Guardian Relation */}
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6 group hover:shadow-lg transition-all duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-6 px-2">
            <div>
              <CardTitle className="text-lg font-normal text-slate-900 tracking-tight">Guardian Relation</CardTitle>
              <p className="text-[10px] font-normal text-slate-400 uppercase tracking-widest mt-1">Primary accompaniment mapping</p>
            </div>
            <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Users size={18} className="text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="h-[250px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={relationData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="relation" 
                  type="category" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontWeight: 400 }}
                  width={80}
                />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={16}>
                  <LabelList dataKey="count" position="right" fontSize={10} fill="#64748b" offset={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Accompaniment Status */}
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6 group hover:shadow-lg transition-all duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-6 px-2">
            <div>
              <CardTitle className="text-lg font-normal text-slate-900 tracking-tight">Safety Status</CardTitle>
              <p className="text-[10px] font-normal text-slate-400 uppercase tracking-widest mt-1">Accompaniment verification</p>
            </div>
            <div className="h-10 w-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <Activity size={18} className="text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="h-[250px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={accompanimentData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={85}
                  dataKey="value" stroke="none"
                  animationDuration={1500}
                >
                  {accompanimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-lg text-xs">
                        {payload[0].name}: <span className="font-bold">{payload[0].value}</span>
                      </div>
                    );
                  }
                  return null;
                }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend for Pie */}
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2 text-[10px] font-normal text-slate-500 uppercase">
                <div className="w-2 h-2 rounded-full bg-[#10b981]" /> Accompanied
              </div>
              <div className="flex items-center gap-2 text-[10px] font-normal text-slate-500 uppercase">
                <div className="w-2 h-2 rounded-full bg-[#f43f5e]" /> Individual
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
