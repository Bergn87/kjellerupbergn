'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { checkUserHasTenant } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNeedsOnboarding(false)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Forkert email eller adgangskode')
        return
      }

      // Tjek om brugeren har en virksomhed oprettet
      const result = await checkUserHasTenant()
      if (result && !result.hasTenant) {
        setNeedsOnboarding(true)
        return
      }

      router.push(redirect || '/admin/dashboard')
      router.refresh()
    } catch {
      setError('Der opstod en fejl. Prøv igen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Log ind</CardTitle>
        <CardDescription>
          Log ind på din Bergn.dk konto
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {needsOnboarding && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-sm font-medium text-amber-900">
                Du er logget ind, men din virksomhed er ikke oprettet endnu.
              </p>
              <p className="text-sm text-amber-700">
                For at bruge dashboardet skal du først oprette din virksomhedsprofil.
              </p>
              <Link
                href={`/onboarding?email=${encodeURIComponent(email)}`}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Opret virksomhed →
              </Link>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="din@email.dk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Adgangskode</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logger ind...
              </>
            ) : (
              'Log ind'
            )}
          </Button>
          <div className="flex items-center justify-between text-sm w-full">
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:underline"
            >
              Glemt adgangskode?
            </Link>
            <Link
              href="/signup"
              className="text-primary hover:underline font-medium"
            >
              Opret konto
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
