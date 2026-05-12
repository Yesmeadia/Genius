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
    driverStaffRegistrations,
    mediaRegistrations,
    alumniRegistrations,
    volunteerRegistrations,
    qiraathRegistrations,
    scoutTeamRegistrations
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
        mediaRegistrations={mediaRegistrations}
        alumniRegistrations={alumniRegistrations}
        volunteerRegistrations={volunteerRegistrations}
        qiraathRegistrations={qiraathRegistrations}
        scoutTeamRegistrations={scoutTeamRegistrations}
      />
    </div>
  );
}
