"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { LocalStaffDataTable } from "../components/LocalStaffDataTable";

export default function LocalStaffPage() {
  const { 
    localStaffRegistrations, 
    searchTerm, 
    setSearchTerm 
  } = useDashboardData();

  const filteredLocalStaff = useMemo(() => localStaffRegistrations.filter(r => {
    const searchLow = searchTerm.toLowerCase();
    return (r.name?.toLowerCase() || "").includes(searchLow) ||
      (r.whatsappNumber || "").includes(searchLow) ||
      (r.zone?.toLowerCase() || "").includes(searchLow) ||
      (r.role?.toLowerCase() || "").includes(searchLow);
  }), [localStaffRegistrations, searchTerm]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <LocalStaffDataTable
        data={filteredLocalStaff}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        itemsPerPage={20}
      />
    </div>
  );
}
