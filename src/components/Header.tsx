import { SearchIcon } from "@heroicons/react/outline";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import Image from "next/future/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isSearchOpenAtom } from "./SearchModal";

export const Header: React.FC = () => {
  const setIsSearchOpen = useSetAtom(isSearchOpenAtom);

  const [isAtTop, setIsAtTop] = useState(true);

  function onScroll() {
    if ((window.scrollY || 0) < 20) {
      setIsAtTop(true);
    } else if (isAtTop) {
      setIsAtTop(false);
    }
  }

  useEffect(() => {
    if (!window) return;

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
        <div className="flex space-x-2 items-center">
          <Image
            src="/logo.png"
            width={50}
            height={50}
            quality={100}
            className="drop-shadow-xl"
          />
          <Link href="/">
            <a>
              <div className="text-xl font-black tracking-wide hidden sm:block drop-shadow-xl leading-none">
                <p className="text-primary">RUNE</p>
                <p className="text-accent">PROFILE</p>
              </div>
            </a>
          </Link>
        </div>
        <div className="flex text-light-gray text-lg">
          <span className="drop-shadow-xl">Leaderboards</span>
        </div>
        <div
          className="flex justify-between space-x-2 items-center rounded border-accent border-[2px] py-[6px] px-[7px] pr-2 text-accent shadow-xl hover:cursor-pointer hover:border-primary transition-colors"
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
