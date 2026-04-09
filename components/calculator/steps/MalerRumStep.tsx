'use client'

import { useState } from 'react'
import { ChevronRight, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { MalerRumType } from '@/lib/calculators/types'

interface RumSelection {
  typeId: string
  antal: number
  areal?: number
  inkluderLoft: boolean
  inkluderVaegge: boolean
  inkluderKarme: boolean
  inkluderDoere: boolean
}

interface MalerRumStepProps {
  primaryColor: string
  rumtyper: MalerRumType[]
  onComplete: (rum: RumSelection[]) => void
}

export default function MalerRumStep({ primaryColor, rumtyper, onComplete }: MalerRumStepProps) {
  const [selections, setSelections] = useState<Record<string, RumSelection>>(() => {
    const init: Record<string, RumSelection> = {}
    rumtyper.forEach(r => {
      init[r.id] = { typeId: r.id, antal: 0, inkluderLoft: true, inkluderVaegge: true, inkluderKarme: false, inkluderDoere: false }
    })
    return init
  })

  const updateAntal = (id: string, delta: number) => {
    setSelections(prev => ({
      ...prev,
      [id]: { ...prev[id], antal: Math.max(0, (prev[id]?.antal ?? 0) + delta) }
    }))
  }

  const toggleOption = (id: string, field: keyof RumSelection) => {
    setSelections(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: !prev[id]?.[field] }
    }))
  }

  const hasRooms = Object.values(selections).some(s => s.antal > 0)
  const totalRooms = Object.values(selections).reduce((s, r) => s + r.antal, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Vælg rum</h2>
        <p className="text-sm text-muted-foreground mt-1">Angiv antal rum og hvad der skal males</p>
      </div>

      <div className="space-y-3">
        {rumtyper.map(rum => {
          const sel = selections[rum.id]
          const isActive = (sel?.antal ?? 0) > 0
          return (
            <div key={rum.id} className={`rounded-lg border p-4 transition-colors ${isActive ? 'border-gray-400 bg-gray-50/50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{rum.name}</p>
                  <p className="text-xs text-muted-foreground">{rum.defaultAreal} m² standard</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateAntal(rum.id, -1)}
                    className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
                    disabled={(sel?.antal ?? 0) === 0}
                  ><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-6 text-center font-medium text-sm">{sel?.antal ?? 0}</span>
                  <button type="button" onClick={() => updateAntal(rum.id, 1)}
                    className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                  ><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>

              {isActive && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-1.5">
                    <Checkbox id={`${rum.id}-vaeg`} checked={sel?.inkluderVaegge} onCheckedChange={() => toggleOption(rum.id, 'inkluderVaegge')} />
                    <Label htmlFor={`${rum.id}-vaeg`} className="text-xs cursor-pointer">Vægge</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Checkbox id={`${rum.id}-loft`} checked={sel?.inkluderLoft} onCheckedChange={() => toggleOption(rum.id, 'inkluderLoft')} />
                    <Label htmlFor={`${rum.id}-loft`} className="text-xs cursor-pointer">Loft</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Checkbox id={`${rum.id}-karme`} checked={sel?.inkluderKarme} onCheckedChange={() => toggleOption(rum.id, 'inkluderKarme')} />
                    <Label htmlFor={`${rum.id}-karme`} className="text-xs cursor-pointer">Karme</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Checkbox id={`${rum.id}-doer`} checked={sel?.inkluderDoere} onCheckedChange={() => toggleOption(rum.id, 'inkluderDoere')} />
                    <Label htmlFor={`${rum.id}-doer`} className="text-xs cursor-pointer">Døre</Label>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{totalRooms} rum valgt</span>
      </div>

      <Button className="w-full" style={{ backgroundColor: primaryColor }} disabled={!hasRooms}
        onClick={() => onComplete(Object.values(selections).filter(s => s.antal > 0))}
      >
        Se min pris<ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
