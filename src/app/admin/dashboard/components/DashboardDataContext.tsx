"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { locations } from "@/data/locations";
import {
  Registration,
  GuestRegistration,
  YesianRegistration,
  LocalStaffRegistration,
  AlumniRegistration,
  VolunteerRegistration,
  DashboardStats,
  AwardeeRegistration,
  QiraathRegistration,
  DriverStaffRegistration
} from "../types";

interface DashboardDataContextType {
  registrations: Registration[];
  guestRegistrations: GuestRegistration[];
  yesianRegistrations: YesianRegistration[];
  localStaffRegistrations: LocalStaffRegistration[];
  alumniRegistrations: AlumniRegistration[];
  volunteerRegistrations: VolunteerRegistration[];
  awardeeRegistrations: AwardeeRegistration[];
  qiraathRegistrations: QiraathRegistration[];
  driverStaffRegistrations: DriverStaffRegistration[];
  stats: DashboardStats;
  loading: boolean;
  lastSync: string;
  // Common filtering states (optional, but useful to keep sync during navigation)
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterZone: string;
  setFilterZone: (zone: string) => void;
  filterSchool: string;
  setFilterSchool: (school: string) => void;
  filterClass: string;
  setFilterClass: (cls: string) => void;
  filterGender: string;
  setFilterGender: (gender: string) => void;
  filterAccompaniment: string;
  setFilterAccompaniment: (acc: string) => void;
  filterAwardType: string;
  setFilterAwardType: (type: string) => void;
  resetFilters: () => void;
  filterOptions: { zones: string[]; schools: string[]; classes: string[] };
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [guestRegistrations, setGuestRegistrations] = useState<GuestRegistration[]>([]);
  const [yesianRegistrations, setYesianRegistrations] = useState<YesianRegistration[]>([]);
  const [localStaffRegistrations, setLocalStaffRegistrations] = useState<LocalStaffRegistration[]>([]);
  const [alumniRegistrations, setAlumniRegistrations] = useState<AlumniRegistration[]>([]);
  const [volunteerRegistrations, setVolunteerRegistrations] = useState<VolunteerRegistration[]>([]);
  const [awardeeRegistrations, setAwardeeRegistrations] = useState<AwardeeRegistration[]>([]);
  const [qiraathRegistrations, setQiraathRegistrations] = useState<QiraathRegistration[]>([]);
  const [driverStaffRegistrations, setDriverStaffRegistrations] = useState<DriverStaffRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  // Shared Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("all");
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterAccompaniment, setFilterAccompaniment] = useState("all");
  const [filterAwardType, setFilterAwardType] = useState("all");

  useEffect(() => {
    // Listeners
    const qStudents = query(collection(db, "registrations"), orderBy("createdAt", "desc"));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Registration[]);
      setLoading(false);
      setLastSync(new Date().toLocaleTimeString());
    });

    const qGuests = query(collection(db, "guest_registrations"), orderBy("createdAt", "desc"));
    const unsubGuests = onSnapshot(qGuests, (snap) => {
      setGuestRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GuestRegistration[]);
    });

    const qYesians = query(collection(db, "yesian_registrations"), orderBy("createdAt", "desc"));
    const unsubYesians = onSnapshot(qYesians, (snap) => {
      setYesianRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as YesianRegistration[]);
    });

    const qStaff = query(collection(db, "local_staff_registrations"), orderBy("createdAt", "desc"));
    const unsubStaff = onSnapshot(qStaff, (snap) => {
      setLocalStaffRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LocalStaffRegistration[]);
    });

    const qAlumni = query(collection(db, "alumni_registrations"), orderBy("createdAt", "desc"));
    const unsubAlumni = onSnapshot(qAlumni, (snap) => {
      setAlumniRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AlumniRegistration[]);
    });

    const qVolunteers = query(collection(db, "volunteer_registrations"), orderBy("createdAt", "desc"));
    const unsubVolunteers = onSnapshot(qVolunteers, (snap) => {
      setVolunteerRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VolunteerRegistration[]);
    });

    const qAwardees = query(collection(db, "awardee_registrations"), orderBy("createdAt", "desc"));
    const unsubAwardees = onSnapshot(qAwardees, (snap) => {
      setAwardeeRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AwardeeRegistration[]);
    });

    const qQiraath = query(collection(db, "qiraath_registrations"), orderBy("createdAt", "desc"));
    const unsubQiraath = onSnapshot(qQiraath, (snap) => {
      setQiraathRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QiraathRegistration[]);
    });

    const qDriverStaff = query(collection(db, "driver_staff_registrations"), orderBy("createdAt", "desc"));
    const unsubDriverStaff = onSnapshot(qDriverStaff, (snap) => {
      setDriverStaffRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DriverStaffRegistration[]);
    });

    return () => {
      unsubStudents();
      unsubGuests();
      unsubYesians();
      unsubStaff();
      unsubAlumni();
      unsubVolunteers();
      unsubAwardees();
      unsubQiraath();
      unsubDriverStaff();
    };
  }, []);

  const filterOptions = useMemo(() => {
    const zones = Array.from(new Set(registrations.map(r => r.zone))).filter(Boolean).sort();
    
    let schools = [];
    if (filterZone !== "all") {
      schools = Array.from(new Set(registrations.filter(r => r.zone === filterZone).map(r => r.school))).filter(Boolean).sort();
    } else {
      schools = Array.from(new Set(registrations.map(r => r.school))).filter(Boolean).sort();
    }
    
    const classes = Array.from(new Set(registrations.map(r => r.className))).filter(Boolean).sort();
    
    return { zones, schools, classes };
  }, [registrations, filterZone]);

  const stats: DashboardStats = useMemo(() => {
    const today = new Date();
    const todayCount = registrations.filter(r => {
      if (!r.createdAt) return false;
      const date = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    }).length;

    const studentMales = registrations.filter(r => r.gender?.toLowerCase() === "male").length;
    const studentFemales = registrations.filter(r => r.gender?.toLowerCase() === "female").length;
    const totalParticipation = registrations.length + guestRegistrations.length + yesianRegistrations.length + localStaffRegistrations.length + alumniRegistrations.length + volunteerRegistrations.length + awardeeRegistrations.length + qiraathRegistrations.length + driverStaffRegistrations.length;

    const trendMap = new Map();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    last7Days.forEach(date => trendMap.set(date, 0));
    [...registrations, ...guestRegistrations].forEach(doc => {
      if (!doc.createdAt) return;
      const date = (doc.createdAt.toDate ? doc.createdAt.toDate() : new Date(doc.createdAt))
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (trendMap.has(date)) trendMap.set(date, trendMap.get(date) + 1);
    });

    const trendData = last7Days.map(date => ({ date, count: trendMap.get(date) }));

    return {
      totalStudents: registrations.length,
      totalGuests: guestRegistrations.length,
      totalYesians: yesianRegistrations.length,
      totalStaff: localStaffRegistrations.length,
      totalAlumni: alumniRegistrations.length,
      totalVolunteers: volunteerRegistrations.length,
      totalAwardees: awardeeRegistrations.length,
      totalQiraath: qiraathRegistrations.length,
      totalDriverStaff: driverStaffRegistrations.length,
      todayCount,
      totalParticipation,
      totalAccompanied: registrations.filter(r => r.withParent).length,
      totalSchools: new Set(registrations.map(r => r.school)).size,
      totalZones: new Set(registrations.map(r => r.zone)).size,
      availableSchoolsCount: locations.reduce((acc, z) => acc + z.schools.length, 0),
      availableZonesCount: locations.length,
      malesCount: studentMales + guestRegistrations.filter(r => r.gender?.toLowerCase() === "male").length + yesianRegistrations.filter(r => r.gender?.toLowerCase() === "male").length + localStaffRegistrations.filter(r => r.gender?.toLowerCase() === "male").length + alumniRegistrations.filter(r => r.gender?.toLowerCase() === "male").length + volunteerRegistrations.filter(r => r.gender?.toLowerCase() === "male").length + awardeeRegistrations.filter(r => r.gender?.toLowerCase() === "male").length + qiraathRegistrations.filter(r => r.gender?.toLowerCase() === "male").length,
      femalesCount: studentFemales + guestRegistrations.filter(r => r.gender?.toLowerCase() === "female").length + yesianRegistrations.filter(r => r.gender?.toLowerCase() === "female").length + localStaffRegistrations.filter(r => r.gender?.toLowerCase() === "female").length + alumniRegistrations.filter(r => r.gender?.toLowerCase() === "female").length + volunteerRegistrations.filter(r => r.gender?.toLowerCase() === "female").length + awardeeRegistrations.filter(r => r.gender?.toLowerCase() === "female").length + qiraathRegistrations.filter(r => r.gender?.toLowerCase() === "female").length,
      lastUpdated: lastSync,
      trendData,
      platformData: [
        { name: 'Students', value: registrations.length },
        { name: 'Guests', value: guestRegistrations.length },
        { name: 'Yesians', value: yesianRegistrations.length },
        { name: 'Local Staff', value: localStaffRegistrations.length },
        { name: 'Alumni', value: alumniRegistrations.length },
        { name: 'Volunteers', value: volunteerRegistrations.length },
        { name: 'Awardees', value: awardeeRegistrations.length },
        { name: 'Qiraath', value: qiraathRegistrations.length },
        { name: 'Drivers/Staff', value: driverStaffRegistrations.length },
      ],
    };
  }, [registrations, guestRegistrations, yesianRegistrations, localStaffRegistrations, alumniRegistrations, volunteerRegistrations, awardeeRegistrations, driverStaffRegistrations, lastSync]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterZone("all");
    setFilterSchool("all");
    setFilterClass("all");
    setFilterGender("all");
    setFilterAccompaniment("all");
    setFilterAwardType("all");
  };

  const handleSetFilterZone = (zone: string) => {
    setFilterZone(zone);
    setFilterSchool("all");
  };

  const value = {
    registrations,
    guestRegistrations,
    yesianRegistrations,
    localStaffRegistrations,
    alumniRegistrations,
    volunteerRegistrations,
    awardeeRegistrations,
    qiraathRegistrations,
    driverStaffRegistrations,
    stats,
    loading,
    lastSync,
    searchTerm,
    setSearchTerm,
    filterZone,
    setFilterZone: handleSetFilterZone,
    filterSchool,
    setFilterSchool,
    filterClass,
    setFilterClass,
    filterGender,
    setFilterGender,
    filterAccompaniment,
    setFilterAccompaniment,
    filterAwardType,
    setFilterAwardType,
    resetFilters,
    filterOptions
  };

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error("useDashboardData must be used within a DashboardDataProvider");
  }
  return context;
}
