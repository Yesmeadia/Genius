"use client";

import { useState, useMemo, useRef } from "react";
import { generateParticipationCertificate, generateBatchParticipationCertificates } from "@/lib/certificateUtils";
import { generateBatchAccessPasses } from "@/lib/exportUtils";
import { generateScoutCertificate } from "@/lib/scoutCertificateUtils";
import { generateVolunteerCertificate } from "@/lib/volunteerCertificateUtils";
import { generateQiraathCertificate } from "@/lib/qiraathCertificateUtils";
import { locations } from "@/data/locations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Award, School, Archive, ArrowRight, Loader2, ShieldCheck, MoreHorizontal, X, User, Download, ExternalLink } from "lucide-react";
import { Registration, AwardeeRegistration, ScoutTeamRegistration, VolunteerRegistration, QiraathRegistration } from "../types";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";

const toTitleCase = (str: string) => {
    return str.toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\bYes\b/g, "YES");
};

interface CertificateCenterProps {
    registrations: Registration[];
    awardeeRegistrations: AwardeeRegistration[];
    scoutTeamRegistrations: ScoutTeamRegistration[];
    volunteerRegistrations: VolunteerRegistration[];
    qiraathRegistrations: QiraathRegistration[];
}

type CertType = 'student' | 'awardee' | 'scout-team' | 'volunteer' | 'qiraath';

const CERT_META: Record<CertType, { label: string; plural: string; color: string; bg: string; }> = {
    student: { label: 'Delegate', plural: 'Delegates', color: 'text-emerald-600', bg: 'bg-emerald-600', },
    awardee: { label: 'Awardee', plural: 'Awardees', color: 'text-violet-600', bg: 'bg-violet-600', },
    'scout-team': { label: 'Scout', plural: 'Scout Team', color: 'text-blue-600', bg: 'bg-blue-600', },
    volunteer: { label: 'Volunteer', plural: 'Volunteers', color: 'text-rose-600', bg: 'bg-rose-600', },
    qiraath: { label: 'Qiraath', plural: 'Qiraath', color: 'text-emerald-600', bg: 'bg-emerald-600', },
};

