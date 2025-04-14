import { Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Search } from "lucide-react";
import React from "react";

import Logo from "~/assets/misc/logo.png";
import { DiscordIcon } from "~/components/icons";
import { isSearchDialogOpenAtom } from "~/components/search-dialog";
import { Button, buttonVariants } from "~/components/ui/button";
import { DISCORD_INVITE_INK } from "~/lib/constants";
import { cn } from "~/lib/utils";

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
        "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4",
        isAtTop
          ? "border-transparent bg-transparent"
          : "border-primary bg-background bg-opacity-80 backdrop-blur",
      )}
    >
      <div className="flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <img
              src={Logo}
              alt="Logo"
              width={42}
              height={42}
              className="drop-shadow"
            />
            <p className="hidden flex-col text-lg font-black leading-none tracking-wide drop-shadow sm:flex">
              <span className="text-primary">RUNE</span>
              <span className="text-secondary-foreground">PROFILE</span>
            </p>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="outline"
              className={cn(
                "relative h-8 w-full justify-start rounded-[0.5rem] bg-background pl-2 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64",
              )}
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="mr-1 h-4 w-4" />
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
            <a href={DISCORD_INVITE_INK} target="_blank" rel="noreferrer">
              <div
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                  }),
                  "w-9 px-0",
                )}
              >
                <DiscordIcon className="h-4 w-4 fill-current" />
                <span className="sr-only">Discord</span>
              </div>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
