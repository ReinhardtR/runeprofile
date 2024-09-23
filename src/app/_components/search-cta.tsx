"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useSetAtom } from "jotai";

import { cn } from "~/lib/utils/cn";
import { Button, ButtonProps } from "~/components/ui/button";
import { isSearchDialogOpenAtom } from "~/components/search-dialog";

export const SearchCTA: React.FC<ButtonProps> = ({ className, ...props }) => {
  const setIsSearchOpen = useSetAtom(isSearchDialogOpenAtom);

  return (
    <Button
      variant="outline"
      className={cn(
        "flex h-12 transform items-center justify-center space-x-2 rounded-full border border-primary bg-black/75 px-4 py-1.5 text-base font-medium shadow transition-all hover:scale-110 hover:bg-black/75",
        className
      )}
      onClick={() => setIsSearchOpen(true)}
      {...props}
    >
      <MagnifyingGlassIcon className="mr-1 h-5 w-5 fill-current" />
      <span className="inline-flex">Search profiles</span>
    </Button>
  );
};
