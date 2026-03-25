import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportFormat = "csv" | "pdf" | "excel" | "png" | "jpg" | "pptx";

export async function exportToCsv(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] ?? "";
        const str = String(val);
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(",")
    ),
  ];
  downloadBlob(new Blob([csvRows.join("\n")], { type: "text/csv" }), `${filename}.csv`);
}

export async function exportToPdf(
  data: Record<string, any>[],
  filename: string,
  title: string,
  metadata?: { date?: string; facility?: string; source?: string }
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  if (metadata) {
    doc.setFontSize(10);
    let y = 28;
    if (metadata.date) { doc.text(`Date: ${metadata.date}`, 14, y); y += 6; }
    if (metadata.facility) { doc.text(`Facility: ${metadata.facility}`, 14, y); y += 6; }
    if (metadata.source) { doc.text(`Source: ${metadata.source}`, 14, y); y += 6; }
    doc.text(`Generated: ${new Date().toISOString()}`, 14, y);
  }

  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    autoTable(doc, {
      startY: metadata ? 50 : 30,
      head: [headers],
      body: data.map(row => headers.map(h => String(row[h] ?? ""))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 150, 136] },
    });
  }

  doc.save(`${filename}.pdf`);
}

export async function exportToExcel(data: Record<string, any>[], filename: string, sheetName = "Sheet1") {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportToPptx(
  data: Record<string, any>[],
  filename: string,
  title: string,
) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  const titleSlide = pptx.addSlide();
  titleSlide.addText(title, { x: 1, y: 1, w: 8, h: 2, fontSize: 28, color: "009688", bold: true });
  titleSlide.addText(`Generated: ${new Date().toLocaleString()}`, { x: 1, y: 3, w: 8, h: 1, fontSize: 14, color: "666666" });

  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    const tableSlide = pptx.addSlide();
    const rows: any[][] = [
      headers.map(h => ({ text: h, options: { bold: true, fill: { color: "009688" }, color: "FFFFFF", fontSize: 9 } })),
      ...data.slice(0, 15).map(row =>
        headers.map(h => ({ text: String(row[h] ?? ""), options: { fontSize: 8 } }))
      ),
    ];
    tableSlide.addTable(rows, { x: 0.3, y: 0.5, w: 9.4, colW: headers.map(() => 9.4 / headers.length) });
  }

  await pptx.writeFile({ fileName: `${filename}.pptx` });
}

export async function exportToImage(elementId: string, filename: string, format: "png" | "jpg" = "png") {
  const html2canvas = (await import("html2canvas")).default;
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
  });

  const link = document.createElement("a");
  link.download = `${filename}.${format}`;
  link.href = canvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png", 0.95);
  link.click();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
