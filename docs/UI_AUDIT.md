# UI/UX Audit Report

Dato: 2026-05-15
Auditor: Claude (Sprint 0)
Branch: `sprint-0-ui-audit`

Scope: `app/(marketing)/`, `app/(auth)/`, `app/(admin)/admin/`

---

## P0 — Kritiske bugs

### Login-redirect sender brugere til signup-flow

- **Fil(er):**
  - `middleware.ts` (linje 70-80)
  - `app/(admin)/layout.tsx` (linje 14-17)
  - `app/(onboarding)/onboarding/page.tsx` (linje 54-60, trin 1)
- **Beskrivelse:** En logget-ind bruger uden tenant (fx en der har oprettet konto men ikke faerdiggjort onboarding) klikker "Log ind" og ender i signup-wizarden i stedet for at komme tilbage til sit flow. Redirect-kaeden er: `/login` -> middleware ser logget-ind bruger -> redirect til `/admin/dashboard` -> admin layout ser ingen tenant -> redirect til `/onboarding` -> onboarding trin 1 viser kontooprettelses-formular (email + password). Brugeren har allerede en konto, saa dette er forvirrende og fejlagtigt.
- **Reproduktion:**
  1. Opret en bruger via onboarding (gennemfoer trin 1, luk browseren foer trin 2)
  2. Gaa til bergn.dk og klik "Log ind" i navigationen
  3. Middleware redirect: `/login` -> `/admin/dashboard` -> `/onboarding`
  4. Bruger ser signup-formular (trin 1) i stedet for firma-info (trin 2)
- **Foreslaaet loesning:** Tilfoej en `useEffect` i `app/(onboarding)/onboarding/page.tsx` der kalder `supabase.auth.getUser()` paa mount. Hvis en session eksisterer: set `accountCreated: true`, pre-fill email, og spring automatisk til trin 2. Middleware aendres IKKE (andre flows afhaenger af den).
- **Estimeret tid:** 60-90 minutter

---

## P1 — Visuel konsistens

### 1.1 Brand-tokens defineret men aldrig brugt

- **Fil(er):** `app/globals.css` (linje 52-58)
- **Beskrivelse:** Seks CSS custom properties er defineret som brand-tokens:
  ```
  --bergn-sidebar: #1B3C2E
  --bergn-sidebar-dark: #152F24
  --bergn-accent: #D4A843
  --bergn-accent-text: #92710A
  --bergn-page-bg: #F5F6FA
  --bergn-card-border: #E8EAF0
  ```
  Ingen af disse bruges noget sted i kodebasen. I stedet er de samme hex-vaerdier hardcodet direkte i Tailwind classes 80+ steder paa tvaers af 20+ filer.
- **Reproduktion:** `grep -r "var(--bergn" --include="*.tsx"` returnerer 0 resultater.
- **Foreslaaet loesning:**
  1. Opdater `--primary` i globals.css fra `oklch(0.205 0 0)` (near-black) til oklch-aequivalent af `#1B3C2E` (ca. `oklch(0.27 0.04 163)`)
  2. Tilfoej Tailwind theme-mappings i `@theme inline` blokken: `--color-bergn-cta`, `--color-bergn-accent`, `--color-bergn-page-bg`, `--color-bergn-card-border`
  3. Search-and-replace alle hardcodede hex-vaerdier med Tailwind token-klasser
- **Estimeret tid:** 3-4 timer

### 1.2 Hardcodede farver — komplet oversigt

| Farve | Hex | Antal filer | Eksempel-fil:linje | Erstatning |
|-------|-----|-------------|---------------------|------------|
| Brand green | `#1B3C2E` | 30+ | `Sidebar.tsx:49`, `LandingNav.tsx:34`, `page.tsx:18` | `primary` (via opdateret --primary) |
| Dark green hover | `#152F24` | 8 | `Sidebar.tsx:49` (implicit), `layout.tsx:41` | `primary/90` |
| Gold accent | `#D4A843` | 15+ | `Sidebar.tsx:55,80,84,93`, `LandingNav.tsx:35` | `bergn-accent` |
| Dark gold text | `#92710A` | 3 | `StatusBadge.tsx:5` | `bergn-accent-text` |
| CTA orange | `#E8500A` | 10 | `LandingNav.tsx:63,91`, `page.tsx:37` | `bergn-cta` |
| CTA hover | `#d04609` | 10 | `LandingNav.tsx:63`, `page.tsx:37` | `bergn-cta/90` |
| Page background | `#F5F6FA` | 7 | `layout.tsx:32`, `page.tsx:90` | `bergn-page-bg` |
| Card border | `#E8EAF0` | 15+ | `dashboard/page.tsx`, `quotes/page.tsx` | `bergn-card-border` |
| Alt green | `#1B4332` | 2 | `quotes/[id]/page.tsx:60`, `onboarding/page.tsx:60` | Brug `primary` i stedet |

