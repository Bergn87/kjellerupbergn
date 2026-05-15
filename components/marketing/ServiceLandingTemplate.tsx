import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import LandingNav from '@/components/shared/LandingNav'
import FadeIn from '@/components/shared/FadeIn'
import CalculatorMockup from './CalculatorMockup'

interface Benefit {
  icon: LucideIcon
  title: string
  desc: string
}

interface FaqItem {
  q: string
  a: string
}

interface ServiceLandingProps {
  service: string
  headline: string
  headlineAccent: string
  subtext: string
  benefits: Benefit[]
  faqItems: FaqItem[]
}

export default function ServiceLandingTemplate({
  service,
  headline,
  headlineAccent,
  subtext,
  benefits,
  faqItems,
}: ServiceLandingProps) {
  return (
    <div className="min-h-screen">
      <LandingNav />

      {/* Hero */}
      <section className="bg-white pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{service}</p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900">
              {headline} <span className="text-bergn-accent">{headlineAccent}</span>
            </h1>
            <p className="mt-5 text-lg text-gray-500 max-w-lg leading-relaxed">{subtext}</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <FadeIn>
        <section className="py-16 bg-bergn-page-bg">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((b) => {
                const Icon = b.icon
                return (
                  <div key={b.title} className="rounded-xl bg-white border border-gray-200 p-6 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{b.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Calculator */}
      <FadeIn>
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-3xl px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900">Se beregneren i aktion</h2>
              <p className="text-gray-500 mt-2">Sådan ser den ud for dine kunder — klar til at embede på din hjemmeside</p>
            </div>
            <CalculatorMockup />
          </div>
        </section>
      </FadeIn>

      {/* FAQ */}
      {faqItems.length > 0 && (
        <FadeIn>
          <section className="py-16 bg-bergn-page-bg">
            <div className="mx-auto max-w-3xl px-4">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Ofte stillede spørgsmål</h2>
              <div className="space-y-3">
                {faqItems.map((faq) => (
                  <details key={faq.q} className="group rounded-lg border border-gray-200 bg-white">
                    <summary className="cursor-pointer px-5 py-4 font-semibold text-gray-900 flex items-center justify-between text-sm">
                      {faq.q}
                      <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4" />
                    </summary>
                    <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>
      )}

      {/* Cross-sell CTA */}
      <section className="py-16 bg-primary text-white text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Klar til at få din egen beregner?</h2>
          <p className="text-white/60 mb-6">Opsæt din prisberegner på 10 minutter. Dine kunder beregner pris — du modtager leads.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-bergn-cta px-6 py-3 font-semibold text-white hover:bg-bergn-cta-hover transition-colors">
            Start gratis i 14 dage <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Mini footer */}
      <footer className="border-t bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="font-bold text-gray-900">Bergn<span className="text-bergn-accent">.dk</span></div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-gray-700">Forside</Link>
            <Link href="/login" className="hover:text-gray-700">Log ind</Link>
            <a href="/privatlivspolitik" className="hover:text-gray-700">Privatlivspolitik</a>
          </div>
          <p>&copy; 2026 Bergn.dk</p>
        </div>
      </footer>
    </div>
  )
}
