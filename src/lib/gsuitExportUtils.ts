import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import { Zone, locations } from "@/data/locations";

/** Robust filename sanitization */
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9\-_]/gi, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};

/** Manual download trigger */
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

/** Barcode generator */
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

/** Image fetcher */
const getBase64ImageFromUrl = async (imageUrl: string) => {
  try {
    if (imageUrl.startsWith('http')) {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.base64;
    }
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

/** Fetches a local font file and returns its raw base64 string */
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
    return null;
  }
};

/**
 * Generate GSuit Guest Access Pass
 */
export async function generateGSuitPassPDF(data: any) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [120, 55]
  });

  // Load Fonts
  let fontsLoaded = { montserratMedium: false, montserratSemiBold: false, bebas: false };

  const montMediumB64 = await getFontBase64('/fonts/Montserrat-Medium.ttf');
  if (montMediumB64) {
    try {
      doc.addFileToVFS('Montserrat-Medium.ttf', montMediumB64);
      doc.addFont('Montserrat-Medium.ttf', 'MontserratMedium', 'normal');
      fontsLoaded.montserratMedium = true;
    } catch (e) { }
  }

  const montSemiB64 = await getFontBase64('/fonts/Montserrat-SemiBold.ttf');
  if (montSemiB64) {
    try {
      doc.addFileToVFS('Montserrat-SemiBold.ttf', montSemiB64);
      doc.addFont('Montserrat-SemiBold.ttf', 'MontserratSemiBold', 'normal');
      fontsLoaded.montserratSemiBold = true;
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

  // Draw Content
  await drawGSuitBadge(doc, data, fontsLoaded);

  triggerDownload(doc, `GSuit_Pass_${data.name || 'Guest'}`);
}

/**
 * Batch Generate GSuit Passes
 */
export async function generateBatchGSuitPasses(data: any[]) {
  if (data.length === 0) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [120, 55]
  });

  // Load Fonts once
  let fontsLoaded = { montserratMedium: false, montserratSemiBold: false, bebas: false };
  const montMediumB64 = await getFontBase64('/fonts/Montserrat-Medium.ttf');
  if (montMediumB64) {
    try {
      doc.addFileToVFS('Montserrat-Medium.ttf', montMediumB64);
      doc.addFont('Montserrat-Medium.ttf', 'MontserratMedium', 'normal');
      fontsLoaded.montserratMedium = true;
    } catch (e) { }
  }

  const montSemiB64 = await getFontBase64('/fonts/Montserrat-SemiBold.ttf');
  if (montSemiB64) {
    try {
      doc.addFileToVFS('Montserrat-SemiBold.ttf', montSemiB64);
      doc.addFont('Montserrat-SemiBold.ttf', 'MontserratSemiBold', 'normal');
      fontsLoaded.montserratSemiBold = true;
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
    if (i > 0) doc.addPage([120, 55], "landscape");
    await drawGSuitBadge(doc, data[i], fontsLoaded);
  }

  triggerDownload(doc, `GSuit_Batch_Passes`);
}

/**
 * Internal function to draw the GSuit badge content
 */
