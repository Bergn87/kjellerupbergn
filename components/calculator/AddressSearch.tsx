'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface DAWAResult {
  tekst: string
  adresse: {
    id: string
    adgangsadresseid: string
    vejnavn: string
    husnr: string
    postnr: string
    postnrnavn: string
  }
}

export interface AddressSelection {
  displayText: string
  adresseId: string
  adgAdrId: string
  postnr: string
  by: string
  vejnavn: string
  husnr: string
}

interface AddressSearchProps {
  onSelect: (address: AddressSelection) => void
  placeholder?: string
  initialValue?: string
  className?: string
}

// ============================================
// COMPONENT
// ============================================

export default function AddressSearch({
  onSelect,
  placeholder = 'Indtast din adresse...',
  initialValue = '',
  className,
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<DAWAResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ============================================
  // DAWA SØGNING
  // ============================================

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ q, per_side: '8' })
      const res = await fetch(
        `https://api.dataforsyningen.dk/adresser/autocomplete?${params}`
      )

      if (!res.ok) throw new Error('Fejl ved søgning')

      const data: DAWAResult[] = await res.json()
      setResults(data)
      setIsOpen(data.length > 0)
      setActiveIndex(-1)
    } catch {
      setError('Kunne ikke søge — prøv igen')
      setResults([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ============================================
  // DEBOUNCE
  // ============================================

  const handleInputChange = (value: string) => {
    setQuery(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      search(value)
    }, 300)
  }

  // Cleanup debounce ved unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // ============================================
  // VÆLG ADRESSE
  // ============================================

  const handleSelect = (result: DAWAResult) => {
    const selection: AddressSelection = {
      displayText: result.tekst,
      adresseId: result.adresse.id,
      adgAdrId: result.adresse.adgangsadresseid,
      postnr: result.adresse.postnr,
      by: result.adresse.postnrnavn,
      vejnavn: result.adresse.vejnavn,
      husnr: result.adresse.husnr,
    }

    setQuery(result.tekst)
    setResults([])
    setIsOpen(false)
    setActiveIndex(-1)
    onSelect(selection)
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleSelect(results[activeIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  // ============================================
  // CLICK OUTSIDE
  // ============================================

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ============================================
  // SCROLL ACTIVE INTO VIEW
  // ============================================

  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[data-result]')
      items[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          className="rounded-lg border-gray-200 focus:border-primary pr-10"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg overflow-hidden"
          role="listbox"
        >
          {results.map((result, index) => (
            <button
              key={result.adresse.id}
              data-result
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer',
                index === activeIndex
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
              )}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {result.tekst}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
