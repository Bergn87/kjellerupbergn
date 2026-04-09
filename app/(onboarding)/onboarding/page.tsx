'use client'

import { useReducer, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/actions/onboarding'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Loader2, ChevronRight, ChevronLeft, Check, Copy, ExternalLink, Home, Paintbrush, Droplets, Sparkles, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_TAGRENS_PRICE_CONFIG } from '@/lib/calculators/tagrens'

// ============================================
// STATE
// ============================================

interface OnboardingState {
  step: number
  // Trin 1
  email: string
  password: string
  confirmPassword: string
  accountCreated: boolean
  emailConfirmed: boolean
  // Trin 2
  companyName: string
  companyCvr: string
  companyPhone: string
  companyEmail: string
  // Trin 3
  calculatorTypes: string[]
  // Trin 4
  logoUrl: string | null
  primaryColor: string
  // Trin 5 (price config beholder default)
  // Trin 6
  senderEmail: string
  smsSenderName: string
  // General
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: 'SET_FIELD'; field: string; value: unknown }
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'TOGGLE_CALC_TYPE'; calcType: string }

const initialState: OnboardingState = {
  step: 1,
  email: '', password: '', confirmPassword: '',
  accountCreated: false, emailConfirmed: false,
  companyName: '', companyCvr: '', companyPhone: '', companyEmail: '',
  calculatorTypes: [],
  logoUrl: null, primaryColor: '#1B4332',
  senderEmail: '', smsSenderName: '',
  isLoading: false, error: null,
}

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.value, error: null }
    case 'SET_STEP': return { ...state, step: action.step, error: null }
    case 'SET_LOADING': return { ...state, isLoading: action.loading }
    case 'SET_ERROR': return { ...state, error: action.error }
    case 'TOGGLE_CALC_TYPE': {
      const types = state.calculatorTypes.includes(action.calcType)
        ? state.calculatorTypes.filter((t) => t !== action.calcType)
        : [...state.calculatorTypes, action.calcType]
      return { ...state, calculatorTypes: types }
    }
    default: return state
  }
}

const CALC_TYPE_OPTIONS = [
  { type: 'tagrens', label: 'Tagrens & Tagmaling', icon: Home },
  { type: 'maler', label: 'Malerarbejde', icon: Paintbrush },
  { type: 'fliserens', label: 'Fliserens', icon: Droplets },
  { type: 'vinduespolering', label: 'Vinduespolering', icon: Sparkles },
  { type: 'isolering', label: 'Isolering', icon: Home },
  { type: 'generisk', label: 'Andet', icon: Settings },
]

const COLOR_PRESETS = ['#1B4332', '#1e3a5f', '#7c2d12', '#581c87', '#0f766e', '#92400e', '#be123c', '#1d4ed8']

// ============================================
// COMPONENT
// ============================================

const STORAGE_KEY = 'bergn-onboarding'

function loadSavedState(): OnboardingState {
  if (typeof window === 'undefined') return initialState
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<OnboardingState>
      return { ...initialState, ...parsed, isLoading: false, error: null }
    }
  } catch { /* ignore */ }
  return initialState
}

