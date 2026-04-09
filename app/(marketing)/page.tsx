import Link from 'next/link'
import { Check } from 'lucide-react'
import LandingNav from '@/components/shared/LandingNav'
import FadeIn from '@/components/shared/FadeIn'

// ============================================
// LANDING PAGE — bergn.dk
// ============================================

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* NAV */}
      <LandingNav />

      {/* HERO */}
      <section className="relative bg-[#0F1B35] text-white overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm mb-6">
              <span className="text-[#E8500A]">&#10022;</span> Dansk tilbudsværktøj til håndværkere
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6">
              Stop med at tabe tilbud.<br />
              <span className="text-[#E8500A]">Begynd at vinde dem.</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg leading-relaxed">
              Bergn.dk giver dig en professionel prisberegner til din hjemmeside og et smart tilbudssystem — så du bruger tid på arbejdet, ikke på papirarbejdet.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link href="/signup" className="inline-flex items-center justify-center rounded-lg bg-[#E8500A] px-8 py-3.5 text-lg font-semibold text-white hover:bg-[#d04609] transition-colors">
                Prøv gratis i 14 dage &rarr;
              </Link>
              <a href="#demo" className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-8 py-3.5 text-lg font-semibold hover:bg-white/10 transition-colors">
                Se en demo
              </a>
            </div>

            <p className="text-sm text-gray-400">
              Intet kreditkort &bull; Ingen binding &bull; Dansk support
            </p>
          </div>
        </div>
      </section>

      {/* PROBLEMER */}
      <FadeIn>
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { emoji: '😤', title: 'For meget tid på tilbud', desc: 'Du bruger timer på at skrive tilbud der aldrig bliver til noget.' },
                { emoji: '📉', title: 'Leads der forsvinder', desc: 'Kunder beder om tilbud og svarer aldrig. Opfølgning glemmes.' },
                { emoji: '📋', title: 'Ingen overblik', desc: 'Hvem har fået tilbud? Hvem har accepteret? Det er umuligt at holde styr på.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border bg-gray-50 p-8 text-center">
                  <div className="text-4xl mb-4">{item.emoji}</div>
                  <h3 className="text-lg font-bold text-[#0F1B35] mb-2">{item.title}</h3>
                  <p className="text-[#374151]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* LIVE DEMO */}
      <FadeIn>
        <section id="demo" className="py-20 bg-[#F8F9FA]">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F1B35] mb-4">Se det i aktion</h2>
            <p className="text-lg text-[#374151] mb-8">Prøv beregneren her — præcis som dine kunder vil se den</p>
            <div className="rounded-2xl bg-white shadow-xl p-4 md:p-8">
              <div className="rounded-xl bg-gray-100 h-[400px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Demo-beregner vises her når en demo-tenant er oprettet</p>
              </div>
            </div>
            <p className="text-sm text-[#374151] mt-4">Denne beregner kan ligge på din hjemmeside i morgen</p>
          </div>
        </section>
      </FadeIn>

      {/* FEATURES */}
      <FadeIn>
        <section id="funktioner" className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center text-[#0F1B35] mb-12">Alt hvad du behøver</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: '🧮', title: 'Smart prisberegner', desc: 'Beregner automatisk pris baseret på adresse og BBR-data. Altid præcis.' },
                { icon: '📄', title: 'Professionelle tilbud', desc: 'Flotte PDF-tilbud der ser ud som om en grafiker har lavet dem.' },
                { icon: '📧', title: 'Automatisk mail + SMS', desc: 'Tilbudet sendes automatisk til kunden med det samme.' },
                { icon: '🔔', title: 'Automatiske påmindelser', desc: 'Systemet husker opfølgning for dig. Aldrig et glemt lead igen.' },
                { icon: '✅', title: 'Digital accept', desc: 'Kunden accepterer med et klik. Du får besked med det samme.' },
                { icon: '📊', title: 'Komplet overblik', desc: 'Se alle tilbud, kunder og omsætning ét sted.' },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl border p-6">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="text-lg font-bold text-[#0F1B35] mb-2">{f.title}</h3>
                  <p className="text-[#374151] text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* SÅDAN VIRKER DET */}
      <FadeIn>
        <section className="py-20 bg-[#F8F9FA]">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center text-[#0F1B35] mb-12">Sådan virker det</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: '1', title: 'Opret og tilpas', desc: 'Vælg dine ydelser, sæt dine priser og upload dit logo. Klar på 10 minutter.' },
                { num: '2', title: 'Indsæt på din hjemmeside', desc: 'Kopier ét stykke kode ind på din hjemmeside. Eller brug din personlige bergn.dk-side.' },
                { num: '3', title: 'Modtag leads automatisk', desc: 'Kunder beregner pris, du modtager kvalificerede leads — automatisk.' },
              ].map((s) => (
                <div key={s.num} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B4332] text-white text-xl font-bold">
                    {s.num}
                  </div>
                  <h3 className="text-lg font-bold text-[#0F1B35] mb-2">{s.title}</h3>
                  <p className="text-[#374151] text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* BRANCHER */}
      <FadeIn>
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F1B35] mb-8">Til alle typer håndværkere</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {['Tagmaling', 'Malerarbejde', 'Fliserens', 'Vinduespolering', 'Isolering', 'Tømrer', 'Murer', 'Og mange flere'].map((b) => (
                <span key={b} className="rounded-full bg-[#F8F9FA] border px-5 py-2.5 text-sm font-medium text-[#374151]">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* PRISER */}
      <FadeIn>
        <section id="priser" className="py-20 bg-[#F8F9FA]">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center text-[#0F1B35] mb-12">Enkel prissætning</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Starter', price: '299', features: ['50 tilbud per måned', 'Email-tilbud', '1 beregner', 'Grundlæggende admin'], cta: 'Kom i gang', popular: false },
                { name: 'Pro', price: '599', features: ['200 tilbud per måned', 'Email + SMS', 'PDF-tilbud', '3 beregnere', 'Automatiske påmindelser'], cta: 'Start gratis i 14 dage', popular: true },
                { name: 'Business', price: '999', features: ['1.000 tilbud per måned', 'Alt fra Pro', 'Ubegrænsede beregnere', '5 brugere', 'Prioriteret support'], cta: 'Kontakt os', popular: false },
              ].map((plan) => (
                <div key={plan.name} className={`rounded-2xl bg-white p-8 ${plan.popular ? 'ring-2 ring-[#E8500A] shadow-xl relative' : 'border shadow-sm'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#E8500A] px-4 py-1 text-xs font-bold text-white">
                      Mest populær
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-[#0F1B35]">{plan.name}</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-extrabold text-[#0F1B35]">{plan.price}</span>
                    <span className="text-[#374151]"> kr/md</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[#374151]">
                        <Check className="h-4 w-4 text-[#1B4332] shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`block w-full rounded-lg py-3 text-center font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-[#E8500A] text-white hover:bg-[#d04609]'
                        : 'border-2 border-[#0F1B35] text-[#0F1B35] hover:bg-[#0F1B35] hover:text-white'
                    }`}
                  >
                    {plan.cta} &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* FAQ */}
      <FadeIn>
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center text-[#0F1B35] mb-12">Ofte stillede spørgsmål</h2>
            <div className="space-y-3">
              {[
                { q: 'Virker det på WordPress og andre hjemmesider?', a: 'Ja! Beregneren fungerer med alle hjemmesider — WordPress, Wix, Squarespace, custom-byggede sites og alt derimellem. Du kopierer blot et stykke kode.' },
                { q: 'Kræver det teknisk viden at sætte op?', a: 'Nej. Du kan være klar på 10 minutter uden teknisk viden. Og har du en webudvikler, kan du sende embed-koden direkte til dem.' },
                { q: 'Hvad sker der når mine 14 dage er gået?', a: 'Du vælger selv om du vil fortsætte med en betalt plan. Ingen automatisk opkrævning under prøveperioden.' },
                { q: 'Kan jeg skifte plan når som helst?', a: 'Ja, du kan frit opgradere eller nedgradere din plan når som helst.' },
                { q: 'Hvad er et tilbud i jeres system?', a: 'Et tilbud er et prisoverslag sendt til en kunde — enten via beregneren eller manuelt fra admin-panelet. Det tæller som ét lead.' },
                { q: 'Kan jeg bruge mit eget logo og farver?', a: 'Absolut. Du uploader dit logo og vælger din primærfarve under opsætningen.' },
                { q: 'Hvordan sikrer I mine kunders data? (GDPR)', a: 'Alle data opbevares i EU (Frankfurt). Vi sletter automatisk gamle leads efter 24 måneder. GDPR-accept er indbygget i beregneren.' },
                { q: 'Kan jeg afmelde når som helst?', a: 'Ja, ingen binding. Du kan afmelde dit abonnement når som helst fra admin-panelet.' },
              ].map((faq) => (
                <details key={faq.q} className="group rounded-lg border">
                  <summary className="cursor-pointer px-6 py-4 font-semibold text-[#0F1B35] flex items-center justify-between">
                    {faq.q}
                    <span className="text-[#374151] group-open:rotate-45 transition-transform text-xl">+</span>
                  </summary>
                  <p className="px-6 pb-4 text-sm text-[#374151] leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* FINAL CTA */}
      <section className="py-20 bg-[#0F1B35] text-white text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Klar til at vinde flere tilbud?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Start din 14-dages gratis prøveperiode — intet kreditkort, ingen binding.
          </p>
          <Link href="/signup" className="inline-flex items-center justify-center rounded-lg bg-[#E8500A] px-10 py-4 text-lg font-bold text-white hover:bg-[#d04609] transition-colors">
            Kom i gang nu &rarr;
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-lg font-bold text-[#0F1B35] mb-2">Bergn<span className="text-[#E8500A]">.dk</span></div>
              <p className="text-xs text-[#374151]">Tilbudsværktøj til håndværkere</p>
              <p className="text-xs text-[#374151] mt-2">&copy; 2026 Bergn.dk ApS</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#0F1B35] mb-3">Produkt</h4>
              <div className="space-y-2 text-sm text-[#374151]">
                <a href="#funktioner" className="block hover:text-[#0F1B35]">Funktioner</a>
                <a href="#priser" className="block hover:text-[#0F1B35]">Priser</a>
                <a href="#demo" className="block hover:text-[#0F1B35]">Demo</a>
                <Link href="/login" className="block hover:text-[#0F1B35]">Log ind</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#0F1B35] mb-3">Juridisk</h4>
              <div className="space-y-2 text-sm text-[#374151]">
                <a href="/privatlivspolitik" className="block hover:text-[#0F1B35]">Privatlivspolitik</a>
                <a href="/handelsbetingelser" className="block hover:text-[#0F1B35]">Handelsbetingelser</a>
                <a href="/gdpr" className="block hover:text-[#0F1B35]">GDPR</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#0F1B35] mb-3">Kontakt</h4>
              <div className="space-y-2 text-sm text-[#374151]">
                <p>hej@bergn.dk</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
