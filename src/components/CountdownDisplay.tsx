"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownDisplayProps {
  closingDate?: string;
  closingTime?: string;
  className?: string;
}

export default function CountdownDisplay({ closingDate, closingTime, className = "" }: CountdownDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!closingDate || !closingTime) return;

    const calculateTimeLeft = () => {
      const target = new Date(`${closingDate}T${closingTime}`);
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
  }, [closingDate, closingTime]);

  if (!timeLeft || timeLeft === "Closed") return null;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold tracking-wide ${className}`}>
      <Clock size={12} className="animate-pulse" />
      <span>{timeLeft}</span>
    </div>
  );
}
