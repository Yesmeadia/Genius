import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { locations } from "@/data/locations";
import {
  Registration,
  GuestRegistration,
  YesianRegistration,
  LocalStaffRegistration,
  AlumniRegistration,
  VolunteerRegistration,
  AwardeeRegistration,
  QiraathRegistration,
  DriverStaffRegistration
} from "@/app/admin/dashboard/types";

/** Robust filename sanitization for cross-browser compatibility */
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9\-_]/gi, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};

/** Manual download trigger to bypass Chrome/Firefox restrictions on async save() */
const triggerDownload = (doc: jsPDF, filename: string) => {
  const cleanName = sanitizeFilename(filename);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

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
    console.log(`Fetching local asset: ${imageUrl}`);
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
    console.log(`Fetching font: ${path}`);
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

  const tableData = data.map((reg, index) => {
    let guardianInfo = reg.parentName || "-";
    if (reg.accompaniments && reg.accompaniments.length > 0) {
      guardianInfo = reg.accompaniments.map(a => `${a.name} (${a.relation})`).join(", ");
    }

    return [
      index + 1,
      reg.studentName,
      (reg as any).type || "Student",
      reg.gender,
      reg.parentage,
      reg.className,
      getSchoolName(reg.school),
      reg.zone,
      reg.withParent ? "Yes" : "No",
      guardianInfo,
      reg.mobileNumber || "-"
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [["#", "Student Name", "Type", "Gender", "Parentage", "Class", "School Name", "Zone", "Acc.", "Guardian", "Mobile"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
    didDrawPage: (data) => addFooter(doc, data)
  });

  triggerDownload(doc, filename);
}

/**
 * Guardian / Accompaniment Database PDF Export
 * Prioritizes Guardian Name as requested
 */
export async function generateGuardianExportPDF(
  data: Registration[],
  title: string,
  filename: string
) {
  if (data.length === 0) return alert("No records found.");

  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData: any[][] = [];
  let rowCount = 1;

  data.forEach((reg) => {
    if (reg.accompaniments && reg.accompaniments.length > 0) {
      reg.accompaniments.forEach((acc) => {
        tableData.push([
          rowCount++,
          acc.name,
          acc.relation,
          reg.studentName,
          reg.className,
          getSchoolName(reg.school),
          reg.zone,
          reg.mobileNumber || (reg as any).whatsappNumber || "-"
        ]);
      });
    } else {
      tableData.push([
        rowCount++,
        reg.parentName || "Unknown",
        reg.relation || "Parent",
        reg.studentName,
        reg.className,
        getSchoolName(reg.school),
        reg.zone,
        reg.mobileNumber || (reg as any).whatsappNumber || "-"
      ]);
    }
  });

  autoTable(doc, {
    startY: 50,
    head: [["#", "Guardian Name", "Relation", "Student Name", "Class", "School Name", "Zone", "Contact"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });

  triggerDownload(doc, filename);
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
    reg.address
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Guest Name", "WhatsApp", "Address"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  triggerDownload(doc, filename);
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
    reg.whatsappNumber
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Member Name", "Designation", "Zone", "WhatsApp"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  triggerDownload(doc, filename);
}

/**
 * Local Staff Registration PDF
 */
export async function generateLocalStaffExportPDF(data: LocalStaffRegistration[], title: string, filename: string) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => [
    index + 1,
    reg.name,
    reg.gender || "N/A",
    reg.role || "N/A",
    getSchoolName(reg.school),
    reg.zone,
    reg.whatsappNumber
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Staff Name", "Gender", "Role", "School", "Zone", "WhatsApp"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  triggerDownload(doc, filename);
}

/**
 * Alumni Registration PDF
 */
export async function generateAlumniExportPDF(data: AlumniRegistration[], title: string, filename: string) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => [
    index + 1,
    reg.name,
    reg.category,
    reg.className,
    getSchoolName(reg.school),
    reg.zone,
    reg.withParent ? "Yes" : "No",
    reg.whatsappNumber
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Alumni Name", "Category", "Class", "School", "Zone", "Acc.", "WhatsApp"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  triggerDownload(doc, filename);
}

/**
 * Volunteer Registration PDF
 */
export async function generateVolunteerExportPDF(data: VolunteerRegistration[], title: string, filename: string) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => {
    let guardianInfo = "-";
    if (reg.accompaniments && reg.accompaniments.length > 0) {
      guardianInfo = reg.accompaniments.map(a => `${a.name} (${a.relation})`).join(", ");
    }

    return [
      index + 1,
      reg.volunteerName,
      reg.parentage,
      reg.className,
      getSchoolName(reg.school),
      reg.zone,
      reg.withParent ? "Yes" : "No",
      guardianInfo,
      reg.whatsappNumber || reg.mobileNumber || "N/A"
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [["#", "Volunteer Name", "Parentage", "Class", "School", "Zone", "Acc.", "Guardian", "Contact"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  triggerDownload(doc, filename);
}

/**
 * Awardee Registration PDF
 */
export async function generateAwardeeExportPDF(data: AwardeeRegistration[], title: string, filename: string) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => [
    index + 1,
    reg.name,
    reg.selectionType === "State/UT Rank Holder" ? "-" : reg.category,
    reg.className,
    reg.rank,
    reg.selectionType,
    getSchoolName(reg.school),
    reg.zone,
    reg.withParent ? "Yes" : "No",
    reg.whatsappNumber
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Awardee Name", "Category", "Class", "Rank", "Type", "School", "Zone", "Acc.", "WhatsApp"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  triggerDownload(doc, filename);
}

/**
 * Qiraath Registration PDF
 */
export async function generateQiraathExportPDF(data: QiraathRegistration[], title: string, filename: string) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => [
    index + 1,
    reg.name,
    reg.category,
    reg.className,
    reg.rank,
    getSchoolName(reg.school),
    reg.zone,
    reg.withParent ? "Yes" : "No",
    reg.whatsappNumber
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Participant Name", "Category", "Class", "Rank", "School", "Zone", "Acc.", "WhatsApp"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  triggerDownload(doc, filename);
}

/**
 * Driver & Staff Registration PDF
 */
export async function generateDriverStaffExportPDF(data: DriverStaffRegistration[], title: string, filename: string) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => [
    index + 1,
    reg.name,
    reg.staffType,
    reg.vehicleType || "N/A",
    reg.vehicleNumber || "N/A",
    reg.zone,
    reg.whatsappNumber
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Name", "Staff Type", "Vehicle", "Plate No.", "Zone", "WhatsApp"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  triggerDownload(doc, filename);
}


export async function generateStrategicReportPDF(
  registrations: Registration[],
  localStaff: LocalStaffRegistration[],
  yesians: YesianRegistration[],
  guests: GuestRegistration[],
  alumni: AlumniRegistration[],
  volunteers: VolunteerRegistration[],
  awardees: AwardeeRegistration[],
  qiraath: QiraathRegistration[],
  drivers: DriverStaffRegistration[]
) {
  const doc = new jsPDF({ orientation: "portrait" });
  const title = "STRATEGIC PARTICIPATION REPORT";
  await addHeader(doc, title);

  let currentY = 55;

  const countAcc = (list: any[]) => list.reduce((total, r) => total + (r.accompaniments?.length || (r.withParent ? 1 : 0)), 0);
  const totalAcc = countAcc(registrations) + countAcc(alumni) + countAcc(volunteers) + countAcc(awardees) + countAcc(qiraath);

  // 1. CONSOLIDATED PARTICIPATION SUMMARY
  const summaryBody = [
    ["1. Students", registrations.length],
    ["2. Local School Staff", localStaff.length],
    ["3. Yesian Members", yesians.length],
    ["4. Invited Guests", guests.length],
    ["5. Alumni Achievers", alumni.length],
    ["6. Event Volunteers", volunteers.length],
    ["7. Awardee Recognition", awardees.length],
    ["8. Qiraath Participants", qiraath.length],
    ["9. Drivers & Support Staff", drivers.length],
    ["10. Accompaniments (Guardians)", totalAcc],
  ];
  const totalPeople = registrations.length + localStaff.length + yesians.length + guests.length + alumni.length + volunteers.length + awardees.length + qiraath.length + drivers.length + totalAcc;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. Overall Participation Summary", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Registration Category", "Total Count"]],
    body: summaryBody as any[][],
    theme: "striped",
    headStyles: { fillColor: [51, 65, 85], fontSize: 9 },
    styles: { fontSize: 8 },
    foot: [["GRAND TOTAL HEADCOUNT", totalPeople]],
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold" }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 2. STUDENT GENDER BY ZONE
  const zoneGenderMap = registrations.reduce((acc: any, r) => {
    const zone = r.zone || "N/A";
    const gender = r.gender?.toLowerCase() === "male" ? "Male" :
      r.gender?.toLowerCase() === "female" ? "Female" : "Other";
    if (!acc[zone]) acc[zone] = { Male: 0, Female: 0, Total: 0 };
    acc[zone][gender]++;
    acc[zone].Total++;
    return acc;
  }, {});

  const zoneGenderBody = Object.entries(zoneGenderMap).map(([zone, counts]: [string, any]) => [
    zone,
    counts.Male,
    counts.Female,
    counts.Total
  ]);

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. Student Gender Distribution by Zone", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Zone/Region", "Male Students", "Female Students", "Grand Total"]],
    body: zoneGenderBody as any[][],
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
    styles: { fontSize: 8 },
    foot: [["TOTAL",
      Object.values(zoneGenderMap).reduce((a: number, b: any) => a + b.Male, 0),
      Object.values(zoneGenderMap).reduce((a: number, b: any) => a + b.Female, 0),
      registrations.length
    ]],
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold" }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 3. STAFF GENDER BY SCHOOL
  const staffSchoolMap = localStaff.reduce((acc: any, s) => {
    const schoolName = getSchoolName(s.school);
    const gender = s.gender?.toLowerCase() === "male" ? "Male" :
      s.gender?.toLowerCase() === "female" ? "Female" : "Other";
    if (!acc[schoolName]) acc[schoolName] = { Male: 0, Female: 0, Total: 0 };
    acc[schoolName][gender]++;
    acc[schoolName].Total++;
    return acc;
  }, {});

  const staffBody = Object.entries(staffSchoolMap).map(([school, counts]: [string, any]) => [
    school,
    counts.Male,
    counts.Female,
    counts.Total
  ]);

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("3. Local Staff Distribution by School", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["School Institution", "Male Staff", "Female Staff", "Grand Total"]],
    body: staffBody as any[][],
    theme: "striped",
    headStyles: { fillColor: [14, 165, 233], fontSize: 9 },
    styles: { fontSize: 8 },
    foot: [["TOTAL",
      Object.values(staffSchoolMap).reduce((a: number, b: any) => a + b.Male, 0),
      Object.values(staffSchoolMap).reduce((a: number, b: any) => a + b.Female, 0),
      localStaff.length
    ]],
    footStyles: { fillColor: [240, 249, 255], textColor: [14, 165, 233], fontStyle: "bold" }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 4. STUDENT GENDER BY SCHOOL
  const schoolGenderMap = registrations.reduce((acc: any, r) => {
    const schoolName = getSchoolName(r.school);
    const gender = r.gender?.toLowerCase() === "male" ? "Male" :
      r.gender?.toLowerCase() === "female" ? "Female" : "Other";
    if (!acc[schoolName]) acc[schoolName] = { Male: 0, Female: 0, Total: 0 };
    acc[schoolName][gender]++;
    acc[schoolName].Total++;
    return acc;
  }, {});

  const schoolGenderBody = Object.entries(schoolGenderMap).map(([school, counts]: [string, any]) => [
    school,
    counts.Male,
    counts.Female,
    counts.Total
  ]);

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("4. Student Gender Distribution by School", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["School Institution", "Male Students", "Female Students", "Grand Total"]],
    body: schoolGenderBody as any[][],
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
    styles: { fontSize: 8 },
    foot: [["TOTAL",
      Object.values(schoolGenderMap).reduce((a: number, b: any) => a + b.Male, 0),
      Object.values(schoolGenderMap).reduce((a: number, b: any) => a + b.Female, 0),
      registrations.length
    ]],
    footStyles: { fillColor: [245, 243, 255], textColor: [79, 70, 229], fontStyle: "bold" }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 5. TOP SCHOOL PARTICIPATION (STUDENTS)
  const studentSchoolMap = registrations.reduce((acc: any, r) => {
    const schoolName = getSchoolName(r.school);
    acc[schoolName] = (acc[schoolName] || 0) + 1;
    return acc;
  }, {});

  const schoolRows = Object.entries(studentSchoolMap)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 25)
    .map(([name, count], i) => [i + 1, name, count]);

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("5. Top Schools by Enrollment (Ranked)", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Rank", "School Name", "Total Students"]],
    body: schoolRows as any[][],
    theme: "striped",
    headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
    styles: { fontSize: 8 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 6. YESIAN MEMBERS BY ZONE
  const yesianZoneMap = yesians.reduce((acc: any, y) => {
    const zone = y.zone || "N/A";
    const gender = y.gender?.toLowerCase() === "male" ? "Male" :
      y.gender?.toLowerCase() === "female" ? "Female" : "Other";
    if (!acc[zone]) acc[zone] = { Male: 0, Female: 0, Total: 0 };
    acc[zone][gender]++;
    acc[zone].Total++;
    return acc;
  }, {});

  const yesianBody = Object.entries(yesianZoneMap).map(([zone, counts]: [string, any]) => [
    zone,
    counts.Male,
    counts.Female,
    counts.Total
  ]);

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("6. Yesian Member Distribution by Zone", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Zone/Region", "Male Yesians", "Female Yesians", "Grand Total"]],
    body: yesianBody as any[][],
    theme: "striped",
    headStyles: { fillColor: [245, 158, 11], fontSize: 9 },
    styles: { fontSize: 8 },
    foot: [["TOTAL",
      Object.values(yesianZoneMap).reduce((a: number, b: any) => a + b.Male, 0),
      Object.values(yesianZoneMap).reduce((a: number, b: any) => a + b.Female, 0),
      yesians.length
    ]],
    footStyles: { fillColor: [255, 251, 235], textColor: [180, 83, 9], fontStyle: "bold" },
    didDrawPage: (data) => addFooter(doc, data)
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 7. OTHER CATEGORIES SUMMARY
  const otherCategoriesBody = [
    ["Guests", guests.length],
    ["Alumni Achievers", alumni.length],
    ["Volunteers", volunteers.length],
    ["Awardees", awardees.length],
    ["Qiraath Participants", qiraath.length],
    ["Drivers & Support Staff", drivers.length],
  ];

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("7. Supplemental Categories Participation", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Category", "Total Count"]],
    body: otherCategoriesBody as any[][],
    theme: "striped",
    headStyles: { fillColor: [100, 116, 139], fontSize: 9 },
    styles: { fontSize: 8 },
    didDrawPage: (data) => addFooter(doc, data)
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 8. ACCOMPANIMENT DISTRIBUTION BY ZONE
  const accZoneMap: any = {};
  [registrations, alumni, volunteers, awardees, qiraath].forEach(list => {
    list.forEach((r: any) => {
      const zone = r.zone || "N/A";
      const count = r.accompaniments?.length || (r.withParent ? 1 : 0);
      if (count > 0) {
        accZoneMap[zone] = (accZoneMap[zone] || 0) + count;
      }
    });
  });

  const accZoneBody = Object.entries(accZoneMap).map(([zone, count]) => [zone, count]);

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("8. Accompaniment (Guardian) Distribution by Zone", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Zone/Region", "Total Accompaniments"]],
    body: accZoneBody as any[][],
    theme: "striped",
    headStyles: { fillColor: [219, 39, 119], fontSize: 9 },
    styles: { fontSize: 8 },
    foot: [["TOTAL ACCOMPANIMENTS", totalAcc]],
    footStyles: { fillColor: [253, 242, 248], textColor: [190, 24, 93], fontStyle: "bold" },
    didDrawPage: (data) => addFooter(doc, data)
  });

  const dateStr = new Date().toISOString().split("T")[0];
  triggerDownload(doc, `Strategic_Report_${dateStr}`);
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
  type: 'student' | 'guest' | 'yesian' | 'local-staff' | 'alumni-achiever' | 'volunteer' | 'awardee' | 'qiraath' | 'driver-staff',
  kalashFontLoaded: boolean
) {
  const W = doc.internal.pageSize.width;   // 70mm
  const H = doc.internal.pageSize.height;  // 100mm

  // ── 1. FULL-CARD BACKGROUND IMAGE ─────────────────────────────
  const bgPath = type === 'student' ? '/pass/delegates.png'
    : type === 'guest' ? '/pass/guest.png'
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
  const splitY = 67;  // taller header gives more space before footer content
  const stripW = 16;
  const photoW = 34;    // reduced width
  const photoH = 46;    // reduced height
  // Center horizontally within the right photo area (stripW to W)
  const photoAreaW = W - stripW - 1;
  const photoX = stripW + 1 + (photoAreaW - photoW) / 2;
  const photoY = 12;                // push down from top — adds space from header

  const photoSrc = (type === 'student' || type === 'yesian' || type === 'local-staff' || type === 'alumni-achiever' || type === 'volunteer' || type === 'awardee' || type === 'qiraath' || type === 'driver-staff') ? data.photoUrl : null;
  if (photoSrc) {
    const photo = await getBase64ImageFromUrl(photoSrc);
    if (photo) doc.addImage(photo, 'JPEG', photoX, photoY, photoW, photoH);
  }


  // ── 3. NAME (single line) ──────────────────────────────────────
  const fullName = (type === 'student' ? data.studentName : type === 'volunteer' ? data.volunteerName : (data.name || '')).trim();

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
  else if (type === 'local-staff') tc = [14, 165, 233]; // sky blue
  else if (type === 'alumni-achiever') tc = [236, 72, 153]; // pink
  else if (type === 'volunteer') tc = [217, 119, 6]; // amber
  else if (type === 'awardee') tc = [124, 58, 237]; // violet
  else if (type === 'qiraath') tc = [16, 185, 129]; // emerald
  else if (type === 'driver-staff') tc = [79, 70, 229]; // indigo

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(tc[0], tc[1], tc[2]);
  let infoText = '';
  if (type === 'student') infoText = `${data.zone} | ${getSchoolName(data.school)}`;
  else if (type === 'guest') infoText = data.address || '';
  else if (type === 'local-staff') {
    const schoolName = getSchoolName(data.school);
    infoText = `${data.role || ''}\n${data.zone} | ${schoolName}`;
  }
  else if (type === 'alumni-achiever') {
    const schoolName = getSchoolName(data.school);
    infoText = `${data.className || ''} ${data.category || ''}\n${data.zone} | ${schoolName}`;
  }
  else if (type === 'volunteer') {
    const schoolName = getSchoolName(data.school);
    infoText = `${data.className || ''}\n${data.zone} | ${schoolName}`;
  }
  else if (type === 'awardee') {
    const schoolName = getSchoolName(data.school);
    infoText = `${data.rank || ''} RANK | ${data.className || ''}\n${data.zone} | ${schoolName}`;
  }
  else if (type === 'qiraath') {
    const schoolName = getSchoolName(data.school);
    infoText = `${data.rank || ''} RANK | ${data.className || ''}\n${data.zone} | ${schoolName}`;
  }
  else if (type === 'driver-staff') {
    infoText = data.staffType === 'DRIVER'
      ? `DRIVER | ${data.vehicleType || ''}\n${data.vehicleNumber || ''}\nZONE: ${data.zone || ''}`
      : `SUPPORT STAFF\nZONE: ${data.zone || ''}`;
  }
  else infoText = data.designation ? `${data.zone} | ${data.designation}` : data.zone || '';
  const infoY = splitY + 17;
  doc.text(infoText.toUpperCase(), 4, infoY, { maxWidth: W - 16 });

  // ── 5. BARCODE + SHORT REF ID (centered) ─────────────────────
  const barcode = getBarcodeBase64(data.id);
  const bcW = 36;               // further reduced width
  const bcH = 6;                // further reduced height
  const bcX = (W - bcW) / 2;   // centred
  const bcY = H - 12;
  if (barcode) doc.addImage(barcode, 'PNG', bcX, bcY, bcW, bcH);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(80, 80, 80);
  doc.text(data.id.substring(0, 8).toUpperCase(), W / 2, bcY + bcH + 1.5, { align: 'center' });
}



export async function generateBatchAccessPasses(
  data: any[],
  filename: string,
  type: 'student' | 'guest' | 'yesian' | 'local-staff' | 'alumni-achiever' | 'volunteer' | 'awardee' | 'qiraath' | 'driver-staff' = 'student'
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
  triggerDownload(doc, filename);
}

/**
 * Data + Photos ZIP Backup
 */
export async function generateZipBackup(data: any[], title: string, filename: string, onProgress?: (msg: string) => void) {
  if (data.length === 0) {
    alert("No records found to backup.");
    return;
  }

  if (onProgress) onProgress("Initializing ZIP...");
  const zip = new JSZip();
  const cleanName = sanitizeFilename(filename);

  // 1. JSON Backup
  const cleanData = data.map(item => {
    const copy = { ...item };
    delete copy.tableData;
    return copy;
  });
  zip.file(`${cleanName}_data.json`, JSON.stringify(cleanData, null, 2));

  // 2. CSV Backup
  if (data.length > 0) {
    const headers = Object.keys(cleanData[0]).filter(k => k !== 'createdAt' && typeof cleanData[0][k] !== 'object');
    const csvContent = [
      headers.join(","),
      ...cleanData.map(item => headers.map(h => `"${(item[h] || '').toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    zip.file(`${cleanName}_data.csv`, csvContent);
  }

  // 3. Download Photos
  const photosFolder = zip.folder("photos");
  if (photosFolder) {
    let photoCount = 0;
    for (let i = 0; i < data.length; i++) {
      const rec = data[i];
      if (rec.photoUrl) {
        if (onProgress) onProgress(`Fetching photo ${i + 1} of ${data.length}...`);
        try {
          const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(rec.photoUrl)}`);
          if (res.ok) {
            const result = await res.json();
            if (result.base64) {
              const base64Data = result.base64.split(",")[1] || result.base64;
              let ext = "jpg";
              const match = result.base64.match(/data:image\/([a-zA-Z0-9]+);base64/);
              if (match) ext = match[1];

              const personName = rec.studentName || rec.volunteerName || rec.name || `Record_${i + 1}`;
              const photoName = sanitizeFilename(`${i + 1}_${personName}`);
              photosFolder.file(`${photoName}.${ext}`, base64Data, { base64: true });
              photoCount++;
            }
          }
        } catch (e) {
          console.error(`Failed to fetch photo for ${rec.id}`, e);
        }
      }
    }
  }

  if (onProgress) onProgress("Generating ZIP file...");
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${cleanName}_backup.zip`);
  if (onProgress) onProgress("Done");
}
