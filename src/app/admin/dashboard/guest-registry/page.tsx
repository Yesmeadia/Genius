"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { GuestDataTable } from "../components/GuestDataTable";

export default function GuestRegistryPage() {
  const { 
    guestRegistrations, 
    searchTerm, 
    setSearchTerm 
  } = useDashboardData();

  const filteredGuests = useMemo(() => guestRegistrations.filter(r => {
    const searchLow = searchTerm.toLowerCase();
    return (r.name?.toLowerCase() || "").includes(searchLow) ||
      (r.whatsappNumber || "").includes(searchLow) ||
      (r.address?.toLowerCase() || "").includes(searchLow);
  }), [guestRegistrations, searchTerm]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GuestDataTable
        data={filteredGuests}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        itemsPerPage={20}
      />
    </div>
  );
}
