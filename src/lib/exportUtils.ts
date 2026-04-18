import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import { locations } from "@/data/locations";

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

interface Registration {
  id: string;
  studentName: string;
  parentage: string;
  className: string;
  gender: string;
  zone: string;
  school: string;
  withParent: boolean;
  parentName?: string;
  parentGender?: string;
  relation?: string;
  createdAt: any;
  photoUrl?: string;
}

const getSchoolName = (schoolId: string) => {
  for (const zone of locations) {
    const school = zone.schools.find((s) => s.id === schoolId);
    if (school) return school.name;
  }
  return schoolId;
};

const getBase64ImageFromUrl = async (imageUrl: string) => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
};

export async function generateRegistrationPDF(
  data: Registration[],
  title: string,
  filename: string
) {
  if (data.length === 0) {
    return alert("No records found for this selection.");
  }

  const doc = new jsPDF({ orientation: "landscape" });

  // Load Logos
  const yesLogoMsg = await getBase64ImageFromUrl("/yeslogo.png");
  const geniusLogoMsg = await getBase64ImageFromUrl("/Genius.png");

  const pageWidth = doc.internal.pageSize.width; // 297mm for landscape A4
  const centerX = pageWidth / 2;

  if (yesLogoMsg) {
    // Proportional scaling for YES logo (Fixed height: 15mm)
    const props = doc.getImageProperties(yesLogoMsg);
    const ratio = props.width / props.height;
    const h = 15;
    const w = h * ratio;
    doc.addImage(yesLogoMsg, "PNG", 10, 10, w, h);
  }
  if (geniusLogoMsg) {
    // Adjusted Genius Logo size and position (Preserving aspect ratio, fixed height: 20mm)
    const props = doc.getImageProperties(geniusLogoMsg);
    const ratio = props.width / props.height;
    const h = 20;
    const w = h * ratio;
    doc.addImage(geniusLogoMsg, "PNG", centerX - (w / 2), 10, w, h);
  }

  // Header Layout Redesign - New Organization Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("YES GENIUS REGISTRATION", centerX, 35, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(title, centerX, 42, { align: "center" });

  const tableData = data.map((reg, index) => {
    const schoolName = getSchoolName(reg.school);

    return [
      index + 1,
      reg.studentName,
      reg.gender,
      reg.parentage,
      reg.className,
      schoolName,
      reg.zone,
      reg.withParent ? "Yes" : "No",
      reg.parentName || "-",
      reg.relation || "-",
      reg.parentGender || "-"
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [
      [
        "#",
        "Student Name",
        "Gender",
        "Parentage",
        "Class",
        "School Name",
        "Zone",
        "Accompanied",
        "Guardian Name",
        "Relation",
        "G.Gender"
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8
    },
    bodyStyles: {
      textColor: [50, 50, 50],
      fontSize: 7
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: {
      font: "helvetica",
      cellPadding: 2,
      overflow: "linebreak",
      halign: "left"
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      4: { halign: 'center', cellWidth: 15 },
      7: { halign: 'center', cellWidth: 15 },
    },
    didDrawPage: function (data) {
      // Footer injection at bottom
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);

      const footerStr = `Generated on: ${new Date().toLocaleString()}`;
      doc.text(
        footerStr,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );

      const pageCount = (doc as any).internal.getNumberOfPages();
      const pageStr = `Page ${data.pageNumber} of ${pageCount}`;
      const strWidth =
        (doc.getStringUnitWidth(pageStr) * doc.getFontSize()) /
        doc.internal.scaleFactor;
      doc.text(
        pageStr,
        doc.internal.pageSize.width - data.settings.margin.left - strWidth,
        doc.internal.pageSize.height - 10
      );
    },
  });

  doc.save(`${filename}.pdf`);
}

async function drawBadgeContent(doc: jsPDF, reg: Registration, yesLogo: string | null, geniusLogo: string | null, studentPhoto: string | null = null) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const centerX = pageWidth / 2;

  // 1. Backgrounds & Borders
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  // Top Indigo Bar
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 6, "F");

  // Secondary Cyan Bar
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 6, pageWidth, 1.5, "F");

  // Outer Border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.rect(0.25, 0.25, pageWidth - 0.5, pageHeight - 0.5);

  // 2. Branding
  if (geniusLogo) {
    const props = doc.getImageProperties(geniusLogo);
    const ratio = props.width / props.height;
    const h = 12;
    const w = h * ratio;
    doc.addImage(geniusLogo, "PNG", centerX - (w / 2), 14, w, h);
  }

  // 3. Organization Titles
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("GENIUS JAM 3", centerX, 33, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("OFFICIAL ACCESS PASS", centerX, 37, { align: "center" });

  // Decorative Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 41, pageWidth - 20, 41);

  // 4. Participant Photo
  if (studentPhoto) {
    try {
      // 12x16mm gives a standard 3:4 portrait ratio for passport photos
      doc.addImage(studentPhoto, centerX - 6, 43, 12, 16);
    } catch (e) {
      console.error("Error adding photo to PDF:", e);
    }
  }

  // 5. Participant Name
  const name = reg.studentName.toUpperCase();
  let nameSize = 13;
  if (name.length > 22) nameSize = 9;
  else if (name.length > 15) nameSize = 11;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameSize);
  doc.setTextColor(15, 23, 42);
  doc.text(name, centerX, 61, { align: "center" });

  // 6. Class & Gender Pill
  const classText = `CLASS ${reg.className}   •   ${reg.gender}`;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.rect(centerX - 28, 63, 56, 5, "F");
  
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(classText, centerX, 66.5, { align: "center" });

  // 7. Assignment Meta Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.rect(6, 70, pageWidth - 12, 17, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.setTextColor(100, 116, 139);
  doc.text("ZONE ASSIGNMENT", 10, 74);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text(reg.zone.substring(0, 32), 10, 77.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.setTextColor(100, 116, 139);
  doc.text("INSTITUTION", 10, 81.5);
  
  const schoolName = getSchoolName(reg.school);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(15, 23, 42);
  doc.text(schoolName.substring(0, 35), 10, 85); // Fits approx one line

  // 7. Footer
  const barcodeBase64 = getBarcodeBase64(reg.id);
  if (barcodeBase64) {
     const props = doc.getImageProperties(barcodeBase64);
     const ratio = props.width / props.height;
     const h = 5.5;
     let w = h * ratio;
     if (w > 38) w = 38; // Restrict max width so it doesn't overlap the logo
     doc.addImage(barcodeBase64, "PNG", 6, pageHeight - 9, w, h);
  }

  if (yesLogo) {
     const props = doc.getImageProperties(yesLogo);
     const ratio = props.width / props.height;
     const h = 4;
     const w = h * ratio;
     doc.addImage(yesLogo, "PNG", pageWidth - w - 6, pageHeight - 7.5, w, h);
  }
}

