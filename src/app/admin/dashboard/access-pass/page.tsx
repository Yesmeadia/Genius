"use client";

import { useDashboardData } from "../components/DashboardDataContext";
import AccessPassCenter from "../components/AccessPassCenter";

export default function AccessPassPage() {
  const { 
    registrations, 
    guestRegistrations, 
    yesianRegistrations, 
    localStaffRegistrations,
    scoutTeamRegistrations,
    awardeeRegistrations,
    qiraathRegistrations
  } = useDashboardData();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AccessPassCenter
        registrations={registrations}
        guestRegistrations={guestRegistrations}
        yesianRegistrations={yesianRegistrations}
        localStaffRegistrations={localStaffRegistrations}
        scoutTeamRegistrations={scoutTeamRegistrations}
        awardeeRegistrations={awardeeRegistrations}
        qiraathRegistrations={qiraathRegistrations}
      />
    </div>
  );
}
