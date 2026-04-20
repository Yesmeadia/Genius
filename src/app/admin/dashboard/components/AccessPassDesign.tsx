"use client";

import { locations } from "@/data/locations";
import JsBarcode from "jsbarcode";
import { useRef, useEffect } from "react";

export type PassType = 'student' | 'guest' | 'yesian';

export interface AccessPassTheme {
  primary: string;
  bg: string;
  light: string;
  border: string;
}

export interface AccessPassDesignProps {
  registration: any;
  passType: PassType;
  theme: AccessPassTheme; // kept for API compat, display now uses bg image
}

export function AccessPassDesign({ registration, passType }: AccessPassDesignProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  // Background image per pass type
  const bgSrc =
    passType === 'student' ? '/pass/delegates.png'
    : passType === 'guest'  ? '/pass/guest.png'
                             : '/pass/officials.png';

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find(s => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  // Name
  const fullName = registration
    ? (passType === 'student' ? registration.studentName : registration.name) || ''
    : 'FULL NAME';

  // Detail line
  let infoLine = '';
  if (registration) {
    if (passType === 'student')     infoLine = `${registration.zone || ''} | ${getSchoolName(registration.school)}`;
    else if (passType === 'guest')  infoLine = registration.address || '';
    else                            infoLine = registration.designation ? `${registration.zone} | ${registration.designation}` : registration.zone || '';
  } else {
    infoLine = 'ZONE | SCHOOL NAME';
  }

  // Photo
  const photoUrl = (passType === 'student' || passType === 'yesian') ? registration?.photoUrl : null;

  // Barcode
  useEffect(() => {
    if (barcodeRef.current && registration?.id) {
      try {
        JsBarcode(barcodeRef.current, registration.id, {
          format: 'CODE128',
          displayValue: false,
          lineColor: '#1e293b',
          width: 1.2,
          height: 28,
          margin: 0,
          background: 'transparent',
        });
      } catch (_) {}
    }
  }, [registration?.id]);

  return (
    <div className="relative group select-none">
      {/* Outer glow effect */}
      <div className="absolute -inset-6 bg-black/10 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Card container — portrait 70:100 ratio */}
      <div
        className="relative rounded-[20px] overflow-hidden shadow-2xl group-hover:-translate-y-1 transition-transform duration-500"
        style={{ width: '100%', aspectRatio: '70/100' }}
      >
        {/* ── FULL-CARD BACKGROUND IMAGE ── */}
        <img
          src={bgSrc}
          alt="pass background"
          className="absolute inset-0 w-full h-full object-fill"
        />

        {/* ── PHOTO (right-aligned in upper black panel) ── */}
        {/* The black panel takes top ~67% of card. Photo is right-pinned with top margin. */}
        <div
          className="absolute overflow-hidden"
          style={{
            top:    '16%',
            // Center in the right photo area (strip ~23% wide, photo ~49%)
            // left = 23% + (77% - 49%) / 2 = ~37%
            left:   '37%',
            width:  '49%',
            height: '44%',
          }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/30">
              <svg viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
          )}
        </div>

        {/* ── CREAM BOTTOM DATA SECTION ── */}
        {/* Positioned at ~68% down (corresponds to splitY=67 in 100mm) */}
        <div
          className="absolute flex flex-col justify-start"
          style={{
            top:    '68%',
            left:   '5%',
            right:  '10%',  // leave room for rotated URL text
            bottom: '2%',
          }}
        >
          {/* NAME */}
          <p
            className="font-black text-slate-900 leading-tight uppercase tracking-tight truncate"
            style={{ fontSize: 'clamp(10px, 3.8vw, 18px)' }}
          >
            {fullName}
          </p>

          {/* ZONE | SCHOOL */}
          <p
            className="font-bold uppercase tracking-wide text-orange-600 leading-tight mt-0.5 truncate"
            style={{ fontSize: 'clamp(6px, 2vw, 10px)', color: passType === 'guest' ? '#059669' : passType === 'yesian' ? '#d97706' : '#ea580c' }}
          >
            {infoLine}
          </p>

          {/* BARCODE */}
          <div className="mt-auto flex flex-col items-center pt-1">
            <svg ref={barcodeRef} className="w-[55%] max-w-[120px]" />
            <p className="text-slate-500 font-mono tracking-widest mt-0.5" style={{ fontSize: 'clamp(5px, 1.5vw, 7px)' }}>
              {registration?.id?.substring(0, 8).toUpperCase() || 'REF ID NUMBER'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
