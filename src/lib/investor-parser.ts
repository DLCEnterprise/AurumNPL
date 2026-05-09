/**
 * Aurum Trader Investor Sheet Parser
 *
 * Labels are in column D (index 3), values in column E (index 4).
 */

import ExcelJS from 'exceljs'
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

function getCellValue(sheet: ExcelJS.Worksheet, col: number, row: number): unknown {
  const cell = sheet.getCell(row + 1, col + 1)
  const val = cell.value
  if (val === null || val === undefined) return undefined
  if (val instanceof Date) return val
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val
  const obj = val as unknown as Record<string, unknown>
  if (Array.isArray(obj.richText)) return (obj.richText as Array<{ text: string }>).map(r => r.text).join('')
  if ('formula' in obj || 'sharedFormula' in obj) return obj.result
  if ('text' in obj) return obj.text
  if ('error' in obj) return undefined
  return undefined
}

export function parseInvestorSheet(wb: ExcelJS.Workbook): ParseResult<ParsedInvestor> {
  const sheetNames = wb.worksheets.map(ws => ws.name)
  const sheetName = sheetNames.find(
    (n) => n.toLowerCase().includes('investor') || n.toLowerCase().includes('buyer')
  ) ?? sheetNames[1]

  if (!sheetName) {
    return { data: {}, warnings: ['No investor sheet found'], criticalMissing: [] }
  }

  const sheet = wb.getWorksheet(sheetName)
  if (!sheet) {
    return { data: {}, warnings: [`Sheet "${sheetName}" not found`], criticalMissing: [] }
  }

  const rowCount = sheet.rowCount
  const data: ParsedInvestor = {}
  const warnings: string[] = []

  for (let r = 0; r < rowCount; r++) {
    const rawLabel = getCellValue(sheet, 3, r) // column D (0-indexed)
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
