"use client"

import { usePathname } from "next/navigation"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { navData } from "@/lib/nav-config"

function getTitleFromPath(pathname: string): string {
  const allNavItems = [
    ...navData.navMain,
    ...navData.navSecondary,
    ...navData.collaborations,
    ...navData.operations,
  ]

  if (pathname === "/account") return "Account"

  for (const item of allNavItems) {
    if (item.url !== "#" && pathname.startsWith(item.url)) {
      return item.title
    }
  }

  return "Documents" // fallback title
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = pathname ? getTitleFromPath(pathname) : "Documents"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <p className="hidden sm:flex">☁️</p>
        </div>
      </div>
    </header>
  )
}
