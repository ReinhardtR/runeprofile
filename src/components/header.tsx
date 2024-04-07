"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { DiscordLogoIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useSetAtom } from "jotai";

import { cn } from "~/lib/utils/cn";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";
import { isSearchDialogOpenAtom } from "~/components/search-dialog";

export const Header: React.FC = () => {
  const setIsSearchOpen = useSetAtom(isSearchDialogOpenAtom);

  const [isAtTop, setIsAtTop] = React.useState(true);

  React.useEffect(() => {
    if (!window) return;

    function onScroll() {
      if ((window.scrollY || 0) < 20) {
        setIsAtTop(true);
      } else if (isAtTop) {
        setIsAtTop(false);
      }
    }

    setTimeout(onScroll, 0);

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isAtTop
          ? "border-transparent bg-transparent"
          : "border-primary bg-background bg-opacity-80 backdrop-blur"
      )}
    >
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="/assets/misc/logo.png"
              alt="Logo"
              width={42}
              height={42}
              quality={100}
              className="drop-shadow"
            />
            <p className="hidden flex-col text-lg font-black leading-none tracking-wide drop-shadow sm:flex">
              <span className="text-primary">RUNE</span>
              <span className="text-secondary">PROFILE</span>
            </p>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  Leaderboards
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem
                      href="/leaderboards/collection-log"
                      title="Collection Log"
                      icon="/assets/icons/collection-log.png"
                    >
                      The most succesful collectors in Gilineor
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="outline"
              className={cn(
                "relative h-8 w-full justify-start rounded-[0.5rem] bg-background pl-2 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
              )}
              onClick={() => setIsSearchOpen(true)}
            >
              <MagnifyingGlassIcon className="mr-1 h-4 w-4 fill-current" />
              <span className="hidden lg:inline-flex">
                Search by username...
              </span>
              <span className="inline-flex lg:hidden">Search...</span>
              <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-sm">⌘</span>
                <span>K</span>
              </kbd>
            </Button>
          </div>
          <nav>
            <Link
              href="https://discord.gg/6XgBcePAfj"
              target="_blank"
              rel="noreferrer"
            >
              <div
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                  }),
                  "w-9 px-0"
                )}
              >
                <DiscordLogoIcon className="h-4 w-4 fill-current" />
                <span className="sr-only">Discord</span>
              </div>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  icon?: string;
}

const ListItem = React.forwardRef<React.ElementRef<"a">, ListItemProps>(
  ({ className, title, children, icon, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "flex select-none items-center space-x-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            {icon && <Image src={icon} width={40} height={40} alt={""} />}
            <div className="space-y-1">
              <div className="text-sm font-medium leading-none">{title}</div>
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                {children}
              </p>
            </div>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = "ListItem";
