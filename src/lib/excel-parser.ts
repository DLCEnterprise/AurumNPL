/**
 * Aurum Trader Listing Sheet Parser
 *
 * The spreadsheet is a vertical form layout — NOT a standard table.
 * Labels appear in columns C (index 2) and F (index 5).
 * Values appear in columns D (index 3) and G (index 6).
 *
 * Usage:
 *   const { data, warnings } = parseListingSheet(workbook)
 */

import ExcelJS from 'exceljs'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedAsset {
  // LTV
  ltv?: number
  cltv?: number
  payoffCltv?: number

  // Property
  fairMarketValue?: number
  occupancyType?: string
  homePurchaseDate?: Date
  homePurchasePrice?: number
  propertyStreet?: string
  propertyCity?: string
  propertyState?: string
  propertyZip?: string
  streetViewUrl?: string

  // Bankruptcy — current
  isInBankruptcy?: boolean
  bankruptcyChapter?: string
  bkFilingDate?: Date
  ch13PocFilingDate?: Date
  bkConfirmationDate?: Date
  bkDismissalDate?: Date
  ch13DischargedDate?: Date

  // Bankruptcy — previous
  ch7PetitionDate?: Date
  ch7CaseNumber?: string
  ch7DateFiled?: Date
  ch7DismissalDate?: Date
  ch7DischargeDate?: Date
  prevCh13PetitionDate?: Date
  prevCh13CaseNumber?: string
  prevCh13DateFiled?: Date
  prevCh13DismissalDate?: Date
  prevCh13DischargeDate?: Date

  // First mortgage — current
  firstMtg_loanStatus?: string
  firstMtg_originationDate?: Date
  firstMtg_maturityDate?: Date
  firstMtg_loanTermMonths?: number
  firstMtg_firstPaymentDate?: Date
  firstMtg_interestPaidToDate?: Date
  firstMtg_totalMonthsPaid?: number
  firstMtg_originalAmount?: number
  firstMtg_currentBalance?: number
  firstMtg_nextDueDate?: Date
  firstMtg_monthsRemaining?: number
  firstMtg_interestRate?: number
  firstMtg_monthlyPI?: number
  firstMtg_monthlyEscrow?: number

  // First mortgage — modification
  firstMtg_isModified?: boolean
  firstMtg_hasBalloon?: boolean
  firstMtg_balloonDate?: Date
  firstMtg_modDate?: Date
  firstMtg_modMaturityDate?: Date
  firstMtg_modTermMonths?: number
  firstMtg_modFirstPayDate?: Date
  firstMtg_modInterestPaidTo?: Date
  firstMtg_modMonthsPaid?: number
  firstMtg_modPaymentsRemaining?: number
  firstMtg_modLoanAmount?: number
  firstMtg_modCurrentBalance?: number
  firstMtg_modDeferredBalance?: number
  firstMtg_modInterestRate?: number
  firstMtg_modMonthlyPI?: number
  firstMtg_modMonthlyEscrow?: number

  // First mortgage — foreclosure
  firstMtg_foreclosureDefaultDate?: Date
  firstMtg_foreclosureDefaultAmt?: number
  firstMtg_foreclosureSaleDate?: Date

  // Second mortgage — current
  secondMtg_loanStatus?: string
  secondMtg_originationDate?: Date
  secondMtg_maturityDate?: Date
  secondMtg_loanTermMonths?: number
  secondMtg_firstPaymentDate?: Date
  secondMtg_interestPaidToDate?: Date
  secondMtg_totalMonthsPaid?: number
  secondMtg_originalAmount?: number
  secondMtg_currentBalance?: number
  secondMtg_nextDueDate?: Date
  secondMtg_monthsRemaining?: number
  secondMtg_interestRate?: number
  secondMtg_monthlyPI?: number
  secondMtg_monthlyEscrow?: number

  // Second mortgage — modification
  secondMtg_isModified?: boolean
  secondMtg_hasBalloon?: boolean
  secondMtg_balloonDate?: Date
  secondMtg_modDate?: Date
  secondMtg_modMaturityDate?: Date
  secondMtg_modTermMonths?: number
  secondMtg_modFirstPayDate?: Date
  secondMtg_modInterestPaidTo?: Date
  secondMtg_modMonthsPaid?: number
  secondMtg_modPaymentsRemaining?: number
  secondMtg_modLoanAmount?: number
  secondMtg_modCurrentBalance?: number
  secondMtg_modDeferredBalance?: number
  secondMtg_modInterestRate?: number
  secondMtg_modMonthlyPI?: number
  secondMtg_modMonthlyEscrow?: number

  // Second mortgage — foreclosure
  secondMtg_foreclosureDefaultDate?: Date
  secondMtg_foreclosureDefaultAmt?: number
  secondMtg_foreclosureSaleDate?: Date
}

