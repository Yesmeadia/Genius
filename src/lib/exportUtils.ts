import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import { locations } from "@/data/locations";
import { Registration, GuestRegistration, YesianRegistration } from "@/app/admin/dashboard/types";

const getBarcodeBase64 = (text: string): string | null => {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "CODE128",
      displayValue: false,
      margin: 0,
      width: 2,
      height: 35,
      lineColor: "#1e293b",
      background: "transparent"
    });
    return canvas.toDataURL("image/png");
  } catch (e) {
    return null;
  }
};

const getSchoolName = (schoolId: string) => {
  for (const zone of locations) {
    const school = zone.schools.find((s) => s.id === schoolId);
    if (school) return school.name;
  }
  return schoolId;
};

const getBase64ImageFromUrl = async (imageUrl: string) => {
  try {
    // If it's a remote URL (like Firebase Storage), route through our proxy to bypass CORS
    if (imageUrl.startsWith('http')) {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.base64;
    }

    // For local assets (e.g. /yeslogo.png) use standard fetch
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Image processing error: ", e);
    return null;
  }
};

/** Fetches a local font file and returns its raw base64 string (without data: prefix) for jsPDF */
const getFontBase64 = async (path: string): Promise<string | null> => {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch (e) {
    console.error('Font load error:', e);
    return null;
  }
};

/**
 * Standard Student Registration PDF
 */
