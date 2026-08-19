import ExcelJS from "exceljs";
import type { CsvColumn } from "./csv";

export async function toXlsxBuffer<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[],
  sheetName = "Sheet1"
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: String(column.key),
    width: Math.max(column.header.length + 4, 14),
  }));
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(Object.fromEntries(columns.map((column) => [column.key, row[column.key] ?? ""])));
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
