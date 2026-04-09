'use client'

import { useState, useCallback } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalculatorType, PriceResult, AnyPriceConfig, TagrensPriceConfig, VinduesPriceConfig, MalerPriceConfig } from '@/lib/calculators/types'
import type { BBRData, AddressSelection } from '@/types'
import { getCalculatorConfig } from '@/lib/calculators/registry'

// Step components
import AddressStep from './steps/AddressStep'
import ContactStep from './steps/ContactStep'
import type { ContactData } from './steps/ContactStep'
import PricePreviewStep from './steps/PricePreviewStep'
import TagrensDetailsStep from './steps/TagrensDetailsStep'
import TagrensExtrasStep from './steps/TagrensExtrasStep'
import FliserensArealStep from './steps/FliserensArealStep'
import MalerTypeStep from './steps/MalerTypeStep'
import MalerRumStep from './steps/MalerRumStep'
import VinduerStep from './steps/VinduerStep'
import VinduerServiceStep from './steps/VinduerServiceStep'
import IsoleringsTypeStep from './steps/IsoleringsTypeStep'

// ============================================
// PROPS
// ============================================

interface QuoteCalculatorProps {
  tenantId: string
  calculatorId: string
  calculatorType?: CalculatorType
  priceConfig: AnyPriceConfig
  primaryColor?: string
}

// ============================================
// COMPONENT
// ============================================

