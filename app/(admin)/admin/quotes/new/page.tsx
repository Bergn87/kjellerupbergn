'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
// CSS transform utility inline (no @dnd-kit/utilities in v10)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { GripVertical, Trash2, Plus, Loader2, Save, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
}

const UNITS = ['stk', 'm²', 'm', 'time', 'dag', 'opgave']

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

// ============================================
// SORTABLE LINE ITEM
// ============================================

function SortableLineItem({
  item,
  onChange,
  onRemove,
}: {
  item: LineItem
  onChange: (id: string, field: keyof LineItem, value: string | number) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  }

  const total = Math.round(item.quantity * item.unitPrice)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-2 rounded-lg border bg-white p-3',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        type="button"
        className="mt-2 cursor-grab text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
        {/* Beskrivelse */}
        <div className="sm:col-span-5">
          <Input
            placeholder="Beskrivelse"
            value={item.description}
            onChange={(e) => onChange(item.id, 'description', e.target.value)}
          />
        </div>

        {/* Antal */}
        <div className="sm:col-span-2">
          <Input
            type="number"
            min={0}
            step={0.01}
            placeholder="Antal"
            value={item.quantity || ''}
            onChange={(e) => onChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Enhed */}
        <div className="sm:col-span-2">
          <Select
            value={item.unit}
            onValueChange={(v) => { if (v) onChange(item.id, 'unit', v) }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Enhedspris */}
        <div className="sm:col-span-2">
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="Pris"
            value={item.unitPrice || ''}
            onChange={(e) => onChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Total */}
        <div className="sm:col-span-1 flex items-center justify-end">
          <span className="text-sm font-medium whitespace-nowrap">
            {total.toLocaleString('da-DK')} kr.
          </span>
        </div>
      </div>

      <button
        type="button"
        className="mt-2 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

// ============================================
// PAGE
// ============================================

export default function NewQuotePage() {
  const router = useRouter()

  // Kunde
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  // Tilbudsinfo
  const [expiresAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })
  const [internalNotes, setInternalNotes] = useState('')

  // Linjer
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: generateId(), description: '', quantity: 1, unit: 'stk', unitPrice: 0 },
  ])

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ── Line item handlers ────────────────────

  const handleLineChange = useCallback(
    (id: string, field: keyof LineItem, value: string | number) => {
      setLineItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      )
    },
    []
  )

  const handleRemoveLine = useCallback((id: string) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev))
  }, [])

  const handleAddLine = () => {
    setLineItems((prev) => [
      ...prev,
      { id: generateId(), description: '', quantity: 1, unit: 'stk', unitPrice: 0 },
    ])
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setLineItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  // ── Totaler ───────────────────────────────

  const subtotal = lineItems.reduce((sum, i) => sum + Math.round(i.quantity * i.unitPrice), 0)
  const vatAmount = Math.round(subtotal * 0.25)
  const totalInclVat = subtotal + vatAmount

  const formatKr = (n: number) => n.toLocaleString('da-DK') + ' kr.'

  // ── Submit ────────────────────────────────

  async function handleSubmit(status: 'draft' | 'pending') {
    setError(null)

    if (!customerName || !customerEmail) {
      setError('Navn og email er påkrævet')
      return
    }

    if (lineItems.every((i) => !i.description)) {
      setError('Tilføj mindst én tilbudslinje')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          expiresAt,
          internalNotes,
          lineItems: lineItems
            .filter((i) => i.description)
            .map((i, idx) => ({
              description: i.description,
              quantity: i.quantity,
              unit: i.unit,
              unit_price: i.unitPrice,
              total: Math.round(i.quantity * i.unitPrice),
              sort_order: idx,
            })),
          subtotal,
          vatAmount,
          totalExclVat: subtotal,
          totalInclVat,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Der opstod en fejl')
        return
      }

      router.push(`/admin/quotes/${json.quoteId}`)
    } catch {
      setError('Netværksfejl — prøv igen')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nyt tilbud</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── VENSTRE: Kunde + Tilbudsinfo ──── */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kunde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Navn *</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Kundens navn" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="kunde@email.dk" />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="12 34 56 78" />
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Vej 1, 1234 By" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tilbudsinfo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Udløbsdato</Label>
                <Input type="date" defaultValue={expiresAt} readOnly className="text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Interne noter</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Kun synlig for dig..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── HØJRE: Ydelser + Totaler ──────── */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ydelser</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Header (desktop) */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-8 text-xs text-muted-foreground font-medium">
                <div className="col-span-5">Beskrivelse</div>
                <div className="col-span-2">Antal</div>
                <div className="col-span-2">Enhed</div>
                <div className="col-span-2">Enhedspris</div>
                <div className="col-span-1 text-right">Total</div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={lineItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  {lineItems.map((item) => (
                    <SortableLineItem
                      key={item.id}
                      item={item}
                      onChange={handleLineChange}
                      onRemove={handleRemoveLine}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <Button variant="outline" size="sm" onClick={handleAddLine} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Tilføj linje
              </Button>
            </CardContent>
          </Card>

          {/* Totaler */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ekskl. moms</span>
                  <span>{formatKr(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Moms (25%)</span>
                  <span>{formatKr(vatAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total inkl. moms</span>
                  <span>{formatKr(totalInclVat)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer knapper */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Gem kladde
            </Button>
            <Button
              className="flex-1 text-white"
              style={{ backgroundColor: '#E8500A' }}
              disabled={isSubmitting}
              onClick={() => handleSubmit('pending')}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send tilbud nu
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