export interface ParseResult<T> {
  data: T
  warnings: string[]
  criticalMissing: string[]
}

// ── Label → field mapping ─────────────────────────────────────────────────────

type FieldType = 'float' | 'currency' | 'date' | 'boolean' | 'string' | 'int' | 'percent'

interface FieldMapping {
  field: keyof ParsedAsset
  type: FieldType
}

// Normalise a label for fuzzy matching (lowercase, collapse whitespace, strip punctuation)
function normaliseLabel(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

const LISTING_LABEL_MAP: Record<string, FieldMapping> = {
  // LTV
  'ltv': { field: 'ltv', type: 'percent' },
  'loan to value': { field: 'ltv', type: 'percent' },
  'cltv': { field: 'cltv', type: 'percent' },
  'combined loan to value': { field: 'cltv', type: 'percent' },
  'payoff cltv': { field: 'payoffCltv', type: 'percent' },
  'payoff cltv including past due amounts': { field: 'payoffCltv', type: 'percent' },

  // Property
  'fair market value': { field: 'fairMarketValue', type: 'currency' },
  'fmv': { field: 'fairMarketValue', type: 'currency' },
  'occupancy type': { field: 'occupancyType', type: 'string' },
  'home purchase date': { field: 'homePurchaseDate', type: 'date' },
  'home purchase price': { field: 'homePurchasePrice', type: 'currency' },
  'purchase price': { field: 'homePurchasePrice', type: 'currency' },
  'street address': { field: 'propertyStreet', type: 'string' },
  'address': { field: 'propertyStreet', type: 'string' },
  'city': { field: 'propertyCity', type: 'string' },
  'state': { field: 'propertyState', type: 'string' },
  'zip': { field: 'propertyZip', type: 'string' },
  'zip code': { field: 'propertyZip', type: 'string' },
  'google property street view photo': { field: 'streetViewUrl', type: 'string' },
  'street view url': { field: 'streetViewUrl', type: 'string' },

  // BK current
  'is loan currently in bankruptcy': { field: 'isInBankruptcy', type: 'boolean' },
  'in bankruptcy': { field: 'isInBankruptcy', type: 'boolean' },
  'what chapter bankruptcy': { field: 'bankruptcyChapter', type: 'string' },
  'chapter': { field: 'bankruptcyChapter', type: 'string' },
  'bk filing date': { field: 'bkFilingDate', type: 'date' },
  'bankruptcy filing date': { field: 'bkFilingDate', type: 'date' },
  'ch 13 poc filing date': { field: 'ch13PocFilingDate', type: 'date' },
  'ch13 poc filing date': { field: 'ch13PocFilingDate', type: 'date' },
  'bk confirmation date': { field: 'bkConfirmationDate', type: 'date' },
  'confirmation date': { field: 'bkConfirmationDate', type: 'date' },
  'bk dismissal date': { field: 'bkDismissalDate', type: 'date' },
  'ch 13 discharged date': { field: 'ch13DischargedDate', type: 'date' },
  'ch13 discharged date': { field: 'ch13DischargedDate', type: 'date' },

  // BK previous — Ch7
  'ch 7 petition filing date': { field: 'ch7PetitionDate', type: 'date' },
  'ch7 petition filing date': { field: 'ch7PetitionDate', type: 'date' },
  'ch 7 case number': { field: 'ch7CaseNumber', type: 'string' },
  'ch7 case number': { field: 'ch7CaseNumber', type: 'string' },
  'ch 7 date filed': { field: 'ch7DateFiled', type: 'date' },
  'ch7 date filed': { field: 'ch7DateFiled', type: 'date' },
  'debtor dismissal date ch 7': { field: 'ch7DismissalDate', type: 'date' },
  'debtor discharge date ch 7': { field: 'ch7DischargeDate', type: 'date' },

  // BK previous — Ch13
  'ch 13 petition filing date': { field: 'prevCh13PetitionDate', type: 'date' },
  'ch13 petition filing date previous': { field: 'prevCh13PetitionDate', type: 'date' },
  'ch 13 case number': { field: 'prevCh13CaseNumber', type: 'string' },
  'ch13 case number': { field: 'prevCh13CaseNumber', type: 'string' },
  'ch 13 date filed': { field: 'prevCh13DateFiled', type: 'date' },
  'ch13 date filed': { field: 'prevCh13DateFiled', type: 'date' },
  'debtor dismissal date ch 13': { field: 'prevCh13DismissalDate', type: 'date' },
  'debtor discharge date ch 13': { field: 'prevCh13DischargeDate', type: 'date' },

  // 1st mortgage — current
  'loan status': { field: 'firstMtg_loanStatus', type: 'string' },
  '1st mortgage loan status': { field: 'firstMtg_loanStatus', type: 'string' },
  'first mortgage loan status': { field: 'firstMtg_loanStatus', type: 'string' },
  'origination date': { field: 'firstMtg_originationDate', type: 'date' },
  '1st mortgage origination date': { field: 'firstMtg_originationDate', type: 'date' },
  'loan maturity date': { field: 'firstMtg_maturityDate', type: 'date' },
  '1st mortgage maturity date': { field: 'firstMtg_maturityDate', type: 'date' },
  'loan terms months': { field: 'firstMtg_loanTermMonths', type: 'int' },
  '1st mortgage term months': { field: 'firstMtg_loanTermMonths', type: 'int' },
  'first payment date': { field: 'firstMtg_firstPaymentDate', type: 'date' },
  '1st mortgage first payment date': { field: 'firstMtg_firstPaymentDate', type: 'date' },
  'interest paid to date': { field: 'firstMtg_interestPaidToDate', type: 'date' },
  '1st mortgage interest paid to date': { field: 'firstMtg_interestPaidToDate', type: 'date' },
  'total months paid': { field: 'firstMtg_totalMonthsPaid', type: 'int' },
  '1st mortgage total months paid': { field: 'firstMtg_totalMonthsPaid', type: 'int' },
  'original loan amount': { field: 'firstMtg_originalAmount', type: 'currency' },
  '1st mortgage original amount': { field: 'firstMtg_originalAmount', type: 'currency' },
  'current principal balance': { field: 'firstMtg_currentBalance', type: 'currency' },
  '1st mortgage current balance': { field: 'firstMtg_currentBalance', type: 'currency' },
  'next due date': { field: 'firstMtg_nextDueDate', type: 'date' },
  '1st mortgage next due date': { field: 'firstMtg_nextDueDate', type: 'date' },
  'total months remaining': { field: 'firstMtg_monthsRemaining', type: 'int' },
  '1st mortgage months remaining': { field: 'firstMtg_monthsRemaining', type: 'int' },
  'original interest rate': { field: 'firstMtg_interestRate', type: 'percent' },
  '1st mortgage interest rate': { field: 'firstMtg_interestRate', type: 'percent' },
  'original monthly pi payment': { field: 'firstMtg_monthlyPI', type: 'currency' },
  'original monthly p i payment': { field: 'firstMtg_monthlyPI', type: 'currency' },
  '1st mortgage monthly pi': { field: 'firstMtg_monthlyPI', type: 'currency' },
  'current monthly escrow': { field: 'firstMtg_monthlyEscrow', type: 'currency' },
  '1st mortgage monthly escrow': { field: 'firstMtg_monthlyEscrow', type: 'currency' },

  // 1st mortgage — modification
  'has loan been modified': { field: 'firstMtg_isModified', type: 'boolean' },
  '1st mortgage is modified': { field: 'firstMtg_isModified', type: 'boolean' },
  'is there balloon date on this modification': { field: 'firstMtg_hasBalloon', type: 'boolean' },
  '1st mortgage has balloon': { field: 'firstMtg_hasBalloon', type: 'boolean' },
  'loan modification balloon date': { field: 'firstMtg_balloonDate', type: 'date' },
  'loan modification date': { field: 'firstMtg_modDate', type: 'date' },
  'loan modification maturity date': { field: 'firstMtg_modMaturityDate', type: 'date' },
  'loan modification loan term months': { field: 'firstMtg_modTermMonths', type: 'int' },
  'loan modification first payment date': { field: 'firstMtg_modFirstPayDate', type: 'date' },
  'loan modification interest paid to date': { field: 'firstMtg_modInterestPaidTo', type: 'date' },
  'loan modification total months paid': { field: 'firstMtg_modMonthsPaid', type: 'int' },
  'loan modification total payments remaining': { field: 'firstMtg_modPaymentsRemaining', type: 'int' },
  'loan modification modified loan amount': { field: 'firstMtg_modLoanAmount', type: 'currency' },
  'loan modification current principal balance': { field: 'firstMtg_modCurrentBalance', type: 'currency' },
  'loan modification deferred balance': { field: 'firstMtg_modDeferredBalance', type: 'currency' },
  'loan modification interest rate': { field: 'firstMtg_modInterestRate', type: 'percent' },
  'loan modification monthly pi payment': { field: 'firstMtg_modMonthlyPI', type: 'currency' },
  'loan modification monthly p i payment': { field: 'firstMtg_modMonthlyPI', type: 'currency' },
  'loan modification monthly escrow payment': { field: 'firstMtg_modMonthlyEscrow', type: 'currency' },

  // 1st mortgage — foreclosure
  'foreclosure notice of default date': { field: 'firstMtg_foreclosureDefaultDate', type: 'date' },
  'foreclosure default date': { field: 'firstMtg_foreclosureDefaultDate', type: 'date' },
  'foreclosure default amount': { field: 'firstMtg_foreclosureDefaultAmt', type: 'currency' },
  'foreclosure notice of sale date': { field: 'firstMtg_foreclosureSaleDate', type: 'date' },
  'foreclosure sale date': { field: 'firstMtg_foreclosureSaleDate', type: 'date' },

  // 2nd mortgage — current (same labels, context-based — handled via section detection)
  '2nd mortgage loan status': { field: 'secondMtg_loanStatus', type: 'string' },
  'second mortgage loan status': { field: 'secondMtg_loanStatus', type: 'string' },
  '2nd mortgage origination date': { field: 'secondMtg_originationDate', type: 'date' },
  '2nd mortgage maturity date': { field: 'secondMtg_maturityDate', type: 'date' },
  '2nd mortgage term months': { field: 'secondMtg_loanTermMonths', type: 'int' },
  '2nd mortgage first payment date': { field: 'secondMtg_firstPaymentDate', type: 'date' },
  '2nd mortgage interest paid to date': { field: 'secondMtg_interestPaidToDate', type: 'date' },
  '2nd mortgage total months paid': { field: 'secondMtg_totalMonthsPaid', type: 'int' },
  '2nd mortgage original amount': { field: 'secondMtg_originalAmount', type: 'currency' },
  '2nd mortgage current balance': { field: 'secondMtg_currentBalance', type: 'currency' },
  '2nd mortgage next due date': { field: 'secondMtg_nextDueDate', type: 'date' },
  '2nd mortgage months remaining': { field: 'secondMtg_monthsRemaining', type: 'int' },
  '2nd mortgage interest rate': { field: 'secondMtg_interestRate', type: 'percent' },
  '2nd mortgage monthly pi': { field: 'secondMtg_monthlyPI', type: 'currency' },
  '2nd mortgage monthly escrow': { field: 'secondMtg_monthlyEscrow', type: 'currency' },

  // 2nd mortgage — modification
  '2nd mortgage is modified': { field: 'secondMtg_isModified', type: 'boolean' },
  '2nd mortgage has balloon': { field: 'secondMtg_hasBalloon', type: 'boolean' },
  '2nd mortgage balloon date': { field: 'secondMtg_balloonDate', type: 'date' },
  '2nd loan modification date': { field: 'secondMtg_modDate', type: 'date' },
  '2nd loan modification maturity date': { field: 'secondMtg_modMaturityDate', type: 'date' },
  '2nd loan modification term months': { field: 'secondMtg_modTermMonths', type: 'int' },
  '2nd loan modification first payment date': { field: 'secondMtg_modFirstPayDate', type: 'date' },
  '2nd loan modification interest paid to date': { field: 'secondMtg_modInterestPaidTo', type: 'date' },
  '2nd loan modification total months paid': { field: 'secondMtg_modMonthsPaid', type: 'int' },
  '2nd loan modification total payments remaining': { field: 'secondMtg_modPaymentsRemaining', type: 'int' },
  '2nd loan modification modified loan amount': { field: 'secondMtg_modLoanAmount', type: 'currency' },
  '2nd loan modification current principal balance': { field: 'secondMtg_modCurrentBalance', type: 'currency' },
  '2nd loan modification deferred balance': { field: 'secondMtg_modDeferredBalance', type: 'currency' },
  '2nd loan modification interest rate': { field: 'secondMtg_modInterestRate', type: 'percent' },
  '2nd loan modification monthly pi payment': { field: 'secondMtg_modMonthlyPI', type: 'currency' },
  '2nd loan modification monthly escrow payment': { field: 'secondMtg_modMonthlyEscrow', type: 'currency' },

  // 2nd mortgage — foreclosure
  '2nd foreclosure notice of default date': { field: 'secondMtg_foreclosureDefaultDate', type: 'date' },
  '2nd foreclosure default amount': { field: 'secondMtg_foreclosureDefaultAmt', type: 'currency' },
  '2nd foreclosure notice of sale date': { field: 'secondMtg_foreclosureSaleDate', type: 'date' },
}

// Section headers that indicate we've entered the 2nd mortgage section.
// When seen, subsequent ambiguous labels (no "2nd"/"second" prefix) map to secondMtg_ fields.
const SECOND_MTG_SECTION_HEADERS = [
  'second mortgage', '2nd mortgage', 'second lien', '2nd lien', 'heloc',
]

// Ambiguous 1st-mortgage labels that need section context to resolve
const AMBIGUOUS_TO_SECOND: Record<string, FieldMapping> = {
  'loan status': { field: 'secondMtg_loanStatus', type: 'string' },
  'origination date': { field: 'secondMtg_originationDate', type: 'date' },
  'loan maturity date': { field: 'secondMtg_maturityDate', type: 'date' },
  'loan terms months': { field: 'secondMtg_loanTermMonths', type: 'int' },
  'first payment date': { field: 'secondMtg_firstPaymentDate', type: 'date' },
  'interest paid to date': { field: 'secondMtg_interestPaidToDate', type: 'date' },
  'total months paid': { field: 'secondMtg_totalMonthsPaid', type: 'int' },
  'original loan amount': { field: 'secondMtg_originalAmount', type: 'currency' },
  'current principal balance': { field: 'secondMtg_currentBalance', type: 'currency' },
  'next due date': { field: 'secondMtg_nextDueDate', type: 'date' },
  'total months remaining': { field: 'secondMtg_monthsRemaining', type: 'int' },
  'original interest rate': { field: 'secondMtg_interestRate', type: 'percent' },
  'original monthly pi payment': { field: 'secondMtg_monthlyPI', type: 'currency' },
  'original monthly p i payment': { field: 'secondMtg_monthlyPI', type: 'currency' },
  'current monthly escrow': { field: 'secondMtg_monthlyEscrow', type: 'currency' },
  'has loan been modified': { field: 'secondMtg_isModified', type: 'boolean' },
  'is there balloon date on this modification': { field: 'secondMtg_hasBalloon', type: 'boolean' },
  'loan modification balloon date': { field: 'secondMtg_balloonDate', type: 'date' },
  'loan modification date': { field: 'secondMtg_modDate', type: 'date' },
  'loan modification maturity date': { field: 'secondMtg_modMaturityDate', type: 'date' },
  'loan modification loan term months': { field: 'secondMtg_modTermMonths', type: 'int' },
  'loan modification first payment date': { field: 'secondMtg_modFirstPayDate', type: 'date' },
  'loan modification interest paid to date': { field: 'secondMtg_modInterestPaidTo', type: 'date' },
  'loan modification total months paid': { field: 'secondMtg_modMonthsPaid', type: 'int' },
  'loan modification total payments remaining': { field: 'secondMtg_modPaymentsRemaining', type: 'int' },
  'loan modification modified loan amount': { field: 'secondMtg_modLoanAmount', type: 'currency' },
  'loan modification current principal balance': { field: 'secondMtg_modCurrentBalance', type: 'currency' },
  'loan modification deferred balance': { field: 'secondMtg_modDeferredBalance', type: 'currency' },
  'loan modification interest rate': { field: 'secondMtg_modInterestRate', type: 'percent' },
  'loan modification monthly pi payment': { field: 'secondMtg_modMonthlyPI', type: 'currency' },
  'loan modification monthly p i payment': { field: 'secondMtg_modMonthlyPI', type: 'currency' },
  'loan modification monthly escrow payment': { field: 'secondMtg_modMonthlyEscrow', type: 'currency' },
  'foreclosure notice of default date': { field: 'secondMtg_foreclosureDefaultDate', type: 'date' },
  'foreclosure default amount': { field: 'secondMtg_foreclosureDefaultAmt', type: 'currency' },
  'foreclosure notice of sale date': { field: 'secondMtg_foreclosureSaleDate', type: 'date' },
}

// ── Value coercion ────────────────────────────────────────────────────────────

function coerceCurrency(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined
  if (typeof raw === 'number') return raw
  const s = String(raw).replace(/[$,\s]/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}

function coercePercent(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined
  if (typeof raw === 'number') {
    // Excel sometimes stores percentages as decimals (0.065) already
    return raw > 1 ? raw / 100 : raw
  }
  const s = String(raw).replace(/[%\s]/g, '')
  const n = parseFloat(s)
  if (isNaN(n)) return undefined
  // If entered as "6.5" (not decimal), divide by 100
  return n > 1 ? n / 100 : n
}

function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000))
}

