import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import ImportListingClient from './ImportListingClient'

export const metadata = { title: 'Add a Listing' }

export default async function ImportListingPage() {
  const session = await auth()
  if (!session || session.user.role === 'BUYER') redirect('/listings')

  return <ImportListingClient />
}
