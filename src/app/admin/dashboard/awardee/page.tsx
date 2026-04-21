"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { AwardeeDataTable } from "../components/AwardeeDataTable";

export default function AwardeePage() {
  const {
    awardeeRegistrations,
    searchTerm,
    setSearchTerm
  } = useDashboardData();

  const filteredAwardees = useMemo(() => awardeeRegistrations.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.name?.toLowerCase().includes(term) || false) ||
      (r.zone?.toLowerCase().includes(term) || false) ||
      (r.school?.toLowerCase().includes(term) || false) ||
      (r.className?.toLowerCase().includes(term) || false) ||
      (r.category?.toLowerCase().includes(term) || false) ||
      (r.rank?.toLowerCase().includes(term) || false) ||
      (r.selectionType?.toLowerCase().includes(term) || false) ||
      (r.whatsappNumber?.includes(term) || false)
    );
  }), [awardeeRegistrations, searchTerm]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AwardeeDataTable
        data={filteredAwardees}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        itemsPerPage={20}
      />
    </div>
  );
}