function coerceDate(raw: unknown): Date | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined
  if (raw instanceof Date) return isNaN(raw.getTime()) ? undefined : raw
  if (typeof raw === 'number') return excelSerialToDate(raw)
  const d = new Date(String(raw))
  return isNaN(d.getTime()) ? undefined : d
}

function coerceBoolean(raw: unknown): boolean | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined
  const s = String(raw).toLowerCase().trim()
  if (s === 'yes' || s === 'true' || s === '1') return true
  if (s === 'no' || s === 'false' || s === '0') return false
  return undefined
}

function coerceInt(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.-]/g, ''))
  return isNaN(n) ? undefined : Math.round(n)
}

function coerceString(raw: unknown): string | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined
  return String(raw).trim() || undefined
}

function coerce(raw: unknown, type: FieldType): unknown {
  switch (type) {
    case 'currency': return coerceCurrency(raw)
    case 'float':    return coerceCurrency(raw)
    case 'percent':  return coercePercent(raw)
    case 'date':     return coerceDate(raw)
    case 'boolean':  return coerceBoolean(raw)
    case 'int':      return coerceInt(raw)
    case 'string':   return coerceString(raw)
  }
}

// ── Sheet reader ──────────────────────────────────────────────────────────────

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

// ── Main listing sheet parser ─────────────────────────────────────────────────