export default function OnboardingPage() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [hydrated, setHydrated] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  // Hydrate state fra localStorage (kun client-side)
  useEffect(() => {
    const saved = loadSavedState()
    if (saved.step > 1) {
      // Restore alle felter
      Object.entries(saved).forEach(([key, value]) => {
        if (key !== 'isLoading' && key !== 'error' && value !== initialState[key as keyof OnboardingState]) {
          dispatch({ type: 'SET_FIELD', field: key, value })
        }
      })
      if (saved.step > 1) dispatch({ type: 'SET_STEP', step: saved.step })
    }
    setHydrated(true)
  }, [])

  // Persist state til localStorage
  useEffect(() => {
    if (!hydrated) return
    const { isLoading, error, ...rest } = state
    void isLoading; void error;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  }, [state, hydrated])

  const totalSteps = 8
  const progress = Math.round((state.step / totalSteps) * 100)

  const set = (field: string, value: unknown) => dispatch({ type: 'SET_FIELD', field, value })
  const nextStep = () => dispatch({ type: 'SET_STEP', step: Math.min(state.step + 1, totalSteps) })
  const prevStep = () => dispatch({ type: 'SET_STEP', step: Math.max(state.step - 1, 1) })

  // ── Trin 1: Opret konto ───────────────────
  async function handleSignUp() {
    if (state.password.length < 8 || !/\d/.test(state.password)) {
      dispatch({ type: 'SET_ERROR', error: 'Adgangskode skal være min. 8 tegn og indeholde mindst ét tal' })
      return
    }
    if (state.password !== state.confirmPassword) {
      dispatch({ type: 'SET_ERROR', error: 'Adgangskoderne matcher ikke' })
      return
    }

    dispatch({ type: 'SET_LOADING', loading: true })
    const { error } = await supabase.auth.signUp({ email: state.email, password: state.password })
    dispatch({ type: 'SET_LOADING', loading: false })

    if (error) {
      dispatch({ type: 'SET_ERROR', error: error.message })
      return
    }
    set('accountCreated', true)
  }

  async function checkEmailConfirmed() {
    dispatch({ type: 'SET_LOADING', loading: true })

    // Log ind med password — dette fejler hvis email ikke er bekræftet
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: state.email,
      password: state.password,
    })

    dispatch({ type: 'SET_LOADING', loading: false })

    if (signInError) {
      // "Email not confirmed" fejl fra Supabase
      if (signInError.message.toLowerCase().includes('email')) {
        dispatch({ type: 'SET_ERROR', error: 'Email er endnu ikke bekræftet. Tjek din indbakke og klik linket.' })
      } else {
        dispatch({ type: 'SET_ERROR', error: signInError.message })
      }
      return
    }

    if (signInData.user) {
      set('emailConfirmed', true)
      set('companyEmail', state.email)
      nextStep()
    }
  }

  // ── Trin 8: Fuldfør ───────────────────────
  async function handleComplete() {
    dispatch({ type: 'SET_LOADING', loading: true })
    try {
      await completeOnboarding({
        companyName: state.companyName,
        companyCvr: state.companyCvr,
        companyPhone: state.companyPhone,
        companyEmail: state.companyEmail,
        calculatorTypes: state.calculatorTypes,
        logoUrl: state.logoUrl,
        primaryColor: state.primaryColor,
        priceConfig: DEFAULT_TAGRENS_PRICE_CONFIG as unknown as Record<string, unknown>,
        senderEmail: state.senderEmail || state.companyEmail,
        smsSenderName: state.smsSenderName || 'Bergn',
      })
    } catch (err) {
      dispatch({ type: 'SET_LOADING', loading: false })
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Der opstod en fejl' })
    }
  }

  const slug = state.companyName
    .toLowerCase().replace(/[^a-zæøå0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'din-virksomhed'

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B3C2E] to-[#152F24] flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-6">
        <span className="text-2xl font-bold text-white">Bergn.dk</span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-4">
        <div className="flex justify-between text-xs text-white/60 mb-1">
          <span>Trin {state.step} af {totalSteps}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="w-full max-w-lg">
        <CardContent className="p-6 md:p-8">

          {state.error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {/* ── TRIN 1: Opret konto ────────── */}
          {state.step === 1 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold">Opret din konto</h2><p className="text-sm text-muted-foreground">Kom i gang på under 5 minutter</p></div>

              {!state.accountCreated ? (
                <>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={state.email} onChange={(e) => set('email', e.target.value)} placeholder="din@email.dk" /></div>
                  <div className="space-y-2"><Label>Adgangskode</Label><Input type="password" value={state.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 8 tegn, mindst ét tal" /></div>
                  <div className="space-y-2"><Label>Bekræft adgangskode</Label><Input type="password" value={state.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} /></div>
                  <Button className="w-full" onClick={handleSignUp} disabled={state.isLoading || !state.email || !state.password}>
                    {state.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Opret konto
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                    <Check className="mx-auto mb-2 h-8 w-8 text-green-600" />
                    <p className="font-medium text-green-800">Tjek din email!</p>
                    <p className="text-sm text-green-700 mt-1">Klik bekræftelseslinket vi sendte til {state.email}</p>
                  </div>
                  <Button className="w-full" onClick={checkEmailConfirmed} disabled={state.isLoading}>
                    {state.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Jeg har bekræftet min email <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── TRIN 2: Virksomhed ─────────── */}
          {state.step === 2 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold">Din virksomhed</h2></div>
              <div className="space-y-2"><Label>Firmanavn *</Label><Input value={state.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Jensens Tagservice" /></div>
              <div className="space-y-2"><Label>CVR</Label><Input value={state.companyCvr} onChange={(e) => set('companyCvr', e.target.value)} placeholder="12345678" maxLength={8} /></div>
              <div className="space-y-2"><Label>Telefon</Label><Input type="tel" value={state.companyPhone} onChange={(e) => set('companyPhone', e.target.value)} placeholder="12 34 56 78" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={state.companyEmail} onChange={(e) => set('companyEmail', e.target.value)} /></div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep}><ChevronLeft className="h-4 w-4" /></Button>
                <Button className="flex-1" onClick={nextStep} disabled={!state.companyName}>Fortsæt <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* ── TRIN 3: Hvad tilbyder du? ──── */}
          {state.step === 3 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold">Hvad tilbyder du?</h2><p className="text-sm text-muted-foreground">Vælg en eller flere — du kan tilføje flere senere</p></div>
              <div className="grid grid-cols-2 gap-3">
                {CALC_TYPE_OPTIONS.map((ct) => {
                  const Icon = ct.icon
                  const selected = state.calculatorTypes.includes(ct.type)
                  return (
                    <button key={ct.type} type="button"
                      className={cn('flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors', selected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300')}
                      onClick={() => dispatch({ type: 'TOGGLE_CALC_TYPE', calcType: ct.type })}
                    >
                      <Icon className={cn('h-6 w-6', selected ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="text-sm font-medium text-center">{ct.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep}><ChevronLeft className="h-4 w-4" /></Button>
                <Button className="flex-1" onClick={nextStep}>Fortsæt <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* ── TRIN 4: Tilpas udtryk ──────── */}
          {state.step === 4 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold">Tilpas dit udtryk</h2></div>
              <div className="space-y-2">
                <Label>Primærfarve</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button key={c} type="button"
                      className={cn('h-10 w-10 rounded-lg border-2 transition-all', state.primaryColor === c ? 'border-black scale-110' : 'border-transparent')}
                      style={{ backgroundColor: c }}
                      onClick={() => set('primaryColor', c)}
                    />
                  ))}
                </div>
                <Input type="text" value={state.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} placeholder="#1B4332" className="max-w-[140px] mt-2" />
              </div>
              <Separator />
              <div className="rounded-lg border p-4" style={{ borderColor: state.primaryColor }}>
                <p className="text-xs text-muted-foreground mb-2">Forhåndsvisning</p>
                <div className="rounded-lg p-3" style={{ backgroundColor: state.primaryColor }}>
                  <span className="text-white font-semibold text-sm">{state.companyName || 'Dit firmanavn'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep}><ChevronLeft className="h-4 w-4" /></Button>
                <Button className="flex-1" onClick={nextStep}>Fortsæt <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* ── TRIN 5: Priser ─────────────── */}
          {state.step === 5 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold">Sæt dine priser</h2><p className="text-sm text-muted-foreground">Standardpriser er udfyldt — du kan altid ændre dem senere</p></div>
              <div className="space-y-2">
                {Object.entries(DEFAULT_TAGRENS_PRICE_CONFIG.tagtyper).slice(0, 5).map(([name, cfg]) => (
                  <div key={name} className="flex items-center justify-between rounded border p-2">
                    <span className="text-sm">{name}</span>
                    <span className="text-sm font-medium">{cfg.pris_per_kvm} kr/m²</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">+ {Object.keys(DEFAULT_TAGRENS_PRICE_CONFIG.tagtyper).length - 5} flere tagtyper</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep}><ChevronLeft className="h-4 w-4" /></Button>
                <Button className="flex-1" onClick={nextStep}>Fortsæt <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* ── TRIN 6: Kommunikation ──────── */}
          {state.step === 6 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold">Kommunikation</h2></div>
              <div className="space-y-2">
                <Label>Afsender-email til tilbud</Label>
                <Input type="email" value={state.senderEmail || state.companyEmail} onChange={(e) => set('senderEmail', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SMS-afsendernavn (max 11 tegn)</Label>
                <Input value={state.smsSenderName} onChange={(e) => set('smsSenderName', e.target.value.slice(0, 11))} placeholder="Bergn" maxLength={11} />
                <p className="text-xs text-muted-foreground">SMS sendes fra: <strong>{state.smsSenderName || 'Bergn'}</strong></p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep}><ChevronLeft className="h-4 w-4" /></Button>
                <Button className="flex-1" onClick={nextStep}>Fortsæt <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* ── TRIN 7: Beregner klar ──────── */}
          {state.step === 7 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold">Din beregner er klar!</h2></div>
              <div className="space-y-2">
                <Label>Din hosted URL</Label>
                <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
                  <span className="text-sm font-mono">{slug}.bergn.dk</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Embed-kode</Label>
                <div className="relative">
                  <pre className="rounded-lg bg-gray-900 text-green-400 p-3 text-xs overflow-x-auto">
{`<div id="bergn-calculator"></div>
<script src="https://app.bergn.dk/embed.js"
  data-slug="${slug}">
</script>`}
                  </pre>
                  <button type="button" className="absolute top-2 right-2 rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
                    onClick={() => { navigator.clipboard.writeText(`<div id="bergn-calculator"></div>\n<script src="https://app.bergn.dk/embed.js" data-slug="${slug}"></script>`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep}><ChevronLeft className="h-4 w-4" /></Button>
                <Button className="flex-1" onClick={nextStep}>Fortsæt <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* ── TRIN 8: Test det ───────────── */}
          {state.step === 8 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold">Test din beregner</h2><p className="text-sm text-muted-foreground">Tjek at alt virker korrekt</p></div>
              <a href={`https://${slug}.bergn.dk`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full"><ExternalLink className="mr-2 h-4 w-4" />Åbn beregner i nyt vindue</Button>
              </a>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2"><div className="h-5 w-5 rounded border border-gray-300" /><span className="text-sm">Beregneren åbner korrekt</span></div>
                <div className="flex items-center gap-2"><div className="h-5 w-5 rounded border border-gray-300" /><span className="text-sm">Jeg modtog en test-email</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep}><ChevronLeft className="h-4 w-4" /></Button>
                <Button className="flex-1 text-white" style={{ backgroundColor: '#E8500A' }} onClick={handleComplete} disabled={state.isLoading}>
                  {state.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Start min 14-dages prøveperiode <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
