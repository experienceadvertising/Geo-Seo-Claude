export function csvCell(value: string): string {
  // Quoting alone does not prevent spreadsheet software executing formulas.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? "'" + value : value;
  return `"${safe.replace(/"/g, '\"\"')}"`;
}
