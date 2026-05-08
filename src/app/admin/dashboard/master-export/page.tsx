"use client";

import { useDashboardData } from "../components/DashboardDataContext";
import { ExportCenter } from "../components/ExportCenter";

export default function MasterExportPage() {
  const { 
    registrations, 
    guestRegistrations, 
    yesianRegistrations, 
    localStaffRegistrations,
    awardeeRegistrations,
    driverStaffRegistrations
  } = useDashboardData();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ExportCenter
        registrations={registrations}
        guestRegistrations={guestRegistrations}
        yesianRegistrations={yesianRegistrations}
        localStaffRegistrations={localStaffRegistrations}
        awardeeRegistrations={awardeeRegistrations}
        driverStaffRegistrations={driverStaffRegistrations}
      />
    </div>
  );
}
