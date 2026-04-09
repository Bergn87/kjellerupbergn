'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '@/components/admin/StatusBadge'
import { Loader2, Save, Plus, ArrowLeft } from 'lucide-react'

interface CustomerData {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  notes: string | null
}

interface QuoteRow {
  id: string
  quote_number: string
  total_incl_vat: number | null
  status: string
  created_at: string
}

function formatKr(n: number | null): string {
  if (n == null) return '-'
  return Math.round(n).toLocaleString('da-DK') + ' kr.'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const supabase = createClient()

  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Editable fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      const { data: c } = await supabase
        .from('customers')
        .select('id, name, email, phone, address, notes')
        .eq('id', customerId)
        .single()

      if (c) {
        const cust = c as unknown as CustomerData
        setCustomer(cust)
        setName(cust.name)
        setEmail(cust.email)
        setPhone(cust.phone ?? '')
        setAddress(cust.address ?? '')
        setNotes(cust.notes ?? '')
      }

      const { data: q } = await supabase
        .from('quotes')
        .select('id, quote_number, total_incl_vat, status, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      setQuotes((q as unknown as QuoteRow[] | null) ?? [])
      setLoading(false)
    }
    load()
  }, [customerId, supabase])

  const handleSave = useCallback(async () => {
    if (!customer) return
    setSaving(true)
    setSaved(false)

    await supabase
      .from('customers')
      .update({
        name,
        email,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
      } as never)
      .eq('id', customer.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [customer, name, email, phone, address, notes, supabase])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  if (!customer) {
    return <div className="text-center py-20 text-muted-foreground">Kunde ikke fundet</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/customers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <Link href={`/admin/quotes/new?customer=${customer.id}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nyt tilbud
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rediger kunde */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Kundeoplysninger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Navn</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Noter</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saved ? 'Gemt!' : 'Gem ændringer'}
            </Button>
          </CardContent>
        </Card>

        {/* Tilbudshistorik */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tilbudshistorik</CardTitle>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Ingen tilbud endnu for denne kunde.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Beløb</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <Link href={`/admin/quotes/${q.id}`} className="font-medium text-primary hover:underline">
                          {q.quote_number}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{formatKr(q.total_incl_vat)}</TableCell>
                      <TableCell><StatusBadge status={q.status} /></TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(q.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