async function drawGSuitBadge(doc: jsPDF, data: any, fontsLoaded: any) {
  const W = 120;
  const H = 55;

  // 1. Background
  const bgPath = data.room ? '/gsuit/room.jpeg' : '/gsuit/no_room.jpeg';
  const bg = await getBase64ImageFromUrl(bgPath);
  if (bg) {
    doc.addImage(bg, 'JPEG', 0, 0, W, H);
  }

  // 2. Data Preparation
  const fullName = (data.name || 'GUEST NAME').toUpperCase();
  const hotelName = (data.room || 'Hotel Metropolis ').toUpperCase();
  const contactName = data.hostName || "Mr. Host";
  const contactPhone = data.hostPhone || "+919000000000";
  const contactWhatsapp = data.hostWhatsapp || "919000000000";

  // 3. Guest Name (Strictly Bebas Neue 400 preferred)
  doc.setTextColor(255, 255, 255);
  if (fontsLoaded.bebas) {
    doc.setFont('BebasNeue', 'normal');
  } else if (fontsLoaded.montserratSemiBold) {
    doc.setFont('MontserratSemiBold', 'normal');
  } else {
    doc.setFont("helvetica", "bold");
  }

  doc.setFontSize(12);
  doc.text(fullName, 60, 10.6);

  // 4. Content Logic
  doc.setTextColor(0, 74, 128);
  if (data.room) {
    // Venue Only part
    doc.setFont(fontsLoaded.bebas ? 'BebasNeue' : 'helvetica', "normal");
    doc.setFontSize(11.89);
    doc.text("SKICC _ SRINAGAR", 40, 16.5);

    // Host & Room Info (Right Box)
    doc.setTextColor(0, 74, 128);
    doc.setFontSize(9);
    doc.text(hotelName, 76, 28, { maxWidth: 35 });

    doc.setFontSize(6);
    doc.text("Get in Touch", 76, 34);

    doc.setTextColor(225, 29, 72);
    doc.setFontSize(7.5);
    doc.text(`• ${contactName}`, 76, 28);

    // Contact Links with icons (room layout)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(0, 74, 128);
    doc.textWithLink('\u260E Call', 76, 38, { url: `tel:${contactPhone}` });
    doc.setTextColor(37, 211, 102);
    doc.textWithLink('\u{1F4AC} WhatsApp', 76, 42, { url: `https://wa.me/${contactWhatsapp}` });
  } else {
    // Venue Only layout
    doc.setFont(fontsLoaded.bebas ? 'BebasNeue' : 'helvetica', "normal");
    doc.setFontSize(11.89);
    doc.text("SKICC _ SRINAGAR", 45, 29);

    doc.setFont(fontsLoaded.montserratMedium ? 'MontserratMedium' : 'helvetica', "normal");
    doc.setTextColor(0, 74, 128); // Blue
    doc.setFontSize(6);
    doc.text("Get in Touch", 76, 27);

    doc.setTextColor(225, 29, 72);
    doc.setFontSize(6.5);
    doc.text(`• ${contactName}`, 76, 30);

    // Contact Links with icons (no-room layout)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(0, 74, 128);
    doc.textWithLink('\u260E Phone', 76, 35, { url: `tel:${contactPhone}` });
    doc.setTextColor(37, 211, 102);
    doc.textWithLink('\u{1F4AC} WhatsApp', 76, 39, { url: `https://wa.me/${contactWhatsapp}` });
  }

  // 5. Barcodes

  // Bottom-Right Horizontal Barcode (small, with ID text underneath)
  const bBcW = 22; // width
  const bBcH = 5;  // height

  const bBarcode = getBarcodeBase64(
    data.id.substring(0, 8).toUpperCase()
  );

  if (bBarcode) {
    doc.addImage(
      bBarcode,
      'PNG',
      85, // X position
      44, // Y position
      bBcW,
      bBcH
    );
    // ID text underneath the barcode
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4);
    doc.setTextColor(80, 80, 80);
    doc.text(
      data.id.substring(0, 8).toUpperCase(),
      85 + bBcW / 2, // centered under barcode
      44 + bBcH + 1.5,
      { align: 'center' }
    );
  }

  // Left Vertical Barcode (rotated 90°, tall — spans ~35mm of height)
  const vBcW = 28; // becomes visible HEIGHT after 90° rotation
  const vBcH = 5;  // becomes visible WIDTH after 90° rotation

  const vBarcode = getBarcodeBase64(data.id);

  if (vBarcode) {
    doc.addImage(
      vBarcode,
      'PNG',
      12,
      40,  // Y position (more space from top)
      vBcW,
      vBcH,
      undefined,
      'FAST',
      90   // Rotate 90° → barcode runs vertically top to bottom
    );
  }
}
