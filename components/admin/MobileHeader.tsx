'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Sidebar from './Sidebar'

interface MobileHeaderProps {
  tenantName: string
  plan: string
}

export default function AdminMobileHeader({ tenantName, plan }: MobileHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex items-center border-b bg-white px-4 py-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <div className="h-full" onClick={() => setOpen(false)}>
            <Sidebar tenantName={tenantName} plan={plan} />
          </div>
        </SheetContent>
      </Sheet>
      <span className="ml-3 font-semibold text-sm">Bergn.dk</span>
    </header>
  )
}
