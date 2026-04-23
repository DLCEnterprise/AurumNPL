// ─── CSV Bulk Import helpers ────────────────────────────────────────────────

export const CSV_HEADERS = [
  'Property Street',
  'Property City',
  'Property State',
  'Property Zip',
  'Property Type',
  'Occupancy',
  'Fair Market Value',
  'Lien Position',
  'Note Type',
  'Performance Status',
  'Loan Status',
  'First Mtg Balance',
  'First Mtg Original Amount',
  'First Mtg Interest Rate',
  'First Mtg Monthly PI',
  'First Mtg Origination Date',
  'First Mtg Maturity Date',
  'First Mtg Next Due Date',
  'Asking Price',
  'Bid Deadline',
  'Listing Notes',
] as const

export type CsvRow = Record<typeof CSV_HEADERS[number], string>

export interface ParsedCsvListing {
  title: string
  assetType: 'RESIDENTIAL' | 'COMMERCIAL'
  lienPosition: 'SENIOR' | 'JUNIOR'
  unpaidBalance: number
  askingPrice: number | null
  bidDeadline: Date | null
  performanceStatus: string | null
  noteType: string | null
  description: string | null
  location: string
  zip: string | null
  region: string | null
  asset: {
    propertyStreet: string | null
    propertyCity: string | null
    propertyState: string | null
    propertyZip: string | null
    propertyType: string | null
    occupancyType: string | null
    fairMarketValue: number | null
    firstMtg_loanStatus: string | null
    firstMtg_currentBalance: number | null
    firstMtg_originalAmount: number | null
    firstMtg_interestRate: number | null
    firstMtg_monthlyPI: number | null
    firstMtg_originationDate: Date | null
    firstMtg_maturityDate: Date | null
    firstMtg_nextDueDate: Date | null
  }
}

function parseNum(s: string): number | null {
  if (!s?.trim()) return null
  const n = parseFloat(s.replace(/[$,%\s,]/g, ''))
  return isNaN(n) ? null : n
}

function parseDate(s: string): Date | null {
  if (!s?.trim()) return null
  const d = new Date(s.trim())
  return isNaN(d.getTime()) ? null : d
}

function parseLienPosition(s: string): 'SENIOR' | 'JUNIOR' {
  const lower = s?.toLowerCase() ?? ''
  if (lower.includes('2nd') || lower.includes('second') || lower.includes('junior')) return 'JUNIOR'
  return 'SENIOR'
}

function parseAssetType(s: string): 'RESIDENTIAL' | 'COMMERCIAL' {
  const lower = s?.toLowerCase() ?? ''
  if (lower.includes('commercial')) return 'COMMERCIAL'
  return 'RESIDENTIAL'
}

export function parseCsvRow(row: CsvRow, rowIndex: number): ParsedCsvListing & { rowIndex: number; warnings: string[] } {
  const warnings: string[] = []

  const street    = row['Property Street']?.trim() || null
  const city      = row['Property City']?.trim() || null
  const state     = row['Property State']?.trim() || null
  const zip       = row['Property Zip']?.trim() || null
  const propType  = row['Property Type']?.trim() || null
  const occupancy = row['Occupancy']?.trim() || null
  const fmv       = parseNum(row['Fair Market Value'])
  const lien      = parseLienPosition(row['Lien Position'] ?? '')
  const assetType = parseAssetType(row['Property Type'] ?? '')
  const noteType  = row['Note Type']?.trim() || null
  const perfStatus = row['Performance Status']?.trim() || null
  const loanStatus = row['Loan Status']?.trim() || null
  const firstBal  = parseNum(row['First Mtg Balance'])
  const firstOrig = parseNum(row['First Mtg Original Amount'])
  const firstRate = parseNum(row['First Mtg Interest Rate'])
  const firstPI   = parseNum(row['First Mtg Monthly PI'])
  const firstOrigDate = parseDate(row['First Mtg Origination Date'])
  const firstMatDate  = parseDate(row['First Mtg Maturity Date'])
  const firstNextDue  = parseDate(row['First Mtg Next Due Date'])
  const askPrice  = parseNum(row['Asking Price'])
  const bidDeadline = parseDate(row['Bid Deadline'])
  const notes     = row['Listing Notes']?.trim() || null

  const unpaidBalance = firstBal ?? 0
  if (unpaidBalance === 0) warnings.push(`Row ${rowIndex}: First Mtg Balance is missing or zero.`)

  const cityState = [city, state].filter(Boolean).join(', ')
  const addressParts = [street, cityState, zip].filter(Boolean)
  const title = addressParts.length > 0 ? addressParts.join(', ') : `Import Row ${rowIndex}`

  return {
    rowIndex,
    warnings,
    title,
    assetType,
    lienPosition: lien,
    unpaidBalance,
    askingPrice: askPrice,
    bidDeadline,
    performanceStatus: perfStatus,
    noteType,
    description: notes,
    location: cityState || 'Unknown',
    zip,
    region: state,
    asset: {
      propertyStreet: street,
      propertyCity: city,
      propertyState: state,
      propertyZip: zip,
      propertyType: propType,
      occupancyType: occupancy,
      fairMarketValue: fmv,
      firstMtg_loanStatus: loanStatus,
      firstMtg_currentBalance: firstBal,
      firstMtg_originalAmount: firstOrig,
      firstMtg_interestRate: firstRate != null ? firstRate / 100 : null,
      firstMtg_monthlyPI: firstPI,
      firstMtg_originationDate: firstOrigDate,
      firstMtg_maturityDate: firstMatDate,
      firstMtg_nextDueDate: firstNextDue,
    },
  }
}

// Simple CSV parser — handles quoted fields and embedded commas
export function parseCSV(text: string): CsvRow[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return []

  const parseRow = (line: string): string[] => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else { inQuotes = !inQuotes }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current)
    return fields
  }

  const headers = parseRow(lines[0])
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseRow(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h.trim()] = values[idx]?.trim() ?? '' })
    rows.push(row as CsvRow)
  }

  return rows
}
