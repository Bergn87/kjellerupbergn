'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Server action: Log bruger ud og redirect til login.
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Server action: Tjek om den aktuelle bruger har en tenant.
 * Bruges af login-siden til at afgøre om brugeren kan tilgå dashboardet.
 * Returnerer { hasTenant, email } eller null hvis ikke logget ind.
 */
export async function checkUserHasTenant(): Promise<{
  hasTenant: boolean
  email: string | null
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  return {
    hasTenant: !!tenantUser,
    email: user.email ?? null,
  }
}
