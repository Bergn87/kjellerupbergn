'use client'

import { useState } from 'react'
import { ChevronRight, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VinduesType } from '@/lib/calculators/types'

interface VinduerStepProps {
  primaryColor: string
  vinduestyper: VinduesType[]
  onComplete: (vinduer: { typeId: string; antal: number }[]) => void
}

export default function VinduerStep({ primaryColor, vinduestyper, onComplete }: VinduerStepProps) {
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    vinduestyper.forEach(v => { init[v.id] = 0 })
    return init
  })

  const updateCount = (id: string, delta: number) => {
    setCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }))
  }

  const totalVinduer = Object.values(counts).reduce((s, n) => s + n, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Dine vinduer</h2>
        <p className="text-sm text-muted-foreground mt-1">Angiv antal af hver vinduestype</p>
      </div>

      <div className="space-y-3">
        {vinduestyper.filter(v => v.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map(vt => (
          <div key={vt.id} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium text-sm">{vt.name}</p>
              {vt.description && <p className="text-xs text-muted-foreground">{vt.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => updateCount(vt.id, -1)}
                className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
                disabled={(counts[vt.id] ?? 0) === 0}
              ><Minus className="h-3.5 w-3.5" /></button>
              <span className="w-8 text-center font-medium text-sm">{counts[vt.id] ?? 0}</span>
              <button type="button" onClick={() => updateCount(vt.id, 1)}
                className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
              ><Plus className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm py-2 border-t">
        <span className="font-medium">Total vinduer</span>
        <span className="font-bold">{totalVinduer}</span>
      </div>

      <Button className="w-full" style={{ backgroundColor: primaryColor }} disabled={totalVinduer === 0}
        onClick={() => onComplete(Object.entries(counts).filter(([, n]) => n > 0).map(([typeId, antal]) => ({ typeId, antal })))}
      >
        Fortsæt<ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
