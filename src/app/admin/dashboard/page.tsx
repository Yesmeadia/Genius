"use client";

import { useMemo } from "react";
import { useDashboardData } from "./components/DashboardDataContext";
import { AnalyticsSummary } from "./components/AnalyticsSummary";
import { PerformanceCharts } from "./components/PerformanceCharts";
import { StudentDataTable } from "./components/StudentDataTable";
import { locations } from "@/data/locations";

export default function DashboardOverview() {
  const { 
    registrations, 
    stats, 
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

  // Derived filtered data for the quick-look table
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

    return matchesSearch && matchesZone && matchesSchool && matchesClass && matchesGender;
  }), [registrations, searchTerm, filterZone, filterSchool, filterClass, filterGender, filterAccompaniment]);

  const aggregatedData = useMemo(() => {
    const accompanimentData = [
      { name: 'Accompanied', value: registrations.filter(r => r.withParent).length },
      { name: 'Individual', value: registrations.filter(r => !r.withParent).length },
    ];

    const relationMap = registrations.filter(r => r.withParent).reduce((acc: any, r) => {
      const rel = r.relation || 'Other';
      acc[rel] = (acc[rel] || 0) + 1;
      return acc;
    }, {});
    const relationData = Object.keys(relationMap).map(key => ({ relation: key, count: relationMap[key] }));

    return { accompanimentData, relationData };
  }, [registrations]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AnalyticsSummary stats={stats} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-12">
        <div>
          <h2 className="text-xl font-normal text-slate-900 tracking-tight">Analytical Insights</h2>
          <p className="text-[10px] font-normal text-slate-500 uppercase mt-1">Cross-filtered database metrics</p>
        </div>
      </div>

      <PerformanceCharts
        stats={stats}
        accompanimentData={aggregatedData.accompanimentData}
        relationData={aggregatedData.relationData}
      />

      <div className="mt-12">
        <div className="mb-6">
          <h2 className="text-xl font-normal text-slate-900 tracking-tight">Recent Activity</h2>
          <p className="text-[10px] font-normal text-slate-500 uppercase mt-1">Latest synchronized records</p>
        </div>
        <StudentDataTable
          filteredData={filteredData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          itemsPerPage={10}
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
    </div>
  );
}
