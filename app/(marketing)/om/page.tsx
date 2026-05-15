import type { Metadata } from 'next'
import Link from 'next/link'
import LandingNav from '@/components/shared/LandingNav'

export const metadata: Metadata = {
  title: 'Om Bergn.dk — Tilbudsværktøj til håndværkere',
  description: 'Bergn.dk er et dansk SaaS-produkt der hjælper håndværkere med at automatisere tilbudsprocessen.',
}

export default function OmPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />

      <section className="pt-28 pb-16 bg-white">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">Om Bergn.dk</h1>

          <div className="prose prose-gray max-w-none text-gray-600 space-y-6 text-base leading-relaxed">
            <p>
              Bergn.dk er bygget til danske håndværkere der bruger for meget tid på
              tilbud og for lidt tid på det de er gode til.
            </p>

            <p>
              Vi giver dig en prisberegner du kan sætte på din hjemmeside.
              Dine kunder indtaster deres adresse, beregneren henter data fra
              BBR-registeret og beregner en pris ud fra dine satser. Du modtager
              et kvalificeret lead med alle detaljer — klar til opfølgning.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10">Hvorfor Bergn?</h2>

            <p>
              De fleste håndværkere håndterer tilbud manuelt. En kunde ringer,
              du kører ud og kigger på opgaven, kører hjem og skriver et tilbud.
              Det tager tid. Og halvdelen svarer aldrig.
            </p>

            <p>
              Med Bergn automatiserer du den første del. Kunden beregner selv
              prisen på din hjemmeside. Du modtager et lead med adresse, tagdata,
              prisoverslag og telefonnummer. Systemet sender tilbuddet automatisk
              og følger op med påmindelser.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10">Hvem er det til?</h2>

            <p>
              Bergn er til håndværkere og servicevirksomheder der arbejder med
              opgaver der kan prissættes ud fra areal, mængde eller andre
              målbare parametre. Tagrens, fliserens, malerarbejde,
              vinduespolering og lignende brancher.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10">Kontakt</h2>

            <p>
              Har du spørgsmål? Skriv til os på{' '}
              <a href="mailto:hej@bergn.dk" className="text-primary font-medium hover:underline">hej@bergn.dk</a>{' '}
              eller ring på <a href="tel:+4570605040" className="text-primary font-medium hover:underline">70 60 50 40</a>.
            </p>
          </div>

          <div className="mt-12">
            <Link href="/signup" className="inline-flex items-center justify-center rounded-lg bg-bergn-cta px-6 py-3 text-base font-semibold text-white hover:bg-bergn-cta-hover transition-colors">
              Prøv Bergn gratis i 14 dage
            </Link>
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
