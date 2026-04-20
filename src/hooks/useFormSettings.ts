"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export interface FormSetting {
  id: "student" | "guest" | "yesian" | "local-staff" | "alumni-achiever" | "volunteer";
  label: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_SETTINGS: FormSetting[] = [
  { id: "student", label: "Student Registration", enabled: true, order: 0 },
  { id: "guest", label: "Guest Registration", enabled: true, order: 1 },
  { id: "yesian", label: "Yesian Registration", enabled: true, order: 2 },
  { id: "local-staff", label: "Local Staff Registration", enabled: true, order: 3 },
  { id: "alumni-achiever", label: "Alumni Achiever Registration", enabled: true, order: 4 },
  { id: "volunteer", label: "Volunteer Registration", enabled: true, order: 5 },
];

const SETTINGS_DOC = doc(db, "settings", "registrationForms");

export function useFormSettings() {
  const [forms, setForms] = useState<FormSetting[]>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(SETTINGS_DOC, (snap) => {
      if (snap.exists()) {
        const firestoreForms = snap.data().forms as FormSetting[];

        // Merge: Keep Firestore settings for existing IDs, add default settings for new IDs
        // This ensures new form types appear even if they haven't been saved to Firestore yet.
        const mergedForms = DEFAULT_SETTINGS.map(defaultForm => {
          const existing = firestoreForms.find(f => f.id === defaultForm.id);
          return existing ? { ...defaultForm, ...existing } : defaultForm;
        });

        setForms(mergedForms.sort((a, b) => a.order - b.order));
      } else {
        // First-time fallback - in case document is completely missing
        setForms(DEFAULT_SETTINGS);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveSettings = async (updated: FormSetting[]) => {
    await setDoc(SETTINGS_DOC, { forms: updated });
  };

  return { forms, loading, saveSettings };
}
