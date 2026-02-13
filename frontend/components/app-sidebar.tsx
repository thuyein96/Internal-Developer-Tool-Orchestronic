"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import OrchestronicLogo from "./orchestronic-logo"
import { navData } from "@/lib/nav-config"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@/app/api/user/api"
import { Role } from "@/types/role"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  const isAdmin = user?.role === Role.Admin

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <OrchestronicLogo size={20} />
                <span className="text-base font-semibold">Orchestronic</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        <NavDocuments items={navData.operations} label="Operations" />
        {!isAdmin && <NavDocuments items={navData.account} label="Account" />}
        {isAdmin && <NavDocuments items={navData.users} label="Users" />}
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
