"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { atom, useAtom } from "jotai";

import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";

export const isSearchDialogOpenAtom = atom(false);

const results = ["PGN", "B0aty", "Zezima"];

export const SearchDialog: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useAtom(isSearchDialogOpenAtom);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setIsOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Type a username..." />
      <CommandList>
        <CommandEmpty>No results found</CommandEmpty>
        {results.map((username) => (
          <CommandItem
            key={username}
            onSelect={() => {
              runCommand(() => router.push(`/${username}`));
            }}
          >
            {username}
          </CommandItem>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
