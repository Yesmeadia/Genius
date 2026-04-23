"use client";

import { useState, useEffect } from "react";
import { useFormSettings } from "@/hooks/useFormSettings";
import { X } from "lucide-react";

interface ClosingPopupProps {
  formId: string;
}

export default function ClosingPopup({ formId }: ClosingPopupProps) {
  const { forms, loading } = useFormSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const formSetting = forms.find((f) => f.id === formId);

  useEffect(() => {
    if (!loading && formSetting?.popupEnabled && !dismissed) {
      setIsVisible(true);
    }
  }, [loading, formSetting, dismissed]);

  useEffect(() => {
    if (!formSetting?.closingDate || !formSetting?.closingTime) return;

    const calculateTimeLeft = () => {
      const target = new Date(`${formSetting.closingDate}T${formSetting.closingTime}`);
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft("Closed");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(" "));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [formSetting]);

  if (loading || !formSetting?.popupEnabled || !isVisible || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
  };

  return (
    <div className="mb-6 form-card bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-4 w-full relative animate-in fade-in duration-500">
      <div className="bg-amber-100 text-amber-600 rounded-full p-2 mt-0.5 shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-grow pr-6">
        <h3 className="text-sm font-bold text-amber-900 tracking-tight uppercase mb-1">
          Important Notice
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          {formSetting.popupMessage || "Registration for this category is closing soon. Please complete your submission."}
          {" "}
          {timeLeft && timeLeft !== "Closed" && (
            <span className="font-bold text-amber-900 tabular-nums">
              {timeLeft}
            </span>
          )}
        </p>
      </div>
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 rounded-full text-amber-600/50 hover:bg-amber-200/50 hover:text-amber-700 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
