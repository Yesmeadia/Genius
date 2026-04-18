"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, FileText, UserCircle, RotateCcw, Filter } from "lucide-react";
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
import { locations } from "@/data/locations";

import { Registration, DataTableProps } from "../types";

export function AccompanimentDataTable({ 
  filteredData, searchTerm, setSearchTerm, 
  itemsPerPage, filterZone, setFilterZone, filterClass, setFilterClass, filterOptions,
  filterGender, setFilterGender, filterAccompaniment, setFilterAccompaniment,
  filterSchool, setFilterSchool, resetFilters
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMounted, setHasMounted] = useState(false);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find((sc: any) => sc.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };
  
  const isFiltered = searchTerm !== "" || 
    (filterZone && filterZone !== "all") || 
    (filterSchool && filterSchool !== "all") || 
    (filterClass && filterClass !== "all") || 
    (filterGender && filterGender !== "all") || 
    (filterAccompaniment && filterAccompaniment !== "all");
  
  const displayData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterZone, filterClass, filterGender, filterAccompaniment, filterSchool]);

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

          <div className="flex flex-wrap items-center gap-2">
            {isFiltered && (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800">
                  <Filter size={12} className="opacity-70" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{filteredData.length} Results</span>
                </div>
                
                {resetFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="h-8 px-2 text-[10px] uppercase font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </Button>
                )}
              </div>
            )}

            <Button 
              onClick={() => {
                const parts: string[] = [];
                if (filterZone && filterZone !== "all") parts.push(`Zone: ${filterZone}`);
                if (filterSchool && filterSchool !== "all") parts.push(`School: ${getSchoolName(filterSchool)}`);
                if (filterClass && filterClass !== "all") parts.push(`Class: ${filterClass}`);
                if (filterGender && filterGender !== "all") parts.push(`Gender: ${filterGender}`);
                if (filterAccompaniment && filterAccompaniment !== "all") parts.push(`Status: ${filterAccompaniment}`);

                const pdfTitle = parts.length > 0 ? parts.join(" | ") : "All Guardian Data";
                const pdfFilename = isFiltered ? "guardian_data_filtered" : "all_guardian_data_master";
                
                import("@/lib/exportUtils").then(m => {
                  m.generateRegistrationPDF(filteredData, pdfTitle, pdfFilename);
                });
              }}
              className="h-9 px-3 text-[10px] uppercase tracking-widest font-bold bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all rounded-xl shadow-sm"
            >
              <Download size={14} className="mr-2" /> Export PDF
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
          {filterOptions && setFilterClass && (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {filterZone !== undefined && setFilterZone && (
                <Select value={filterZone || "all"} onValueChange={setFilterZone}>
                  <SelectTrigger className="w-full sm:w-[130px] h-10 font-normal border-none bg-slate-50 shadow-sm rounded-2xl text-[12px]">
                    <SelectValue placeholder="All Zones" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="all">All Zones</SelectItem>
                    {filterOptions.zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {filterSchool !== undefined && setFilterSchool && (
                <Select value={filterSchool || "all"} onValueChange={setFilterSchool}>
                  <SelectTrigger className="w-full sm:w-[160px] h-10 font-normal border-none bg-slate-50 shadow-sm rounded-2xl text-[12px]">
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="all">All Schools</SelectItem>
                    {filterOptions.schools.map(s => (
                      <SelectItem key={s} value={s}>{getSchoolName(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full sm:w-[120px] h-10 font-normal border-none bg-slate-50 shadow-sm rounded-2xl text-[12px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  <SelectItem value="all">All Classes</SelectItem>
                  {filterOptions.classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>
              
              {filterGender !== undefined && setFilterGender && (
                <Select value={filterGender || "all"} onValueChange={setFilterGender}>
                  <SelectTrigger className="w-full sm:w-[120px] h-10 font-normal border-none bg-slate-50 shadow-sm rounded-2xl text-[12px]">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {filterAccompaniment !== undefined && setFilterAccompaniment && (
                <Select value={filterAccompaniment || "all"} onValueChange={setFilterAccompaniment}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10 font-normal border-none bg-slate-50 shadow-sm rounded-2xl text-[12px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="accompanied">Accompanied</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 w-full xl:w-auto">
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-50">
                <TableHead className="py-4 text-[10px] font-normal text-emerald-600 uppercase tracking-widest pl-6">Guardian Profile</TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">Student Linked</TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">Institution Location</TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((reg) => (
                <TableRow key={reg.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reg.withParent ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <UserCircle size={16} />
                      </div>
                      <div>
                        {reg.withParent ? (
                          <>
                            <div className="font-normal text-sm text-slate-900">{reg.parentName || "Unknown Guardian"}</div>
                            <div className="text-[10px] text-slate-400 font-normal uppercase tracking-wide">
                                {reg.relation || "Relative"} • {reg.parentGender || "Unspecified"}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-normal text-sm text-slate-500">Individual Participant</div>
                            <div className="text-[10px] text-slate-300 font-normal uppercase tracking-wide">No Guardian Data</div>
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="font-normal text-[13px] text-slate-600">{reg.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-normal uppercase tracking-wide">Grade {reg.className}</div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="font-normal text-[12px] text-slate-600 max-w-[200px] leading-tight truncate">{reg.schoolName || reg.school}</div>
                    <div className="text-[10px] text-slate-400 font-normal uppercase tracking-wide">{reg.zone}</div>
                  </TableCell>
                  <TableCell className="py-4 text-[10px] text-slate-400 font-normal uppercase tracking-tighter">
                    {hasMounted && reg.createdAt?.toDate ? 
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
