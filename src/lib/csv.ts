/**
 * Minimal CSV parser. Handles quoted values + escaped quotes ("").
 * For more complex cases (newlines inside quotes etc) we'd reach for papaparse,
 * but our admin CSV import is太太-controlled and stays simple.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const c = text[i]

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      cell += c
      i++
      continue
    }

    if (c === '"') {
      inQuotes = true
      i++
      continue
    }

    if (c === ',') {
      row.push(cell)
      cell = ''
      i++
      continue
    }

    if (c === '\r') {
      i++
      continue
    }

    if (c === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      i++
      continue
    }

    cell += c
    i++
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((r) => r.length > 0 && r.some((c) => c.length > 0))
}
