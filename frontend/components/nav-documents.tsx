"use client"

import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { Role } from "@/types/role"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@/app/api/user/api"
import Link from "next/link"

export function NavDocuments({
  items,
  label,
}: Readonly<{
  items: {
    title: string
    url: string
    icon: Icon
    role?: Role[]
  }[]
  label: string
}>) {
  const pathname = usePathname()

  const { data: session } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  const itemsFiltered = items.filter((item) =>
    item.role?.includes(session?.role as Role)
  )

  if (itemsFiltered.length === 0) {
    return null
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label ?? "No label"}</SidebarGroupLabel>
      <SidebarMenu>
        {itemsFiltered.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.url)}
              className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
