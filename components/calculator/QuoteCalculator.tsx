'use client'

import { useReducer } from 'react'
import { Check, Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import AddressSearch from './AddressSearch'
import type { AddressSelection } from './AddressSearch'
import type { TagrensPriceConfig } from '@/lib/calculators/types'
import type { BBRData, PriceResult } from '@/types'

// ============================================
// TYPES
// ============================================

type CalculatorStep = 1 | 2 | 3 | 4 | 5

interface HouseDetails {
  tagType: string
  boligAreal: number
  tagFladeareal: number
  tagHaeldning: number
  bygningsHoejde: number
}

interface ExtraDetails {
  hasSkylights: boolean
  skylightCount: number
  hasDormers: boolean
  dormerCount: number
  hasGutters: boolean
  hasHiddenGutters: boolean
  hasSolarPanels: boolean
}

interface ContactDetails {
  name: string
  email: string
  phone: string
  message: string
  gdprAccepted: boolean
}

interface CalculatorState {
  step: CalculatorStep
  address: AddressSelection | null
  bbrData: BBRData | null
  bbrLoading: boolean
  bbrError: string | null
  houseDetails: HouseDetails | null
  houseConfirmed: boolean
  extraDetails: ExtraDetails
  priceResult: PriceResult | null
  priceLoading: boolean
  contactDetails: ContactDetails
  isSubmitting: boolean
  submitError: string | null
  submitSuccess: boolean
}

type Action =
  | { type: 'SET_ADDRESS'; payload: AddressSelection }
  | { type: 'BBR_LOADING' }
  | { type: 'BBR_SUCCESS'; payload: BBRData }
  | { type: 'BBR_ERROR'; payload: string }
  | { type: 'SET_HOUSE_DETAILS'; payload: Partial<HouseDetails> }
  | { type: 'CONFIRM_HOUSE'; payload: boolean }
  | { type: 'SET_EXTRA'; payload: Partial<ExtraDetails> }
  | { type: 'PRICE_LOADING' }
  | { type: 'PRICE_SUCCESS'; payload: PriceResult }
  | { type: 'SET_CONTACT'; payload: Partial<ContactDetails> }
  | { type: 'SET_STEP'; payload: CalculatorStep }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: string }

const initialState: CalculatorState = {
  step: 1,
  address: null,
  bbrData: null,
  bbrLoading: false,
  bbrError: null,
  houseDetails: null,
  houseConfirmed: false,
  extraDetails: {
    hasSkylights: false,
    skylightCount: 0,
    hasDormers: false,
    dormerCount: 0,
    hasGutters: true,
    hasHiddenGutters: false,
    hasSolarPanels: false,
  },
  priceResult: null,
  priceLoading: false,
  contactDetails: {
    name: '',
    email: '',
    phone: '',
    message: '',
    gdprAccepted: false,
  },
  isSubmitting: false,
  submitError: null,
  submitSuccess: false,
}

function reducer(state: CalculatorState, action: Action): CalculatorState {
  switch (action.type) {
    case 'SET_ADDRESS':
      return { ...state, address: action.payload, bbrError: null }
    case 'BBR_LOADING':
      return { ...state, bbrLoading: true, bbrError: null }
    case 'BBR_SUCCESS': {
      const bbr = action.payload
      return {
        ...state,
        bbrLoading: false,
        bbrData: bbr,
        houseDetails: {
          tagType: bbr.tagType ?? 'Andet',
          boligAreal: bbr.boligAreal ?? 0,
          tagFladeareal: bbr.tagFladeareal ?? 0,
          tagHaeldning: bbr.tagHaeldning ?? 30,
          bygningsHoejde: bbr.bygningsHoejde ?? 3,
        },
        step: 2,
      }
    }
    case 'BBR_ERROR':
      return {
        ...state,
        bbrLoading: false,
        bbrError: action.payload,
        houseDetails: {
          tagType: 'Andet',
          boligAreal: 0,
          tagFladeareal: 0,
          tagHaeldning: 30,
          bygningsHoejde: 3,
        },
      }
    case 'SET_HOUSE_DETAILS':
      return {
        ...state,
        houseDetails: state.houseDetails
          ? { ...state.houseDetails, ...action.payload }
          : null,
      }
    case 'CONFIRM_HOUSE':
      return { ...state, houseConfirmed: action.payload }
    case 'SET_EXTRA':
      return { ...state, extraDetails: { ...state.extraDetails, ...action.payload } }
    case 'PRICE_LOADING':
      return { ...state, priceLoading: true }
    case 'PRICE_SUCCESS':
      return { ...state, priceLoading: false, priceResult: action.payload, step: 4 }
    case 'SET_CONTACT':
      return { ...state, contactDetails: { ...state.contactDetails, ...action.payload } }
    case 'SET_STEP':
      return { ...state, step: action.payload }
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, submitError: null }
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, submitSuccess: true }
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, submitError: action.payload }
    default:
      return state
  }
}

