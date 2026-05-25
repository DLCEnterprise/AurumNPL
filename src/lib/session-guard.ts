import { auth } from './auth'
import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'

/**
 * Resolve the current session or redirect to /signin.
 *
 * The `(dashboard)/layout.tsx` already redirects unauthenticated requests, but
 * in Next.js 15 dev mode the page handler can render concurrently with the
 * layout. Calling this at the top of every dashboard page handler eliminates
 * the `session!.user` non-null-assertion crash, narrows the TypeScript type,
 * and gives us a single place to evolve the auth gate later.
 */
export async function requireSession(): Promise<Session & { user: { id: string } }> {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')
  return session as Session & { user: { id: string } }
}
