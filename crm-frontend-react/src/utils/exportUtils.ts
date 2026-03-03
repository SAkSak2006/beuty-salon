import { jsPDF } from 'jspdf';

export function exportCSV(data: Record<string, unknown>[], filename: string, headers?: Record<string, string>) {
  if (data.length === 0) return;

  const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
  const headerRow = headers ? Object.values(headers) : keys;

  const csvContent = [
    headerRow.join(';'),
    ...data.map((row) =>
      keys.map((key) => {
        const val = row[key];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(';') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(';')
    ),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(title: string, content: string[][], headers: string[]) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  let y = 35;
  const colWidth = (doc.internal.pageSize.width - 28) / headers.length;

  // Headers
  headers.forEach((h, i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(h, 14 + i * colWidth, y);
  });
  y += 8;

  // Data
  doc.setFont('helvetica', 'normal');
  content.forEach((row) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    row.forEach((cell, i) => {
      doc.text(String(cell).slice(0, 30), 14 + i * colWidth, y);
    });
    y += 7;
  });

  doc.save(`${title}.pdf`);
}
