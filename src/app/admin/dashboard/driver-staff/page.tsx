"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { DriverStaffDataTable } from "../components/DriverStaffDataTable";

export default function DriverStaffPage() {
  const { 
    driverStaffRegistrations, 
    searchTerm, 
    setSearchTerm 
  } = useDashboardData();

  const filteredData = useMemo(() => driverStaffRegistrations.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.name?.toLowerCase().includes(term) || false) ||
      (r.zone?.toLowerCase().includes(term) || false) ||
      (r.staffType?.toLowerCase().includes(term) || false) ||
      (r.vehicleNumber?.toLowerCase().includes(term) || false) ||
      (r.vehicleType?.toLowerCase().includes(term) || false) ||
      (r.whatsappNumber?.includes(term) || false)
    );
  }), [driverStaffRegistrations, searchTerm]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <DriverStaffDataTable 
        data={filteredData} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        itemsPerPage={20} 
      />
    </div>
  );
}
