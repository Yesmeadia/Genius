import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export type RegistrationType = 
  | "student" 
  | "guest" 
  | "yesian" 
  | "local-staff" 
  | "alumni" 
  | "volunteer" 
  | "awardee" 
  | "driver-staff";

export const REGISTRATION_TYPES: { id: RegistrationType; label: string; collection: string; path: string }[] = [
  { id: "student", label: "Student", collection: "registrations", path: "/admin/dashboard/student" },
  { id: "guest", label: "Guest", collection: "guest_registrations", path: "/admin/dashboard/guest-registry" },
  { id: "yesian", label: "Yesian", collection: "yesian_registrations", path: "/admin/dashboard/yesian-network" },
  { id: "local-staff", label: "Local Staff", collection: "local_staff_registrations", path: "/admin/dashboard/local-staff" },
  { id: "alumni", label: "Alumni", collection: "alumni_registrations", path: "/admin/dashboard/alumni-achievers" },
  { id: "volunteer", label: "Volunteer", collection: "volunteer_registrations", path: "/admin/dashboard/volunteers" },
  { id: "awardee", label: "Awardee", collection: "awardee_registrations", path: "/admin/dashboard/awardee" },
  { id: "driver-staff", label: "Driver Staff", collection: "driver_staff_registrations", path: "/admin/dashboard/driver-staff" },
];

export async function transferRegistration(
  sourceId: string,
  sourceType: RegistrationType,
  targetType: RegistrationType,
  currentData: any
) {
  if (sourceType === targetType) return;

  const sourceConfig = REGISTRATION_TYPES.find(t => t.id === sourceType);
  const targetConfig = REGISTRATION_TYPES.find(t => t.id === targetType);

  if (!sourceConfig || !targetConfig) throw new Error("Invalid registration type");

  // Normalize data for the target collection
  const normalizedData = { ...currentData };
  delete normalizedData.id;

  // Handle name mapping
  const name = currentData.studentName || currentData.volunteerName || currentData.name || "";
  if (targetType === "student") {
    normalizedData.studentName = name;
    delete normalizedData.volunteerName;
    delete normalizedData.name;
  } else if (targetType === "volunteer") {
    normalizedData.volunteerName = name;
    delete normalizedData.studentName;
    delete normalizedData.name;
  } else {
    normalizedData.name = name;
    delete normalizedData.studentName;
    delete normalizedData.volunteerName;
  }

  // Handle phone mapping
  const phone = currentData.whatsappNumber || currentData.mobileNumber || "";
  if (targetType === "student" || targetType === "volunteer") {
    normalizedData.mobileNumber = phone;
    delete normalizedData.whatsappNumber;
  } else {
    normalizedData.whatsappNumber = phone;
    delete normalizedData.mobileNumber;
  }

  // Add metadata about transfer
  normalizedData.transferredFrom = sourceType;
  normalizedData.transferredAt = new Date();
  normalizedData.updatedAt = serverTimestamp();

  // Perform the transfer
  const targetDocRef = doc(db, targetConfig.collection, sourceId);
  const sourceDocRef = doc(db, sourceConfig.collection, sourceId);

  await setDoc(targetDocRef, normalizedData);
  await deleteDoc(sourceDocRef);

  return {
    targetPath: `${targetConfig.path}/${sourceId}`
  };
}
