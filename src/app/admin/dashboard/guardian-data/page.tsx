"use client";

import { useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { AccompanimentDataTable } from "../components/AccompanimentDataTable";
import { locations } from "@/data/locations";
import { Registration } from "../types";

export default function GuardianDataPage() {
  const { 
    registrations, 
    alumniRegistrations,
    volunteerRegistrations,
    awardeeRegistrations,
    qiraathRegistrations,
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

  const allAccompaniments = useMemo(() => {
    const studentData = registrations.map(r => ({
      ...r,
      type: "Student"
    }));

    const alumniData = alumniRegistrations.map(r => ({
      ...r,
      studentName: r.name,
      parentage: "",
      withParent: !!r.withParent,
      type: "Alumni"
    }));

    const volunteerData = volunteerRegistrations.map(r => ({
      ...r,
      studentName: r.volunteerName,
      withParent: !!r.withParent,
      type: "Volunteer"
    }));

    const awardeeData = awardeeRegistrations.map(r => ({
      ...r,
      studentName: r.name,
      parentage: "",
      withParent: !!r.withParent,
      type: "Awardee"
    }));

    const qiraathData = qiraathRegistrations.map(r => ({
      ...r,
      studentName: r.name,
      parentage: "",
      withParent: !!r.withParent,
      type: "Qiraath"
    }));

    return [...studentData, ...alumniData, ...volunteerData, ...awardeeData, ...qiraathData];
  }, [registrations, alumniRegistrations, volunteerRegistrations, awardeeRegistrations, qiraathRegistrations]);

  const filteredData = useMemo(() => allAccompaniments.map(r => ({
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

    return matchesSearch && matchesZone && matchesSchool && matchesClass && matchesGender && r.withParent === true;
  }) as Registration[], [allAccompaniments, searchTerm, filterZone, filterSchool, filterClass, filterGender, filterAccompaniment]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AccompanimentDataTable
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
