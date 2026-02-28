import Papa from "papaparse";

export interface ParseResult<T> {
  data: T[];
  errors: { row: number; message: string }[];
  totalRows: number;
}

export function parseCSV<T>(
  csvContent: string,
  options?: { delimiter?: string; header?: boolean }
): ParseResult<T> {
  const result = Papa.parse<T>(csvContent, {
    header: options?.header !== false,
    delimiter: options?.delimiter,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  const errors = result.errors.map((e) => ({
    row: e.row ?? 0,
    message: e.message,
  }));

  return {
    data: result.data,
    errors,
    totalRows: result.data.length,
  };
}
