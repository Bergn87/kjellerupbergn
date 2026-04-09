'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TagrensExtrasStepProps {
  primaryColor: string
  defaultHaeldningOver30: boolean
  defaultHoejdeOver35: boolean
  onComplete: (extras: {
    oenskerMaling: boolean; antalOvenlysvinduer: number; antalTagkviste: number
    harTagrender: boolean; harSkjulteTagrender: boolean; harSolceller: boolean
  }) => void
}

function YesNo({ label, value, onChange, color }: { label: string; value: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {[true, false].map((v) => (
          <button key={String(v)} type="button"
            className={cn('min-h-[48px] rounded-lg border-2 font-medium transition-colors', value === v ? 'border-transparent text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50')}
            style={value === v ? { backgroundColor: color } : undefined}
            onClick={() => onChange(v)}
          >{v ? 'Ja' : 'Nej'}</button>
        ))}
      </div>
    </div>
  )
}

export default function TagrensExtrasStep({ primaryColor, onComplete }: TagrensExtrasStepProps) {
  const [hasSkylights, setHasSkylights] = useState(false)
  const [skylightCount, setSkylightCount] = useState(0)
  const [hasDormers, setHasDormers] = useState(false)
  const [dormerCount, setDormerCount] = useState(0)
  const [hasGutters, setHasGutters] = useState(true)
  const [hasHiddenGutters, setHasHiddenGutters] = useState(false)
  const [hasSolarPanels, setHasSolarPanels] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Et par hurtige spørgsmål</h2>
        <p className="text-sm text-muted-foreground mt-1">Så vi kan beregne en præcis pris</p>
      </div>

      <div className="space-y-4">
        <YesNo label="Har du ovenlysvinduer?" value={hasSkylights} onChange={setHasSkylights} color={primaryColor} />
        {hasSkylights && (
          <div className="ml-4 space-y-1">
            <Label>Antal</Label>
            <Input type="number" min={1} value={skylightCount || ''} onChange={(e) => setSkylightCount(Number(e.target.value))} className="max-w-[100px]" />
          </div>
        )}

        <YesNo label="Har du tagkviste?" value={hasDormers} onChange={setHasDormers} color={primaryColor} />
        {hasDormers && (
          <div className="ml-4 space-y-1">
            <Label>Antal</Label>
            <Input type="number" min={1} value={dormerCount || ''} onChange={(e) => setDormerCount(Number(e.target.value))} className="max-w-[100px]" />
          </div>
        )}

        <YesNo label="Har du tagrender?" value={hasGutters} onChange={setHasGutters} color={primaryColor} />
        <YesNo label="Har du skjulte tagrender?" value={hasHiddenGutters} onChange={setHasHiddenGutters} color={primaryColor} />
        <YesNo label="Har du solceller eller solfanger?" value={hasSolarPanels} onChange={setHasSolarPanels} color={primaryColor} />
      </div>

      <Button className="w-full" style={{ backgroundColor: primaryColor }}
        onClick={() => onComplete({
          oenskerMaling: false,
          antalOvenlysvinduer: hasSkylights ? skylightCount : 0,
          antalTagkviste: hasDormers ? dormerCount : 0,
          harTagrender: hasGutters,
          harSkjulteTagrender: hasHiddenGutters,
          harSolceller: hasSolarPanels,
        })}
      >
        Se min pris<ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