export async function generateAccessPass(registration: Registration) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [100, 70] // Event badge size (W:70, H:100 due to portrait mode in jsPDF usually interpreting as [x, y] or reversing based on orientation. Usually 70x100)
  });

  const yesLogo = await getBase64ImageFromUrl("/yeslogo.png");
  const geniusLogo = await getBase64ImageFromUrl("/Genius.png");
  let studentPhoto = null;
  if (registration.photoUrl) {
    studentPhoto = await getBase64ImageFromUrl(registration.photoUrl);
  }

  await drawBadgeContent(doc, registration, yesLogo, geniusLogo, studentPhoto);

  doc.save(`AccessPass_${registration.studentName.replace(/\s+/g, '_')}.pdf`);
}

export async function generateBatchAccessPasses(data: Registration[], filename: string) {
    if (data.length === 0) return alert("No records found.");
    
    // Create first page
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [100, 70]
    });

    const yesLogo = await getBase64ImageFromUrl("/yeslogo.png");
    const geniusLogo = await getBase64ImageFromUrl("/Genius.png");

    for (let i = 0; i < data.length; i++) {
        const reg = data[i];
        if (i > 0) doc.addPage([100, 70], "portrait");

        let studentPhoto = null;
        if (reg.photoUrl) {
            studentPhoto = await getBase64ImageFromUrl(reg.photoUrl);
        }
        
        await drawBadgeContent(doc, reg, yesLogo, geniusLogo, studentPhoto);
    }

    doc.save(`${filename}.pdf`);
}
