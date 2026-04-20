"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { VolunteerDataTable } from "../components/VolunteerDataTable";
import { ShieldCheck } from "lucide-react";

export default function VolunteersPage() {
  const { 
    volunteerRegistrations, 
    searchTerm, 
    setSearchTerm 
  } = useDashboardData();

  const filteredVolunteers = useMemo(() => volunteerRegistrations.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.volunteerName?.toLowerCase().includes(term) || false) ||
      (r.zone?.toLowerCase().includes(term) || false) ||
      (r.school?.toLowerCase().includes(term) || false) ||
      (r.className?.toLowerCase().includes(term) || false) ||
      (r.mobileNumber?.includes(term) || false)
    );
  }), [volunteerRegistrations, searchTerm]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <VolunteerDataTable 
        data={filteredVolunteers} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        itemsPerPage={20} 
      />
    </div>
  );
}
