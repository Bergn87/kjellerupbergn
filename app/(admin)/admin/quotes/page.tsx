import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/supabase/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/admin/StatusBadge'
import QuotesFilter from './QuotesFilter'
import { Plus, Eye, FileText } from 'lucide-react'
import type { Quote } from '@/types'

function formatKr(n: number | null): string {
  if (n == null) return '-'
  return Math.round(n).toLocaleString('da-DK') + ' kr.'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    search?: string
    page?: string
    period?: string
  }>
}

const TABS = [
  { value: '', label: 'Alle' },
  { value: 'draft', label: 'Kladder' },
  { value: 'pending', label: 'Afventer' },
  { value: 'accepted', label: 'Accepteret' },
  { value: 'rejected', label: 'Afvist' },
  { value: 'expired', label: 'Udløbet' },
]

const PAGE_SIZE = 20

export default async function QuotesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tenant = await getCurrentTenant()
  if (!tenant) redirect('/onboarding')

  const supabase = await createClient()
  const statusFilter = params.status || ''
  const search = params.search || ''
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const period = params.period || ''

  // Byg query
  let query = supabase
    .from('quotes')
    .select('id, quote_number, customer_name, customer_address, source, total_incl_vat, status, created_at', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  // Status filter
  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  // Søgning
  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_address.ilike.%${search}%,quote_number.ilike.%${search}%`
    )
  }

  // Dato-filter
  if (period === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', weekAgo)
  } else if (period === 'month') {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    query = query.gte('created_at', monthStart)
  }

  // Pagination
  const from = (page - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data, count } = await query

  const quotes = (data ?? []) as Pick<Quote, 'id' | 'quote_number' | 'customer_name' | 'customer_address' | 'source' | 'total_incl_vat' | 'status' | 'created_at'>[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tilbud</h1>
        <Link href="/admin/quotes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nyt tilbud
          </Button>
        </Link>
      </div>

      {/* Tabs + Filter */}
      <QuotesFilter
        tabs={TABS}
        currentStatus={statusFilter}
        currentSearch={search}
        currentPeriod={period}
      />

      {/* Tabel */}
      <Card>
        <CardContent className="p-0">
          {quotes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'Ingen tilbud matcher din søgning.' : 'Ingen tilbud endnu.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead className="hidden md:table-cell">Kilde</TableHead>
                  <TableHead className="hidden sm:table-cell">Beløb</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Dato</TableHead>
                  <TableHead className="w-[80px]" />
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
                    <TableCell>
                      <div>{q.customer_name}</div>
                      {q.customer_address && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{q.customer_address}</div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {q.source === 'calculator' ? 'Beregner' : 'Manuel'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-medium">{formatKr(q.total_incl_vat)}</TableCell>
                    <TableCell><StatusBadge status={q.status} /></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{formatDate(q.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/quotes/${q.id}`} title="Vis">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/q/${q.id}`} target="_blank" title="PDF">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/quotes?status=${statusFilter}&search=${search}&period=${period}&page=${page - 1}`}>
              <Button variant="outline" size="sm">Forrige</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Side {page} af {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/quotes?status=${statusFilter}&search=${search}&period=${period}&page=${page + 1}`}>
              <Button variant="outline" size="sm">Næste</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
