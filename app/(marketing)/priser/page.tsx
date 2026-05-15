import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, ChevronDown } from 'lucide-react'
import LandingNav from '@/components/shared/LandingNav'

export const metadata: Metadata = {
  title: 'Priser — Bergn.dk',
  description: 'Se priser for Bergn.dk. Start gratis i 14 dage. Planer fra 299 kr/md.',
}

const PLANS = [
  { name: 'Starter', price: '299', desc: 'For håndværkere der vil i gang', features: ['50 tilbud / måned', 'Email-tilbud til kunder', '1 beregner', 'Admin-panel med overblik', 'Embed-kode til hjemmeside'], cta: 'Kom i gang', popular: false },
  { name: 'Pro', price: '599', desc: 'For virksomheder der vil vækste', features: ['200 tilbud / måned', 'Email + SMS til kunder', 'PDF-tilbud med dit logo', 'Op til 3 beregnere', 'Automatiske påmindelser', 'Digital accept', '2 brugere'], cta: 'Start gratis', popular: true },
  { name: 'Business', price: '999', desc: 'For etablerede firmaer', features: ['1.000 tilbud / måned', 'Alt fra Pro', 'Ubegrænsede beregnere', '5 brugere', 'Prioriteret support', 'Custom subdomæne'], cta: 'Kontakt os', popular: false },
]

const FAQ = [
  { q: 'Hvad tæller som et tilbud?', a: 'Hver gang en kunde udfylder din beregner og sender en forespørgsel, tæller det som ét tilbud. Manuelle tilbud fra admin-panelet tæller også.' },
  { q: 'Kan jeg skifte plan?', a: 'Ja. Du kan opgradere eller nedgradere når som helst fra dit admin-panel under "Abonnement".' },
  { q: 'Er der nogen binding?', a: 'Nej. Du betaler måned til måned og kan afmelde når som helst.' },
  { q: 'Hvad sker der efter prøveperioden?', a: 'Når dine 14 dage er gået, vælger du selv om du vil fortsætte. Vi opkræver ikke automatisk.' },
  { q: 'Kan jeg få en demo først?', a: 'Prøveperioden ER din demo. Du får fuld adgang til alle funktioner i 14 dage, helt gratis.' },
]

export default function PriserPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />

      <section className="pt-28 pb-20 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Enkel prissætning</h1>
            <p className="text-lg text-gray-500 mt-3">Ingen skjulte gebyrer. Betal kun for det du bruger.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`rounded-2xl bg-white p-8 ${plan.popular ? 'ring-2 ring-primary shadow-xl relative' : 'border border-gray-200'}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white">Mest populær</div>}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500"> kr/md</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`block w-full rounded-lg py-3 text-center font-semibold transition-colors ${plan.popular ? 'bg-bergn-cta text-white hover:bg-bergn-cta-hover' : 'border-2 border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">Alle priser er ekskl. moms. 14 dages gratis prøveperiode på alle planer.</p>
        </div>
      </section>

      <section className="py-16 bg-bergn-page-bg">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">Spørgsmål om priser</h2>
          <div className="space-y-3">
            {FAQ.map((faq) => (
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

      <footer className="border-t bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between text-sm text-gray-400">
          <span className="font-bold text-gray-900">Bergn<span className="text-bergn-accent">.dk</span></span>
          <p>&copy; 2026 Bergn.dk</p>
        </div>
      </footer>
    </div>
  )
}
