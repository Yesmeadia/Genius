"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { DriverStaffDataTable } from "../components/DriverStaffDataTable";

export default function DriverStaffPage() {
  const { 
    driverStaffRegistrations, 
    searchTerm, 
    setSearchTerm,
    filterZone,
    setFilterZone,
    resetFilters
  } = useDashboardData();

  const filterOptions = useMemo(() => {
    const zones = Array.from(new Set(driverStaffRegistrations.map(r => r.zone))).filter(Boolean).sort();
    return { zones };
  }, [driverStaffRegistrations]);

  const filteredData = useMemo(() => driverStaffRegistrations.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (r.name?.toLowerCase().includes(term) || false) ||
      (r.zone?.toLowerCase().includes(term) || false) ||
      (r.staffType?.toLowerCase().includes(term) || false) ||
      (r.vehicleNumber?.toLowerCase().includes(term) || false) ||
      (r.vehicleType?.toLowerCase().includes(term) || false) ||
      (r.whatsappNumber?.includes(term) || false)
    );

    const matchesZone = filterZone === "all" || r.zone === filterZone;

    return matchesSearch && matchesZone;
  }), [driverStaffRegistrations, searchTerm, filterZone]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <DriverStaffDataTable 
        data={filteredData} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        itemsPerPage={20}
        filterZone={filterZone}
        setFilterZone={setFilterZone}
        filterOptions={filterOptions}
        resetFilters={resetFilters}
      />
    </div>
  );
}
