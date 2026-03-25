/**
 * Aurum Trader Investor Sheet Parser
 *
 * Labels are in column D (index 3), values in column E (index 4).
 */

import * as XLSX from 'xlsx'
import type { ParseResult } from './excel-parser'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedInvestor {
  entityName?: string
  name?: string
  lastName?: string
  signerTitle?: string
  addressStreet?: string
  addressCity?: string
  addressState?: string
  addressZip?: string
  directPhone?: string
  officePhone?: string
  email?: string
  yearsExperience?: number
  investorType?: string
  lienPosition?: string
  loanStatusPref?: string
  mainObjective?: string
  servicerName?: string
  servicerAddress?: string
  servicerContactName?: string
  servicerContactPhone?: string
  servicerContactEmail?: string
}

// ── Label map ─────────────────────────────────────────────────────────────────

function normaliseLabel(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

type InvFieldType = 'string' | 'int'

interface InvFieldMapping {
  field: keyof ParsedInvestor
  type: InvFieldType
}

const INVESTOR_LABEL_MAP: Record<string, InvFieldMapping> = {
  'entity name': { field: 'entityName', type: 'string' },
  'first name': { field: 'name', type: 'string' },
  'last name': { field: 'lastName', type: 'string' },
  'signers title': { field: 'signerTitle', type: 'string' },
  'signer title': { field: 'signerTitle', type: 'string' },
  'street address': { field: 'addressStreet', type: 'string' },
  'address': { field: 'addressStreet', type: 'string' },
  'city': { field: 'addressCity', type: 'string' },
  'state': { field: 'addressState', type: 'string' },
  'zip': { field: 'addressZip', type: 'string' },
  'zip code': { field: 'addressZip', type: 'string' },
  'direct phone number': { field: 'directPhone', type: 'string' },
  'direct phone': { field: 'directPhone', type: 'string' },
  'office phone number': { field: 'officePhone', type: 'string' },
  'office phone': { field: 'officePhone', type: 'string' },
  'email address': { field: 'email', type: 'string' },
  'email': { field: 'email', type: 'string' },
  'years of experience': { field: 'yearsExperience', type: 'int' },
  'years experience': { field: 'yearsExperience', type: 'int' },
  'investor type': { field: 'investorType', type: 'string' },
  'lien position': { field: 'lienPosition', type: 'string' },
  'loan status preference': { field: 'loanStatusPref', type: 'string' },
  'loan status': { field: 'loanStatusPref', type: 'string' },
  'main objective': { field: 'mainObjective', type: 'string' },
  'objective': { field: 'mainObjective', type: 'string' },
  'loan servicer name': { field: 'servicerName', type: 'string' },
  'servicer name': { field: 'servicerName', type: 'string' },
  'loan servicer address': { field: 'servicerAddress', type: 'string' },
  'servicer address': { field: 'servicerAddress', type: 'string' },
  'loan servicer boarding dept contact name': { field: 'servicerContactName', type: 'string' },
  'servicer contact name': { field: 'servicerContactName', type: 'string' },
  'loan servicer contact phone': { field: 'servicerContactPhone', type: 'string' },
  'servicer contact phone': { field: 'servicerContactPhone', type: 'string' },
  'loan servicer contact email': { field: 'servicerContactEmail', type: 'string' },
  'servicer contact email': { field: 'servicerContactEmail', type: 'string' },
}

// ── Parser ────────────────────────────────────────────────────────────────────

function getCellValue(sheet: XLSX.WorkSheet, col: number, row: number): unknown {
  const addr = XLSX.utils.encode_cell({ c: col, r: row })
  const cell = sheet[addr]
  if (!cell) return undefined
  return cell.v !== undefined ? cell.v : cell.w
}

export function parseInvestorSheet(wb: XLSX.WorkBook): ParseResult<ParsedInvestor> {
  const sheetName = wb.SheetNames.find(
    (n) => n.toLowerCase().includes('investor') || n.toLowerCase().includes('buyer')
  ) ?? wb.SheetNames[1]

  if (!sheetName) {
    return { data: {}, warnings: ['No investor sheet found'], criticalMissing: [] }
  }

  const sheet = wb.Sheets[sheetName]
  if (!sheet) {
    return { data: {}, warnings: [`Sheet "${sheetName}" not found`], criticalMissing: [] }
  }

  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1')
  const data: ParsedInvestor = {}
  const warnings: string[] = []

  for (let r = range.s.r; r <= range.e.r; r++) {
    const rawLabel = getCellValue(sheet, 3, r) // column D
    if (!rawLabel) continue

    const norm = normaliseLabel(String(rawLabel))
    if (!norm) continue

    const rawValue = getCellValue(sheet, 4, r) // column E
    const mapping = INVESTOR_LABEL_MAP[norm]

    if (!mapping) {
      if (norm.length > 3 && rawValue !== undefined) {
        warnings.push(`Unrecognised investor label: "${String(rawLabel).trim()}"`)
      }
      continue
    }

    let coerced: string | number | undefined
    if (mapping.type === 'int') {
      const n = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue))
      coerced = isNaN(n) ? undefined : Math.round(n)
    } else {
      const s = rawValue !== null && rawValue !== undefined ? String(rawValue).trim() : ''
      coerced = s || undefined
    }

    if (coerced !== undefined) {
      ;(data as Record<string, unknown>)[mapping.field] = coerced
    }
  }

  return { data, warnings, criticalMissing: [] }
}
