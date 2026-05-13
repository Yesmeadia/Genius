import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { locations, Zone } from "@/data/locations";
import {
  Registration,
  GuestRegistration,
  YesianRegistration,
  LocalStaffRegistration,
  AlumniRegistration,
  VolunteerRegistration,
  AwardeeRegistration,
  QiraathRegistration,
  DriverStaffRegistration,
  ScoutTeamRegistration,
  MediaRegistration
} from "@/app/admin/dashboard/types";

export async function generateChecklistPDF(
  data: (Registration | any)[],
  title: string,
  filename: string
) {
  if (data.length === 0) return alert("No records found.");

  const doc = new jsPDF({ orientation: "portrait" });
  await addHeader(doc, title);

  // Define Category Order
  const categoryOrder = ["Student", "Awardee", "Qiraath", "Volunteer", "Scout", "Alumni", "Staff"];
  const categoryTitles: Record<string, string> = {
    "Student": "STUDENTS (DELEGATES)",
    "Awardee": "AWARDEES",
    "Qiraath": "QIRAATH PARTICIPANTS",
    "Volunteer": "VOLUNTEERS",
    "Scout": "SCOUT TEAM",
    "Alumni": "ALUMNI ACHIEVERS",
    "Staff": "STAFFS & OTHERS"
  };

  // 1. Group by School
  const schoolGroups: Record<string, any[]> = {};
  data.forEach(reg => {
    const sId = reg.school || "Other";
    if (!schoolGroups[sId]) schoolGroups[sId] = [];
    schoolGroups[sId].push(reg);
  });

  const sortedSchoolIds = Object.keys(schoolGroups).sort((a, b) =>
    getSchoolName(a).localeCompare(getSchoolName(b))
  );

  const isMultiSchool = sortedSchoolIds.length > 1;
  let currentY = 50;

  for (const sId of sortedSchoolIds) {
    const schoolData = schoolGroups[sId];
    const schoolName = sId === "Other" ? "Direct Registrations" : getSchoolName(sId);

    if (isMultiSchool) {
      if (currentY > 50) {
        doc.addPage();
        currentY = 20;
      }

      // --- School Name Banner ---
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFillColor(30, 41, 59); // slate-900
      doc.roundedRect(14, currentY, pageWidth - 28, 14, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(schoolName.toUpperCase(), 20, currentY + 9.5);
      doc.setTextColor(30, 41, 59); // reset
      currentY += 20;
    }

    // 2. Group school data by category
    const groupedData: Record<string, any[]> = {};
    schoolData.forEach(reg => {
      const cat = reg.category || "Other";
      if (!groupedData[cat]) groupedData[cat] = [];
      groupedData[cat].push(reg);
    });

    const sortedCategories = Object.keys(groupedData).sort((a, b) => {
      const idxA = categoryOrder.indexOf(a);
      const idxB = categoryOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    for (const cat of sortedCategories) {
      const catData = groupedData[cat];
      const catTitle = categoryTitles[cat] || `${cat.toUpperCase()}S`;
      const isStaff = cat === "Staff";

      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(catTitle, 14, currentY);
      currentY += 6;

      // Sort by class then by name
      const sortedData = catData.sort((a, b) => {
        const aClass = a.className || "N/A";
        const bClass = b.className || "N/A";
        const aNum = parseInt(aClass) || 999;
        const bNum = parseInt(bClass) || 999;
        if (aNum !== bNum) return aNum - bNum;
        if (aClass !== bClass) return aClass.localeCompare(bClass);
        return (a.studentName || "").localeCompare(b.studentName || "");
      });

      const tableData = sortedData.map((reg, index) => {
        // Strip any category suffix like "(Staff)" from the display name
        const cleanName = (reg.studentName || "").replace(/\s*\([^)]*\)$/, "");

        // Base row data
        const row = [
          index + 1,
          cleanName,
          reg.className || "-", // Placeholder, will be removed if Staff
          "", // Badge
          "", // Arrival
          "", // Lunch
          "", // Spell 2
          "", // Departure
          ""  // Certificate
        ];

        // Remove Class column (index 2) for staff
        if (isStaff) {
          row.splice(2, 1);
        }
        return row;
      });

      const head = isStaff
        ? [["#", "Name", "Badge", "Arrival", "Lunch", "Spell 2", "Depart", "Cert."]]
        : [["#", "Name", "Class", "Badge", "Arrival", "Lunch", "Spell 2", "Depart", "Cert."]];

      const columnStyles: any = isStaff ? {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 15, halign: 'center' }
      } : {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' },
        7: { cellWidth: 15, halign: 'center' },
        8: { cellWidth: 15, halign: 'center' }
      };

      autoTable(doc, {
        startY: currentY,
        head: head,
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
        styles: { fontSize: 7, cellPadding: 1.5, minCellHeight: 10 },
        columnStyles: columnStyles,
        margin: { top: 20 },
        didDrawPage: (data) => addFooter(doc, data)
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;
    }
  }

  triggerDownload(doc, filename);
}

export function generateSchoolSummaryExcel(
  data: any[],
  filename: string
) {
  if (data.length === 0) return alert("No records found.");

  const categoryPriority = ["Student", "Awardee", "Qiraath", "Volunteer", "Scout", "Alumni", "Staff", "Other"];

  const sortedData = [...data].sort((a, b) => {
    // 1. Category Priority
    const catA = a.category || "Other";
    const catB = b.category || "Other";
    const idxA = categoryPriority.indexOf(catA);
    const idxB = categoryPriority.indexOf(catB);
    const priorityA = idxA === -1 ? 99 : idxA;
    const priorityB = idxB === -1 ? 99 : idxB;
    if (priorityA !== priorityB) return priorityA - priorityB;

    // 2. Class Sort
    const classA = a.className || "";
    const classB = b.className || "";
    const numA = parseInt(classA) || 999;
    const numB = parseInt(classB) || 999;
    if (numA !== numB) return numA - numB;
    if (classA !== classB) return classA.localeCompare(classB);

    // 3. Name Sort
    const nameA = (a.displayName || a.studentName || a.name || "").toLowerCase();
    const nameB = (b.displayName || b.studentName || b.name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const excelData = sortedData.map((reg, index) => {
    const loc = getLocationDetails(reg.school);
    const rawName = reg.displayName || reg.studentName || reg.volunteerName || reg.name || "-";
    const cleanName = rawName.replace(/\s*\([^)]*\)$/, "");

    return {
      "SL No": index + 1,
      "Name": cleanName,
      "Category": reg.category === "Student" ? "Delegate" : (reg.category || "Other"),
      "Gender": reg.gender || "-",
      "Class": reg.className || "-",
      "Parentage": reg.parentage || "-",
      "School": loc.schoolName || reg.school || "-",
      "Zone": loc.zoneName || reg.zone || "-",
      "With Guardian": reg.withParent ? "Yes" : "No",
      "Contact": reg.mobileNumber || reg.whatsappNumber || "-"
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const wscols = [
    { wch: 8 },  // SL No
    { wch: 30 }, // Name
    { wch: 15 }, // Category
    { wch: 10 }, // Gender
    { wch: 10 }, // Class
    { wch: 25 }, // Parentage
    { wch: 40 }, // School
    { wch: 20 }, // Zone
    { wch: 15 }, // With Guardian
    { wch: 20 }  // Contact
  ];
  worksheet["!cols"] = wscols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "All Participants");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${filename}.xlsx`);
}

/**
 * Yesian Members Excel Export
 */
export function generateYesianExcel(data: YesianRegistration[], filename: string) {
  if (data.length === 0) return alert("No Yesian records found.");

  const sorted = [...data].sort((a, b) => {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    return a.name.localeCompare(b.name);
  });

  const excelData = sorted.map((reg, i) => ({
    "SL No": i + 1,
    "Name": reg.name,
    "Gender": reg.gender || "-",
    "Designation": reg.designation || "-",
    "Zone": reg.zone || "-",
    "WhatsApp": reg.whatsappNumber || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [
    { wch: 8 },  // SL No
    { wch: 28 }, // Name
    { wch: 10 }, // Gender
    { wch: 25 }, // Designation
    { wch: 20 }, // Zone
    { wch: 18 }, // WhatsApp
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Yesians");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${filename}.xlsx`);
}

/**
 * Local Staff Excel Export
 */
export function generateLocalStaffExcel(data: LocalStaffRegistration[], filename: string) {
  if (data.length === 0) return alert("No Local Staff records found.");

  const sorted = [...data].sort((a, b) => {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    return a.name.localeCompare(b.name);
  });

  const excelData = sorted.map((reg, i) => ({
    "SL No": i + 1,
    "Name": reg.name,
    "Gender": reg.gender || "-",
    "Role": reg.role || "-",
    "School": getSchoolName(reg.school),
    "Zone": reg.zone || "-",
    "WhatsApp": reg.whatsappNumber || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [
    { wch: 8 },  // SL No
    { wch: 28 }, // Name
    { wch: 10 }, // Gender
    { wch: 18 }, // Role
    { wch: 38 }, // School
    { wch: 20 }, // Zone
    { wch: 18 }, // WhatsApp
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Local Staff");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${filename}.xlsx`);
}

/**
 * Driver & Support Staff Excel Export
 */
export function generateDriverStaffExcel(data: DriverStaffRegistration[], filename: string) {
  if (data.length === 0) return alert("No Driver/Staff records found.");

  const sorted = [...data].sort((a, b) => {
    if (a.staffType !== b.staffType) return a.staffType.localeCompare(b.staffType);
    return a.name.localeCompare(b.name);
  });

  const excelData = sorted.map((reg, i) => ({
    "SL No": i + 1,
    "Name": reg.name,
    "Gender": reg.gender || "-",
    "Staff Type": reg.staffType || "-",
    "Vehicle No": reg.vehicleNumber || "-",
    "Vehicle Type": reg.vehicleType || "-",
    "Zone": reg.zone || "-",
    "WhatsApp": reg.whatsappNumber || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [
    { wch: 8 },  // SL No
    { wch: 28 }, // Name
    { wch: 10 }, // Gender
    { wch: 18 }, // Staff Type
    { wch: 15 }, // Vehicle No
    { wch: 18 }, // Vehicle Type
    { wch: 20 }, // Zone
    { wch: 18 }, // WhatsApp
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Driver Staff");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${filename}.xlsx`);
}

/**
 * Individual School Excel Export
 * Generates a full participant list for a specific school
 */
export function generateSchoolExcelIndividual(
  people: any[],
  schoolName: string,
  filename: string
) {
  if (people.length === 0) return alert("No records found for this school.");

  const categoryPriority = ["Student", "Awardee", "Qiraath", "Volunteer", "Scout", "Alumni", "Staff", "Other"];

  const sortedPeople = [...people].sort((a, b) => {
    // 1. Category Priority
    const catA = a.category || "Other";
    const catB = b.category || "Other";
    const idxA = categoryPriority.indexOf(catA);
    const idxB = categoryPriority.indexOf(catB);
    const priorityA = idxA === -1 ? 99 : idxA;
    const priorityB = idxB === -1 ? 99 : idxB;
    if (priorityA !== priorityB) return priorityA - priorityB;

    // 2. Class Sort
    const classA = a.className || "";
    const classB = b.className || "";
    const numA = parseInt(classA) || 999;
    const numB = parseInt(classB) || 999;
    if (numA !== numB) return numA - numB;
    if (classA !== classB) return classA.localeCompare(classB);

    // 3. Name Sort
    const nameA = (a.displayName || a.studentName || a.name || "").toLowerCase();
    const nameB = (b.displayName || b.studentName || b.name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const excelData = sortedPeople.map((reg, index) => {
    const rawName = reg.displayName || reg.studentName || reg.volunteerName || reg.name || "-";
    const cleanName = rawName.replace(/\s*\([^)]*\)$/, "");

    return {
      "SL No": index + 1,
      "Name": cleanName,
      "Category": reg.category === "Student" ? "Delegate" : (reg.category || "Other"),
      "Gender": reg.gender || "-",
      "Class": reg.className || "-",
      "Parentage": reg.parentage || "-",
      "Zone": reg.zone || "-",
      "With Guardian": reg.withParent ? "Yes" : "No",
      "Contact": reg.mobileNumber || reg.whatsappNumber || "-"
    };
  });

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [
    { wch: 8 },  // SL No
    { wch: 30 }, // Name
    { wch: 15 }, // Category
    { wch: 10 }, // Gender
    { wch: 10 }, // Class
    { wch: 25 }, // Parentage
    { wch: 20 }, // Zone
    { wch: 15 }, // With Guardian
    { wch: 20 }  // Contact
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Participants");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${filename}.xlsx`);
}

export async function generateClassGenderSummaryPDF(
  data: (Registration | AlumniRegistration | VolunteerRegistration | AwardeeRegistration | QiraathRegistration | ScoutTeamRegistration | any)[],
  title: string,
  filename: string
) {
  if (data.length === 0) return alert("No records found.");

  const doc = new jsPDF({ orientation: "portrait" });
  await addHeader(doc, title);

  // Group by class and then gender
  const classMap: Record<string, { Male: number; Female: number; Total: number }> = {};

  data.forEach(reg => {
    const cls = reg.className || "N/A";
    const gender = reg.gender?.toLowerCase() === "male" ? "Male" :
      reg.gender?.toLowerCase() === "female" ? "Female" : "Other";

    if (!classMap[cls]) {
      classMap[cls] = { Male: 0, Female: 0, Total: 0 };
    }

    if (gender === "Male") classMap[cls].Male++;
    else if (gender === "Female") classMap[cls].Female++;
    classMap[cls].Total++;
  });

  const sortedClasses = Object.keys(classMap).sort((a, b) => {
    const aNum = parseInt(a) || 999;
    const bNum = parseInt(b) || 999;
    if (aNum !== bNum) return aNum - bNum;
    return a.localeCompare(b);
  });

  const tableData = sortedClasses.map((cls, index) => [
    index + 1,
    cls,
    classMap[cls].Male,
    classMap[cls].Female,
    classMap[cls].Total
  ]);

  const totals = sortedClasses.reduce((acc, cls) => {
    acc.Male += classMap[cls].Male;
    acc.Female += classMap[cls].Female;
    acc.Total += classMap[cls].Total;
    return acc;
  }, { Male: 0, Female: 0, Total: 0 });

  autoTable(doc, {
    startY: 50,
    head: [["#", "Class / Grade", "Male Students", "Female Students", "Total Students"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 },
    foot: [["", "GRAND TOTAL", totals.Male, totals.Female, totals.Total]],
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold" },
    didDrawPage: (data) => addFooter(doc, data)
  });

  triggerDownload(doc, filename);
}

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

const getLocationDetails = (schoolId: string, customLocations?: Zone[]) => {
  const activeLocs = customLocations || locations;
  for (const zone of activeLocs) {
    const school = zone.schools.find((s) => s.id === schoolId);
    if (school) return { schoolName: school.name, zoneName: zone.name };
  }
  return { schoolName: schoolId, zoneName: '' };
};

const getSchoolName = (schoolId: string, customLocations?: Zone[]) =>
  getLocationDetails(schoolId, customLocations).schoolName;

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
  data: any[],
  title: string,
  filename: string
) {
  if (data.length === 0) return alert("No records found.");

  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => {
    let guardianInfo = reg.parentName || "-";
    if (reg.accompaniments && reg.accompaniments.length > 0) {
      guardianInfo = reg.accompaniments.map((a: any) => `${a.name} (${a.relation})`).join(", ");
    }

    const displayName = reg.studentName || reg.volunteerName || reg.name || "Unknown";

    return [
      index + 1,
      displayName,
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
 * Guardian / Accompaniment Database Excel Export
 */
export function generateGuardianExcel(data: Registration[], filename: string) {
  if (data.length === 0) return alert("No records found.");

  const excelData: any[] = [];
  let rowCount = 1;

  data.forEach((reg) => {
    if (reg.accompaniments && reg.accompaniments.length > 0) {
      reg.accompaniments.forEach((acc) => {
        excelData.push({
          "SL No": rowCount++,
          "Guardian Name": acc.name,
          "Relation": acc.relation,
          "Student Name": reg.studentName,
          "Class": reg.className,
          "School Name": getSchoolName(reg.school),
          "Zone": reg.zone,
          "Contact": reg.mobileNumber || (reg as any).whatsappNumber || "-"
        });
      });
    } else {
      excelData.push({
        "SL No": rowCount++,
        "Guardian Name": reg.parentName || "Unknown",
        "Relation": reg.relation || "Parent",
        "Student Name": reg.studentName,
        "Class": reg.className,
        "School Name": getSchoolName(reg.school),
        "Zone": reg.zone,
        "Contact": reg.mobileNumber || (reg as any).whatsappNumber || "-"
      });
    }
  });

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [
    { wch: 8 },  // SL No
    { wch: 25 }, // Guardian Name
    { wch: 15 }, // Relation
    { wch: 25 }, // Student Name
    { wch: 10 }, // Class
    { wch: 35 }, // School Name
    { wch: 20 }, // Zone
    { wch: 18 }  // Contact
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Guardians");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${filename}.xlsx`);
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

  // Group data by zone
  const groupedData = data.reduce((acc, reg) => {
    const zone = reg.zone || "N/A";
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(reg);
    return acc;
  }, {} as Record<string, YesianRegistration[]>);

  const zones = Object.keys(groupedData).sort();
  let currentY = 50;

  zones.forEach((zone, zIndex) => {
    // Add zone header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(217, 119, 6); // Amber-600

    if (zIndex > 0) {
      // Check if we need a new page or just some spacing
      if (currentY > 160) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY += 10;
      }
    }

    doc.text(`Zone: ${zone} (${groupedData[zone].length} Members)`, 14, currentY);
    currentY += 5;

    const tableData = groupedData[zone]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((reg, index) => [
        index + 1,
        reg.name,
        reg.designation,
        reg.whatsappNumber
      ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Member Name", "Designation", "WhatsApp"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => addFooter(doc, data)
    });

    currentY = (doc as any).lastAutoTable.finalY;
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
      guardianInfo = reg.accompaniments.map((a: any) => `${a.name} (${a.relation})`).join(", ");
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

/**
 * Media Registration PDF
 */
export async function generateMediaExportPDF(data: MediaRegistration[], title: string, filename: string) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => [
    index + 1,
    reg.name,
    reg.gender || "N/A",
    reg.agency || "N/A",
    reg.designation || "N/A",
    reg.whatsappNumber || "N/A"
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["#", "Name", "Gender", "Agency", "Designation", "WhatsApp"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 8 },
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
  drivers: DriverStaffRegistration[],
  scoutTeam: ScoutTeamRegistration[],
  media: MediaRegistration[]
) {
  const doc = new jsPDF({ orientation: "portrait" });
  const title = "STRATEGIC PARTICIPATION REPORT";
  await addHeader(doc, title);

  let currentY = 55;

  const countAcc = (list: any[]) => list.reduce((total, r) => total + (r.accompaniments?.length || (r.withParent ? 1 : 0)), 0);
  const totalAcc = countAcc(registrations) + countAcc(alumni) + countAcc(volunteers) + countAcc(awardees) + countAcc(qiraath) + countAcc(scoutTeam);

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
    ["10. Scout Team Members", scoutTeam.length],
    ["11. Media Personnel", media.length],
    ["12. Accompaniments (Guardians)", totalAcc],
  ];
  const totalPeople = registrations.length + localStaff.length + yesians.length + guests.length + alumni.length + volunteers.length + awardees.length + qiraath.length + drivers.length + scoutTeam.length + media.length + totalAcc;

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
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold" },
    didDrawPage: (data) => addFooter(doc, data)
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
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold" },
    didDrawPage: (data) => addFooter(doc, data)
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
    footStyles: { fillColor: [240, 249, 255], textColor: [14, 165, 233], fontStyle: "bold" },
    didDrawPage: (data) => addFooter(doc, data)
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
    footStyles: { fillColor: [245, 243, 255], textColor: [79, 70, 229], fontStyle: "bold" },
    didDrawPage: (data) => addFooter(doc, data)
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
    didDrawPage: (data) => addFooter(doc, data)
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

  // 7. QIRAATH PARTICIPANTS BY ZONE
  const qiraathZoneMap = qiraath.reduce((acc: any, q) => {
    const zone = q.zone || "N/A";
    const gender = q.gender?.toLowerCase() === "male" ? "Male" :
      q.gender?.toLowerCase() === "female" ? "Female" : "Other";
    if (!acc[zone]) acc[zone] = { Male: 0, Female: 0, Total: 0 };
    acc[zone][gender]++;
    acc[zone].Total++;
    return acc;
  }, {});

  const qiraathBody = Object.entries(qiraathZoneMap).map(([zone, counts]: [string, any]) => [
    zone,
    counts.Male,
    counts.Female,
    counts.Total
  ]);

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("7. Qiraath Participant Distribution by Zone", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Zone/Region", "Male Participants", "Female Participants", "Grand Total"]],
    body: qiraathBody as any[][],
    theme: "striped",
    headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
    styles: { fontSize: 8 },
    foot: [["TOTAL",
      Object.values(qiraathZoneMap).reduce((a: number, b: any) => a + b.Male, 0),
      Object.values(qiraathZoneMap).reduce((a: number, b: any) => a + b.Female, 0),
      qiraath.length
    ]],
    footStyles: { fillColor: [236, 253, 245], textColor: [5, 150, 105], fontStyle: "bold" },
    didDrawPage: (data) => addFooter(doc, data)
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 8. OVERALL DISTRIBUTION BY CLASS AND GENDER (All Categories)
  const classGenderMap: Record<string, { Male: number; Female: number; Total: number }> = {};
  const allWithClass = [...registrations, ...alumni, ...volunteers, ...awardees, ...qiraath, ...scoutTeam];

  allWithClass.forEach(r => {
    const cls = (r as any).className || "N/A";
    const gender = (r as any).gender?.toLowerCase() === "male" ? "Male" :
      (r as any).gender?.toLowerCase() === "female" ? "Female" : "Other";
    if (!classGenderMap[cls]) classGenderMap[cls] = { Male: 0, Female: 0, Total: 0 };
    if (gender === "Male") classGenderMap[cls].Male++;
    else if (gender === "Female") classGenderMap[cls].Female++;
    classGenderMap[cls].Total++;
  });

  const sortedCls = Object.keys(classGenderMap).sort((a, b) => {
    const aNum = parseInt(a) || 999;
    const bNum = parseInt(b) || 999;
    if (aNum !== bNum) return aNum - bNum;
    return a.localeCompare(b);
  });

  const classGenderBody = sortedCls.map((cls, index) => [
    index + 1,
    cls,
    classGenderMap[cls].Male,
    classGenderMap[cls].Female,
    classGenderMap[cls].Total
  ]);

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("8. Participant Distribution by Class and Gender", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["#", "Class / Grade", "Male Count", "Female Count", "Total Count"]],
    body: classGenderBody as any[][],
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
    styles: { fontSize: 8 },
    foot: [["", "TOTAL",
      Object.values(classGenderMap).reduce((a, b) => a + b.Male, 0),
      Object.values(classGenderMap).reduce((a, b) => a + b.Female, 0),
      allWithClass.length
    ]],
    footStyles: { fillColor: [245, 243, 255], textColor: [79, 70, 229], fontStyle: "bold" },
    didDrawPage: (data) => addFooter(doc, data)
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 9. SUPPLEMENTAL CATEGORIES SUMMARY
  const otherCategoriesBody = [
    ["Guests", guests.length],
    ["Alumni Achievers", alumni.length],
    ["Volunteers", volunteers.length],
    ["Awardees", awardees.length],
    ["Qiraath Participants", qiraath.length],
    ["Drivers & Support Staff", drivers.length],
    ["Scout Team", scoutTeam.length],
  ];

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("9. Supplemental Categories Participation", 14, currentY);

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

  // 10. ACCOMPANIMENT DISTRIBUTION BY ZONE
  const accZoneMap: any = {};
  [registrations, alumni, volunteers, awardees, qiraath, scoutTeam].forEach(list => {
    list.forEach((r: any) => {
      const zone = r.zone || "N/A";
      if (!accZoneMap[zone]) accZoneMap[zone] = { Male: 0, Female: 0, Total: 0 };

      if (r.accompaniments && r.accompaniments.length > 0) {
        r.accompaniments.forEach((acc: any) => {
          const g = acc.gender?.toLowerCase() === "male" ? "Male" : "Female";
          accZoneMap[zone][g]++;
          accZoneMap[zone].Total++;
        });
      } else if (r.withParent) {
        const g = r.parentGender?.toLowerCase() === "male" ? "Male" : "Female";
        accZoneMap[zone][g]++;
        accZoneMap[zone].Total++;
      }
    });
  });

  const accZoneBody = Object.entries(accZoneMap).map(([zone, counts]: [string, any]) => [
    zone,
    counts.Male,
    counts.Female,
    counts.Total
  ]);

  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("10. Accompaniment (Guardian) Gender Distribution by Zone", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Zone/Region", "Male Guardians", "Female Guardians", "Grand Total"]],
    body: accZoneBody as any[][],
    theme: "striped",
    headStyles: { fillColor: [219, 39, 119], fontSize: 9 },
    styles: { fontSize: 8 },
    foot: [["TOTAL",
      Object.values(accZoneMap).reduce((a: number, b: any) => a + b.Male, 0),
      Object.values(accZoneMap).reduce((a: number, b: any) => a + b.Female, 0),
      totalAcc
    ]],
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
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const marginLeft = data?.settings?.margin?.left || 14;

  doc.text(footerStr, marginLeft, pageHeight - 10);
  const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
  const pageStr = `Page ${currentPage}`;
  doc.text(pageStr, pageWidth - marginLeft - 20, pageHeight - 10);
}

function toTitleCase(str: string): string {
  if (!str) return '';
  const acronyms = ['YES', 'DS', 'PA'];
  return str.split(' ').map(word => {
    if (acronyms.includes(word.toUpperCase())) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

/**
 * Access Pass Generation
 */
async function drawBadgeContent(
  doc: jsPDF,
  data: any,
  type: 'student' | 'guest' | 'yesian' | 'local-staff' | 'alumni-achiever' | 'volunteer' | 'awardee' | 'qiraath' | 'driver-staff' | 'guardian' | 'media' | 'gsuit',
  fontsLoaded: { kalash: boolean; montserratSemiBold: boolean; montserratMedium: boolean; bebas: boolean },
  dynamicLocations?: Zone[]
) {
  const W = doc.internal.pageSize.width;   // 85mm
  const H = doc.internal.pageSize.height;  // 120mm

  // ── 1. FULL-CARD BACKGROUND IMAGE ─────────────────────────────
  const bgPath = (type === 'student' || type === 'qiraath') ? '/pass/Delegate.jpeg'
    : type === 'local-staff' ? '/pass/Mentor.jpeg'
      : type === 'awardee' ? '/pass/Awardee.jpeg'
        : type === 'yesian' ? '/pass/Crew.jpeg'
          : type === 'guardian' ? '/pass/Guardian.jpeg'
            : type === 'media' ? '/pass/Media.jpeg'
              : type === 'guest' ? '/pass/guest.png'
                : type === 'gsuit' ? (data.room ? '/gsuit/room.jpeg' : '/gsuit/no_room.jpeg')
                  : type === 'driver-staff' ? '/pass/Escort.jpeg'
                    : '/pass/Crew.jpeg';
  const bg = await getBase64ImageFromUrl(bgPath);
  if (bg) {
    const bgFormat = bgPath.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
    doc.addImage(bg, bgFormat, 0, 0, W, H);
  } else {
    // Fallback plain white if image fails to load
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');
  }

  // ── 2. STANDARD PASS CONTENT (Only for non-gsuit types) ──
  if (type !== 'gsuit') {
    const splitY = 67;  // taller header gives more space before footer content
  let photoW = 34;
  let photoH = 46;
  let photoX = 20;
  let photoY = 12;

  if (type === 'student' || type === 'local-staff' || type === 'awardee' || type === 'yesian' || type === 'guardian' || type === 'qiraath' || type === 'media' || type === 'driver-staff') {
    photoW = 29.157;
    photoH = 36.425;
    photoX = 46.289;
    photoY = 51.168;
  } else {
    const stripW = 16;
    const photoAreaW = W - stripW - 1;
    photoX = stripW + 1 + (photoAreaW - photoW) / 2;
  }

  const photoSrc = (type === 'student' || type === 'yesian' || type === 'local-staff' || type === 'alumni-achiever' || type === 'volunteer' || type === 'awardee' || type === 'qiraath' || type === 'driver-staff' || type === 'media') ? data.photoUrl : null;
  if (photoSrc) {
    const photo = await getBase64ImageFromUrl(photoSrc);
    if (photo) {
      if (type === 'student' || type === 'local-staff' || type === 'awardee' || type === 'yesian' || type === 'qiraath' || type === 'media' || type === 'driver-staff') {
        const r = 7.69;
        const d = doc as any;
        // Robust PDF clipping using internal operators
        d.internal.write('q');
        d.roundedRect(photoX, photoY, photoW, photoH, r, r, null);
        d.internal.write('W n'); // W = clip, n = no-op path termination
        d.addImage(photo, 'JPEG', photoX, photoY, photoW, photoH);
        d.internal.write('Q');
      } else {
        doc.addImage(photo, 'JPEG', photoX, photoY, photoW, photoH);
      }
    }
  }


  // ── 3. NAME (single line) ──────────────────────────────────────
  const fullName = (type === 'student' ? data.studentName : type === 'volunteer' ? data.volunteerName : type === 'guardian' ? data.guardianName : (data.name || '')).trim();

  // Auto-scale font size based on name length
  const nameFontSize = fullName.length <= 10 ? 12
    : fullName.length <= 15 ? 10
      : fullName.length <= 20 ? 8
        : 7;

  if (type === 'student' || type === 'local-staff' || type === 'awardee' || type === 'yesian' || type === 'guardian' || type === 'qiraath' || type === 'media' || type === 'driver-staff') {
    doc.setFont(fontsLoaded.montserratSemiBold ? 'MontserratSemiBold' : 'helvetica', 'normal');
    if (!fontsLoaded.montserratSemiBold) doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const fontSize = fullName.length > 25 ? 9
      : fullName.length > 18 ? 11
        : fullName.length > 13 ? 12
          : 15;
    doc.setFontSize(fontSize);
    const nameY = type === 'guardian' ? 53.354 : 44.354;
    const nameX = type === 'guardian' ? W / 2 : 11.753;
    const align = type === 'guardian' ? 'center' : 'left';
    doc.text(toTitleCase(fullName), nameX, nameY, { align }); // Moved down from 41.354
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 10, 10);
    doc.setFontSize(nameFontSize);
    doc.text(fullName, 4, splitY + 14, { maxWidth: W - 16 });
  }

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

  let infoText = '';
  if (type === 'student') infoText = ` ${getSchoolName(data.school)}`;
  else if (type === 'guest') infoText = data.address || '';
  else if (type === 'local-staff') {
    const schoolName = getSchoolName(data.school);
    infoText = `${data.role || ''}\n${schoolName}`;
  }
  else if (type === 'alumni-achiever') {
    const schoolName = getSchoolName(data.school);
    infoText = `${data.className || ''} ${data.category || ''}\n${schoolName}`;
  }
  else if (type === 'volunteer') {
    const schoolName = getSchoolName(data.school);
    infoText = `${data.className || ''}\n${schoolName}`;
  }
  else if (type === 'awardee') {
    const schoolName = getSchoolName(data.school);
    infoText = `${data.rank || ''} RANK | ${data.className || ''}\n${schoolName}`;
  }
  else if (type === 'qiraath') {
    const schoolName = getSchoolName(data.school);
    infoText = `${data.rank || ''} RANK | ${data.className || ''}\n${schoolName}`;
  }
  else if (type === 'driver-staff') {
    infoText = `${data.zone || ''}`;
  }
  else if (type === 'guardian') {
    infoText = `STUDENT: ${data.studentName || ''}`;
  }
  else if (type === 'media') {
    infoText = data.agency ? `${data.agency}\n${data.designation || ''}` : data.designation || '';
  }
  else infoText = data.designation ? `${data.zone} | ${data.designation}` : data.zone || '';

  if (type === 'student' || type === 'local-staff' || type === 'awardee' || type === 'yesian' || type === 'guardian' || type === 'qiraath' || type === 'media' || type === 'driver-staff') {
    doc.setFontSize(7);
    doc.setFont(fontsLoaded.montserratMedium ? 'MontserratMedium' : 'helvetica', 'normal');
    if (!fontsLoaded.montserratMedium) doc.setFont('helvetica', 'bold');
    doc.setTextColor(226, 232, 240);

    let displayInfo = "";
    if (type === 'student') {
      const { schoolName } = getLocationDetails(data.school, dynamicLocations);
      displayInfo = `${toTitleCase(schoolName)}`;
    } else if (type === 'local-staff') {
      const { schoolName } = getLocationDetails(data.school, dynamicLocations);
      displayInfo = `${toTitleCase(schoolName)}`;
    } else if (type === 'yesian') {
      displayInfo = `${data.designation || ''}`;
    } else if (type === 'guardian') {
      displayInfo = `C/O: ${toTitleCase(data.studentName || '')}`;
    } else if (type === 'media') {
      displayInfo = "";
    } else if (type === 'driver-staff') {
      displayInfo = `${data.zone || ''}`;
    } else {
      // Awardee
      const { schoolName } = getLocationDetails(data.school, dynamicLocations);
      displayInfo = `${toTitleCase(schoolName)}`;
    }

    if (displayInfo.includes('-')) {
      const parts = displayInfo.split('-');
      displayInfo = parts.map(p => p.trim()).join('\n');
    }
    const infoY = type === 'guardian' ? 56.354 : 48.354;
    const infoX = type === 'guardian' ? W / 2 : 11.753;
    const align = type === 'guardian' ? 'center' : 'left';
    doc.text(displayInfo, infoX, infoY, { align });
  } else {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(tc[0], tc[1], tc[2]);
    const infoY = splitY + 17;
    doc.text(infoText.toUpperCase(), 4, infoY, { maxWidth: W - 16 });
  }

  // ── 5. BARCODE + SHORT REF ID (centered) ─────────────────────
  const barcode = getBarcodeBase64(data.id);
  if (type === 'student' || type === 'local-staff' || type === 'awardee' || type === 'yesian' || type === 'guardian' || type === 'qiraath' || type === 'media' || type === 'driver-staff') {
    const bcW = 26;
    const bcH = 6;
    const bcX = W - bcW - 8.228; // right: 0.8228 cm
    const bcY = H - bcH - 10.66; // down: 1.066 cm
    if (barcode) doc.addImage(barcode, 'PNG', bcX, bcY, bcW, bcH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(0, 0, 0);
    doc.text(data.id.substring(0, 8).toUpperCase(), bcX + (bcW / 2), bcY + bcH + 2, { align: 'center' });
  } else {
    const bcW = 36;
    const bcH = 6;
    const bcX = (W - bcW) / 2;
    const bcY = H - 12;
    if (barcode) doc.addImage(barcode, 'PNG', bcX, bcY, bcW, bcH);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
      doc.setTextColor(80, 80, 80);
      doc.text(data.id.substring(0, 8).toUpperCase(), W / 2, bcY + bcH + 1.5, { align: 'center' });
    }
  }

  // ── GSuit Specific Data Overlays ──
  if (type === 'gsuit') {
    const fullName = (data.name || 'GUEST NAME').toUpperCase();
    const hotelName = (data.room || 'HOTEL KASHMIRI FLOWER').toUpperCase();
    const contactName = data.hostName || "Mr. Fazlurahman";
    const contactPhone = data.hostPhone || "+919000000000";
    const contactWhatsapp = data.hostWhatsapp || "919000000000";

    // Guest Name using Bebas Neue
    doc.setFont(fontsLoaded.bebas ? 'BebasNeue' : 'helvetica', "normal");
    doc.setFontSize(20.72);
    doc.setTextColor(255, 255, 255);
    doc.text(fullName, 42.0, 7.5);
    // Adjusted positioning as requested (Left: 42.0mm, Top: 7.5mm)

    doc.setTextColor(0, 74, 128); // Blue color for content
    doc.setFont(fontsLoaded.montserratMedium ? 'MontserratMedium' : 'helvetica', "normal");

    if (data.room) {
      // Venue
      doc.setTextColor(0, 74, 128);
      doc.setFont(fontsLoaded.bebas ? 'BebasNeue' : 'helvetica', "normal");
      doc.setFontSize(11.89);
      doc.text("SKICC _ SRINAGAR", 42, 26);

      doc.setFont(fontsLoaded.montserratMedium ? 'MontserratMedium' : 'helvetica', "normal");
      doc.setTextColor(225, 29, 72); // Rose-600
      doc.setFontSize(7.5);
      doc.text(`• ${contactName}`, 42, 39);

      // Link areas (PDF links)
      doc.link(45, 41, 6, 4, { url: `tel:${contactPhone}` });
      doc.link(52, 41, 6, 4, { url: `https://wa.me/${contactWhatsapp}` });

      // Accommodation
      doc.setTextColor(0, 74, 128);
      doc.setFontSize(9);
      doc.text(hotelName, 76, 26, { maxWidth: 35 });

      doc.setTextColor(225, 29, 72); // Rose-600
      doc.setFontSize(7.5);
      doc.text(`• ${contactName}`, 76, 39);

      // Link areas
      doc.link(80, 41, 6, 4, { url: `tel:${contactPhone}` });
      doc.link(87, 41, 6, 4, { url: `https://wa.me/${contactWhatsapp}` });
    } else {
      // Venue Only
      doc.setTextColor(0, 74, 128);
      doc.setFont(fontsLoaded.bebas ? 'BebasNeue' : 'helvetica', "normal");
      doc.setFontSize(11.89);
      doc.text("SKICC _ SRINAGAR", 42, 32);

      doc.setFont(fontsLoaded.montserratMedium ? 'MontserratMedium' : 'helvetica', "normal");
      doc.setTextColor(225, 29, 72);
      doc.setFontSize(7.5);
      doc.text(`• ${contactName}`, 82, 32);

      // Link areas
      doc.link(85, 34, 8, 5, { url: `tel:${contactPhone}` });
      doc.link(95, 34, 8, 5, { url: `https://wa.me/${contactWhatsapp}` });
    }

    // Bottom Barcode
    const bBcW = 20;
    const bBcH = 6;
    const bBcX = W - bBcW - 6;
    const bBcY = H - bBcH - 6;
    const bBarcode = getBarcodeBase64(data.id.substring(0, 8).toUpperCase());
    if (bBarcode) doc.addImage(bBarcode, 'PNG', bBcX, bBcY, bBcW, bBcH);

    // Left Vertical Barcode
    const vBcW = 30;
    const vBcH = 6;
    const vBcX = 8;
    const vBcY = 12;
    const vBarcode = getBarcodeBase64(data.id);
    if (vBarcode) {
      // Rotate 90 degrees for vertical placement
      doc.addImage(vBarcode, 'PNG', vBcX, vBcY, vBcW, vBcH, undefined, 'FAST', 90);
    }
  }
}



export async function generateBatchAccessPasses(
  data: any[],
  filename: string,
  type: 'student' | 'guest' | 'yesian' | 'local-staff' | 'alumni-achiever' | 'volunteer' | 'awardee' | 'qiraath' | 'driver-staff' | 'guardian' | 'media' | 'gsuit' = 'student',
  dynamicLocations?: Zone[]
) {
  if (data.length === 0) return alert("No records found.");
  const format = type === 'gsuit' ? [120, 55] : [85, 120];
  const doc = new jsPDF({ orientation: type === 'gsuit' ? "landscape" : "portrait", unit: "mm", format: format as any });
  const yesLogo = await getBase64ImageFromUrl("/yeslogo.png");
  const geniusLogo = await getBase64ImageFromUrl("/Genius.png");

  // Load and register fonts
  let fontsLoaded = { kalash: false, montserratSemiBold: false, montserratMedium: false, bebas: false };
  const kalashBase64 = await getFontBase64('/fonts/KalashRegular.ttf');
  if (kalashBase64) {
    try {
      doc.addFileToVFS('KalashRegular.ttf', kalashBase64);
      doc.addFont('KalashRegular.ttf', 'KalashRegular', 'normal');
      fontsLoaded.kalash = true;
    } catch (e) {
      console.warn('Kalash font registration failed, falling back to Helvetica', e);
    }
  }

  // Load Montserrat fonts
  const montSemiB64 = await getFontBase64('/fonts/Montserrat-SemiBold.ttf');
  if (montSemiB64) {
    try {
      doc.addFileToVFS('Montserrat-SemiBold.ttf', montSemiB64);
      doc.addFont('Montserrat-SemiBold.ttf', 'MontserratSemiBold', 'normal');
      fontsLoaded.montserratSemiBold = true;
    } catch (e) { }
  }

  const montMediumB64 = await getFontBase64('/fonts/Montserrat-Medium.ttf');
  if (montMediumB64) {
    try {
      doc.addFileToVFS('Montserrat-Medium.ttf', montMediumB64);
      doc.addFont('Montserrat-Medium.ttf', 'MontserratMedium', 'normal');
      fontsLoaded.montserratMedium = true;
    } catch (e) { }
  }

  const bebasB64 = await getFontBase64('/fonts/Bebas-Regular.ttf');
  if (bebasB64) {
    try {
      doc.addFileToVFS('Bebas-Regular.ttf', bebasB64);
      doc.addFont('Bebas-Regular.ttf', 'BebasNeue', 'normal');
      fontsLoaded.bebas = true;
    } catch (e) { }
  }

  for (let i = 0; i < data.length; i++) {
    if (i > 0) {
      const format = type === 'gsuit' ? [120, 55] : [85, 120];
      doc.addPage(format as any, type === 'gsuit' ? "landscape" : "portrait");
    }
    await drawBadgeContent(doc, data[i], type, fontsLoaded, dynamicLocations);
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

/**
 * Attendance Report PDF
 */
export async function generateAttendancePDF(data: any[], title: string, filename: string) {
  if (data.length === 0) return alert("No records found.");
  const doc = new jsPDF({ orientation: "landscape" });
  await addHeader(doc, title);

  const tableData = data.map((reg, index) => {
    let checkInTime = "N/A";
    if (reg.attendedAt) {
      const date = reg.attendedAt.toDate ? reg.attendedAt.toDate() : new Date(reg.attendedAt);
      checkInTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        day: "2-digit",
        month: "short"
      }).format(date);
    }

    return [
      index + 1,
      reg.label || reg.name || reg.studentName || reg.volunteerName || "Unknown",
      reg.category || "N/A",
      reg.id?.substring(0, 8) || "N/A",
      (reg as any).zone || "N/A",
      getSchoolName((reg as any).school) || (reg as any).schoolName || "N/A",
      (reg as any).className || "N/A",
      reg.gender || "N/A",
      checkInTime
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [["#", "Name", "Category", "ID Prefix", "Zone", "School", "Class", "Gender", "Check-in Time"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    didDrawPage: (data) => addFooter(doc, data)
  });
  triggerDownload(doc, filename);
}
