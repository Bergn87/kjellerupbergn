'use client'

import { Suspense, useReducer, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/actions/onboarding'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react'

// ============================================
// STATE — kun konto + firma
// ============================================

interface OnboardingState {
  step: number
  // Trin 1: Konto
  email: string
  password: string
  confirmPassword: string
  accountCreated: boolean
  emailConfirmed: boolean
  // Trin 2: Firma
  companyName: string
  companyCvr: string
  companyPhone: string
  companyEmail: string
  // General
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: 'SET_FIELD'; field: string; value: unknown }
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }

const initialState: OnboardingState = {
  step: 1,
  email: '', password: '', confirmPassword: '',
  accountCreated: false, emailConfirmed: false,
  companyName: '', companyCvr: '', companyPhone: '', companyEmail: '',
  isLoading: false, error: null,
}

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.value, error: null }
    case 'SET_STEP': return { ...state, step: action.step, error: null }
    case 'SET_LOADING': return { ...state, isLoading: action.loading }
    case 'SET_ERROR': return { ...state, error: action.error }
    default: return state
  }
}

// ============================================
// COMPONENT
// ============================================

const STORAGE_KEY = 'bergn-onboarding'
const TOTAL_STEPS = 2

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
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [hydrated, setHydrated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Hydrate fra localStorage + detect eksisterende session
  useEffect(() => {
    const saved = loadSavedState()
    if (saved.step > 1) {
      Object.entries(saved).forEach(([key, value]) => {
        if (key !== 'isLoading' && key !== 'error' && value !== initialState[key as keyof OnboardingState]) {
          dispatch({ type: 'SET_FIELD', field: key, value })
        }
      })
      // Clamp til max 2 steps (migration fra ældre flows)
      dispatch({ type: 'SET_STEP', step: Math.min(saved.step, TOTAL_STEPS) })
    }

    // Admin layout redirecter hertil med ?email= naar brugeren
    // er logget ind men ikke har en tenant. Spring trin 1 over.
    const returningEmail = searchParams.get('email')
    if (saved.step <= 1 && !saved.accountCreated && returningEmail) {
      dispatch({ type: 'SET_FIELD', field: 'email', value: returningEmail })
      dispatch({ type: 'SET_FIELD', field: 'accountCreated', value: true })
      dispatch({ type: 'SET_FIELD', field: 'emailConfirmed', value: true })
      dispatch({ type: 'SET_FIELD', field: 'companyEmail', value: returningEmail })
      dispatch({ type: 'SET_STEP', step: 2 })
    }

    setHydrated(true)
    setCheckingSession(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- runs once on mount

  // Persist state til localStorage
  useEffect(() => {
    if (!hydrated) return
    const { isLoading, error, ...rest } = state
    void isLoading; void error
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  }, [state, hydrated])

  const progress = Math.round((state.step / TOTAL_STEPS) * 100)
  const set = (field: string, value: unknown) => dispatch({ type: 'SET_FIELD', field, value })

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
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://bergn.dk')
    const { error } = await supabase.auth.signUp({
      email: state.email,
      password: state.password,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?type=signup` },
    })
    dispatch({ type: 'SET_LOADING', loading: false })

    if (error) {
      dispatch({ type: 'SET_ERROR', error: error.message })
      return
    }
    set('accountCreated', true)
  }

  async function checkEmailConfirmed() {
    dispatch({ type: 'SET_LOADING', loading: true })

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: state.email,
      password: state.password,
    })

    dispatch({ type: 'SET_LOADING', loading: false })

    if (signInError) {
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
      dispatch({ type: 'SET_STEP', step: 2 })
    }
  }

  // ── Trin 2: Opret virksomhed & gå til dashboard ──
  async function handleComplete() {
    dispatch({ type: 'SET_LOADING', loading: true })
    try {
      await completeOnboarding({
        companyName: state.companyName,
        companyCvr: state.companyCvr,
        companyPhone: state.companyPhone,
        companyEmail: state.companyEmail || state.email,
      })
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      dispatch({ type: 'SET_LOADING', loading: false })
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Der opstod en fejl' })
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/90 flex flex-col items-center justify-center px-4 py-8">
        <div className="mb-6">
          <span className="text-2xl font-bold text-white">Bergn.dk</span>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-white/60" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/90 flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-6">
        <span className="text-2xl font-bold text-white">Bergn.dk</span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-4">
        <div className="flex justify-between text-xs text-white/60 mb-1">
          <span>Trin {state.step} af {TOTAL_STEPS}</span>
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
              <div>
                <h2 className="text-xl font-bold">Opret din konto</h2>
                <p className="text-sm text-muted-foreground">Kom i gang på under 2 minutter</p>
              </div>

              {!state.accountCreated ? (
                <>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={state.email} onChange={(e) => set('email', e.target.value)} placeholder="din@email.dk" />
                  </div>
                  <div className="space-y-2">
                    <Label>Adgangskode</Label>
                    <Input type="password" value={state.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 8 tegn, mindst ét tal" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bekræft adgangskode</Label>
                    <Input type="password" value={state.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={handleSignUp} disabled={state.isLoading || !state.email || !state.password}>
                    {state.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Opret konto
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
                    {state.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Jeg har bekræftet min email <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── TRIN 2: Firmaoplysninger & start ── */}
          {state.step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Din virksomhed</h2>
                <p className="text-sm text-muted-foreground">Du kan tilpasse alt andet i admin-panelet bagefter</p>
              </div>

              <div className="space-y-2">
                <Label>Firmanavn *</Label>
                <Input value={state.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Jensens Tagservice" />
              </div>
              <div className="space-y-2">
                <Label>CVR</Label>
                <Input value={state.companyCvr} onChange={(e) => set('companyCvr', e.target.value)} placeholder="12345678" maxLength={8} />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input type="tel" value={state.companyPhone} onChange={(e) => set('companyPhone', e.target.value)} placeholder="12 34 56 78" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={state.companyEmail} onChange={(e) => set('companyEmail', e.target.value)} placeholder={state.email} />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => dispatch({ type: 'SET_STEP', step: 1 })}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  className="flex-1 text-white bg-bergn-cta hover:bg-bergn-cta-hover"
                  onClick={handleComplete}
                  disabled={state.isLoading || !state.companyName}
                >
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
