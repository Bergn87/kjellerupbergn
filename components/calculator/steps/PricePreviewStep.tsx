'use client'

import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { PriceResult } from '@/lib/calculators/types'

interface PricePreviewStepProps {
  primaryColor: string
  priceResult: PriceResult
  onContinue: () => void
}

function formatKr(n: number) {
  return new Intl.NumberFormat('da-DK').format(Math.round(n)) + ' kr.'
}

export default function PricePreviewStep({ primaryColor, priceResult, onContinue }: PricePreviewStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Dit prisoverslag</h2>

      <div className="space-y-3">
        {priceResult.lineItems.map((item, i) => (
          <div key={i} className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{item.description}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} {item.unit} &times; {formatKr(item.unit_price)}
              </p>
            </div>
            <p className={`text-sm font-medium whitespace-nowrap ml-4 ${item.total < 0 ? 'text-green-600' : ''}`}>
              {item.total < 0 ? '−' : ''}{formatKr(Math.abs(item.total))}
            </p>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal ekskl. moms</span>
          <span>{formatKr(priceResult.totalExclVat)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Moms (25%)</span>
          <span>{formatKr(priceResult.vatAmount)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2">
          <span>Total inkl. moms</span>
          <span>{formatKr(priceResult.totalInclVat)}</span>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4 text-xs text-muted-foreground">
        Dette er et estimat baseret på de oplyste data. Endelig pris aftales ved besigtigelse.
      </div>

      <Button
        className="w-full text-white"
        style={{ backgroundColor: '#E8500A' }}
        size="lg"
        onClick={onContinue}
      >
        Få dit tilbud
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
