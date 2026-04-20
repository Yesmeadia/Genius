"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { AlumniDataTable } from "../components/AlumniDataTable";

export default function AlumniPage() {
  const { 
    alumniRegistrations, 
    searchTerm, 
    setSearchTerm 
  } = useDashboardData();

  const filteredAlumni = useMemo(() => alumniRegistrations.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.name?.toLowerCase().includes(term) || false) ||
      (r.zone?.toLowerCase().includes(term) || false) ||
      (r.school?.toLowerCase().includes(term) || false) ||
      (r.category?.toLowerCase().includes(term) || false) ||
      (r.className?.toLowerCase().includes(term) || false) ||
      (r.whatsappNumber?.includes(term) || false)
    );
  }), [alumniRegistrations, searchTerm]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AlumniDataTable 
        data={filteredAlumni} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        itemsPerPage={20} 
      />
    </div>
  );
}
