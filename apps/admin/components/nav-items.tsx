"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavItems() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Home" },
    { href: "/accounts", label: "Accounts" },
    { href: "/activities", label: "Activities" },
  ];
  return (
    <SidebarMenu>
      {items.map((i) => (
        <SidebarMenuItem key={i.href}>
          <SidebarMenuButton asChild isActive={pathname === i.href}>
            <Link href={i.href}>{i.label}</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
