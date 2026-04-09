'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VinduerServiceStepProps {
  primaryColor: string
  onComplete: (data: {
    rengoeringstype: 'indvendig' | 'udvendig' | 'begge'
    vandtype: 'traditionel' | 'rentvandsanlaeg'
    ordreType: 'engangskob' | 'abonnement'
    interval?: '4_uger' | '6_uger' | '8_uger' | '12_uger'
  }) => void
}

export default function VinduerServiceStep({ primaryColor, onComplete }: VinduerServiceStepProps) {
  const [rengoering, setRengoering] = useState<'indvendig' | 'udvendig' | 'begge'>('begge')
  const [vandtype, setVandtype] = useState<'traditionel' | 'rentvandsanlaeg'>('traditionel')
  const [ordreType, setOrdreType] = useState<'engangskob' | 'abonnement'>('engangskob')
  const [interval, setInterval] = useState<'4_uger' | '6_uger' | '8_uger' | '12_uger'>('8_uger')

  function OptionCard({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc: string }) {
    return (
      <button type="button" onClick={onClick}
        className={cn('text-left rounded-lg border-2 p-3 transition-colors w-full', selected ? 'border-current' : 'border-gray-200 hover:border-gray-300')}
        style={selected ? { borderColor: primaryColor } : undefined}
      >
        <p className="font-medium text-sm" style={selected ? { color: primaryColor } : undefined}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Vælg service</h2>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Rengøringstype</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionCard selected={rengoering === 'indvendig'} onClick={() => setRengoering('indvendig')} title="Indvendig" desc="Kun indvendig" />
          <OptionCard selected={rengoering === 'udvendig'} onClick={() => setRengoering('udvendig')} title="Udvendig" desc="Kun udvendig" />
          <OptionCard selected={rengoering === 'begge'} onClick={() => setRengoering('begge')} title="Begge" desc="Komplet" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Vandbehandling</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionCard selected={vandtype === 'traditionel'} onClick={() => setVandtype('traditionel')} title="Traditionel" desc="Klassisk pudsning" />
          <OptionCard selected={vandtype === 'rentvandsanlaeg'} onClick={() => setVandtype('rentvandsanlaeg')} title="Rentvandsanlæg" desc="Moderne, kalkfrit vand" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Bestillingstype</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionCard selected={ordreType === 'engangskob'} onClick={() => setOrdreType('engangskob')} title="Engangsbestilling" desc="Bestil når det passer" />
          <OptionCard selected={ordreType === 'abonnement'} onClick={() => setOrdreType('abonnement')} title="Abonnement" desc="Fast lav pris" />
        </div>
      </div>

      {ordreType === 'abonnement' && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Interval</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { value: '4_uger' as const, label: 'Hver 4. uge' },
              { value: '6_uger' as const, label: 'Hver 6. uge' },
              { value: '8_uger' as const, label: 'Hver 8. uge' },
              { value: '12_uger' as const, label: 'Hver 12. uge' },
            ]).map((i) => (
              <button key={i.value} type="button" onClick={() => setInterval(i.value)}
                className={cn('rounded-lg border-2 p-2.5 text-center text-xs font-medium transition-colors', interval === i.value ? 'border-current text-current' : 'border-gray-200 text-gray-600 hover:border-gray-300')}
                style={interval === i.value ? { borderColor: primaryColor, color: primaryColor } : undefined}
              >{i.label}</button>
            ))}
          </div>
        </div>
      )}

      <Button className="w-full" style={{ backgroundColor: primaryColor }}
        onClick={() => onComplete({ rengoeringstype: rengoering, vandtype, ordreType, interval: ordreType === 'abonnement' ? interval : undefined })}
      >
        Se min pris<ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
