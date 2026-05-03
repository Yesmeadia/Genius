"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { MediaDataTable } from "../components/MediaDataTable";
import { Camera } from "lucide-react";

export default function MediaPage() {
  const { 
    mediaRegistrations, 
    searchTerm, 
    setSearchTerm,
    filterGender,
    setFilterGender,
    resetFilters
  } = useDashboardData();

  const localFilterOptions = useMemo(() => {
    return { zones: [] };
  }, []);

  const filteredMedia = useMemo(() => mediaRegistrations.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (r.name?.toLowerCase().includes(term) || false) ||
      (r.agency?.toLowerCase().includes(term) || false) ||
      (r.designation?.toLowerCase().includes(term) || false) ||
      (r.whatsappNumber?.includes(term) || false)
    );

    const matchesGender = filterGender === "all" || (r.gender && r.gender.toUpperCase() === filterGender.toUpperCase());

    return matchesSearch && matchesGender;
  }), [mediaRegistrations, searchTerm, filterGender]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <MediaDataTable 
        data={filteredMedia} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        itemsPerPage={20}
        filterGender={filterGender}
        setFilterGender={setFilterGender}
        resetFilters={resetFilters}
      />
    </div>
  );
}