export default function QuoteCalculator({
  tenantId,
  calculatorId,
  calculatorType = 'tagrens',
  priceConfig,
  primaryColor = '#1B3C2E',
}: QuoteCalculatorProps) {
  const calcConfig = getCalculatorConfig(calculatorType)
  const steps = calcConfig.steps
  const totalSteps = steps.length

  const [currentStep, setCurrentStep] = useState(0)
  const [address, setAddress] = useState<AddressSelection | null>(null)
  const [bbr, setBbr] = useState<BBRData | null>(null)
  const [calcData, setCalcData] = useState<Record<string, unknown>>({})
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const nextStep = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1)), [totalSteps])

  // ── Beregn pris via API ───────────────────
  const calculatePrice = useCallback(async (data: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculatorId, calculatorType, ...data }),
      })
      const json = await res.json()
      if (json.data) {
        setPriceResult(json.data)
        nextStep()
      }
    } catch { /* ignore */ }
  }, [calculatorId, calculatorType, nextStep])

  // ── Send tilbud ───────────────────────────
  const submitQuote = useCallback(async (contact: ContactData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          calculatorId,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          address: address?.displayText ?? '',
          message: contact.message,
          bbrData: bbr,
          houseDetails: calcData,
          extraDetails: calcData,
          lineItems: priceResult?.lineItems ?? [],
          totalExclVat: priceResult?.totalExclVat ?? 0,
          totalInclVat: priceResult?.totalInclVat ?? 0,
          gdprAccepted: contact.gdprAccepted,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        setSubmitError(json.error || 'Der opstod en fejl')
        return
      }

      setSubmitSuccess(true)
    } catch {
      setSubmitError('Netværksfejl — prøv igen')
    } finally {
      setIsSubmitting(false)
    }
  }, [tenantId, calculatorId, address, bbr, calcData, priceResult])

  // ── Success state ─────────────────────────
  if (submitSuccess) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Tak for din henvendelse!</h2>
          <p className="text-muted-foreground">Vi sender dit detaljerede tilbud inden for 1 time.</p>
        </div>
      </div>
    )
  }

  // ── Render current step ───────────────────
  const stepId = steps[currentStep]

  function renderStep() {
    switch (stepId) {
      case 'address':
        return (
          <AddressStep
            primaryColor={primaryColor}
            initialAddress={address}
            skipBBR={!calcConfig.usesBBR}
            onComplete={(addr, bbrData) => {
              setAddress(addr)
              setBbr(bbrData)
              nextStep()
            }}
          />
        )

      case 'bbr_details':
        if (calculatorType === 'tagrens') {
          return (
            <TagrensDetailsStep
              primaryColor={primaryColor}
              bbr={bbr}
              priceConfig={priceConfig as TagrensPriceConfig}
              onComplete={(details) => {
                setCalcData(prev => ({ ...prev, houseDetails: details }))
                nextStep()
              }}
            />
          )
        }
        // For isolering — BBR details vises i IsoleringsTypeStep
        return (
          <IsoleringsTypeStep
            primaryColor={primaryColor}
            bbrByggeaar={bbr?.byggeaar ?? undefined}
            bbrAreal={bbr?.boligAreal ?? undefined}
            onComplete={(data) => {
              setCalcData(prev => ({ ...prev, ...data }))
              calculatePrice(data)
            }}
          />
        )

      case 'extras':
        return (
          <TagrensExtrasStep
            primaryColor={primaryColor}
            defaultHaeldningOver30={(bbr?.tagHaeldning ?? 0) > 30}
            defaultHoejdeOver35={(bbr?.bygningsHoejde ?? 0) >= 3.5}
            onComplete={(extras) => {
              const data = { ...calcData, extraDetails: extras }
              setCalcData(data)
              calculatePrice(data)
            }}
          />
        )

      case 'fliserens_areal':
        return (
          <FliserensArealStep
            primaryColor={primaryColor}
            onComplete={(data) => {
              setCalcData(prev => ({ ...prev, ...data }))
              calculatePrice(data)
            }}
          />
        )

      case 'maler_type':
        return (
          <MalerTypeStep
            primaryColor={primaryColor}
            onComplete={(data) => {
              setCalcData(prev => ({ ...prev, ...data }))
              // If indvendig → go to rum step, else calculate
              if (data.malertype === 'udvendig') {
                calculatePrice({ ...data, rum: [] })
              } else {
                nextStep()
              }
            }}
          />
        )

      case 'rum_valg':
        return (
          <MalerRumStep
            primaryColor={primaryColor}
            rumtyper={(priceConfig as MalerPriceConfig).rumtyper ?? []}
            onComplete={(rum) => {
              const data = { ...calcData, rum }
              setCalcData(data)
              calculatePrice(data)
            }}
          />
        )

      case 'vinduer':
        return (
          <VinduerStep
            primaryColor={primaryColor}
            vinduestyper={(priceConfig as VinduesPriceConfig).vinduestyper ?? []}
            onComplete={(vinduer) => {
              setCalcData(prev => ({ ...prev, vinduer }))
              nextStep()
            }}
          />
        )

      case 'service':
        return (
          <VinduerServiceStep
            primaryColor={primaryColor}
            onComplete={(data) => {
              const fullData = { ...calcData, ...data, kundeType: 'privat' as const, etage: 0 }
              setCalcData(fullData)
              calculatePrice(fullData)
            }}
          />
        )

      case 'isolering_type':
        return (
          <IsoleringsTypeStep
            primaryColor={primaryColor}
            bbrByggeaar={bbr?.byggeaar ?? undefined}
            bbrAreal={bbr?.boligAreal ?? undefined}
            onComplete={(data) => {
              setCalcData(prev => ({ ...prev, ...data }))
              calculatePrice(data)
            }}
          />
        )

      case 'price_preview':
        if (!priceResult) return <p className="text-center py-8 text-muted-foreground">Beregner pris...</p>
        return (
          <PricePreviewStep
            primaryColor={primaryColor}
            priceResult={priceResult}
            onContinue={nextStep}
          />
        )

      case 'contact':
      case 'contact_early':
      case 'confirmation':
      case 'access':
        return (
          <ContactStep
            primaryColor={primaryColor}
            onSubmit={submitQuote}
            isSubmitting={isSubmitting}
            error={submitError}
            initialData={{ message: priceResult ? `Prisoverslag: ${Math.round(priceResult.totalInclVat).toLocaleString('da-DK')} kr. inkl. moms` : '' }}
          />
        )

      default:
        return <p className="text-center py-8 text-muted-foreground">Ukendt step: {stepId}</p>
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
        {/* Progress bar */}
        <div className="mb-8 flex items-center justify-between">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  currentStep > i ? 'bg-green-500 text-white'
                    : currentStep === i ? 'text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
                style={currentStep === i ? { backgroundColor: primaryColor } : undefined}
              >
                {currentStep > i ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('mx-1 h-0.5 w-6 sm:w-10', currentStep > i ? 'bg-green-500' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>

        {renderStep()}
      </div>
    </div>
  )
}