### 1.3 Button-stile inkonsistente

- **Fil(er):**
  - `components/ui/button.tsx` — default variant bruger `bg-primary` (som er near-black, ikke brand-green)
  - Admin-sider overrider med `className="bg-[#1B3C2E] hover:bg-[#152F24]"` (fx `dashboard/page.tsx`, `templates/page.tsx`, `company/page.tsx`)
  - CTA-knapper: nogle bruger `className="bg-[#E8500A]"`, en enkelt bruger `style={{ backgroundColor: '#E8500A' }}` (inline style i stedet for className)
- **Reproduktion:** Soeg efter `bg-\[#1B3C2E\]` i admin-filer — finder 10+ forekomster af identisk override.
- **Foreslaaet loesning:** Naar `--primary` rettes til brand-green, vil default Button variant automatisk vaere korrekt. Alle manuelle overrides kan fjernes.
- **Estimeret tid:** Inkluderet i 1.1 ovenfor

### 1.4 Card border-stile inkonsistente

- **Fil(er):** Diverse admin-sider
- **Beskrivelse:** Nogle Card-komponenter har `border border-[#E8EAF0]`, andre bruger default (ingen explicit border). Der er ingen konsistent regel for hvornaar cards har border.
- **Foreslaaet loesning:** Standardiser til `border-bergn-card-border` paa alle admin-cards efter token-migration.
- **Estimeret tid:** 30 minutter (del af farve-migration)

---

## P1 — Mobil responsivitet

### 1.5 Services dropdown virker ikke paa touch-enheder

- **Fil(er):** `components/shared/LandingNav.tsx` (linje 40)
- **Beskrivelse:** Dropdown bruger `onMouseEnter`/`onMouseLeave` til at styre synlighed. Paa touch-enheder (tablets i landscape over `md:` breakpoint) kan dropdown ikke aabnes.
- **Reproduktion:** Aaben bergn.dk paa iPad i landscape → klik paa "Services" → intet sker.
- **Foreslaaet loesning:** Tilfoej `onClick` toggle paa button-elementet. Behold hover for desktop. Tilfoej `aria-expanded={servicesOpen}` og `aria-haspopup="true"`.
- **Estimeret tid:** 30 minutter

### 1.6 Hamburger-knap mangler aria-label

- **Fil(er):** `components/shared/LandingNav.tsx` (linje 69)
- **Beskrivelse:** `<button className="md:hidden p-2">` indeholder kun et ikon (Menu/X) uden tekst eller aria-label. Screen readers annoncerer den som tom knap.
- **Foreslaaet loesning:** Tilfoej `aria-label={mobileOpen ? 'Luk menu' : 'Aaben menu'}`.
- **Estimeret tid:** 5 minutter

### 1.7 Admin mobile sheet trigger mangler aria-label

- **Fil(er):** `components/admin/MobileHeader.tsx` (linje 19)
- **Beskrivelse:** `<SheetTrigger>` indeholder kun Menu-ikon uden tekst eller label.
- **Foreslaaet loesning:** Tilfoej `aria-label="Aaben menu"`.
- **Estimeret tid:** 5 minutter

### 1.8 Tabeller mister vigtig info paa mobil

- **Fil(er):** `app/(admin)/admin/quotes/page.tsx`, `app/(admin)/admin/customers/page.tsx`
- **Beskrivelse:** Tabeller bruger `hidden md:table-cell` til at skjule kolonner som beloeb, dato og kilde paa mobil. Paa 375px ser brugeren kun navn og status — ikke nok info til at vurdere et tilbud.
- **Foreslaaet loesning:** Dokumenter som fremtidigt forbedringspunkt. Ultimativt: brug kort-baseret layout paa mobil i stedet for tabel. For nu: marker dette som P2/P3 til et fremtidigt sprint.
- **Estimeret tid:** N/A (fremtidigt sprint)

---

## P2 — UX-issues

### 2.1 Ingen inline form-validering paa auth-sider

- **Fil(er):**
  - `app/(auth)/login/page.tsx` (linje 74-78)
  - `app/(auth)/forgot-password/page.tsx`
  - `app/(auth)/reset-password/page.tsx` (linje 92-96)
  - `app/(onboarding)/onboarding/page.tsx`
- **Beskrivelse:** Alle auth-formularer bruger kun en enkelt `<Alert variant="destructive">` oeverst i formen. Individuelle felter viser ikke fejl-tilstand (ingen roed ramme, ingen felt-specifik fejlbesked). Input-felter har aldrig `aria-invalid` sat, selvom `components/ui/input.tsx` understotter det.
- **Foreslaaet loesning:** Tilfoej `aria-invalid={!!error}` paa relevante felter naar der er en valideringsfejl. Vis felt-specifikke fejlbeskeder under hvert input-felt.
- **Estimeret tid:** 2 timer (alle auth-sider)

