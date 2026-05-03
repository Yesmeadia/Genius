"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { locations as staticLocations, Zone, School } from "@/data/locations";

export function useLocations() {
  const [zones, setZones] = useState<Zone[]>(staticLocations);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, "config", "locations");
    
    // Seed if missing
    const checkAndSeed = async () => {
      try {
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          await setDoc(docRef, { zones: staticLocations });
        }
      } catch (e) {
        console.error("Error seeding locations:", e);
      }
    };
    
    checkAndSeed();

    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.zones) {
          setZones(data.zones);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore snapshot error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const getSchoolsForZone = (zoneId: string): School[] => {
    const zone = zones.find((z) => z.id === zoneId);
    return zone ? zone.schools : [];
  };

  return {
    loading,
    zones,
    getSchoolsForZone,
  };
}
