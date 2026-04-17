"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, FileText, UserCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Registration {
  id: string;
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
  createdAt: any;
}

interface StudentDataTableProps {
  filteredData: Registration[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onExport: (type: 'current' | 'all' | 'zone' | 'school' | 'class') => void;
}

export function StudentDataTable({ filteredData, searchTerm, setSearchTerm, onExport }: StudentDataTableProps) {
  return (
    <Card className="main-content border-none shadow-sm overflow-hidden">
      <CardHeader className="bg-white p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <Input 
              placeholder="Quick search student..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-slate-200 w-full sm:w-64"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => onExport('current')} className="flex-grow sm:flex-none h-10 border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-widest">
            <Download className="mr-2 h-4 w-4" />
            Filtered PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-50">
                <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6">Student Details</TableHead>
                {/* Request: in Institution table show the School name */}
                <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">School Name</TableHead>
                <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Zone</TableHead>
                {/* Request: what do you ment by the status ? -> Guardian Accompaniment */}
                <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Accompaniment</TableHead>
                <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((reg) => (
                <TableRow key={reg.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4 pl-6">
                    <div className="font-bold text-sm text-slate-900">{reg.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        Class {reg.className} • {reg.gender}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-[12px] font-semibold text-slate-600 max-w-[200px] leading-tight">
                    {reg.school}
                  </TableCell>
                  <TableCell className="py-4 text-[11px] font-bold text-slate-400">
                    {reg.zone}
                  </TableCell>
                  <TableCell className="py-4">
                    {reg.withParent ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase">
                          <UserCircle size={10} />
                          Accompanied
                        </div>
                        {/* Request: show the Accompaniment in the table */}
                        <div className="text-[10px] font-bold text-slate-400">
                            {reg.parentName} <span className="text-[9px] opacity-75">({reg.relation})</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        Individual
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-right pr-6 text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                    {reg.createdAt?.toDate ? 
                      new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(reg.createdAt.toDate()) : 
                      'Pending'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                    No matching records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
