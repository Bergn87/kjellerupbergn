import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prisberegner',
  robots: 'noindex, nofollow',
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body style={{ margin: 0, padding: 0, background: 'transparent' }}>
        {children}
      </body>
    </html>
  )
}
