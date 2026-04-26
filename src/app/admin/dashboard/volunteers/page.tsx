"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { VolunteerDataTable } from "../components/VolunteerDataTable";
import { ShieldCheck } from "lucide-react";

export default function VolunteersPage() {
  const { 
    volunteerRegistrations, 
    searchTerm, 
    setSearchTerm,
    filterZone,
    setFilterZone,
    filterClass,
    setFilterClass,
    filterSchool,
    setFilterSchool,
    filterGender,
    setFilterGender,
    filterAccompaniment,
    setFilterAccompaniment,
    filterOptions,
    resetFilters
  } = useDashboardData();

  const localFilterOptions = useMemo(() => {
    const zones = Array.from(new Set(volunteerRegistrations.map(r => r.zone))).filter(Boolean).sort();
    let schools = [];
    if (filterZone !== "all") {
      schools = Array.from(new Set(volunteerRegistrations.filter(r => r.zone === filterZone).map(r => r.school))).filter(Boolean).sort();
    } else {
      schools = Array.from(new Set(volunteerRegistrations.map(r => r.school))).filter(Boolean).sort();
    }
    const classes = Array.from(new Set(volunteerRegistrations.map(r => r.className))).filter(Boolean).sort();
    return { zones, schools, classes };
  }, [volunteerRegistrations, filterZone]);

  const filteredVolunteers = useMemo(() => volunteerRegistrations.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (r.volunteerName?.toLowerCase().includes(term) || false) ||
      (r.zone?.toLowerCase().includes(term) || false) ||
      (r.school?.toLowerCase().includes(term) || false) ||
      (r.className?.toLowerCase().includes(term) || false) ||
      (r.mobileNumber?.includes(term) || false)
    );

    const matchesZone = filterZone === "all" || r.zone === filterZone;
    const matchesSchool = filterSchool === "all" || r.school === filterSchool;
    const matchesClass = filterClass === "all" || r.className === filterClass;
    const matchesGender = filterGender === "all" || (r.gender && r.gender.toUpperCase() === filterGender.toUpperCase());

    let matchesAccompaniment = true;
    if (filterAccompaniment === "accompanied") matchesAccompaniment = r.withParent === true;
    if (filterAccompaniment === "individual") matchesAccompaniment = r.withParent === false;

    return matchesSearch && matchesZone && matchesSchool && matchesClass && matchesGender && matchesAccompaniment;
  }), [volunteerRegistrations, searchTerm, filterZone, filterSchool, filterClass, filterGender, filterAccompaniment]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <VolunteerDataTable 
        data={filteredVolunteers} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        itemsPerPage={20}
        filterZone={filterZone}
        setFilterZone={setFilterZone}
        filterClass={filterClass}
        setFilterClass={setFilterClass}
        filterSchool={filterSchool}
        setFilterSchool={setFilterSchool}
        filterGender={filterGender}
        setFilterGender={setFilterGender}
        filterAccompaniment={filterAccompaniment}
        setFilterAccompaniment={setFilterAccompaniment}
        filterOptions={localFilterOptions}
        resetFilters={resetFilters}
      />
    </div>
  );
}
