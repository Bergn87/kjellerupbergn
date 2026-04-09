'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/80 backdrop-blur-lg border-b shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
        <Link href="/" className="text-lg font-bold">
          <span className={scrolled ? 'text-[#0F1B35]' : 'text-white'}>Bergn</span>
          <span className="text-[#E8500A]">.dk</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a href="#funktioner" className={cn('text-sm font-medium transition-colors', scrolled ? 'text-[#374151] hover:text-[#0F1B35]' : 'text-white/80 hover:text-white')}>
            Funktioner
          </a>
          <a href="#priser" className={cn('text-sm font-medium transition-colors', scrolled ? 'text-[#374151] hover:text-[#0F1B35]' : 'text-white/80 hover:text-white')}>
            Priser
          </a>
          <Link href="/login" className={cn('text-sm font-medium transition-colors', scrolled ? 'text-[#374151] hover:text-[#0F1B35]' : 'text-white/80 hover:text-white')}>
            Log ind
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#E8500A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#d04609] transition-colors"
          >
            Start gratis &rarr;
          </Link>
        </div>
      </div>
    </nav>
  )
}
