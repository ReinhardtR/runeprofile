import { useDebouncedValue } from "@tanstack/react-pacer";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { CommandGroup } from "cmdk";
import { atom, useAtom } from "jotai";
import React from "react";

import AccountTypeIcons from "~/assets/account-type-icons.json";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { searchProfiles } from "~/lib/api";
import { base64ImgSrc } from "~/lib/utils";

export const isSearchDialogOpenAtom = atom(false);

export const SearchDialog: React.FC = () => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useAtom(isSearchDialogOpenAtom);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 });

  const searchQuery = useQuery({
    queryKey: ["search", debouncedSearch],
    queryFn: () => searchProfiles({ query: debouncedSearch }),
    enabled: !!debouncedSearch.length,
    staleTime: 1000 * 60 * 5,
  });

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

  console.log(
    "Search query data:",
    searchQuery.data,
    "Search status:",
    searchQuery.status,
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        value={search}
        onValueChange={(value) => {
          setSearch(value);
        }}
        isLoading={searchQuery.isFetching}
        placeholder="Search by username..."
      />
      <CommandList>
        <CommandGroup>
          {searchQuery.data?.map((profile) => {
            const accountTypeIcon =
              AccountTypeIcons[
                profile.accountType.key as keyof typeof AccountTypeIcons
              ];
            return (
              <CommandItem
                className="m-2.5"
                key={profile.username}
                onSelect={() => {
                  runCommand(() => {
                    router.navigate({
                      to: "/$username",
                      params: { username: profile.username },
                    });
                  });
                }}
              >
                {accountTypeIcon && (
                  <img
                    src={base64ImgSrc(accountTypeIcon)}
                    width={20}
                    height={20}
                  />
                )}
                {profile.username}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
