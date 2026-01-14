"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { AlertTriangle, Home, ListChecks, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Accounts", url: "/accounts", icon: Users },
  { title: "Dup Activities", url: "/dup-activities", icon: ListChecks },
  {
    title: "Item Discrepancies",
    url: "/item-discrepancies",
    icon: AlertTriangle,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
