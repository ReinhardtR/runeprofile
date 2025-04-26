import { useDebouncedCallback } from "@tanstack/react-pacer";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { atom, useAtom } from "jotai";
import React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { searchProfiles } from "~/lib/api";

export const isSearchDialogOpenAtom = atom(false);

export const SearchDialog: React.FC = () => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useAtom(isSearchDialogOpenAtom);

  const [search, setSearch] = React.useState("");
  const setSearchDebounced = useDebouncedCallback(setSearch, {
    wait: 300,
  });

  // Force re-render when data changes
  const [, forceUpdate] = React.useState({});

  const searchQuery = useQuery({
    queryKey: ["search", search],
    queryFn: () => searchProfiles({ query: search }),
    enabled: !!search.length,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });

  // Force a re-render when data changes
  React.useEffect(() => {
    if (searchQuery.data) {
      forceUpdate({});
    }
  }, [searchQuery.data]);

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

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setSearch("");
        }
      }}
    >
      <CommandInput
        onValueChange={setSearchDebounced}
        isLoading={searchQuery.isFetching}
        placeholder="Search by username..."
      />
      <CommandList>
        <CommandEmpty>
          {searchQuery.isFetching ? "Searching" : "No results found."}
        </CommandEmpty>
        <CommandGroup>
          {!!search.length &&
            searchQuery.data?.map((profile) => (
              <CommandItem
                key={profile.username}
                onSelect={() =>
                  runCommand(() =>
                    router.navigate({
                      to: "/$username",
                      params: { username: profile.username },
                    }),
                  )
                }
              >
                {profile.username}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
