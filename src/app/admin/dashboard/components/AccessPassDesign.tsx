"use client";

import { locations, Zone } from "@/data/locations";
import JsBarcode from "jsbarcode";
import { useRef, useEffect } from "react";

export type PassType = 'student' | 'guest' | 'yesian' | 'local-staff' | 'awardee' | 'guardian' | 'qiraath' | 'media' | 'driver-staff';

export interface AccessPassDesignProps {
  registration: any;
  passType: PassType;
  customLocations?: Zone[];
}

export function AccessPassDesign({ registration, passType, customLocations }: AccessPassDesignProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  const activeLocations = customLocations || locations;

  // Background image per pass type
  const bgSrc =
    passType === 'student' || passType === 'qiraath' ? '/pass/Delegate.jpeg'
      : passType === 'local-staff' ? '/pass/Mentor.jpeg'
        : passType === 'awardee' ? '/pass/Awardee.jpeg'
          : passType === 'yesian' ? '/pass/Crew.jpeg'
            : passType === 'guardian' ? '/pass/Guardian.jpeg'
              : passType === 'media' ? '/pass/Media.jpeg'
                : passType === 'guest' ? '/pass/guest.png'
                  : passType === 'driver-staff' ? '/pass/Escout.jpeg'
                    : '/pass/Crew.jpeg'; // officials.png used for yesian & local-staff

  const getLocationDetails = (schoolId: string) => {
    for (const zone of activeLocations) {
      const school = zone.schools.find(s => s.id === schoolId);
      if (school) return { schoolName: school.name, zoneName: zone.name };
    }
    return { schoolName: schoolId, zoneName: '' };
  };

  const getSchoolName = (schoolId: string) => getLocationDetails(schoolId).schoolName;

  function toTitleCase(str: string): string {
    if (!str) return '';
    const acronyms = ['YES', 'DS', 'PA'];
    return str.split(' ').map(word => {
      if (acronyms.includes(word.toUpperCase())) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  // Name
  const rawFullName = registration
    ? (passType === 'student' ? registration.studentName : passType === 'guardian' ? registration.guardianName : registration.name) || ''
    : 'FULL NAME';
  const fullName = (passType === 'student' || passType === 'local-staff' || passType === 'awardee' || passType === 'yesian' || passType === 'guardian' || passType === 'qiraath' || passType === 'media' || passType === 'driver-staff') ? toTitleCase(rawFullName) : rawFullName;

  // Detail line
  let infoLine = '';
  if (registration) {
    if (passType === 'student' || passType === 'local-staff' || passType === 'awardee' || passType === 'yesian' || passType === 'guardian' || passType === 'qiraath' || passType === 'media' || passType === 'driver-staff') {
      if (passType === 'student') {
        const { schoolName } = getLocationDetails(registration?.school);
        infoLine = `${toTitleCase(schoolName)}`;
      } else if (passType === 'local-staff') {
        const { schoolName } = getLocationDetails(registration?.school);
        infoLine = `${toTitleCase(schoolName)}`;
      } else if (passType === 'yesian') {
        infoLine = ``;
      } else if (passType === 'guardian') {
        infoLine = `C/O: ${toTitleCase(registration?.studentName || '')}`;
      } else if (passType === 'media') {
        infoLine = ``;
      } else if (passType === 'driver-staff') {
        infoLine = `${registration.staffType}${registration.vehicleNumber ? ` | ${registration.vehicleNumber}` : ''}`;
      } else {
        // Awardee / Qiraath
        const { schoolName } = getLocationDetails(registration?.school);
        infoLine = `${toTitleCase(schoolName)}`;
      }
    }
    else if (passType === 'guest') infoLine = registration.address || '';
    else if (passType === 'media') infoLine = registration.agency ? `${registration.agency}\n${registration.designation || ''}` : registration.designation || '';
    else infoLine = registration.designation ? `${registration.designation}` : registration.zone || '';
  } else {
    infoLine = 'SCHOOL NAME';
  }

  // Photo
  const photoUrl = (passType === 'student' || passType === 'yesian' || passType === 'local-staff' || passType === 'awardee' || passType === 'media' || passType === 'driver-staff') ? registration?.photoUrl : null;

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
      } catch (_) { }
    }
  }, [registration?.id]);

  return (
    <div className="relative group select-none">
      {/* Outer glow effect */}
      <div className="absolute -inset-6 bg-black/10 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Card container — portrait 85:120 ratio */}
      <div
        className="relative rounded-[20px] overflow-hidden shadow-2xl group-hover:-translate-y-1 transition-transform duration-500"
        style={{ width: '100%', aspectRatio: '85/120' }}
      >
        {/* ── FULL-CARD BACKGROUND IMAGE ── */}
        <img
          src={bgSrc}
          alt="pass background"
          className="absolute inset-0 w-full h-full object-fill"
        />

        {/* ── PHOTO ── */}
        <div
          className="absolute overflow-hidden object-cover"
          style={(passType === 'student' || passType === 'local-staff' || passType === 'awardee' || passType === 'yesian' || passType === 'guardian' || passType === 'qiraath' || passType === 'media' || passType === 'driver-staff') ? {
            top: '42.64%', // 51.168mm / 120mm
            left: '54.45%', // 46.289mm / 85mm
            width: '34.3%', // 29.157mm / 85mm
            height: '30.35%', // 36.425mm / 120mm
            borderRadius: '24px' // Approximate for 7.69mm
          } : {
            top: '16%',
            left: '37%',
            width: '49%',
            height: '44%',
          }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/30">
              <svg viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
          )}
        </div>

        {/* ── INFO SECTION ── */}
        <div
          className="absolute flex flex-col justify-start gap-0"
          style={(passType === 'student' || passType === 'local-staff' || passType === 'awardee' || passType === 'yesian' || passType === 'guardian' || passType === 'qiraath' || passType === 'media' || passType === 'driver-staff') ? {
            top: passType === 'guardian' ? '44.46%' : '36.96%', // 53.354mm / 120mm vs 44.354mm / 120mm
            left: passType === 'guardian' ? '0' : '13.83%',
            right: passType === 'guardian' ? '0' : '48%',
            alignItems: passType === 'guardian' ? 'center' : 'flex-start',
            textAlign: passType === 'guardian' ? 'center' : 'left',
          } : {
            top: '68%',
            left: '5%',
            right: '10%',
            bottom: '2%',
          }}
        >
          {/* NAME */}
          <p
            className={`leading-tight tracking-tight truncate ${(passType === 'student' || passType === 'local-staff' || passType === 'awardee' || passType === 'yesian' || passType === 'guardian' || passType === 'qiraath' || passType === 'media' || passType === 'driver-staff') ? 'text-white' : 'font-black uppercase text-slate-900'}`}
            style={(passType === 'student' || passType === 'local-staff' || passType === 'awardee' || passType === 'yesian' || passType === 'guardian' || passType === 'qiraath' || passType === 'media' || passType === 'driver-staff') ? {
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600, // SemiBold
              fontSize: fullName.length > 25 ? 'clamp(8px, 3vw, 11px)' 
                      : fullName.length > 18 ? 'clamp(9px, 3.5vw, 13px)' 
                      : fullName.length > 13 ? 'clamp(10px, 3.8vw, 15px)' 
                      : 'clamp(10px, 4.5vw, 20px)'
            } : { fontSize: 'clamp(10px, 3.8vw, 18px)' }}
          >
            {fullName}
          </p>

          {/*SCHOOL */}
          <p
            className={`leading-tight truncate whitespace-pre-line ${(passType === 'student' || passType === 'local-staff' || passType === 'awardee' || passType === 'yesian' || passType === 'guardian' || passType === 'qiraath' || passType === 'media' || passType === 'driver-staff') ? 'text-slate-200' : 'font-bold uppercase tracking-wide mt-0.5'}`}
            style={(passType === 'student' || passType === 'local-staff' || passType === 'awardee' || passType === 'yesian' || passType === 'guardian' || passType === 'qiraath' || passType === 'media' || passType === 'driver-staff') ? {
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 500, // Medium
              fontSize: 'clamp(6px, 2.5vw, 12px)'
            } : {
              fontSize: 'clamp(6px, 2vw, 10px)',
              color: passType === 'guest' ? '#059669' : '#ea580c'
            }}
          >
            {infoLine}
          </p>

          {/* BARCODE FOR NON-STUDENT/STAFF/AWARDEE/OFFICIAL */}
          {(passType !== 'student' && passType !== 'local-staff' && passType !== 'awardee' && passType !== 'yesian' && passType !== 'guardian') && (
            <div className="mt-auto flex flex-col items-center pt-1">
              <svg ref={barcodeRef} className="w-[55%] max-w-[120px]" />
              <p className="text-slate-500 font-mono tracking-widest mt-0.5" style={{ fontSize: 'clamp(5px, 1.5vw, 7px)' }}>
                {registration?.id?.substring(0, 8).toUpperCase() || 'REF ID NUMBER'}
              </p>
            </div>
          )}
        </div>

        {/* BARCODE FOR STUDENT/STAFF/AWARDEE/OFFICIAL */}
        {(passType === 'student' || passType === 'local-staff' || passType === 'awardee' || passType === 'yesian' || passType === 'guardian' || passType === 'qiraath' || passType === 'media' || passType === 'driver-staff') && (
          <div className="absolute flex flex-col items-center" style={{ bottom: '8.88%', right: '9.68%', width: '30.58%' }}>
            <svg ref={barcodeRef} className="w-full" />
            <p className="text-black font-bold font-mono tracking-widest mt-[2px]" style={{ fontSize: 'clamp(5px, 1.5vw, 7px)' }}>
              {registration?.id?.substring(0, 8).toUpperCase() || 'REF ID NUMBER'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