// ============================================
// PROPS
// ============================================

interface QuoteCalculatorProps {
  tenantId: string
  calculatorId: string
  priceConfig: TagrensPriceConfig
  primaryColor?: string
}

// ============================================
// COMPONENT
// ============================================

export default function QuoteCalculator({
  tenantId,
  calculatorId,
  priceConfig,
  primaryColor = '#1B4332',
}: QuoteCalculatorProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // ── TRIN 1: Hent BBR ──────────────────────
  async function handleFetchBBR() {
    if (!state.address) return
    dispatch({ type: 'BBR_LOADING' })

    try {
      const res = await fetch('/api/bbr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adgAdrId: state.address.adgAdrId }),
      })
      const json = await res.json()

      if (!res.ok || !json.data) {
        dispatch({ type: 'BBR_ERROR', payload: 'Kunne ikke hente oplysninger' })
        return
      }

      dispatch({ type: 'BBR_SUCCESS', payload: json.data })
    } catch {
      dispatch({ type: 'BBR_ERROR', payload: 'Netværksfejl — prøv igen' })
    }
  }

  // ── TRIN 3: Beregn pris ───────────────────
  async function handleCalculatePrice() {
    if (!state.houseDetails) return
    dispatch({ type: 'PRICE_LOADING' })

    try {
      const res = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculatorId,
          houseDetails: state.houseDetails,
          extraDetails: {
            oenskerMaling: false,
            antalOvenlysvinduer: state.extraDetails.hasSkylights
              ? state.extraDetails.skylightCount
              : 0,
            antalTagkviste: state.extraDetails.hasDormers
              ? state.extraDetails.dormerCount
              : 0,
            harTagrender: state.extraDetails.hasGutters,
            harSkjulteTagrender: state.extraDetails.hasHiddenGutters,
            harSolceller: state.extraDetails.hasSolarPanels,
          },
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.data) {
        dispatch({ type: 'SUBMIT_ERROR', payload: json.error || 'Beregningsfejl' })
        return
      }

      dispatch({ type: 'PRICE_SUCCESS', payload: json.data })
    } catch {
      dispatch({ type: 'SUBMIT_ERROR', payload: 'Netværksfejl — prøv igen' })
    }
  }

  // ── TRIN 5: Send tilbud ───────────────────
  async function handleSubmitQuote() {
    dispatch({ type: 'SUBMIT_START' })

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          calculatorId,
          name: state.contactDetails.name,
          email: state.contactDetails.email,
          phone: state.contactDetails.phone,
          address: state.address?.displayText ?? '',
          message: state.contactDetails.message,
          bbrData: state.bbrData,
          houseDetails: state.houseDetails,
          extraDetails: state.extraDetails,
          lineItems: state.priceResult?.lineItems ?? [],
          totalExclVat: state.priceResult?.totalExclVat ?? 0,
          totalInclVat: state.priceResult?.totalInclVat ?? 0,
          gdprAccepted: state.contactDetails.gdprAccepted,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        dispatch({ type: 'SUBMIT_ERROR', payload: json.error || 'Der opstod en fejl' })
        return
      }

      dispatch({ type: 'SUBMIT_SUCCESS' })
    } catch {
      dispatch({ type: 'SUBMIT_ERROR', payload: 'Netværksfejl — prøv igen' })
    }
  }

  // ── Aktive tagtyper ───────────────────────
  const activeTagTypes = Object.entries(priceConfig.tagtyper)
    .filter(([, cfg]) => cfg.aktiv)
    .map(([name]) => name)

  // ── Formatér kroner ───────────────────────
  const formatKr = (n: number) =>
    new Intl.NumberFormat('da-DK').format(Math.round(n)) + ' kr.'

  // ============================================
  // RENDER
  // ============================================

  if (state.submitSuccess) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Tak for din henvendelse!</h2>
          <p className="text-muted-foreground">
            Vi sender dit detaljerede tilbud inden for 1 time.
            Tjek din email ({state.contactDetails.email}).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
        {/* ── PROGRESS BAR ────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  state.step > s
                    ? 'bg-green-500 text-white'
                    : state.step === s
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-500'
                )}
                style={state.step === s ? { backgroundColor: primaryColor } : undefined}
              >
                {state.step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 5 && (
                <div
                  className={cn(
                    'mx-1 h-0.5 w-6 sm:w-10',
                    state.step > s ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── TRIN 1: ADRESSE ─────────────── */}
        {state.step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Find din adresse</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Vi henter automatisk oplysninger om dit hus
              </p>
            </div>

            <AddressSearch
              onSelect={(addr) => dispatch({ type: 'SET_ADDRESS', payload: addr })}
              initialValue={state.address?.displayText}
            />

            {state.bbrLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Henter oplysninger fra BBR...
              </div>
            )}

            {state.bbrError && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{state.bbrError}</p>
                <button
                  type="button"
                  className="text-sm underline text-muted-foreground"
                  onClick={() => {
                    dispatch({
                      type: 'BBR_ERROR',
                      payload: '',
                    })
                    dispatch({ type: 'SET_STEP', payload: 2 })
                  }}
                >
                  Indtast manuelt i stedet
                </button>
              </div>
            )}

            <Button
              className="w-full"
              style={{ backgroundColor: primaryColor }}
              disabled={!state.address || state.bbrLoading}
              onClick={handleFetchBBR}
            >
              Hent husoplysninger
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── TRIN 2: HUSOPLYSNINGER ──────── */}
        {state.step === 2 && state.houseDetails && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Tjek dine oplysninger</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {state.bbrData
                  ? 'Hentet fra BBR-registret — ret hvis nødvendigt'
                  : 'Udfyld oplysninger om dit tag'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tagtype</Label>
                <Select
                  value={state.houseDetails.tagType}
                  onValueChange={(v) => {
                    if (v) dispatch({ type: 'SET_HOUSE_DETAILS', payload: { tagType: v } })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTagTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Boligareal (m²)</Label>
                  <Input
                    type="number"
                    value={state.houseDetails.boligAreal || ''}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_HOUSE_DETAILS',
                        payload: { boligAreal: Number(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagfladeareal (m²)</Label>
                  <Input
                    type="number"
                    value={state.houseDetails.tagFladeareal || ''}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_HOUSE_DETAILS',
                        payload: { tagFladeareal: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hældning (grader)</Label>
                  <Input
                    type="number"
                    value={state.houseDetails.tagHaeldning || ''}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_HOUSE_DETAILS',
                        payload: { tagHaeldning: Number(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Højde til tagkant (m)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={state.houseDetails.bygningsHoejde || ''}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_HOUSE_DETAILS',
                        payload: { bygningsHoejde: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="confirm"
                  checked={state.houseConfirmed}
                  onCheckedChange={(v) =>
                    dispatch({ type: 'CONFIRM_HOUSE', payload: v === true })
                  }
                />
                <Label htmlFor="confirm" className="text-sm cursor-pointer">
                  Oplysningerne er korrekte
                </Label>
              </div>
            </div>

            <Button
              className="w-full"
              style={{ backgroundColor: primaryColor }}
              disabled={!state.houseConfirmed}
              onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })}
            >
              Fortsæt
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── TRIN 3: EKSTRA DETALJER ─────── */}
        {state.step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Et par hurtige spørgsmål</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Så vi kan beregne en præcis pris
              </p>
            </div>

            <div className="space-y-4">
              <YesNoQuestion
                label="Har du ovenlysvinduer?"
                value={state.extraDetails.hasSkylights}
                onChange={(v) => dispatch({ type: 'SET_EXTRA', payload: { hasSkylights: v } })}
                primaryColor={primaryColor}
              />
              {state.extraDetails.hasSkylights && (
                <div className="ml-4 space-y-2">
                  <Label>Antal ovenlysvinduer</Label>
                  <Input
                    type="number"
                    min={1}
                    value={state.extraDetails.skylightCount || ''}
                    onChange={(e) =>
                      dispatch({ type: 'SET_EXTRA', payload: { skylightCount: Number(e.target.value) } })
                    }
                    className="max-w-[120px]"
                  />
                </div>
              )}

              <YesNoQuestion
                label="Har du tagkviste?"
                value={state.extraDetails.hasDormers}
                onChange={(v) => dispatch({ type: 'SET_EXTRA', payload: { hasDormers: v } })}
                primaryColor={primaryColor}
              />
              {state.extraDetails.hasDormers && (
                <div className="ml-4 space-y-2">
                  <Label>Antal tagkviste</Label>
                  <Input
                    type="number"
                    min={1}
                    value={state.extraDetails.dormerCount || ''}
                    onChange={(e) =>
                      dispatch({ type: 'SET_EXTRA', payload: { dormerCount: Number(e.target.value) } })
                    }
                    className="max-w-[120px]"
                  />
                </div>
              )}

              <YesNoQuestion
                label="Har du tagrender?"
                value={state.extraDetails.hasGutters}
                onChange={(v) => dispatch({ type: 'SET_EXTRA', payload: { hasGutters: v } })}
                primaryColor={primaryColor}
              />

              <YesNoQuestion
                label="Har du skjulte tagrender?"
                value={state.extraDetails.hasHiddenGutters}
                onChange={(v) => dispatch({ type: 'SET_EXTRA', payload: { hasHiddenGutters: v } })}
                primaryColor={primaryColor}
              />

              <YesNoQuestion
                label="Har du solceller eller solfanger?"
                value={state.extraDetails.hasSolarPanels}
                onChange={(v) => dispatch({ type: 'SET_EXTRA', payload: { hasSolarPanels: v } })}
                primaryColor={primaryColor}
              />
            </div>

            <Button
              className="w-full"
              style={{ backgroundColor: primaryColor }}
              disabled={state.priceLoading}
              onClick={handleCalculatePrice}
            >
              {state.priceLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Beregner pris...
                </>
              ) : (
                <>
                  Se min pris
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── TRIN 4: PRISOVERSLAG ────────── */}
        {state.step === 4 && state.priceResult && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Dit prisoverslag</h2>

            <div className="space-y-3">
              {state.priceResult.lineItems.map((item, i) => (
                <div key={i} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} × {formatKr(item.unit_price)}
                    </p>
                  </div>
                  <p className="text-sm font-medium whitespace-nowrap ml-4">
                    {formatKr(item.total)}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal ekskl. moms</span>
                <span>{formatKr(state.priceResult.totalExclVat)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Moms (25%)</span>
                <span>{formatKr(state.priceResult.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Total inkl. moms</span>
                <span>{formatKr(state.priceResult.totalInclVat)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-xs text-muted-foreground">
              Dette er et estimat baseret på de oplyste data.
              Endelig pris aftales ved besigtigelse.
            </div>

            <Button
              className="w-full text-white"
              style={{ backgroundColor: '#E8500A' }}
              size="lg"
              onClick={() => {
                dispatch({
                  type: 'SET_CONTACT',
                  payload: {
                    message: `Prisoverslag: ${formatKr(state.priceResult!.totalInclVat)} inkl. moms\nAdresse: ${state.address?.displayText ?? ''}`,
                  },
                })
                dispatch({ type: 'SET_STEP', payload: 5 })
              }}
            >
              Få dit tilbud
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── TRIN 5: KONTAKTOPLYSNINGER ──── */}
        {state.step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Modtag dit tilbud</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Vi sender et detaljeret tilbud inden for 1 time
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={state.contactDetails.name}
                  onChange={(e) =>
                    dispatch({ type: 'SET_CONTACT', payload: { name: e.target.value } })
                  }
                  placeholder="Dit fulde navn"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={state.contactDetails.email}
                  onChange={(e) =>
                    dispatch({ type: 'SET_CONTACT', payload: { email: e.target.value } })
                  }
                  placeholder="din@email.dk"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={state.contactDetails.phone}
                  onChange={(e) =>
                    dispatch({ type: 'SET_CONTACT', payload: { phone: e.target.value } })
                  }
                  placeholder="12 34 56 78"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Besked</Label>
                <Textarea
                  id="message"
                  value={state.contactDetails.message}
                  onChange={(e) =>
                    dispatch({ type: 'SET_CONTACT', payload: { message: e.target.value } })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="gdpr"
                  checked={state.contactDetails.gdprAccepted}
                  onCheckedChange={(v) =>
                    dispatch({ type: 'SET_CONTACT', payload: { gdprAccepted: v === true } })
                  }
                />
                <Label htmlFor="gdpr" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  Jeg accepterer at mine oplysninger behandles i henhold til{' '}
                  <a href="/privatlivspolitik" className="underline" target="_blank">
                    privatlivspolitikken
                  </a>
                </Label>
              </div>
            </div>

            {state.submitError && (
              <p className="text-sm text-destructive">{state.submitError}</p>
            )}

            <Button
              className="w-full"
              style={{ backgroundColor: primaryColor }}
              size="lg"
              disabled={
                state.isSubmitting ||
                !state.contactDetails.name ||
                !state.contactDetails.email ||
                !state.contactDetails.phone ||
                !state.contactDetails.gdprAccepted
              }
              onClick={handleSubmitQuote}
            >
              {state.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sender tilbud...
                </>
              ) : (
                <>
                  Send og modtag tilbud
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// YesNo TOGGLE KOMPONENT
// ============================================

function YesNoQuestion({
  label,
  value,
  onChange,
  primaryColor,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  primaryColor: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn(
            'min-h-[52px] rounded-lg border-2 font-medium transition-colors',
            value
              ? 'border-transparent text-white'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          )}
          style={value ? { backgroundColor: primaryColor } : undefined}
          onClick={() => onChange(true)}
        >
          Ja
        </button>
        <button
          type="button"
          className={cn(
            'min-h-[52px] rounded-lg border-2 font-medium transition-colors',
            !value
              ? 'border-transparent text-white'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          )}
          style={!value ? { backgroundColor: primaryColor } : undefined}
          onClick={() => onChange(false)}
        >
          Nej
        </button>
      </div>
    </div>
  )
}
