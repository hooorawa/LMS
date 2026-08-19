export type CsvColumn<T> = {
  key: keyof T;
  header: string;
};

function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[]
): string {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(",")
  );
  return [header, ...lines].join("\r\n");
}
