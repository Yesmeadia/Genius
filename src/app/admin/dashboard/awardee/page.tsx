"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { AwardeeDataTable } from "../components/AwardeeDataTable";

export default function AwardeePage() {
  const {
    awardeeRegistrations,
    searchTerm, setSearchTerm,
    filterZone, setFilterZone,
    filterSchool, setFilterSchool,
    filterClass, setFilterClass,
    filterGender, setFilterGender,
    resetFilters
  } = useDashboardData();

  const filterOptions = useMemo(() => {
    const zones = Array.from(new Set(awardeeRegistrations.map((r: any) => r.zone))).filter(Boolean).sort();
    let schools = [];
    if (filterZone && filterZone !== "all") {
      schools = Array.from(new Set(awardeeRegistrations.filter((r: any) => r.zone === filterZone).map((r: any) => r.school))).filter(Boolean).sort();
    } else {
      schools = Array.from(new Set(awardeeRegistrations.map((r: any) => r.school))).filter(Boolean).sort();
    }
    const classes = Array.from(new Set(awardeeRegistrations.map((r: any) => r.className))).filter(Boolean).sort();
    return { zones, schools, classes };
  }, [awardeeRegistrations, filterZone]);

  const filteredAwardees = useMemo(() => awardeeRegistrations.filter(r => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (r.name?.toLowerCase().includes(searchLow) || false) ||
      (r.zone?.toLowerCase().includes(searchLow) || false) ||
      (r.school?.toLowerCase().includes(searchLow) || false) ||
      (r.className?.toLowerCase().includes(searchLow) || false) ||
      (r.category?.toLowerCase().includes(searchLow) || false) ||
      (r.rank?.toLowerCase().includes(searchLow) || false) ||
      (r.selectionType?.toLowerCase().includes(searchLow) || false) ||
      (r.whatsappNumber?.includes(searchLow) || false)
    );

    const matchesZone = filterZone === "all" || r.zone === filterZone;
    const matchesSchool = filterSchool === "all" || r.school === filterSchool;
    const matchesClass = filterClass === "all" || r.className === filterClass;
    const matchesGender = filterGender === "all" || (r.gender && r.gender.toUpperCase() === filterGender.toUpperCase());

    return matchesSearch && matchesZone && matchesSchool && matchesClass && matchesGender;
  }), [awardeeRegistrations, searchTerm, filterZone, filterSchool, filterClass, filterGender]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AwardeeDataTable
        data={filteredAwardees}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        itemsPerPage={20}
        filterZone={filterZone}
        setFilterZone={setFilterZone}
        filterClass={filterClass}
        setFilterClass={setFilterClass}
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
