'use client'

import { useState } from 'react'
import { usePreferences } from '@/lib/preferences'
import { DashboardNav } from '@/components/layout/DashboardNav'
import { SidebarLinks } from '@/components/layout/SidebarLinks'
import { TopNav } from '@/components/layout/TopNav'
import { PageTransition } from '@/components/ui/PageTransition'
import { PreferencesPanel } from '@/components/ui/PreferencesPanel'
import { SellerTour } from '@/components/ui/SellerTour'
import { BuyerTour } from '@/components/ui/BuyerTour'
import type { SessionUser } from '@/types'

interface Props {
  user: SessionUser
  children: React.ReactNode
}

export function DashboardShell({ user, children }: Props) {
  const { navLayout } = usePreferences()
  const [prefOpen, setPrefOpen] = useState(false)

  const role = user.role as string

  return (
    <>
      {navLayout === 'topbar' ? (
        <>
          <TopNav user={user} onPrefsOpen={() => setPrefOpen(true)} />
          <div style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh', background: 'var(--bg-deep)' }}>
            <main
              id="main-content"
              style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}
            >
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </>
      ) : (
        <>
          <DashboardNav user={user} />
          <div className="dashboard-layout">
            <aside className="sidebar">
              <SidebarLinks role={role} onPrefsOpen={() => setPrefOpen(true)} />
            </aside>
            <main className="dashboard-main" id="main-content">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </>
      )}

      <PreferencesPanel open={prefOpen} onClose={() => setPrefOpen(false)} />

      {role === 'SELLER'  && <SellerTour />}
      {role === 'BUYER'   && <BuyerTour />}
    </>
  )
}
