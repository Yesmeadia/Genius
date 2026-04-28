"use client";

import { useDashboardData } from "../components/DashboardDataContext";
import CertificateCenter from "../components/CertificateCenter";

export default function CertificatesPage() {
  const { 
    registrations, 
    awardeeRegistrations,
    scoutTeamRegistrations,
    volunteerRegistrations
  } = useDashboardData();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CertificateCenter
        registrations={registrations}
        awardeeRegistrations={awardeeRegistrations}
        scoutTeamRegistrations={scoutTeamRegistrations}
        volunteerRegistrations={volunteerRegistrations}
      />
    </div>
  );
}
