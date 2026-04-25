"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, RotateCcw, User, Phone, MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LocalStaffRegistration } from "../types";
import Link from "next/link";
import { locations } from "@/data/locations";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface LocalStaffDataTableProps {
  data: LocalStaffRegistration[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  itemsPerPage: number;
  filterZone?: string;
  setFilterZone?: (val: string) => void;
  filterGender?: string;
  setFilterGender?: (val: string) => void;
  filterSchool?: string;
  setFilterSchool?: (val: string) => void;
  filterOptions?: { zones: string[]; schools: string[] };
  resetFilters?: () => void;
}

export function LocalStaffDataTable({
  data,
  searchTerm,
  setSearchTerm,
  itemsPerPage,
  filterZone,
  setFilterZone,
  filterGender,
  setFilterGender,
  filterSchool,
  setFilterSchool,
  filterOptions,
  resetFilters
}: LocalStaffDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMounted, setHasMounted] = useState(false);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find(s => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const displayData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterZone, filterSchool, filterGender]);

  const isFiltered = searchTerm !== "" ||
    (filterZone && filterZone !== "all") ||
    (filterSchool && filterSchool !== "all") ||
    (filterGender && filterGender !== "all");

  return (
    <Card className="main-content border-none shadow-sm overflow-hidden">
      <CardHeader className="bg-white p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-50">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative flex-grow sm:w-64 max-w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <Input
              placeholder="Search Local Staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-slate-200 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800">
                  <Filter size={12} className="opacity-70" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{data.length} Results</span>
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
                import("@/lib/exportUtils").then(m => {
                  m.generateLocalStaffExportPDF(data, "Local Staff Registry", "local_staff_data");
                });
              }}
              className="h-9 px-3 text-[10px] uppercase tracking-widest font-bold bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all rounded-xl shadow-sm"
            >
              <Download size={14} className="mr-2" /> Export
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
          {filterOptions && (
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
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-50">
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest pl-6">
                  Staff Name
                </TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest pl-1">
                  Zone
                </TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                  Contact
                </TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                  Role
                </TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                  School
                </TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                  Attendance
                </TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest text-right pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((reg) => (
                <TableRow
                  key={reg.id}
                  className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-8 w-8 border border-slate-100 shadow-sm overflow-hidden text-sky-600">
                        {reg.photoUrl ? (
                          <AvatarImage src={reg.photoUrl} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-sky-50">
                            <User size={16} />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="font-normal text-sm text-slate-900">
                        {reg.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="text-[10px] text-slate-600 uppercase tracking-tight flex items-center gap-1 font-bold">
                      <MapPin size={9} />
                      {reg.zone}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} className="text-slate-300 shrink-0" />
                        <span className="text-[11px] font-normal text-slate-600 tracking-wide">
                          {reg.whatsappNumber}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${reg.role === "Teaching"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}>
                      {reg.role || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="text-[11px] font-normal text-slate-600 line-clamp-2 leading-tight">
                      {locations.find(z => z.id === reg.zone)?.schools.find(s => s.id === reg.school)?.name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {reg.attendance ? (
                      <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-none">
                        Present
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50/50 text-slate-300 border-slate-100 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-none">
                        Absent
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-right pr-6">
                    <Link href={`/admin/dashboard/local-staff/${reg.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-all"
                      >
                        View Profile
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-xs"
                  >
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
            Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, data.length)} of {data.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 text-[10px] uppercase font-normal text-slate-500 rounded-xl"
            >
              Prev
            </Button>
            <div className="text-[10px] font-normal text-slate-600 px-2">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
