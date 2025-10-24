import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "RuneProfile Admin",
  description: "Internal tooling",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full bg-background text-foreground flex min-h-screen">
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <main className="flex-1 flex flex-col">
            <header className="flex h-14 items-center gap-2 border-b px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger />
              <div className="font-medium text-sm tracking-wide">
                RuneProfile Admin
              </div>
            </header>
            <div className="p-6 flex-1 overflow-y-auto">{children}</div>
          </main>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
