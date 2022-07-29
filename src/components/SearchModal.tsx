import { Combobox, Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { SearchIcon } from "@heroicons/react/outline";
import clsx from "clsx";
import { useRouter } from "next/router";

type User = {
  username: string;
  isPluginUser: boolean;
};

type SearchModelProps = {
  users: User[];
};

export const SearchModal: React.FC<SearchModelProps> = ({ users }) => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen((thisIsOpen) => !thisIsOpen);
      }
    };

    window.addEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, []);

  const filteredUsers = query
    ? users.filter((user) =>
        user.username.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <Transition.Root
      show={isOpen}
      as={Fragment}
      // TODO: This is bugged in the current version of Headless UI
      afterLeave={() => {
        setQuery("");
      }}
    >
      <Dialog
        onClose={setIsOpen}
        className="fixed inset-0 overflow-y-auto p-4 pt-[25vh]"
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
                setIsOpen(false);
                router.push(`/u/${user.username}`);
              }
            }}
            as="div"
            className="relative mx-auto max-w-xl divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="flex items-center px-4 py-2">
              <SearchIcon className="h-6 w-6 text-gray-500" />
              <Combobox.Input
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                className="w-full border-0 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:ring-0"
                placeholder="Search for account..."
              />
            </div>
            {filteredUsers.length > 0 && (
              <Combobox.Options
                static
                className="max-h-96 overflow-y-auto py-4 text-sm"
              >
                {filteredUsers.map((user) => (
                  <Combobox.Option key={user.username} value={user}>
                    {({ active }) => (
                      <div
                        className={clsx(
                          "flex w-full justify-between px-4 py-2",
                          active ? "bg-indigo-600" : "bg-white"
                        )}
                      >
                        <p
                          className={clsx(
                            "font-medium",
                            active ? "text-white" : "text-gray-900"
                          )}
                        >
                          {user.username}
                        </p>
                        {user.isPluginUser && (
                          <p
                            className={clsx(
                              active ? "text-indigo-200" : "text-gray-400"
                            )}
                          >
                            Not using the plugin
                          </p>
                        )}
                      </div>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            )}
            {query && filteredUsers.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No accounts found.</p>
            )}
          </Combobox>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
};
