import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Tenant } from '@/types'

interface PageProps {
  searchParams: Promise<{ search?: string }>
}

export default async function TenantsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const supabase = await createAdminClient()

  let query = supabase
    .from('tenants')
    .select('id, slug, company_name, company_email, plan, is_active, leads_used_this_month, leads_quota, created_at, trial_ends_at')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`company_name.ilike.%${search}%,company_email.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  const { data: tenants } = await query

  type TenantRow = Pick<Tenant, 'id' | 'slug' | 'company_name' | 'company_email' | 'plan' | 'is_active' | 'leads_used_this_month' | 'leads_quota' | 'created_at' | 'trial_ends_at'>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alle tenants</h1>

      <form action="/superadmin/tenants">
        <Input name="search" placeholder="Søg på firmanavn, email eller slug..." defaultValue={search} className="max-w-md" />
      </form>

      <Card className="border border-bergn-card-border">
        <CardContent className="p-0">
          <div className="divide-y">
            {(tenants as TenantRow[] | null)?.map((t) => (
              <Link key={t.id} href={`/superadmin/tenants/${t.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-900">{t.company_name}</p>
                  <p className="text-xs text-gray-400">{t.slug}.bergn.dk &middot; {t.company_email}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className="text-xs text-gray-500">{t.leads_used_this_month}/{t.leads_quota}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    t.plan === 'trial' ? 'border-yellow-300 text-yellow-700'
                    : t.plan === 'expired' ? 'border-red-300 text-red-600'
                    : 'border-green-300 text-green-700'
                  }`}>{t.plan}</span>
                  <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('da-DK')}</span>
                </div>
              </Link>
            ))}
            {(!tenants || tenants.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-12">Ingen tenants fundet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
