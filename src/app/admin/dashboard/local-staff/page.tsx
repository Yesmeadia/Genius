"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { LocalStaffDataTable } from "../components/LocalStaffDataTable";

export default function LocalStaffPage() {
  const { 
    localStaffRegistrations, 
    searchTerm, setSearchTerm,
    filterZone, setFilterZone,
    filterSchool, setFilterSchool,
    filterGender, setFilterGender,
    resetFilters
  } = useDashboardData();

  const filterOptions = useMemo(() => {
    const zones = Array.from(new Set(localStaffRegistrations.map((r: any) => r.zone))).filter(Boolean).sort();
    let schools = [];
    if (filterZone && filterZone !== "all") {
      schools = Array.from(new Set(localStaffRegistrations.filter((r: any) => r.zone === filterZone).map((r: any) => r.school))).filter(Boolean).sort();
    } else {
      schools = Array.from(new Set(localStaffRegistrations.map((r: any) => r.school))).filter(Boolean).sort();
    }
    return { zones, schools };
  }, [localStaffRegistrations, filterZone]);

  const filteredLocalStaff = useMemo(() => localStaffRegistrations.filter(r => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (r.name?.toLowerCase() || "").includes(searchLow) ||
      (r.whatsappNumber || "").includes(searchLow) ||
      (r.zone?.toLowerCase() || "").includes(searchLow) ||
      (r.role?.toLowerCase() || "").includes(searchLow)
    );

    const matchesZone = filterZone === "all" || r.zone === filterZone;
    const matchesSchool = filterSchool === "all" || r.school === filterSchool;
    const matchesGender = filterGender === "all" || (r.gender && r.gender.toUpperCase() === filterGender.toUpperCase());

    return matchesSearch && matchesZone && matchesSchool && matchesGender;
  }), [localStaffRegistrations, searchTerm, filterZone, filterSchool, filterGender]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <LocalStaffDataTable
        data={filteredLocalStaff}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        itemsPerPage={20}
        filterZone={filterZone}
        setFilterZone={setFilterZone}
        filterGender={filterGender}
        setFilterGender={setFilterGender}
        filterSchool={filterSchool}
        setFilterSchool={setFilterSchool}
        filterOptions={filterOptions}
        resetFilters={resetFilters}
      />
    </div>
  );
}
