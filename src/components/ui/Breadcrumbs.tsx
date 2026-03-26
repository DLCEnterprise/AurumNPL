'use client'

import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '4px',
        alignItems: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        marginBottom: '16px',
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const separator = index < items.length - 1 ? (
          <span key={`sep-${index}`} style={{ color: 'var(--text-muted)', opacity: 0.5 }}>/</span>
        ) : null

        const node = isLast || !item.href ? (
          <span key={item.label} style={{ color: 'var(--text-muted)' }}>
            {item.label}
          </span>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.color = '#d4a846'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)'
            }}
          >
            {item.label}
          </Link>
        )

        return (
          <span key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {node}
            {separator}
          </span>
        )
      })}
    </nav>
  )
}
