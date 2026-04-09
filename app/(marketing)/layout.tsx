import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bergn.dk — Tilbudsværktøj til håndværkere',
  description: 'Smart prisberegner og tilbudssystem til håndværkere. Automatiske tilbud, digital accept og fuld overblik.',
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
