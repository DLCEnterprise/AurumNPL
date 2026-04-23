import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CSV_HEADERS } from '@/lib/csv-import'

export async function GET() {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const header = CSV_HEADERS.join(',')
  const example = [
    '123 Main St',
    'Dallas',
    'TX',
    '75001',
    'SFR',
    'Owner',
    '250000',
    '1st',
    'Fixed',
    'Non-Performing',
    'Default',
    '185000',
    '210000',
    '6.5',
    '1250',
    '01/15/2018',
    '02/01/2048',
    '03/01/2023',
    '140000',
    '',
    '',
  ].join(',')

  const csv = `${header}\n${example}\n`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="aurum-bulk-import-template.csv"',
    },
  })
}
