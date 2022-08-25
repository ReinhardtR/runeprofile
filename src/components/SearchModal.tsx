import { Combobox, Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { SearchIcon } from "@heroicons/react/outline";
import clsx from "clsx";
import { useRouter } from "next/router";
import { atom, useAtom } from "jotai";
import { useDebounceValue } from "@/utils/useDebounce";
import { trpc } from "@/utils/trpc";
import Spinner from "./Misc/Spinner";
import Image from "next/future/image";

type User = {
  username: string;
};

export const isSearchOpenAtom = atom(false);

export const SearchModal: React.FC = () => {
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useAtom(isSearchOpenAtom);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounceValue(query, 500);

  const { data, isLoading } = trpc.useQuery(
    [
      "accounts.search",
      {
        query: debouncedQuery,
      },
    ],
    {
      enabled: debouncedQuery.length > 0 && isSearchOpen,
    }
  );

  useEffect(() => {
    if (!window) return;

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsSearchOpen((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, []);

  const accounts = data?.accounts || [];

  return (
    <Transition.Root
      show={isSearchOpen}
      as={Fragment}
      // TODO: This is bugged in the current version of Headless UI
      afterLeave={() => {
        setQuery("");
      }}
    >
      <Dialog
        onClose={setIsSearchOpen}
        className="fixed inset-0 overflow-y-auto p-4 pt-[15vh] z-50"
      >
        <Transition.Child
          as={Fragment}
          enter="duration-300 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-200 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="bg-gray-500/7 fixed inset-0 transition-opacity" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="duration-300 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-200 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Combobox
            value={null}
            onChange={(user: User) => {
              if (user) {
                setIsSearchOpen(false);
                router.push(`/u/${user.username}`);
              }
            }}
            as="div"
            className="relative mx-auto max-w-xl divide-y divide-primary overflow-hidden rounded-md bg-background shadow-2xl ring-1 ring-black/5"
          >
            <div className="flex items-center px-4 py-2">
              <SearchIcon className="h-6 w-6 text-primary" />
              <Combobox.Input
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                className="w-full border-0 bg-transparent text-sm text-light-gray placeholder-gray-600 focus:ring-0"
                placeholder="Search for an account..."
              />
            </div>
            {isLoading && (
              <div className="h-24">
                <Spinner />
              </div>
            )}
            {!isLoading && accounts.length > 0 && (
              <Combobox.Options
                static
                className="max-h-96 overflow-y-auto py-4 text-sm divide-y divide-background-light"
              >
                {accounts.map((account) => (
                  <Combobox.Option key={account.username} value={account}>
                    {({ active }) => (
                      <div
                        className={clsx(
                          "flex w-full justify-between px-4 py-3 hover:cursor-pointer",
                          active ? "bg-accent" : "bg-background"
                        )}
                      >
                        <p
                          className={clsx(
                            active
                              ? "text-background font-extrabold"
                              : "text-accent font-medium"
                          )}
                        >
                          {account.username}
                        </p>
                        {account.account_type != "NORMAL" && (
                          <div className="bg-background p-[5px] w-6 h-6 rounded">
                            <div className="relative w-full h-full">
                              <Image
                                src={`/assets/account-type/${account.account_type.toLowerCase()}.png`}
                                alt={account.account_type}
                                quality={100}
                                fill
                                className="drop-shadow-solid object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            )}
            {!isLoading && query && accounts.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No accounts found.</p>
            )}
          </Combobox>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
};