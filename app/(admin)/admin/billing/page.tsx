'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Check, Loader2, ExternalLink, CreditCard, Zap } from 'lucide-react'
import type { Tenant } from '@/types'

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '299 kr/md',
    quota: 50,
    features: ['50 leads/md', 'Email-tilbud', 'Egen branding', '1 beregner'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '599 kr/md',
    quota: 200,
    popular: true,
    features: ['200 leads/md', 'Email + SMS', 'Påmindelser', 'Flere beregnere', 'PDF-tilbud'],
  },
  {
    key: 'business',
    name: 'Business',
    price: '999 kr/md',
    quota: 1000,
    features: ['1.000 leads/md', 'Alt i Pro', 'Prioriteret support', 'Custom domain'],
  },
]

function BillingContent() {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const success = searchParams.get('success') === 'true'

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tu } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!tu) return
      const tenantId = (tu as { tenant_id: string }).tenant_id

      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (data) setTenant(data as unknown as Tenant)
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleUpgrade(plan: string) {
    setUpgrading(plan)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      }
    } catch {
      setUpgrading(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  if (!tenant) return null

  const quotaPercent = tenant.leads_quota > 0
    ? Math.round((tenant.leads_used_this_month / tenant.leads_quota) * 100)
    : 0

  const isTrial = tenant.plan === 'trial'
  const isExpired = tenant.plan === 'expired'
  const trialDaysLeft = tenant.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Abonnement</h1>

      {/* Success banner */}
      {success && (
        <div className="rounded-lg border-2 border-green-300 bg-green-50 px-4 py-3 flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">Dit abonnement er aktiveret!</span>
        </div>
      )}

      {/* Trial banner */}
      {isTrial && (
        <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 px-4 py-3 flex items-center justify-between">
          <span className="text-yellow-800">
            <strong>{trialDaysLeft} dage</strong> tilbage af din gratis prøveperiode
          </span>
          <Button size="sm" onClick={() => handleUpgrade('pro')}>
            <Zap className="mr-1 h-4 w-4" />Opgrader nu
          </Button>
        </div>
      )}

      {/* Expired banner */}
      {isExpired && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 flex items-center justify-between">
          <span className="text-red-800 font-medium">Dit abonnement er udløbet</span>
          <Button size="sm" variant="destructive" onClick={() => handleUpgrade('pro')}>
            Forny abonnement
          </Button>
        </div>
      )}

      {/* Nuværende plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Nuværende plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="text-sm capitalize">{tenant.plan}</Badge>
            {tenant.plan_expires_at && (
              <span className="text-sm text-muted-foreground">
                Fornyes {new Date(tenant.plan_expires_at).toLocaleDateString('da-DK')}
              </span>
            )}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Leads brugt denne måned</span>
              <span className="font-medium">{tenant.leads_used_this_month} / {tenant.leads_quota}</span>
            </div>
            <Progress value={quotaPercent} className="h-2" />
          </div>

          {tenant.stripe_subscription_id && (
            <a href="/api/stripe/portal">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Administrér abonnement
              </Button>
            </a>
          )}
        </CardContent>
      </Card>

      {/* Planer */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Vælg plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = tenant.plan === plan.key
            return (
              <Card key={plan.key} className={plan.popular ? 'border-primary shadow-md' : ''}>
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground text-center text-xs font-semibold py-1 rounded-t-lg">
                    Mest populær
                  </div>
                )}
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="text-2xl font-bold mt-1">{plan.price}</p>
                  </div>

                  <Separator />

                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrent ? 'outline' : 'default'}
                    disabled={isCurrent || upgrading !== null}
                    onClick={() => handleUpgrade(plan.key)}
                  >
                    {upgrading === plan.key ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isCurrent ? 'Nuværende plan' : 'Vælg plan'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <BillingContent />
    </Suspense>
  )
}
