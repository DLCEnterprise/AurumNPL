import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(','))
  ].join('\n')
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const format = searchParams.get('format') ?? 'csv'

  const userId = session.user.id
  const isAdmin = session.user.role === 'ADMIN'

  // ── type=listings ──────────────────────────────────────────────────────────
  if (type === 'listings') {
    const listings = await prisma.listing.findMany({
      where: isAdmin ? {} : { sellerId: userId },
      select: {
        id: true,
        title: true,
        assetType: true,
        status: true,
        lienPosition: true,
        unpaidBalance: true,
        loanCount: true,
        location: true,
        avgDelinquency: true,
        createdAt: true,
        description: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'id', 'title', 'assetType', 'status', 'lienPosition',
      'unpaidBalance', 'loanCount', 'location', 'avgDelinquency',
      'createdAt', 'description',
    ]

    const rows = listings.map(l => ({
      id: l.id,
      title: l.title,
      assetType: l.assetType,
      status: l.status,
      lienPosition: l.lienPosition ?? '',
      unpaidBalance: l.unpaidBalance,
      loanCount: l.loanCount,
      location: l.location,
      avgDelinquency: l.avgDelinquency ?? '',
      createdAt: l.createdAt.toISOString(),
      description: l.description ?? '',
    }))

    if (format === 'json') {
      return NextResponse.json({ success: true, data: rows })
    }

    const csv = toCSV(rows as Record<string, unknown>[], headers)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="listings-export-${Date.now()}.csv"`,
      },
    })
  }

  // ── type=bids ──────────────────────────────────────────────────────────────
  if (type === 'bids') {
    const bids = await prisma.bid.findMany({
      where: isAdmin
        ? {}
        : { listing: { sellerId: userId } },
      select: {
        id: true,
        listingId: true,
        listing: { select: { title: true } },
        bidder: { select: { company: true, name: true } },
        amount: true,
        noteRate: true,
        status: true,
        message: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'id', 'listingId', 'listingTitle', 'bidderCompany',
      'amount', 'noteRate', 'status', 'message', 'createdAt', 'expiresAt',
    ]

    const rows = bids.map(b => ({
      id: b.id,
      listingId: b.listingId,
      listingTitle: b.listing.title,
      bidderCompany: b.bidder.company ?? b.bidder.name ?? '',
      amount: b.amount,
      noteRate: b.noteRate ?? '',
      status: b.status,
      message: b.message ?? '',
      createdAt: b.createdAt.toISOString(),
      expiresAt: b.expiresAt ? b.expiresAt.toISOString() : '',
    }))

    if (format === 'json') {
      return NextResponse.json({ success: true, data: rows })
    }

    const csv = toCSV(rows as Record<string, unknown>[], headers)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bids-export-${Date.now()}.csv"`,
      },
    })
  }

  // ── type=analytics ─────────────────────────────────────────────────────────
  if (type === 'analytics') {
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'userId', 'userEmail', 'userName', 'userCompany',
      'userRole', 'approvalStatus', 'listingCount', 'createdAt',
    ]

    const rows = users.map(u => ({
      userId: u.id,
      userEmail: u.email,
      userName: u.name ?? '',
      userCompany: u.company ?? '',
      userRole: u.role,
      approvalStatus: u.approvalStatus,
      listingCount: u._count.listings,
      createdAt: u.createdAt.toISOString(),
    }))

    if (format === 'json') {
      return NextResponse.json({ success: true, data: rows })
    }

    const csv = toCSV(rows as Record<string, unknown>[], headers)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-export-${Date.now()}.csv"`,
      },
    })
  }

  return NextResponse.json({ success: false, error: 'Invalid type parameter' }, { status: 400 })
}