export default function CertificateCenter({
    registrations,
    awardeeRegistrations,
    scoutTeamRegistrations,
    volunteerRegistrations,
    qiraathRegistrations
}: CertificateCenterProps) {
    const [certType, setCertType] = useState<CertType>('student');
    const [selectedZone, setSelectedZone] = useState("all");
    const [selectedSchool, setSelectedSchool] = useState("all");
    const [selectedClass, setSelectedClass] = useState("all");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeData = useMemo(() => {
        if (certType === 'student') return registrations;
        if (certType === 'awardee') return awardeeRegistrations;
        if (certType === 'scout-team') return scoutTeamRegistrations;
        if (certType === 'volunteer') return volunteerRegistrations;
        if (certType === 'qiraath') return qiraathRegistrations;
        return registrations;
    }, [certType, registrations, awardeeRegistrations, scoutTeamRegistrations, volunteerRegistrations, qiraathRegistrations]);

    const filteredData = useMemo(() => {
        let d = activeData as any[];
        if (selectedZone !== 'all') d = d.filter(r => r.zone === selectedZone);
        if (certType === 'student' || certType === 'volunteer' || certType === 'scout-team' || certType === 'qiraath') {
            if (selectedSchool !== 'all') d = d.filter(r => r.school === selectedSchool);
            if (selectedClass !== 'all') d = d.filter(r => r.className === selectedClass);
        }
        return d;
    }, [activeData, selectedZone, selectedSchool, selectedClass, certType]);

    const previewReg = useMemo(() =>
        filteredData.length > 0 ? filteredData[0] : null,
        [filteredData]);

    useGSAP(() => {
        gsap.from(".apc-card", { opacity: 0, y: 24, stagger: 0.08, duration: 0.7, ease: "power3.out" });
    }, { scope: containerRef });

    const getSchoolName = (schoolId: string) => {
        for (const zone of locations) {
            const s = zone.schools.find(s => s.id === schoolId);
            if (s) return s.name;
        }
        return schoolId;
    };

    const handleExport = async (scope: 'zone' | 'school' | 'class' | 'all') => {
        let data = filteredData;
        let filename = `genius_certificates_${certType}_all`;

        if (scope === 'zone') {
            if (selectedZone === 'all') return alert("Please select a zone.");
            data = (activeData as any[]).filter(r => r.zone === selectedZone);
            filename = `genius_certificates_${certType}_zone_${selectedZone.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
        } else if (scope === 'school' && (certType === 'student' || certType === 'volunteer' || certType === 'scout-team' || certType === 'qiraath')) {
            if (selectedSchool === 'all') return alert("Please select a school.");
            data = (activeData as any[]).filter(r => r.school === selectedSchool);
            filename = `genius_certificates_${certType}_school_${selectedSchool}`;
        } else if (scope === 'class' && (certType === 'student' || certType === 'volunteer' || certType === 'scout-team' || certType === 'qiraath')) {
            if (selectedClass === 'all') return alert("Please select a class.");
            data = (activeData as any[]).filter(r => r.className === selectedClass);
            filename = `genius_certificates_${certType}_class_${selectedClass}`;
        }

        setIsGenerating(true);
        try {
            if (certType === 'scout-team') {
                await generateScoutCertificate(data, filename);
            } else if (certType === 'volunteer') {
                await generateVolunteerCertificate(data, filename);
            } else if (certType === 'qiraath') {
                await generateQiraathCertificate(data, filename);
            } else {
                await generateParticipationCertificate(data, filename, certType);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const getProfileLink = (type: CertType, id: string) => {
        switch (type) {
            case 'student': return `/admin/dashboard/student/${id}`;
            case 'awardee': return `/admin/dashboard/awardee/${id}`;
            case 'scout-team': return `/admin/dashboard/scout/${id}`;
            case 'volunteer': return `/admin/dashboard/volunteer/${id}`;
            case 'qiraath': return `/admin/dashboard/qiraath/${id}`;
            default: return `/admin/dashboard`;
        }
    };

    const getPassType = (type: CertType): any => {
        const mapping: Record<string, string> = {
            student: 'student',
            awardee: 'awardee',
            'scout-team': 'volunteer', // Fallback for scouts
            volunteer: 'volunteer',
            qiraath: 'qiraath'
        };
        return mapping[type] || 'student';
    };

    const meta = CERT_META[certType];

    return (
        <div ref={containerRef} className="max-w-7xl mx-auto space-y-10 pb-24 px-4">

            {/* ── HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 apc-card">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Genius Jam 3</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Certificate Center</h1>
                    <p className="text-slate-500 text-sm mt-1">Generate and export Participation Certificates in bulk.</p>
                </div>

                {/* Category switcher */}
                <div className="flex items-center justify-end">
                    {!showSwitcher ? (
                        <Button
                            onClick={() => setShowSwitcher(true)}
                            className="h-10 rounded-xl bg-slate-900 text-white font-normal uppercase text-[10px] tracking-widest hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
                        >
                            <MoreHorizontal className="mr-2 h-4 w-4" /> {CERT_META[certType].plural}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-3 flex-wrap justify-end animate-in slide-in-from-right-4 duration-300">
                            {(Object.entries(CERT_META) as [CertType, typeof CERT_META[CertType]][]).map(([t, m]) => (
                                <Button
                                    key={t}
                                    variant={certType === t ? "default" : "outline"}
                                    onClick={() => {
                                        setCertType(t);
                                        setSelectedZone("all");
                                        setSelectedSchool("all");
                                        setSelectedClass("all");
                                        setShowSwitcher(false);
                                    }}
                                    className={`h-10 rounded-xl font-normal uppercase text-[10px] tracking-widest transition-all
                                        ${certType === t
                                            ? `${m.bg} hover:opacity-90 text-white shadow-lg`
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <span className="ml-2">{m.plural}</span>
                                </Button>
                            ))}
                            <Button
                                variant="ghost"
                                onClick={() => setShowSwitcher(false)}
                                className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MAIN SECTION ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left controls */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Full batch export */}
                    <Card className="apc-card border-none bg-slate-900 rounded-[28px] overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-56 h-56 ${meta.bg} blur-[100px] opacity-25 pointer-events-none`} />
                        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="flex-grow">
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Batch Export</p>
                                <h3 className="text-xl font-black text-white">Download All {meta.plural}</h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    {filteredData.length} certificate{filteredData.length !== 1 ? 's' : ''} ready for export.
                                </p>
                            </div>
                            <Button
                                disabled={isGenerating || filteredData.length === 0}
                                onClick={() => handleExport('all')}
                                className="shrink-0 h-14 px-8 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] group active:scale-95 transition-all shadow-xl"
                            >
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Export {filteredData.length} Certs
                                {!isGenerating && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Filters grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Zone filter — all types */}
                        <Card className="apc-card border border-slate-100 rounded-[24px] p-6 space-y-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                    <School size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Zone Filter</h4>
                                    <p className="text-[10px] text-slate-400">Export by geographic zone</p>
                                </div>
                            </div>
                            <Select value={selectedZone} onValueChange={setSelectedZone}>
                                <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-none px-4 font-medium text-sm">
                                    <SelectValue placeholder="Select Zone" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-xl">
                                    <SelectItem value="all">All Zones</SelectItem>
                                    {Array.from(new Set((activeData as any[]).map(r => r.zone).filter(Boolean))).sort().map(z => (
                                        <SelectItem key={String(z)} value={String(z)}>{String(z)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button disabled={isGenerating || selectedZone === 'all'} onClick={() => handleExport('zone')} className="w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-widest text-[10px]">
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Export Zone Certs"}
                            </Button>
                        </Card>

                        {/* School filter — students, volunteers, scouts, qiraath */}
                        {(certType === 'student' || certType === 'volunteer' || certType === 'scout-team' || certType === 'qiraath') && (
                            <Card className="apc-card border border-slate-100 rounded-[24px] p-6 space-y-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <School size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">School Filter</h4>
                                        <p className="text-[10px] text-slate-400">Export by institution</p>
                                    </div>
                                </div>
                                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                                    <SelectTrigger className="w-full h-auto min-h-[2.75rem] py-2 rounded-xl bg-slate-50 border-none px-4 font-medium text-sm [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:text-left">
                                        <SelectValue placeholder="Select School" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-xl">
                                        <SelectItem value="all">All Schools</SelectItem>
                                        {Array.from(new Set((activeData as any[]).map(r => r.school))).sort().map(s => (
                                            <SelectItem key={s} value={s}>
                                                <div className="whitespace-normal break-words text-xs leading-snug py-0.5">{getSchoolName(s)}</div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button disabled={isGenerating || selectedSchool === 'all'} onClick={() => handleExport('school')} className="w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-widest text-[10px]">
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Export School Certs"}
                                </Button>
                            </Card>
                        )}

                        {/* Class filter — students, volunteers, scouts, qiraath */}
                        {(certType === 'student' || certType === 'volunteer' || certType === 'scout-team' || certType === 'qiraath') && (
                            <Card className="apc-card border border-slate-100 rounded-[24px] p-6 space-y-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                        <Archive size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Grade Filter</h4>
                                        <p className="text-[10px] text-slate-400">Export by class / grade</p>
                                    </div>
                                </div>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-none px-4 font-medium text-sm">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-xl">
                                        <SelectItem value="all">All Grades</SelectItem>
                                        {["3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].filter(c =>
                                            (activeData as any[]).some(r => r.className === c)
                                        ).map(c => (
                                            <SelectItem key={c} value={c}>Grade {c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button disabled={isGenerating || selectedClass === 'all'} onClick={() => handleExport('class')} className="w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-widest text-[10px]">
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Export Grade Certs"}
                                </Button>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right: Live preview */}
                <div className="lg:col-span-5 apc-card">
                    {/* Dark stage / spotlight backdrop */}
                    <div className="bg-slate-950 rounded-[28px] p-8 flex flex-col items-center gap-6 sticky top-8">
                        <div className="flex items-center gap-2 w-full">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Preview</p>
                            <span className={`ml-auto text-[10px] font-black uppercase tracking-widest ${meta.color}`}>
                                {meta.plural}
                            </span>
                        </div>

                        {/* Record Actions Toggle */}
                        {previewReg && (
                            <div className="w-full flex justify-end">
                                {!showActions ? (
                                    <Button
                                        onClick={() => setShowActions(true)}
                                        className="h-8 rounded-xl bg-slate-800 text-white font-normal uppercase text-[9px] tracking-widest hover:bg-slate-700 shadow-lg active:scale-95 transition-all"
                                    >
                                        <MoreHorizontal className="mr-2 h-3 w-3" /> Actions
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                                        <Link href={getProfileLink(certType, previewReg.id)}>
                                            <Button
                                                variant="outline"
                                                className="h-8 px-3 rounded-xl border-slate-700 text-slate-300 font-normal uppercase text-[9px] tracking-widest hover:bg-slate-800 hover:text-white"
                                            >
                                                <ExternalLink className="mr-2 h-3 w-3" /> Profile
                                            </Button>
                                        </Link>

                                        <Button
                                            onClick={() => generateBatchAccessPasses([previewReg], `AccessPass_${(previewReg.studentName || (previewReg as any).name || 'Pass').replace(/\s+/g, '_')}`, getPassType(certType))}
                                            className="h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-normal uppercase text-[9px] tracking-widest shadow-lg shadow-indigo-900/20"
                                        >
                                            <Download className="mr-2 h-3 w-3" /> ID
                                        </Button>

                                        <Button
                                            onClick={() => {
                                                if (certType === 'scout-team') {
                                                    generateScoutCertificate([previewReg], `Certificate_${((previewReg as any).name || 'Scout').replace(/\s+/g, '_')}`);
                                                } else if (certType === 'volunteer') {
                                                    generateVolunteerCertificate([previewReg], `Certificate_${((previewReg as any).volunteerName || (previewReg as any).name || 'Volunteer').replace(/\s+/g, '_')}`);
                                                } else if (certType === 'qiraath') {
                                                    generateQiraathCertificate([previewReg], `Certificate_${((previewReg as any).name || 'Qiraath').replace(/\s+/g, '_')}`);
                                                } else {
                                                    generateParticipationCertificate([previewReg], `Certificate_${(previewReg.studentName || (previewReg as any).name || 'Participant').replace(/\s+/g, '_')}`, certType as any);
                                                }
                                            }}
                                            className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-normal uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-900/20"
                                        >
                                            <Download className="mr-2 h-3 w-3" /> Cert
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowActions(false)}
                                            className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                        >
                                            <X size={14} />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Glowing halo behind the pass card */}
                        <div className="relative w-full overflow-hidden rounded-md border border-slate-800 bg-white">
                            <img
                                src={
                                    certType === 'scout-team' ? "/certificate/GjamS.jpeg" :
                                        certType === 'volunteer' ? "/certificate/GjamV.jpeg" :
                                            certType === 'qiraath' ? "/certificate/GjamD.jpeg" :
                                                "/certificate/Gjamp.jpeg"
                                }
                                alt="Certificate Background"
                                className="w-full h-auto object-cover opacity-90"
                            />
                            {previewReg && (
                                <div className="absolute inset-0 z-10 flex flex-col justify-center" style={{ left: '45.5%', width: '31%', top: (certType === 'scout-team' || certType === 'volunteer') ? '1.5%' : '5%' }}>
                                    <div className="text-[#a51d46] font-bold" style={{ fontSize: '1.4vw', lineHeight: 1.1 }}>
                                        {toTitleCase(
                                            (certType === 'student' ? previewReg.studentName :
                                                certType === 'volunteer' ? (previewReg as any).volunteerName :
                                                    (previewReg as any).name) || "NAME OF PARTICIPANT"
                                        )}
                                    </div>
                                    <div className="text-[#283272] mt-1" style={{ fontSize: '0.7vw', lineHeight: 1.2 }}>
                                        {toTitleCase(getSchoolName(previewReg.school || "School ID"))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="text-center space-y-1">
                            <p className="text-slate-500 text-[10px] font-semibold">
                                Showing {previewReg
                                    ? (certType === 'student' ? previewReg.studentName :
                                        certType === 'volunteer' ? (previewReg as any).volunteerName :
                                            (previewReg as any).name)
                                    : 'no data yet'}
                            </p>
                            <p className="text-slate-600 text-[9px] uppercase tracking-widest">
                                {filteredData.length} cert{filteredData.length !== 1 ? 's' : ''} in current selection
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
