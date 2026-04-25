"use client";

import { useDashboardData } from "../components/DashboardDataContext";
import { ReportsCenter } from "../components/ReportsCenter";

export default function ReportsPage() {
  const { 
    registrations, 
    guestRegistrations, 
    yesianRegistrations, 
    localStaffRegistrations,
    alumniRegistrations,
    volunteerRegistrations,
    awardeeRegistrations,
    qiraathRegistrations,
    driverStaffRegistrations,
    stats 
  } = useDashboardData();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ReportsCenter
        registrations={registrations}
        guestRegistrations={guestRegistrations}
        yesianRegistrations={yesianRegistrations}
        localStaffRegistrations={localStaffRegistrations}
        alumniRegistrations={alumniRegistrations}
        volunteerRegistrations={volunteerRegistrations}
        awardeeRegistrations={awardeeRegistrations}
        qiraathRegistrations={qiraathRegistrations}
        driverStaffRegistrations={driverStaffRegistrations}
        stats={stats}
      />
    </div>
  );
}