export async function generateRegistrationPDF(
  data: Registration[],
  title: string,
  filename: string
) {
  if (data.length === 0) return alert("No records found.");

  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => [
    index + 1,
    reg.studentName,
    reg.gender,
    reg.parentage,
    reg.className,
    getSchoolName(reg.school),
    reg.zone,
    reg.withParent ? "Yes" : "No",
    reg.parentName || "-",
    reg.mobileNumber || "-"
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Student Name", "Gender", "Parentage", "Class", "School Name", "Zone", "Acc.", "Guardian", "Mobile"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Guest Registration PDF
 */
export async function generateGuestExportPDF(data: GuestRegistration[], title: string, filename: string) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => [
    index + 1,
    reg.name,
    reg.whatsappNumber,
    reg.address,
    reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleString() : "N/A"
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Guest Name", "WhatsApp", "Address", "Created At"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  doc.save(`${filename}.pdf`);
}

/**
 * Yesian Registration PDF
 */
export async function generateYesianExportPDF(data: YesianRegistration[], title: string, filename: string) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => [
    index + 1,
    reg.name,
    reg.designation,
    reg.zone,
    reg.whatsappNumber,
    reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleString() : "N/A"
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Member Name", "Designation", "Zone", "WhatsApp", "Created At"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  doc.save(`${filename}.pdf`);
}

async function addHeader(doc: jsPDF, title: string) {
  const yesLogoMsg = await getBase64ImageFromUrl("/yeslogo.png");
  const geniusLogoMsg = await getBase64ImageFromUrl("/Genius.png");
  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2;

  if (yesLogoMsg) doc.addImage(yesLogoMsg, "PNG", 10, 10, 25, 15);
  if (geniusLogoMsg) doc.addImage(geniusLogoMsg, "PNG", centerX - 25, 10, 50, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("YES GENIUS REGISTRATION", centerX, 35, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(title, centerX, 42, { align: "center" });
}

function addFooter(doc: jsPDF, data: any) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  const footerStr = `Generated on: ${new Date().toLocaleString()}`;
  doc.text(footerStr, data.settings.margin.left, doc.internal.pageSize.height - 10);
  const pageStr = `Page ${data.pageNumber}`;
  doc.text(pageStr, doc.internal.pageSize.width - data.settings.margin.left - 20, doc.internal.pageSize.height - 10);
}

/**
 * Access Pass Generation
 */
async function drawBadgeContent(
  doc: jsPDF,
  data: any,
  type: 'student' | 'guest' | 'yesian',
  kalashFontLoaded: boolean
) {
  const W = doc.internal.pageSize.width;   // 70mm
  const H = doc.internal.pageSize.height;  // 100mm

  // ── 1. FULL-CARD BACKGROUND IMAGE ─────────────────────────────
  const bgPath = type === 'student' ? '/pass/delegates.png'
               : type === 'guest'   ? '/pass/guest.png'
                                    : '/pass/officials.png';
  const bg = await getBase64ImageFromUrl(bgPath);
  if (bg) {
    doc.addImage(bg, 'PNG', 0, 0, W, H);
  } else {
    // Fallback plain white if image fails to load
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');
  }

  // ── 2. PHOTO (right-aligned, with top margin from header) ─────
  const splitY  = 67;  // taller header gives more space before footer content
  const stripW  = 16;
  const photoW  = 34;    // reduced width
  const photoH  = 46;    // reduced height
  // Center horizontally within the right photo area (stripW to W)
  const photoAreaW = W - stripW - 1;
  const photoX  = stripW + 1 + (photoAreaW - photoW) / 2;
  const photoY  = 12;                // push down from top — adds space from header

  const photoSrc = (type === 'student' || type === 'yesian') ? data.photoUrl : null;
  if (photoSrc) {
    const photo = await getBase64ImageFromUrl(photoSrc);
    if (photo) doc.addImage(photo, 'JPEG', photoX, photoY, photoW, photoH);
  }


  // ── 3. NAME (single line) ──────────────────────────────────────
  const fullName = (type === 'student' ? data.studentName : data.name || '').trim();

  // Auto-scale font size based on name length
  const nameFontSize = fullName.length <= 10 ? 12
                     : fullName.length <= 15 ? 10
                     : fullName.length <= 20 ? 8
                     : 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(nameFontSize);
  doc.text(fullName, 4, splitY + 14, { maxWidth: W - 16 }); // +14 for more top space

  // ── 4. ZONE | SCHOOL / ADDRESS ─────────────────────────────────
  // Theme color per type
  let tc = [217, 119, 6]; // amber default
  if (type === 'student') tc = [234, 88, 12];   // orange (matches delegate card)
  else if (type === 'guest') tc = [5, 150, 105]; // emerald

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(tc[0], tc[1], tc[2]);
  let infoText = '';
  if (type === 'student')    infoText = `${data.zone} | ${getSchoolName(data.school)}`;
  else if (type === 'guest') infoText = data.address || '';
  else                       infoText = data.designation ? `${data.zone} | ${data.designation}` : data.zone || '';
  const infoY = splitY + 17;
  doc.text(infoText.toUpperCase(), 4, infoY, { maxWidth: W - 16 });

  // ── 5. BARCODE + SHORT REF ID (centered) ─────────────────────
  const barcode = getBarcodeBase64(data.id);
  const bcW  = 36;               // further reduced width
  const bcH  = 6;                // further reduced height
  const bcX  = (W - bcW) / 2;   // centred
  const bcY  = H - 12;
  if (barcode) doc.addImage(barcode, 'PNG', bcX, bcY, bcW, bcH);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(80, 80, 80);
  doc.text(data.id.substring(0, 8).toUpperCase(), W / 2, bcY + bcH + 1.5, { align: 'center' });
}



export async function generateBatchAccessPasses(
  data: any[],
  filename: string,
  type: 'student' | 'guest' | 'yesian' = 'student'
) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [70, 100] });
  const yesLogo = await getBase64ImageFromUrl("/yeslogo.png");
  const geniusLogo = await getBase64ImageFromUrl("/Genius.png");

  // Load and register the custom Kalash font
  let kalashFontLoaded = false;
  const kalashBase64 = await getFontBase64('/fonts/KalashRegular.ttf');
  if (kalashBase64) {
    try {
      doc.addFileToVFS('KalashRegular.ttf', kalashBase64);
      doc.addFont('KalashRegular.ttf', 'KalashRegular', 'normal');
      kalashFontLoaded = true;
    } catch (e) {
      console.warn('Kalash font registration failed, falling back to Helvetica', e);
    }
  }

  for (let i = 0; i < data.length; i++) {
    if (i > 0) doc.addPage([70, 100], "portrait");
    await drawBadgeContent(doc, data[i], type, kalashFontLoaded);
  }
  doc.save(`${filename}.pdf`);
}
