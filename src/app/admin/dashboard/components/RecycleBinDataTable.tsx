"use client";

import { useState, useMemo } from "react";
import { 
  Search, RefreshCcw, Trash2, ChevronLeft, ChevronRight, 
  ExternalLink, Loader2, Info
} from "lucide-react";
import { DeletedRecord } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { restoreFromRecycleBin, permanentDelete } from "@/lib/deleteUtils";

interface RecycleBinDataTableProps {
  data: DeletedRecord[];
  onActionComplete: () => void;
}

export default function RecycleBinDataTable({ data, onActionComplete }: RecycleBinDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // record id
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    return data.filter(record => {
      const name = (record.data.studentName || record.data.name || record.data.volunteerName || "").toLowerCase();
      const type = record.type.toLowerCase();
      const search = searchTerm.toLowerCase();
      return name.includes(search) || type.includes(search);
    });
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleRestore = async (record: DeletedRecord) => {
    if (!window.confirm(`Are you sure you want to restore the record for ${record.data.studentName || record.data.name || record.data.volunteerName}?`)) return;
    
    setIsProcessing(record.id);
    try {
      await restoreFromRecycleBin(record);
      onActionComplete();
    } catch (error) {
      alert("Failed to restore record.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePermanentDelete = async (record: DeletedRecord) => {
    if (!window.confirm(`WARNING: This will permanently delete the record for ${record.data.studentName || record.data.name || record.data.volunteerName}. This action CANNOT be undone. Proceed?`)) return;
    
    setIsProcessing(record.id);
    try {
      await permanentDelete(record.id);
      onActionComplete();
    } catch (error) {
      alert("Failed to permanently delete record.");
    } finally {
      setIsProcessing(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search deleted records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-100 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
          />
        </div>
        <div className="text-sm text-slate-500 font-normal">
          Total Deleted: <span className="font-semibold text-slate-900">{filteredData.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-[200px] text-[11px] uppercase tracking-widest font-normal text-slate-400 h-14 px-8">Record Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-widest font-normal text-slate-400 h-14">Type</TableHead>
                <TableHead className="text-[11px] uppercase tracking-widest font-normal text-slate-400 h-14">Deleted At</TableHead>
                <TableHead className="text-[11px] uppercase tracking-widest font-normal text-slate-400 h-14">Deleted By</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-widest font-normal text-slate-400 h-14 px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                        <Trash2 size={24} />
                      </div>
                      <p className="text-slate-500 font-normal">No deleted records found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((record) => (
                  <TableRow key={record.id} className="hover:bg-slate-50/50 transition-colors border-slate-50 group">
                    <TableCell className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 leading-tight">
                          {record.data.studentName || record.data.name || record.data.volunteerName || "Unknown"}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tighter mt-0.5">
                          ID: {record.originalId.substring(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg bg-indigo-50 border-indigo-100 text-indigo-600 font-normal px-2 py-0.5">
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-normal text-[13px]">
                      {formatDate(record.deletedAt)}
                    </TableCell>
                    <TableCell className="text-slate-500 font-normal text-[13px]">
                      {record.deletedBy || "System"}
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(record)}
                          disabled={isProcessing !== null}
                          className="h-9 px-3 rounded-xl text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all flex items-center gap-2"
                        >
                          {isProcessing === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw size={16} />}
                          <span className="hidden sm:inline">Restore</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePermanentDelete(record)}
                          disabled={isProcessing !== null}
                          className="h-9 px-3 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          <span className="hidden sm:inline">Permanent Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-normal uppercase tracking-widest">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="h-9 w-9 p-0 rounded-xl border-slate-200"
              >
                <ChevronLeft size={18} />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 p-0 rounded-xl ${currentPage === page ? 'bg-indigo-600 shadow-md shadow-indigo-100' : 'border-slate-200'}`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="h-9 w-9 p-0 rounded-xl border-slate-200"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
        <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Info size={20} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-amber-900 mb-1 tracking-tight">About Recycle Bin</h4>
          <p className="text-[13px] text-amber-700/80 leading-relaxed font-normal">
            Deleted records are stored here for 30 days before being automatically purged (if implemented) or until you permanently delete them. Restoring a record will move it back to its original database with all data intact.
          </p>
        </div>
      </div>
    </div>
  );
}
