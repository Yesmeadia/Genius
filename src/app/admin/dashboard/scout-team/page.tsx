"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { ScoutTeamDataTable } from "../components/ScoutTeamDataTable";
import { ShieldCheck } from "lucide-react";

export default function ScoutTeamPage() {
  const {
    scoutTeamRegistrations,
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
    resetFilters
  } = useDashboardData();

  const localFilterOptions = useMemo(() => {
    const zones = Array.from(new Set(scoutTeamRegistrations.map(r => r.zone))).filter(Boolean).sort();
    let schools = [];
    if (filterZone !== "all") {
      schools = Array.from(new Set(scoutTeamRegistrations.filter(r => r.zone === filterZone).map(r => r.school))).filter(Boolean).sort();
    } else {
      schools = Array.from(new Set(scoutTeamRegistrations.map(r => r.school))).filter(Boolean).sort();
    }
    const classes = Array.from(new Set(scoutTeamRegistrations.map(r => r.className))).filter(Boolean).sort();
    return { zones, schools, classes };
  }, [scoutTeamRegistrations, filterZone]);

  const filteredScoutTeam = useMemo(() => scoutTeamRegistrations.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (r.name?.toLowerCase().includes(term) || false) ||
      (r.zone?.toLowerCase().includes(term) || false) ||
      (r.school?.toLowerCase().includes(term) || false) ||
      (r.className?.toLowerCase().includes(term) || false) ||
      (r.whatsappNumber?.includes(term) || false)
    );

    const matchesZone = filterZone === "all" || r.zone === filterZone;
    const matchesSchool = filterSchool === "all" || r.school === filterSchool;
    const matchesClass = filterClass === "all" || r.className === filterClass;
    const matchesGender = filterGender === "all" || (r.gender && r.gender.toUpperCase() === filterGender.toUpperCase());

    return matchesSearch && matchesZone && matchesSchool && matchesClass && matchesGender;
  }), [scoutTeamRegistrations, searchTerm, filterZone, filterSchool, filterClass, filterGender]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-6 flex items-center justify-between">
      </div>

      <ScoutTeamDataTable
        data={filteredScoutTeam}
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
        filterOptions={localFilterOptions}
        resetFilters={resetFilters}
      />
    </div>
  );
}
