'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Phone, Menu, X, ChevronDown } from 'lucide-react'

const SERVICES = [
  { href: '/tagrens', label: 'Tagrens & Tagmaling' },
  { href: '/fliserens', label: 'Fliserens' },
  { href: '/maler', label: 'Malerarbejde' },
  { href: '/vinduespolering', label: 'Vinduespolering' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/90 backdrop-blur-lg border-b shadow-sm' : 'bg-transparent'
      )}>
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-bold shrink-0">
            <span className={scrolled ? 'text-primary' : 'text-white'}>Bergn</span>
            <span className="text-bergn-accent">.dk</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
              <button className={cn('flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors', scrolled ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10')}>
                Services <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 rounded-xl bg-white border shadow-lg py-2">
                  {SERVICES.map((s) => (
                    <Link key={s.href} href={s.href} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">{s.label}</Link>
                  ))}
                </div>
              )}
            </div>

            <a href="#priser" className={cn('px-3 py-2 text-sm font-medium rounded-lg transition-colors', scrolled ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10')}>Priser</a>
            <a href="#faq" className={cn('px-3 py-2 text-sm font-medium rounded-lg transition-colors', scrolled ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10')}>FAQ</a>
            <Link href="/login" className={cn('px-3 py-2 text-sm font-medium rounded-lg transition-colors', scrolled ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10')}>Log ind</Link>

            <div className="w-px h-6 bg-gray-300/30 mx-1" />

            <a href="tel:+4570605040" className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors', scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white')}>
              <Phone className="h-3.5 w-3.5" /> 70 60 50 40
            </a>

            <Link href="/signup" className="ml-1 rounded-lg bg-bergn-cta px-4 py-2 text-sm font-semibold text-white hover:bg-bergn-cta-hover transition-colors">
              Prøv gratis
            </Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen
              ? <X className={cn('h-5 w-5', scrolled ? 'text-gray-900' : 'text-white')} />
              : <Menu className={cn('h-5 w-5', scrolled ? 'text-gray-900' : 'text-white')} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden overflow-y-auto">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Services</p>
            {SERVICES.map((s) => (
              <Link key={s.href} href={s.href} className="block px-3 py-3 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>{s.label}</Link>
            ))}
            <div className="h-px bg-gray-200 my-4" />
            <a href="#priser" className="block px-3 py-3 text-base font-medium text-gray-800" onClick={() => setMobileOpen(false)}>Priser</a>
            <a href="#faq" className="block px-3 py-3 text-base font-medium text-gray-800" onClick={() => setMobileOpen(false)}>FAQ</a>
            <Link href="/login" className="block px-3 py-3 text-base font-medium text-gray-800" onClick={() => setMobileOpen(false)}>Log ind</Link>
            <div className="h-px bg-gray-200 my-4" />
            <a href="tel:+4570605040" className="flex items-center gap-2 px-3 py-3 text-base font-medium text-gray-800"><Phone className="h-4 w-4" /> 70 60 50 40</a>
            <Link href="/signup" className="block w-full text-center rounded-lg bg-bergn-cta px-4 py-3 text-base font-semibold text-white mt-4" onClick={() => setMobileOpen(false)}>Prøv gratis</Link>
          </div>
        </div>
      )}
    </>
  )
}
