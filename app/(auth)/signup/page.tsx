'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Opret konto</CardTitle>
        <CardDescription>
          Kom i gang med Bergn.dk — dit tilbudsværktøj til håndværkere
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            14 dages gratis prøveperiode
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            Ingen kreditkort påkrævet
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            Op til 20 gratis leads per måned
          </li>
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button
          className="w-full"
          onClick={() => router.push('/onboarding')}
        >
          Kom i gang — gratis
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Har du allerede en konto?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Log ind
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
