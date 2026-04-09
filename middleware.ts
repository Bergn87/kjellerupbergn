import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request)

  // a) Refresh Supabase session
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname, hostname } = request.nextUrl

  // b) Wildcard subdomæne-routing
  // Hvis hostname er [slug].bergn.dk (ikke app. eller www.)
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
  if (!isLocalhost) {
    const parts = hostname.split('.')
    // f.eks. "malerfirma.bergn.dk" → parts = ["malerfirma", "bergn", "dk"]
    if (parts.length === 3 && parts[1] === 'bergn' && parts[2] === 'dk') {
      const slug = parts[0]
      if (slug !== 'app' && slug !== 'www') {
        // Rewrite til /b/[slug][pathname]
        const url = request.nextUrl.clone()
        url.pathname = `/b/${slug}${pathname}`
        return NextResponse.rewrite(url, {
          headers: response.headers,
        })
      }
    }
  }

  // c) Auth beskyttelse

  // /admin/* → redirect til /login hvis ikke logget ind
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url, {
        headers: response.headers,
      })
    }
  }

  // /superadmin/* → redirect til /login hvis ikke superadmin
  if (pathname.startsWith('/superadmin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url, {
        headers: response.headers,
      })
    }
    // Superadmin-check via email (env var)
    const superadminEmail = process.env.SUPERADMIN_EMAIL
    if (superadminEmail && user.email !== superadminEmail) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url, {
        headers: response.headers,
      })
    }
  }

  // /onboarding er ÅBEN — signup sker i trin 1 af wizarden.
  // Ingen auth-krav her.

  // d) Redirect logik for logged-in brugere
  if (user) {
    // Hvis logget ind og på /login eller /signup → tjek om bruger har tenant
    if (pathname === '/login' || pathname === '/signup') {
      const url = request.nextUrl.clone()
      // Vi kan ikke kalde DB i middleware effektivt,
      // så vi redirecter til dashboard — admin layout håndterer onboarding-redirect
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url, {
        headers: response.headers,
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match alle routes undtagen:
     * - _next/static (statiske filer)
     * - _next/image (billede-optimering)
     * - favicon.ico
     * - Statiske filer (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
