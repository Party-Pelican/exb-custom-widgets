export interface ExportRecord { permitId: string; status: string; description: string }
export function toCsv(records: ExportRecord[]): string {
  const cell = (value: string) => {
    let text = String(value ?? '')
    if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text
    return '"' + text.replace(/"/g, '""') + '"'
  }
  return '\uFEFF' + [['Permit ID', 'Status', 'Description'], ...records.map(r => [r.permitId, r.status, r.description])]
    .map(row => row.map(cell).join(',')).join('\r\n')
}
