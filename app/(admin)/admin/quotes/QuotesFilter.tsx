'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, Suspense } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

interface Tab {
  value: string
  label: string
}

interface QuotesFilterProps {
  tabs: Tab[]
  currentStatus: string
  currentSearch: string
  currentPeriod: string
}

export default function QuotesFilter(props: QuotesFilterProps) {
  return (
    <Suspense>
      <QuotesFilterInner {...props} />
    </Suspense>
  )
}

function QuotesFilterInner({ tabs, currentStatus, currentSearch, currentPeriod }: QuotesFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(currentSearch)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v)
        else params.delete(k)
      })
      params.delete('page') // Reset pagination
      router.push(`/admin/quotes?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = () => {
    updateParams({ search: searchValue })
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => updateParams({ status: tab.value })}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              currentStatus === tab.value
                ? 'bg-[#1B3C2E] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Søg + Dato-filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Søg på navn, email, adresse, nummer..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Select
          value={currentPeriod || 'all'}
          onValueChange={(v) => { if (v) updateParams({ period: v === 'all' ? '' : v }) }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle perioder</SelectItem>
            <SelectItem value="week">Denne uge</SelectItem>
            <SelectItem value="month">Denne måned</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
