import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseListingSheet } from '@/lib/excel-parser'
import { parseInvestorSheet } from '@/lib/investor-parser'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'SELLER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Only sellers can import listings.' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 })
  }

  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
    return NextResponse.json({ success: false, error: 'Only .xlsx and .xls files are accepted.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, error: 'File size exceeds 10 MB limit.' }, { status: 400 })
  }

  // Parse workbook
  const buffer = Buffer.from(await file.arrayBuffer())
  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Could not parse the Excel file. Please ensure it is a valid .xlsx file.' }, { status: 422 })
  }

  const listingResult = parseListingSheet(wb)
  const investorResult = parseInvestorSheet(wb)
  const asset = listingResult.data

  // Build listing title from address
  const cityStateZip = [asset.propertyCity, asset.propertyState].filter(Boolean).join(', ')
    + (asset.propertyZip ? ` ${asset.propertyZip}` : '')
  const parts = [asset.propertyStreet, cityStateZip].filter(Boolean)
  const title = formData.get('title') as string | null
    ?? (parts.length > 0 ? parts.join(', ') : 'Imported Listing')

  // UPB = first mortgage current balance (or mod balance)
  const unpaidBalance = asset.firstMtg_currentBalance
    ?? asset.firstMtg_modCurrentBalance
    ?? 0

  // Create listing + asset in a single transaction
  const listing = await prisma.$transaction(async (tx) => {
    const newListing = await tx.listing.create({
      data: {
        title,
        assetType: 'RESIDENTIAL',
        unpaidBalance,
        loanCount: 1,
        location: [asset.propertyCity, asset.propertyState].filter(Boolean).join(', ') || 'Unknown',
        zip: asset.propertyZip ?? null,
        region: asset.propertyState ?? null,
        status: 'DRAFT',
        documents: [],
        sellerId: session.user.id,
      },
    })

    await tx.asset.create({
      data: {
        listingId: newListing.id,
        ...asset,
      },
    })

    // Optionally update investor profile fields if buyer sheet was present
    const inv = investorResult.data
    if (Object.keys(inv).length > 0) {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          ...(inv.entityName && { entityName: inv.entityName }),
          ...(inv.lastName && { lastName: inv.lastName }),
          ...(inv.signerTitle && { signerTitle: inv.signerTitle }),
          ...(inv.addressStreet && { addressStreet: inv.addressStreet }),
          ...(inv.addressCity && { addressCity: inv.addressCity }),
          ...(inv.addressState && { addressState: inv.addressState }),
          ...(inv.addressZip && { addressZip: inv.addressZip }),
          ...(inv.directPhone && { directPhone: inv.directPhone }),
          ...(inv.officePhone && { officePhone: inv.officePhone }),
          ...(inv.servicerName && { servicerName: inv.servicerName }),
          ...(inv.servicerAddress && { servicerAddress: inv.servicerAddress }),
          ...(inv.servicerContactName && { servicerContactName: inv.servicerContactName }),
          ...(inv.servicerContactPhone && { servicerContactPhone: inv.servicerContactPhone }),
          ...(inv.servicerContactEmail && { servicerContactEmail: inv.servicerContactEmail }),
        },
      })
    }

    return newListing
  })

  return NextResponse.json({
    success: true,
    data: {
      listingId: listing.id,
      title: listing.title,
      warnings: [...listingResult.warnings, ...investorResult.warnings],
      criticalMissing: listingResult.criticalMissing,
      preview: {
        address: parts.join(', ') || null,
        currentBalance: asset.firstMtg_currentBalance ?? null,
        loanStatus: asset.firstMtg_loanStatus ?? null,
        fairMarketValue: asset.fairMarketValue ?? null,
        ltv: asset.ltv ?? null,
        propertyState: asset.propertyState ?? null,
      },
    },
  }, { status: 201 })
}
