import type { Metadata } from 'next'
import '../styles/globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PreferencesProvider } from '@/lib/preferences'

export const metadata: Metadata = {
  title: {
    default: 'AURUM — NPL Marketplace',
    template: '%s | AURUM',
  },
  description:
    'The institutional marketplace for non-performing loan transactions. Premium analytics, direct negotiation, seamless execution.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: 'AURUM — NPL Marketplace',
    description:
      'Where distressed assets find new value. Institutional-grade NPL trading platform.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload the display font so headings render without FOUT */}
        <link rel="preload" href="/fonts/cormorant-garamond-semibold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <a href="#main-content" className="skip-to-main">Skip to main content</a>
        <ThemeProvider>
          <PreferencesProvider>
            <ToastProvider>{children}</ToastProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
