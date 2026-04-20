import React from "react";

export default function Footer() {
  return (
    <footer className="mt-12 md:mt-16 pt-8 pb-6 border-t border-slate-200/50 w-full relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-5 text-center md:text-left">
        <div className="space-y-1">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
            © 2026 YES INDIA FOUNDATION | All Rights Reserved
          </p>
        </div>
        <div className="flex flex-col items-center md:items-end gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Designed & Developed by Cyberduce
          </span>
        </div>
      </div>
    </footer>
  );
}
