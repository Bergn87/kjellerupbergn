import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/supabase/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

const PAGE_SIZE = 20

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tenant = await getCurrentTenant()
  if (!tenant) redirect('/onboarding')

  const search = params.search ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const supabase = await createClient()

  let query = supabase
    .from('customers')
    .select('id, name, email, phone, created_at', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const from = (page - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data: customers, count } = await query

  type CustRow = { id: string; name: string; email: string; phone: string | null; created_at: string }
  const rows = (customers ?? []) as CustRow[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Hent antal tilbud per kunde
  const customerIds = rows.map((c) => c.id)
  let quoteCounts: Record<string, number> = {}
  if (customerIds.length > 0) {
    const { data: qc } = await supabase
      .from('quotes')
      .select('customer_id')
      .eq('tenant_id', tenant.id)
      .in('customer_id', customerIds)

    const qcRows = (qc ?? []) as { customer_id: string | null }[]
    qcRows.forEach((r) => {
      if (r.customer_id) {
        quoteCounts[r.customer_id] = (quoteCounts[r.customer_id] ?? 0) + 1
      }
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kunder</h1>

      <Card>
        <CardContent className="pt-6">
          <form className="mb-4" action="/admin/customers">
            <Input
              name="search"
              placeholder="Søg på navn, email eller telefon..."
              defaultValue={search}
              className="max-w-md"
            />
          </form>

          {rows.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Ingen kunder matcher din søgning.' : 'Ingen kunder endnu.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Telefon</TableHead>
                    <TableHead className="hidden md:table-cell">Tilbud</TableHead>
                    <TableHead className="hidden md:table-cell">Oprettet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/admin/customers/${c.id}`} className="font-medium text-primary hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{c.phone ?? '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{quoteCounts[c.id] ?? 0}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">Side {page} af {totalPages} ({count} kunder)</p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link href={`/admin/customers?search=${search}&page=${page - 1}`} className="text-sm text-primary hover:underline">← Forrige</Link>
                    )}
                    {page < totalPages && (
                      <Link href={`/admin/customers?search=${search}&page=${page + 1}`} className="text-sm text-primary hover:underline">Næste →</Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
