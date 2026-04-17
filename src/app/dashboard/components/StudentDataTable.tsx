"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, FileText, UserCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  schoolName?: string;
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
  itemsPerPage: number;
  filterZone?: string;
  setFilterZone?: (val: string) => void;
  filterClass?: string;
  setFilterClass?: (val: string) => void;
  filterOptions?: { zones: string[]; classes: string[] };
}

export function StudentDataTable({ 
  filteredData, searchTerm, setSearchTerm, onExport, 
  itemsPerPage, filterZone, setFilterZone, filterClass, setFilterClass, filterOptions 
}: StudentDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const displayData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterZone, filterClass]);

  return (
    <Card className="main-content border-none shadow-sm overflow-hidden">
      <CardHeader className="bg-white p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
          <div className="relative flex-grow sm:w-64 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <Input 
              placeholder="Quick search student..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-slate-200 w-full"
            />
          </div>

          {filterZone !== undefined && filterOptions && setFilterZone && setFilterClass && (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Select value={filterZone} onValueChange={setFilterZone}>
                <SelectTrigger className="w-full sm:w-[140px] h-10 font-normal border-none bg-slate-50 shadow-sm rounded-2xl text-[12px]">
                  <SelectValue placeholder="All Zones" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  <SelectItem value="all">All Zones</SelectItem>
                  {filterOptions.zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
              
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full sm:w-[120px] h-10 font-normal border-none bg-slate-50 shadow-sm rounded-2xl text-[12px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  <SelectItem value="all">All Classes</SelectItem>
                  {filterOptions.classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex gap-2 w-full xl:w-auto">
          <Button variant="outline" onClick={() => onExport('current')} className="w-full xl:w-auto h-10 border-slate-100 text-slate-500 font-normal text-xs uppercase tracking-widest rounded-2xl">
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
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest pl-6">Student Details</TableHead>
                {/* Request: in Institution table show the School name */}
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">School Name</TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">Zone</TableHead>
                {/* Request: what do you ment by the status ? -> Guardian Accompaniment */}
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">Accompaniment</TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest text-right pr-6">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((reg) => (
                <TableRow key={reg.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4 pl-6">
                    <div className="font-normal text-sm text-slate-900">{reg.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-normal uppercase tracking-wide">
                        Class {reg.className} • {reg.gender}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-[12px] font-normal text-slate-600 max-w-[200px] leading-tight">
                    {reg.schoolName || reg.school}
                  </TableCell>
                  <TableCell className="py-4 text-[11px] font-normal text-slate-400">
                    {reg.zone}
                  </TableCell>
                  <TableCell className="py-4">
                    {reg.withParent ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-normal text-emerald-600 uppercase">
                          <UserCircle size={10} />
                          Accompanied
                        </div>
                        {/* Request: show the Accompaniment in the table */}
                        <div className="text-[10px] font-normal text-slate-400">
                            {reg.parentName} <span className="text-[9px] opacity-75">({reg.relation})</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-normal text-slate-300 uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        Individual
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-right pr-6 text-[10px] text-slate-400 font-normal uppercase tracking-tighter">
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
      {totalPages > 1 && (
        <div className="bg-slate-50/20 p-4 border-t border-slate-50 flex justify-between items-center">
            <div className="text-[10px] text-slate-400 font-normal uppercase tracking-widest px-2">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 text-[10px] uppercase font-normal text-slate-500 rounded-xl"
                >
                    Prev
                </Button>
                <div className="text-[10px] font-normal text-slate-600 px-2">{currentPage} / {totalPages}</div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 text-[10px] uppercase font-normal text-slate-500 rounded-xl"
                >
                    Next
                </Button>
            </div>
        </div>
      )}
    </Card>
  );
}