### 2.2 Reset password auto-redirect for hurtigt

- **Fil(er):** `app/(auth)/reset-password/page.tsx` (linje 56-58)
- **Beskrivelse:** Efter succesfuld password-reset kalder koden `setTimeout(() => { router.push('/admin/dashboard') }, 2000)`. 2 sekunder er for kort til at laese success-beskeden, saerligt for brugere med assisterende teknologi.
- **Reproduktion:** Nulstil adgangskode → success-skaerm vises i ~2 sekunder → redirect sker automatisk.
- **Foreslaaet loesning:** Oeg timeout til 5000ms og tilfoej en "Gaa til dashboard" knap/link saa brugeren kan navigere manuelt.
- **Estimeret tid:** 15 minutter

### 2.3 Emoji-ikoner i tilbuds-tidslinje uden alt-tekst

- **Fil(er):** `app/(admin)/admin/quotes/[id]/page.tsx` (linje 63-75)
- **Beskrivelse:** Tidslinjen bruger raa emoji-strenge (`'📝'`, `'✉️'`, `'📱'`, `'🔔'`, `'✅'`, `'❌'`, `'⏰'`) som ikoner. Disse renderes i `<span>` elementer uden `role="img"` eller `aria-label`. Screen readers kan annoncere dem inkonsistent.
- **Foreslaaet loesning:** Wrap hvert emoji i `<span role="img" aria-label="[beskrivelse]">`.
- **Estimeret tid:** 15 minutter

### 2.4 Inkonsistente loading states

- **Fil(er):**
  - `app/(admin)/admin/dashboard/page.tsx` — bruger Suspense + custom DashboardSkeleton
  - `app/(admin)/admin/billing/page.tsx` — bruger Suspense + inline Loader2 spinner
  - Andre admin-sider — ingen loading state/Suspense
- **Beskrivelse:** Dashboard og Billing har loading-states, men Quotes, Customers, Calculators, Reminders, Templates, Company og Embed viser bare blank skaerm mens data loader.
- **Foreslaaet loesning:** Dokumenter moenster. I fremtidigt sprint: tilfoej Suspense med skeleton til de vigtigste sider (Quotes, Customers). For nu: marker som P3.
- **Estimeret tid:** N/A (fremtidigt sprint)

### 2.5 Inkonsistente empty states

- **Fil(er):** Diverse admin-sider
- **Beskrivelse:** Empty states eksisterer paa de fleste sider (godt!), men er stylet inkonsistent:
  - Quotes: `py-12 text-center text-muted-foreground` med soege-kontekst
  - Customers: ikon (h-12 w-12) + tekst + CTA
  - Calculators: ikon + overskrift + beskrivelse + CTA-knap
  - Ikonstoerrelse varierer, spacing varierer, nogle har CTA, andre har ikke
- **Foreslaaet loesning:** I fremtidigt sprint: opret en genbrugelig `EmptyState` komponent. For nu: dokumenter.
- **Estimeret tid:** N/A (design system fase)

---

## P2 — Tilgaengelighed

### 2.6 Ingen skip-to-content link

- **Fil(er):**
  - `app/(auth)/layout.tsx`
  - `app/(admin)/layout.tsx`
  - Landing page (via LandingNav)
- **Beskrivelse:** Ingen af layoutterne har et skip-to-content link. Keyboard-brugere skal tab'e gennem hele navigationen foer de naar indholdet.
- **Foreslaaet loesning:** Tilfoej `<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary">Spring til indhold</a>` foer navigation i hvert layout. Tilfoej `id="main"` paa main-elementet.
- **Estimeret tid:** 30 minutter

### 2.7 Services dropdown mangler ARIA-attributter

- **Fil(er):** `components/shared/LandingNav.tsx` (linje 40-51)
- **Beskrivelse:** Dropdown-knappen mangler `aria-expanded`, `aria-haspopup`. Dropdown-containeren mangler `role="menu"`. Links mangler `role="menuitem"`.
- **Foreslaaet loesning:** Tilfoej korrekte ARIA-attributter. (Loeses delvist sammen med 1.5 touch-fix).
- **Estimeret tid:** 15 minutter (del af 1.5)

### 2.8 Ikon-knapper uden aria-label i admin

- **Fil(er):**
  - `app/(admin)/admin/quotes/page.tsx` — Eye og FileText ikoner paa quote-raekker (bruger `title` i stedet for `aria-label`)
  - `app/(admin)/admin/quotes/[id]/page.tsx:83` — ArrowLeft back-knap uden label
- **Beskrivelse:** Ikon-knapper bruger `title` attribut, som ikke konsistent annonceres af screen readers. `aria-label` er den korrekte loesning.
- **Foreslaaet loesning:** Erstat `title` med `aria-label` paa alle ikon-knapper.
- **Estimeret tid:** 30 minutter

