import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Updated Terms — AURUM' }

export default async function TermsUpdateLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/signin')
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base, #0a0a0b)',
      color: 'var(--text-primary, #f0ede8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {children}
    </div>
  )
}
