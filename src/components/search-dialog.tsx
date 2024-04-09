"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { atom, useAtom } from "jotai";
import { useDebounce } from "use-debounce";

import { searchAccounts } from "~/lib/data/search";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Spinner } from "~/components/ui/spinner";

export const isSearchDialogOpenAtom = atom(false);

export const SearchDialog: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useAtom(isSearchDialogOpenAtom);
  const [isLoading, setIsLoading] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery] = useDebounce(query, 1000);
  const [results, setResults] = React.useState<string[]>([]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setIsOpen(false);
    command();
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);

      if (debouncedQuery.length === 0) {
        setResults([]);
      } else {
        const usernames = await searchAccounts(debouncedQuery);
        setResults(usernames);
      }

      setIsLoading(false);
    };

    fetchResults();
  }, [debouncedQuery]);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder="Type a username..."
        value={query}
        onValueChange={(value) => {
          setIsLoading(true);
          setQuery(value);
        }}
        isLoading={isLoading}
      />
      <CommandList>
        <CommandEmpty className="text-primary">
          {query.length === 0 || isLoading
            ? "Start typing to search for a username."
            : "No results found."}
        </CommandEmpty>
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
