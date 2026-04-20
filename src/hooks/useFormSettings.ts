"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export interface FormSetting {
  id: "student" | "guest" | "yesian";
  label: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_SETTINGS: FormSetting[] = [
  { id: "student", label: "Student Registration", enabled: true, order: 0 },
  { id: "guest",   label: "Guest Registration",   enabled: true, order: 1 },
  { id: "yesian",  label: "Yesian Registration",  enabled: true, order: 2 },
];

const SETTINGS_DOC = doc(db, "settings", "registrationForms");

export function useFormSettings() {
  const [forms, setForms] = useState<FormSetting[]>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(SETTINGS_DOC, (snap) => {
      if (snap.exists()) {
        setForms(snap.data().forms as FormSetting[]);
      } else {
        // First-time: seed the document with defaults
        setDoc(SETTINGS_DOC, { forms: DEFAULT_SETTINGS });
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
