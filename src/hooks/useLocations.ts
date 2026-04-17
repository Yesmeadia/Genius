"use client";

import { useState, useMemo } from "react";
import { locations, School } from "@/data/locations";

export function useLocations() {
  const [loading] = useState(false);
  const zones = useMemo(() => locations, []);

  const getSchoolsForZone = (zoneId: string): School[] => {
    const zone = locations.find((z) => z.id === zoneId);
    return zone ? zone.schools : [];
  };

  return {
    loading,
    zones,
    getSchoolsForZone,
  };
}