export function parseListingSheet(wb: ExcelJS.Workbook): ParseResult<ParsedAsset> {
  const sheetNames = wb.worksheets.map(ws => ws.name)
  const sheetName = sheetNames.find(
    (n) => !n.toLowerCase().includes('investor') && !n.toLowerCase().includes('buyer')
  ) ?? sheetNames[0]

  const sheet = wb.getWorksheet(sheetName)
  if (!sheet) {
    return { data: {}, warnings: [`Sheet "${sheetName}" not found`], criticalMissing: [] }
  }

  const rowCount = sheet.rowCount
  const data: ParsedAsset = {}
  const warnings: string[] = []
  let inSecondMtg = false

  for (let r = 0; r < rowCount; r++) {
    // Check both label columns: C (2)/D (3) and F (5)/G (6)
    const pairs: Array<[number, number]> = [[2, 3], [5, 6]]

    for (const [labelCol, valueCol] of pairs) {
      const rawLabel = getCellValue(sheet, labelCol, r)
      if (!rawLabel) continue

      const labelStr = String(rawLabel).trim()
      const norm = normaliseLabel(labelStr)
      if (!norm) continue

      // Detect second mortgage section entry
      if (SECOND_MTG_SECTION_HEADERS.some((h) => norm.includes(h))) {
        inSecondMtg = true
      }

      const rawValue = getCellValue(sheet, valueCol, r)

      // Explicit prefixed match first
      let mapping = LISTING_LABEL_MAP[norm]

      // Fall back to context-based second-mortgage remapping
      if (!mapping && inSecondMtg && AMBIGUOUS_TO_SECOND[norm]) {
        mapping = AMBIGUOUS_TO_SECOND[norm]
      }

      if (!mapping) {
        if (norm.length > 3 && rawValue !== undefined) {
          warnings.push(`Unrecognised label: "${labelStr}"`)
        }
        continue
      }

      const coerced = coerce(rawValue, mapping.type)
      if (coerced !== undefined && coerced !== null) {
        ;(data as Record<string, unknown>)[mapping.field] = coerced
      }
    }
  }

  // Critical field check
  const criticalMissing: string[] = []
  if (!data.propertyState) criticalMissing.push('Property State')
  if (!data.firstMtg_currentBalance) criticalMissing.push('First Mortgage Current Balance')
  if (!data.firstMtg_loanStatus) criticalMissing.push('First Mortgage Loan Status')

  return { data, warnings, criticalMissing }
}
