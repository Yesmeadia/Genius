"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { StudentDataTable } from "../components/StudentDataTable";
import { locations } from "@/data/locations";

export default function StudentsDataPage() {
  const { 
    registrations, 
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

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find(s => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  const filteredData = useMemo(() => registrations.map(r => ({
    ...r,
    schoolName: getSchoolName(r.school)
  })).filter(r => {
    const searchLow = searchTerm.toLowerCase();
    const studentNameSafe = r.studentName ? r.studentName.toLowerCase() : "";
    const schoolNameSafe = r.schoolName ? r.schoolName.toLowerCase() : "";
    const zoneSafe = r.zone ? r.zone.toLowerCase() : "";

    const matchesSearch = studentNameSafe.includes(searchLow) ||
      schoolNameSafe.includes(searchLow) ||
      zoneSafe.includes(searchLow);

    const matchesZone = filterZone === "all" || r.zone === filterZone;
    const matchesSchool = filterSchool === "all" || r.school === filterSchool;
    const matchesClass = filterClass === "all" || r.className === filterClass;
    const matchesGender = filterGender === "all" || (r.gender && r.gender.toUpperCase() === filterGender.toUpperCase());

    let matchesAccompaniment = true;
    if (filterAccompaniment === "accompanied") matchesAccompaniment = r.withParent === true;
    if (filterAccompaniment === "individual") matchesAccompaniment = r.withParent === false;

    return matchesSearch && matchesZone && matchesSchool && matchesClass && matchesGender && matchesAccompaniment;
  }), [registrations, searchTerm, filterZone, filterSchool, filterClass, filterGender, filterAccompaniment]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <StudentDataTable
        filteredData={filteredData}
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
        filterOptions={filterOptions}
        resetFilters={resetFilters}
      />
    </div>
  );
}
