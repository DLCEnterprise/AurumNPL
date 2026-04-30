import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { CreateListingForm } from '@/components/listings/CreateListingForm'

export const metadata: Metadata = { title: 'Create Listing' }

export default async function NewListingPage() {
  const session = await auth()
  if (!session || session.user.role === 'BUYER') redirect('/listings')

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '6px' }}>
          Create New Listing
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          List your non-performing loan portfolio for qualified buyers.
        </p>
      </div>
      <CreateListingForm />
    </div>
  )
}
