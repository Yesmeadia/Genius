import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { locations } from "@/data/locations";

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
