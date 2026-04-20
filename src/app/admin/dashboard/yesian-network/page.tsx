"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { YesianDataTable } from "../components/YesianDataTable";

export default function YesianNetworkPage() {
  const { 
    yesianRegistrations, 
    searchTerm, 
    setSearchTerm 
  } = useDashboardData();

  const filteredYesians = useMemo(() => yesianRegistrations.filter(r => {
    const searchLow = searchTerm.toLowerCase();
    return (r.name?.toLowerCase() || "").includes(searchLow) ||
      (r.whatsappNumber || "").includes(searchLow) ||
      (r.zone?.toLowerCase() || "").includes(searchLow) ||
      (r.designation?.toLowerCase() || "").includes(searchLow);
  }), [yesianRegistrations, searchTerm]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <YesianDataTable
        data={filteredYesians}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        itemsPerPage={20}
      />
    </div>
  );
}
