import ExcelJS from "exceljs";

export type ExportFormat = "csv" | "xlsx";

/**
 * Convert rows to CSV.
 * - Uses RFC4180-ish escaping for commas/quotes/newlines.
 */
export function toCSV(rows: Record<string, any>[], columns: string[]) {
  const escape = (value: any) => {
    if (value === null || value === undefined) return "";
    const s = String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = columns.join(",");
  const body = rows
    .map((r) => columns.map((c) => escape(r[c])).join(","))
    .join("\n");

  return `${header}\n${body}\n`;
}

/**
 * Convert rows to XLSX buffer (SAFE).
 */
export async function toXLSX(
  rows: Record<string, any>[],
  sheetName: string,
  columns: string[]
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.addRow(columns);
  for (const row of rows) {
    worksheet.addRow(columns.map((c) => row[c] ?? ""));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