### 2.9 Form-felter mangler aria-invalid

- **Fil(er):** Alle auth-sider (login, signup, forgot-password, reset-password)
- **Beskrivelse:** Naar en valideringsfejl opstaar, vises en Alert oeverst, men de individuelle Input-felter faar aldrig `aria-invalid={true}` sat. shadcn Input-komponenten (`components/ui/input.tsx`) understotter dette og renderer en roed border — men det bruges aldrig.
- **Foreslaaet loesning:** Tilfoej `aria-invalid={!!error}` paa relevante felter i kombination med 2.1.
- **Estimeret tid:** Inkluderet i 2.1

---

## P3 — Performance

### 3.1 Marketing mockups importeret eagerly

- **Fil(er):** `app/(marketing)/page.tsx` (linje 9-10)
- **Beskrivelse:** `DashboardMockup` og `CalculatorMockup` importeres statisk og renderes paa landing page. Disse er store komponenter der er below-the-fold.
- **Foreslaaet loesning:** Brug `next/dynamic` med `{ ssr: false }` eller `{ loading: () => <div className="h-80 animate-pulse bg-gray-100 rounded-xl" /> }`.
- **Estimeret tid:** 30 minutter

### 3.2 Calculator steps importeret eagerly

- **Fil(er):** `components/calculator/QuoteCalculator.tsx` (linje 11-21)
- **Beskrivelse:** Alle 11 step-komponenter importeres statisk. Kun eet step er synligt ad gangen. Lazy-loading ville reducere initial bundle-stoerrelse.
- **Foreslaaet loesning:** Brug `React.lazy` eller `next/dynamic` for step-komponenter.
- **Estimeret tid:** 45 minutter

### 3.3 LandingNav er fuld client component

- **Fil(er):** `components/shared/LandingNav.tsx` (linje 1)
- **Beskrivelse:** `'use client'` er noedvendigt for scroll listener og state, men SERVICES array, links og telefonnummer er statisk indhold der kunne server-renderes.
- **Foreslaaet loesning:** Lavprioriteret. Eventuelt split i server-komponent (statisk indhold) + client-komponent (interaktivt).
- **Estimeret tid:** 45 minutter (valgfrit)

---

## Strukturelle observationer

### Design System status

**Hvad der findes (shadcn/ui, 24 komponenter):**
Alert, Avatar, Badge, Button, Calendar, Card, Checkbox, Command, Dialog, Dropdown-Menu, Input, Input-Group, Label, Popover, Progress, Select, Separator, Sheet, Sonner, Switch, Table, Tabs, Textarea, Toggle

**Hvad der mangler:**
- Skeleton (til loading states — dashboard har en hand-rolled version)
- Tooltip (ingen tooltips noget sted)
- Accordion/Collapsible (FAQ bruger native `<details>`)
- EmptyState (ad-hoc implementeret paa hver side)
- PageHeader (gentaget manuelt: h1 + beskrivelse + action-knap)
- FormField wrapper (label + input + fejlbesked)

**Calculator step-duplikering:**
Flere step-komponenter genimplementerer de samme UI-moenstre:
- Yes/No knapper (TagrensExtrasStep, FliserensArealStep)
- Counter-knapper med Plus/Minus (MalerRumStep, VinduerStep)
- Valg-kort med ikon + titel (MalerTypeStep, IsoleringsTypeStep)

Disse boer udtraekkes til genbrugelige komponenter i et fremtidigt sprint.

---

## Sammenfatning

| Prioritet | Antal issues | Estimeret tid |
|-----------|-------------|---------------|
| P0 — Kritiske bugs | 1 | ~1.5 timer |
| P1 — Visuel konsistens | 4 | ~4 timer |
| P1 — Mobil responsivitet | 4 (1 fremtidig) | ~1 time |
| P2 — UX-issues | 5 (2 fremtidige) | ~2.5 timer |
| P2 — Tilgaengelighed | 4 | ~1 time |
| P3 — Performance | 3 | ~2 timer (valgfrit) |
| **Total** | **21** | **~12 timer** |

### Anbefalet raekkefoelge

1. **P0:** Fix login/onboarding redirect (1 issue, stoerst bruger-impact)
2. **P1 farver:** Centraliser brand-tokens og erstat hardcodede hex-vaerdier (saetter fundament for alt andet)
3. **P1 mobil:** Fix touch dropdown + tilfoej aria-labels (hurtige wins)
4. **P2 UX:** Inline form-validering + reset password timeout (forbedrer auth-flow)
5. **P2 a11y:** Skip-to-content + ARIA-attributter (forbedrer tilgaengelighed)
6. **P3:** Performance-optimeringer (valgfrit, lavest prioritet)
