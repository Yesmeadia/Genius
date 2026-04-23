"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export interface FormSetting {
  id: "student" | "guest" | "yesian" | "local-staff" | "alumni-achiever" | "volunteer" | "awardee" | "driver-staff";
  label: string;
  enabled: boolean;
  order: number;
  popupEnabled?: boolean;
  popupMessage?: string;
  closingDate?: string;
  closingTime?: string;
  autoClose?: boolean;
}

const DEFAULT_SETTINGS: FormSetting[] = [
  { id: "student", label: "Student Registration", enabled: true, order: 0, popupEnabled: false, popupMessage: "Student Registration will close on", closingDate: "", closingTime: "", autoClose: true },
  { id: "guest", label: "Guest Registration", enabled: true, order: 1, popupEnabled: false, popupMessage: "Guest Registration will close on", closingDate: "", closingTime: "", autoClose: true },
  { id: "yesian", label: "Yesian Registration", enabled: true, order: 2, popupEnabled: false, popupMessage: "Yesian Registration will close on", closingDate: "", closingTime: "", autoClose: true },
  { id: "local-staff", label: "Local Staff Registration", enabled: true, order: 3, popupEnabled: false, popupMessage: "Local Staff Registration will close on", closingDate: "", closingTime: "", autoClose: true },
  { id: "alumni-achiever", label: "Alumni Achiever Registration", enabled: true, order: 4, popupEnabled: false, popupMessage: "Alumni Achiever Registration will close on", closingDate: "", closingTime: "", autoClose: true },
  { id: "volunteer", label: "Volunteer Registration", enabled: true, order: 5, popupEnabled: false, popupMessage: "Volunteer Registration will close on", closingDate: "", closingTime: "", autoClose: true },
  { id: "awardee", label: "Awardee Registration", enabled: true, order: 6, popupEnabled: false, popupMessage: "Awardee Registration will close on", closingDate: "", closingTime: "", autoClose: true },
  { id: "driver-staff", label: "Driver & Staff Registration", enabled: true, order: 7, popupEnabled: false, popupMessage: "Driver & Staff Registration will close on", closingDate: "", closingTime: "", autoClose: true },
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

export function useAutoRefresh(form: FormSetting | undefined) {
  useEffect(() => {
    if (!form || !form.autoClose || !form.closingDate || !form.closingTime) return;

    const deadline = new Date(`${form.closingDate}T${form.closingTime}`).getTime();
    const now = Date.now();
    
    if (now < deadline) {
      const timeUntilClose = deadline - now;
      // Set a timeout to refresh the page exactly when the form closes
      const timer = setTimeout(() => {
        window.location.reload();
      }, timeUntilClose);
      
      return () => clearTimeout(timer);
    }
  }, [form]);
}

export function isFormActive(form: FormSetting | undefined) {
  if (!form) return false;
  if (!form.enabled) return false;
  if (form.autoClose && form.closingDate && form.closingTime) {
    const deadline = new Date(`${form.closingDate}T${form.closingTime}`).getTime();
    if (Date.now() >= deadline) return false;
  }
  return true;
}
