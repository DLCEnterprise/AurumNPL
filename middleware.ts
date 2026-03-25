import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/signin', '/signup', '/pending-approval']
const PUBLIC_PREFIXES = ['/api/auth', '/api/admin', '/_next', '/favicon', '/tools']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Always allow public paths and static assets
  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next()
  }

  // Protected routes — require authentication
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/listings') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/profile') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/admin'))

  if (isProtected) {
    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/signin'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    // Redirect pending/rejected users away from protected routes
    if (session.user.approvalStatus === 'PENDING') {
      const url = req.nextUrl.clone()
      url.pathname = '/pending-approval'
      return NextResponse.redirect(url)
    }

    if (session.user.approvalStatus === 'REJECTED') {
      const url = req.nextUrl.clone()
      url.pathname = '/signin'
      url.searchParams.set('error', 'rejected')
      return NextResponse.redirect(url)
    }
  }

  // Redirect already-approved users away from auth pages
  if (
    session?.user.approvalStatus === 'APPROVED' &&
    (pathname === '/signin' || pathname === '/signup')
  ) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect already-approved users away from pending page
  if (session?.user.approvalStatus === 'APPROVED' && pathname === '/pending-approval') {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
