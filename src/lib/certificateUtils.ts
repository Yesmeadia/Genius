import jsPDF from "jspdf";
import { locations } from "@/data/locations";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSchoolName = (schoolId: string): string => {
  for (const zone of locations) {
    const school = zone.schools.find((s) => s.id === schoolId);
    if (school) return school.name;
  }
  return schoolId;
};

/** Fetch a local public asset as a base64 data-URL string. */
const getBase64ImageFromUrl = async (url: string): Promise<string | null> => {
  try {
    if (url.startsWith("http")) {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.base64;
    }
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Certificate: image load error", e);
    return null;
  }
};

/**
 * Fetches a local font file from /public/fonts/ and returns its raw base64
 * string (WITHOUT the data: prefix) suitable for jsPDF.addFileToVFS.
 */
const getFontBase64 = async (path: string): Promise<string | null> => {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch (e) {
    console.error("Certificate: font load error", e);
    return null;
  }
};

const triggerDownload = (doc: jsPDF, filename: string) => {
  const clean = filename.replace(/[^a-z0-9\-_]/gi, "_").substring(0, 255);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${clean}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

// ─── Font names used inside jsPDF after registration ─────────────────────────
const FONT_SEMIBOLD = "MontserratSemiBold";
const FONT_MEDIUM = "MontserratMedium";

/** Load and register Montserrat fonts into a jsPDF instance. */
async function loadMontserratFonts(doc: jsPDF): Promise<{ semiBold: boolean; medium: boolean }> {
  const [semiBoldB64, mediumB64] = await Promise.all([
    getFontBase64("/fonts/Montserrat-SemiBold.ttf"),
    getFontBase64("/fonts/Montserrat-Medium.ttf"),
  ]);

  let semiBold = false;
  let medium = false;

  if (semiBoldB64) {
    try {
      doc.addFileToVFS("Montserrat-SemiBold.ttf", semiBoldB64);
      doc.addFont("Montserrat-SemiBold.ttf", FONT_SEMIBOLD, "normal");
      semiBold = true;
    } catch (e) {
      console.warn("Montserrat SemiBold registration failed, falling back to helvetica bold", e);
    }
  }

  if (mediumB64) {
    try {
      doc.addFileToVFS("Montserrat-Medium.ttf", mediumB64);
      doc.addFont("Montserrat-Medium.ttf", FONT_MEDIUM, "normal");
      medium = true;
    } catch (e) {
      console.warn("Montserrat Medium registration failed, falling back to helvetica normal", e);
    }
  }

  return { semiBold, medium };
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

/** "ANFAS KALOOR" → "Anfas Kaloor" */
function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Shrinks the active font size (step 0.5 pt) until the text fits within maxWidthMm.
 * Returns the final size that was set on the doc.
 */
function fitFontSize(
  doc: jsPDF,
  text: string,
  maxWidthMm: number,
  maxSize: number,
  minSize = 6
): number {
  let size = maxSize;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxWidthMm && size > minSize) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
}

// ─── Core drawing function ────────────────────────────────────────────────────

// Certificate is A4 Landscape: 297 × 210 mm
// Coordinates from design spec (pt → mm, 1 pt = 1/2.8346 mm):
//   left_bound  = 383.3418 pt → 135.24 mm  (text column left edge)
//   top         = 296.9094 pt → 104.75 mm  (name baseline Y)
//   width       = 269.2648 pt →  95.05 mm  (text column width — hard limit)

interface FontLoaded {
  semiBold: boolean;
  medium: boolean;
}

async function drawCertificate(
  doc: jsPDF,
  name: string,
  schoolName: string,
  bgBase64: string | null,
  fonts: FontLoaded
) {
  const W = 297;
  const H = 210;

  // Background
  if (bgBase64) {
    doc.addImage(bgBase64, "JPEG", 0, 0, W, H);
  } else {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, "F");
  }

  const PT = 2.8346;
  const x = 383.3418 / PT; // 135.24 mm
  const nameY = 296.9094 / PT; // 104.75 mm
  const colWidth = 269.2648 / PT; // 95.05  mm

  // ── Student name — Montserrat SemiBold, #a51d46 ───────────────────────────
  const nameText = toTitleCase(name);

  doc.setFont(fonts.semiBold ? FONT_SEMIBOLD : "helvetica", fonts.semiBold ? "normal" : "bold");
  const nameFontSize = nameText.length > 13 ? 20 : 23;
  doc.setFontSize(nameFontSize);
  doc.setTextColor(165, 29, 70);   // #a51d46

  doc.text(nameText, x, nameY, { align: "left" });

  // ── School name — Montserrat Medium, #283272 ──────────────────────────────
  const schoolText = toTitleCase(schoolName);
  const nameLineH = (nameFontSize / PT) * 0.55;
  const schoolY = nameY + nameLineH + 1.5;

  doc.setFont(fonts.medium ? FONT_MEDIUM : "helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(40, 50, 114);   // #283272

  doc.text(schoolText, x, schoolY, { align: "left" });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates and downloads a Participation Certificate PDF (one page per record).
 *
 * @param records  Student or awardee registration objects
 * @param filename Output filename (no extension)
 * @param type     `'student'` → uses rec.studentName; `'awardee'` → uses rec.name
 */
export async function generateParticipationCertificate(
  records: any[],
  filename: string,
  type: "student" | "awardee" = "student"
) {
  if (records.length === 0) {
    alert("No records to generate a certificate for.");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const [fonts, bgBase64] = await Promise.all([
    loadMontserratFonts(doc),
    getBase64ImageFromUrl("/certificate/Gjamp.jpeg"),
  ]);

  for (let i = 0; i < records.length; i++) {
    if (i > 0) doc.addPage("a4", "landscape");

    const rec = records[i];
    const name = type === "student" ? (rec.studentName || rec.name || "") : (rec.name || "");
    const rawSchool = rec.school || "";
    const schoolName = getSchoolName(rawSchool) || rawSchool;

    await drawCertificate(doc, name, schoolName, bgBase64, fonts);
  }

  triggerDownload(doc, filename);
}

/**
 * Generates and downloads one certificate PDF per record (separate files).
 * Useful for bulk individual issuance workflows.
 */
export async function generateBatchParticipationCertificates(
  records: any[],
  type: "student" | "awardee" = "student"
) {
  if (records.length === 0) {
    alert("No records to generate certificates for.");
    return;
  }

  // Load shared assets once
  const doc0 = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const [fonts, bgBase64] = await Promise.all([
    loadMontserratFonts(doc0),
    getBase64ImageFromUrl("/certificate/Gjamp.jpeg"),
  ]);

  for (const rec of records) {
    const name = type === "student" ? (rec.studentName || rec.name || "Unknown") : (rec.name || "Unknown");
    const rawSchool = rec.school || "";
    const schoolName = getSchoolName(rawSchool) || rawSchool;
    const outFile = `Certificate_${name.replace(/\s+/g, "_")}`;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    // Re-register fonts on each new doc instance
    await loadMontserratFonts(doc);
    await drawCertificate(doc, name, schoolName, bgBase64, fonts);
    triggerDownload(doc, outFile);

    await new Promise((r) => setTimeout(r, 400));
  }
}
