import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon, EyeIcon, SearchIcon } from "@heroicons/react/outline";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import Image from "next/future/image";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { isSearchOpenAtom } from "./SearchModal";

export const Header: React.FC = () => {
  const setIsSearchOpen = useSetAtom(isSearchOpenAtom);

  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <header
      className={clsx(
        "fixed h-20 z-[60] border-b flex justify-center w-full",
        isAtTop
          ? "bg-transparent border-transparent"
          : "border-primary bg-background bg-opacity-80 backdrop-blur"
      )}
    >
      <div className="container flex items-center h-full px-2 justify-between">
        <Link href="/">
          <div className="flex space-x-2 items-center hover:cursor-pointer">
            <Image
              src="/assets/misc/logo.png"
              alt="Logo"
              width={42}
              height={42}
              quality={100}
              className="drop-shadow"
            />
            <a>
              <div className="text-lg font-black tracking-wide drop-shadow leading-none">
                <p className="text-primary-light">RUNE</p>
                <p className="text-accent">PROFILE</p>
              </div>
            </a>
          </div>
        </Link>
        <div className="flex text-light-gray text-lg">
          <Popover className="relative">
            <Popover.Button className="drop-shadow-sm">
              <div className="flex justify-center items-center hover:text-white">
                Leaderboards
                <ChevronDownIcon className="w-5 h-5 ml-2" />
              </div>
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute left-1/2 z-50 mt-3 w-screen max-w-sm -translate-x-1/2 transform p-4 sm:px-0">
                <div className="overflow-hidden bg-background border-accent border-2 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="flex flex-col p-4 space-y-4">
                    <Link href="/leaderboards/collection">
                      <a className="flex items-center rounded-md px-2 py-3 transition duration-150 ease-in-out hover:bg-background-light focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center text-white">
                          <Image
                            src="/assets/icons/collection-log.png"
                            fill
                            alt="Collection Log book"
                          />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-light-gray">
                            Collection Log
                          </p>
                          <p className="text-sm text-gray-500">
                            The most succesful collectors in Gilineor
                          </p>
                        </div>
                      </a>
                    </Link>
                    {/* <Link href="/leaderboards/items">
                      <a className="flex items-center rounded-md px-2 py-3 transition duration-150 ease-in-out hover:bg-background-light focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center text-white">
                          <Image
                            src="/assets/leaderboard-icons/justi-helmet.png"
                            alt="A Justiciar helmet"
                            height={40}
                            width={32}
                          />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-light-gray">
                            Items
                          </p>
                          <p className="text-sm text-gray-500">
                            Who has collected the most of <i>x</i> item?
                          </p>
                        </div>
                      </a>
                    </Link> */}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>
        </div>
        <div
          className="flex justify-between space-x-2 items-center rounded border-accent border-[2px] py-[6px] px-[7px] pr-2 text-accent shadow-md hover:cursor-pointer hover:border-primary transition-colors"
          onClick={() => setIsSearchOpen(true)}
        >
          <div className="flex space-x-1 items-center">
            <SearchIcon className="w-[18px] h-[18px]" />
            <span className="text-sm font-meidum">Search...</span>
          </div>
          <span className="text-sm font-bold text-primary">Ctrl K</span>
        </div>
      </div>
    </header>
  );
};
