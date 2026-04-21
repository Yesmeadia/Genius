"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, RotateCcw, User, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GuestRegistration } from "../types";

interface GuestDataTableProps {
  data: GuestRegistration[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  itemsPerPage: number;
}

export function GuestDataTable({
  data,
  searchTerm,
  setSearchTerm,
  itemsPerPage,
}: GuestDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMounted, setHasMounted] = useState(false);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const displayData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-slate-200 w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="h-8 px-2 text-[10px] uppercase font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={12} />
              Reset
            </Button>
          )}
          <Button 
            onClick={() => {
              import("@/lib/exportUtils").then(m => {
                m.generateGuestExportPDF(data, "Guest Registry Registry", "guest_registry_data");
              });
            }}
            className="h-9 px-3 text-[10px] uppercase tracking-widest font-bold bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all rounded-xl shadow-sm"
          >
            <Download size={14} className="mr-2" /> Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-50">
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest pl-6">
                  Guest Name
                </TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                  WhatsApp Number
                </TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                  Address
                </TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                  Registered At
                </TableHead>
                <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest text-right pr-6">
                  Action
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
                      <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                        <AvatarFallback className="bg-slate-50 text-slate-400">
                          <User size={16} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-normal text-sm text-slate-900">
                        {reg.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} className="text-slate-300 shrink-0" />
                      <span className="text-[11px] font-normal text-slate-600 tracking-wide">
                        {reg.whatsappNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-slate-300 shrink-0" />
                      <span className="text-[11px] font-normal text-slate-600">
                        {reg.address}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right pr-6 text-[10px] text-slate-400 font-normal uppercase tracking-tighter">
                    {hasMounted && reg.createdAt?.toDate
                      ? new Intl.DateTimeFormat("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(reg.createdAt.toDate())
                      : "Pending"}
                  </TableCell>
                  <TableCell className="py-4 text-right pr-6">
                    <Link href={`/admin/dashboard/guest/${reg.id}`}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
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
                    colSpan={5}
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
