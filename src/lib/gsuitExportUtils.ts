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

/** Renders a Lucide-style SVG string to a base64 PNG via an off-screen canvas */
const getSvgIconBase64 = (svgString: string, size = 64): Promise<string | null> =>
  new Promise((resolve) => {
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    } catch (e) { resolve(null); }
  });

/** Lucide Phone icon SVG (stroke #004A80 blue) */
const PHONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#004A80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.71 12a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 3.69 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

/** Real WhatsApp brand icon SVG (now color matched to #004A80 blue) */
const WHATSAPP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#004A80"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>`;

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
  // Pre-load Lucide icons as PNG
  const [phoneIcon, waIcon] = await Promise.all([
    getSvgIconBase64(PHONE_SVG, 64),
    getSvgIconBase64(WHATSAPP_SVG, 64),
  ]);
  const iconSize = 1.5; // mm — icon rendered at 1.5×1.5 mm in the PDF
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
    const vName = (data.venue || "SKICC _ SRINAGAR").toUpperCase();
    doc.text(vName, 40, 16.5, { maxWidth: 35 });

    // Location Link under Venue
    doc.setFont(fontsLoaded.montserratMedium ? 'MontserratMedium' : 'helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(0, 74, 128); // Blue to match "Get in Touch"
    doc.textWithLink('Tap Here For Location', 42, 20, { url: data.locationLink || "https://maps.google.com" });

    // Host & Room Info (Right Box)
    doc.setTextColor(0, 74, 128);
    doc.setFontSize(9);
    doc.text(hotelName, 76, 28, { maxWidth: 35 });

    doc.setFontSize(6);
    doc.text("Get in Touch", 76, 34);

    doc.setTextColor(225, 29, 72);
    doc.setFontSize(7.5);
    doc.text(`• ${contactName}`, 76, 28);

    // Contact Links — horizontal row (room layout)
    doc.setFont(fontsLoaded.montserratMedium ? 'MontserratMedium' : 'helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(0, 74, 128);
    const rowY = 20;       // icon top Y
    const textY = rowY + iconSize - 0.15; // text baseline aligned to icon
    // Phone
    if (phoneIcon) doc.addImage(phoneIcon, 'PNG', 78, rowY, iconSize, iconSize);
    doc.textWithLink(' Phone', 78 + iconSize, textY, { url: `tel:${contactPhone}` });
    // WhatsApp (offset ~19mm after phone start)
    if (waIcon) doc.addImage(waIcon, 'PNG', 95, rowY, iconSize, iconSize);
    doc.textWithLink(' WhatsApp', 95 + iconSize, textY, { url: `https://wa.me/${contactWhatsapp}` });

    // Removed Location Link from here
  } else {
    // Venue Only layout
    doc.setFont(fontsLoaded.bebas ? 'BebasNeue' : 'helvetica', "normal");
    doc.setFontSize(11.89);
    const vName2 = (data.venue || "SKICC").toUpperCase();
    doc.text(vName2, 45, 29, { maxWidth: 30 });

    // Location Link under Venue
    doc.setFont(fontsLoaded.montserratMedium ? 'MontserratMedium' : 'helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(0, 74, 128); // Blue to match "Get in Touch"
    doc.textWithLink('Tap Here For Location', 47, 32.5, { url: data.locationLink || "https://maps.google.com" });

    doc.setFont(fontsLoaded.montserratMedium ? 'MontserratMedium' : 'helvetica', "normal");
    doc.setTextColor(0, 74, 128); // Blue
    doc.setFontSize(6);
    doc.text("Get in Touch", 76, 27);

    doc.setTextColor(225, 29, 72);
    doc.setFontSize(6.5);
    doc.text(`• ${contactName}`, 76, 30);

    // Contact Links — horizontal row (no-room layout)
    doc.setFont(fontsLoaded.montserratMedium ? 'MontserratMedium' : 'helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(0, 74, 128);
    const rowY2 = 31;      // icon top Y
    const textY2 = rowY2 + iconSize - 0.15; // text baseline
    // Phone
    if (phoneIcon) doc.addImage(phoneIcon, 'PNG', 78, rowY2, iconSize, iconSize);
    doc.textWithLink(' Phone', 78 + iconSize, textY2, { url: `tel:${contactPhone}` });
    // WhatsApp (offset ~19mm after phone start)
    if (waIcon) doc.addImage(waIcon, 'PNG', 95, rowY2, iconSize, iconSize);
    doc.textWithLink(' WhatsApp', 95 + iconSize, textY2, { url: `https://wa.me/${contactWhatsapp}` });

    // Removed Location Link from here
  }

  // 5. Barcodes

  // Bottom-Right Horizontal Barcode (small, with ID text underneath)
  const bBcW = 18; // width
  const bBcH = 4;  // height

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
