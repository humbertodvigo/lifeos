'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/shared/theme-toggle'

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b px-4 gap-2">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      <div className="flex-1">
        <h1 className="text-base font-semibold leading-none">{title}</h1>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <ThemeToggle />
    </header>
  )
}
