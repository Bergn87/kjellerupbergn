import Link from 'next/link'
import {
  Check, Clock, UserX, BarChart3, Calculator,
  FileText, Send, Bell, CheckCircle, ChevronDown,
  ArrowRight, Home, Droplets, Paintbrush, Sparkles,
} from 'lucide-react'
import LandingNav from '@/components/shared/LandingNav'
import FadeIn from '@/components/shared/FadeIn'
import DashboardMockup from '@/components/marketing/DashboardMockup'
import CalculatorMockup from '@/components/marketing/CalculatorMockup'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />

      {/* ═══ HERO ═══ */}
      <section className="relative bg-primary overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-28 pb-20 md:pt-36 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
                Dine kunder beregner prisen selv.{' '}
                <span className="text-bergn-accent">Du får tilbuddet.</span>
              </h1>

              <p className="mt-5 text-lg text-white/60 max-w-lg leading-relaxed">
                Bergn giver håndværkere en prisberegner til hjemmesiden. Kunden
                indtaster sin adresse, systemet henter BBR-data og beregner prisen.
                Du modtager et færdigt tilbud.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-bergn-cta px-6 py-3 text-base font-semibold text-white hover:bg-bergn-cta-hover transition-colors"
                >
                  Start gratis i 14 dage
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-white/20 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Se beregneren i aktion
                </a>
              </div>

              <p className="mt-6 text-sm text-white/40">
                Brugt af tagrensere, malere og vinduespolerere i hele Danmark
              </p>
            </div>

            {/* Right — dashboard mockup */}
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROBLEMER ═══ */}
      <FadeIn>
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Clock, title: '2 timer per tilbud', desc: 'De fleste håndværkere bruger 1-2 timer på at beregne og skrive et tilbud. Med Bergn tager det under 10 sekunder.' },
                { icon: UserX, title: 'Leads der aldrig svarer', desc: 'Kunden beder om et tilbud per email. Du skriver det manuelt. De svarer aldrig. Bergn sender automatisk påmindelser.' },
                { icon: BarChart3, title: 'Ingen overblik over pipeline', desc: 'Hvem har fået tilbud? Hvem har accepteret? Med Bergn ser du alt ét sted — med status, beløb og dato.' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-8 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ═══ DEMO ═══ */}
      <FadeIn>
        <section id="demo" className="py-20 bg-bergn-page-bg">
          <div className="mx-auto max-w-3xl px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Prøv beregneren
              </h2>
              <p className="text-gray-500 mt-3 max-w-md mx-auto">
                Indtast en adresse og se hvordan prisberegneren virker — præcis som dine kunder ser den.
              </p>
            </div>
            <CalculatorMockup />
            <p className="text-center text-sm text-gray-400 mt-6">
              Denne beregner kan ligge på din hjemmeside i morgen
            </p>
          </div>
        </section>
      </FadeIn>

      {/* ═══ FEATURES ═══ */}
      <FadeIn>
        <section id="funktioner" className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Hvad du får med Bergn
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Calculator, title: 'Prisberegner med BBR-data', desc: 'Kunden indtaster sin adresse. Vi henter tagtype, areal og hældning fra BBR. Prisen beregnes automatisk.' },
                { icon: FileText, title: 'PDF-tilbud med dit logo', desc: 'Systemet genererer et professionelt PDF-tilbud med din virksomheds logo, CVR og kontaktoplysninger.' },
                { icon: Send, title: 'Email og SMS automatisk', desc: 'Tilbuddet sendes til kunden med det samme — email og SMS. Du behøver ikke løfte en finger.' },
                { icon: Bell, title: 'Påmindelser der virker', desc: 'Har kunden ikke svaret efter 3 dage? Bergn sender en venlig påmindelse. Du slipper for at huske det.' },
                { icon: CheckCircle, title: 'Digital accept med ét klik', desc: 'Kunden accepterer tilbuddet direkte fra emailen. Du får besked med det samme i admin-panelet.' },
                { icon: BarChart3, title: 'Fuldt overblik i realtid', desc: 'Se alle leads, tilbud og omsætning i ét dashboard. Filtrer på status, dato og beløb.' },
              ].map((f) => {
                const Icon = f.icon
                return (
                  <div key={f.title} className="rounded-xl border border-gray-200 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ═══ SÅDAN VIRKER DET ═══ */}
      <FadeIn>
        <section className="py-20 bg-bergn-page-bg">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-12">Sådan virker det</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: '1', title: 'Opsæt din beregner', desc: 'Vælg ydelse, sæt dine priser og upload dit logo. Klar på 10 minutter.' },
                { num: '2', title: 'Sæt den på din hjemmeside', desc: 'Kopier embed-koden til din side. Virker med WordPress, Wix, Squarespace — alt.' },
                { num: '3', title: 'Modtag tilbud automatisk', desc: 'Kunder beregner pris på din side. Du modtager leads med alle detaljer i dit admin-panel.' },
              ].map((s) => (
                <div key={s.num} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-lg font-bold">{s.num}</div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-gray-600 text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ═══ BEREGNERE TIL DIN BRANCHE ═══ */}
      <FadeIn>
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-10">
              Beregnere til din branche
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { href: '/tagrens', icon: Home, title: 'Tagrens & Tagmaling', desc: 'Dine kunder får pris ud fra BBR-data. Du modtager leads.' },
                { href: '/fliserens', icon: Droplets, title: 'Fliserens', desc: 'Lad kunderne beregne pris på terrasse og indkørsel.' },
                { href: '/maler', icon: Paintbrush, title: 'Malerarbejde', desc: 'Beregner til ind- og udvendig maling med dine priser.' },
                { href: '/vinduespolering', icon: Sparkles, title: 'Vinduespolering', desc: 'Kunden angiver vinduer og etager. Du får et lead.' },
              ].map((c) => {
                const Icon = c.icon
                return (
                  <Link key={c.href} href={c.href} className="group rounded-xl border-t-4 border-primary bg-white border-x border-b border-x-gray-200 border-b-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{c.title}</h3>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">{c.desc}</p>
                    <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      Se beregneren <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ═══ PRISER ═══ */}
      <FadeIn>
        <section id="priser" className="py-20 bg-bergn-page-bg">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-12">Priser</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Starter', price: '299', features: ['50 tilbud / måned', 'Email-tilbud', '1 beregner', 'Admin-panel'], cta: 'Kom i gang', popular: false },
                { name: 'Pro', price: '599', features: ['200 tilbud / måned', 'Email + SMS', 'PDF-tilbud', '3 beregnere', 'Automatiske påmindelser'], cta: 'Start gratis', popular: true },
                { name: 'Business', price: '999', features: ['1.000 tilbud / måned', 'Alt fra Pro', 'Ubegrænsede beregnere', '5 brugere', 'Prioriteret support'], cta: 'Kontakt os', popular: false },
              ].map((plan) => (
                <div key={plan.name} className={`rounded-2xl bg-white p-8 ${plan.popular ? 'ring-2 ring-primary shadow-xl relative' : 'border border-gray-200'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white">Mest populær</div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
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
            <p className="text-center text-xs text-gray-400 mt-6">Alle priser er ekskl. moms</p>
          </div>
        </section>
      </FadeIn>

      {/* ═══ FAQ ═══ */}
      <FadeIn>
        <section id="faq" className="py-20 bg-white">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-12">Spørgsmål og svar</h2>
            <div className="space-y-3">
              {[
                { q: 'Virker det på WordPress og andre hjemmesider?', a: 'Ja. Beregneren fungerer med alle hjemmesider — WordPress, Wix, Squarespace, custom sites. Du kopierer blot én embed-kode.' },
                { q: 'Kræver det teknisk viden?', a: 'Nej. Du kan være klar på 10 minutter. Har du en webudvikler, kan du sende embed-koden direkte til dem.' },
                { q: 'Hvad sker der efter 14 dages prøveperiode?', a: 'Du vælger selv om du vil fortsætte med en betalt plan. Ingen automatisk opkrævning under prøveperioden.' },
                { q: 'Kan jeg skifte plan?', a: 'Ja, du kan frit opgradere eller nedgradere din plan når som helst.' },
                { q: 'Kan jeg bruge mit eget logo og farver?', a: 'Ja. Du uploader dit logo og vælger din primærfarve under opsætningen.' },
                { q: 'Hvordan håndterer I GDPR?', a: 'Alle data opbevares i EU. Vi sletter automatisk gamle leads efter 24 måneder. GDPR-accept er indbygget.' },
                { q: 'Kan jeg afmelde når som helst?', a: 'Ja. Ingen binding. Du kan afmelde fra admin-panelet med det samme.' },
              ].map((faq) => (
                <details key={faq.q} className="group rounded-lg border border-gray-200">
                  <summary className="cursor-pointer px-5 py-4 font-semibold text-gray-900 flex items-center justify-between">
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

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-20 bg-primary text-white text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Prøv Bergn gratis i 14 dage</h2>
          <p className="text-lg text-white/60 mb-8">
            Opsæt din beregner på 10 minutter. Ingen kreditkort.
          </p>
          <Link href="/signup" className="inline-flex items-center justify-center rounded-lg bg-bergn-cta px-10 py-4 text-lg font-bold text-white hover:bg-bergn-cta-hover transition-colors">
            Start gratis
          </Link>
          <p className="text-sm text-white/30 mt-4">eller ring til os: 70 60 50 40</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="text-lg font-bold text-gray-900 mb-2">Bergn<span className="text-bergn-accent">.dk</span></div>
              <p className="text-xs text-gray-500">Tilbudsværktøj til håndværkere</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-3">Produkt</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#funktioner" className="block hover:text-gray-900">Funktioner</a>
                <a href="#priser" className="block hover:text-gray-900">Priser</a>
                <a href="#demo" className="block hover:text-gray-900">Demo</a>
                <Link href="/login" className="block hover:text-gray-900">Log ind</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-3">Services</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <Link href="/tagrens" className="block hover:text-gray-900">Tagrens</Link>
                <Link href="/fliserens" className="block hover:text-gray-900">Fliserens</Link>
                <Link href="/maler" className="block hover:text-gray-900">Malerarbejde</Link>
                <Link href="/vinduespolering" className="block hover:text-gray-900">Vinduespolering</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-3">Juridisk</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="/privatlivspolitik" className="block hover:text-gray-900">Privatlivspolitik</a>
                <a href="/handelsbetingelser" className="block hover:text-gray-900">Handelsbetingelser</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-3">Kontakt</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <p>hej@bergn.dk</p>
                <p>70 60 50 40</p>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t text-xs text-gray-400 text-center">
            &copy; 2026 Bergn.dk
          </div>
        </div>
      </footer>
    </div>
  )
}
