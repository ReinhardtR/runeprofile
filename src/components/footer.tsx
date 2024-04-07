import React from "react";
import Image from "next/image";
import Link from "next/link";
import { DiscordLogoIcon, Pencil2Icon } from "@radix-ui/react-icons";

import { CHANGE_LOG_CONFIG, isChangeLogNew } from "~/config/change-log";
import { cn } from "~/lib/utils/cn";
import { Button, buttonVariants } from "~/components/ui/button";

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-50 w-full border-t border-primary bg-background pt-3">
      <div className="min-h-64 container m-auto mx-auto grid grid-cols-2 gap-6 p-8 pb-8 pt-10 lg:grid-cols-6">
        <div className="col-span-2 flex flex-col items-start">
          <Link href="/">
            <Image
              src="/assets/misc/logo.png"
              width={40}
              height={40}
              alt="RuneProfile Logo"
            />
            <p className="text-xl font-bold">RuneProfile</p>
          </Link>

          <FooterLink>
            <a
              href="/PGN"
              target="_blank"
              className="group text-primary-foreground/30 hover:text-secondary"
            >
              <p>
                Developed{" "}
                <span className="hidden group-hover:inline">
                  with ❤️ and xp waste{" "}
                </span>
                by PGN
              </p>
            </a>
          </FooterLink>

          <Button className="mt-4" size="lg" asChild>
            <a
              href="https://discord.com/users/476302464493158400"
              target="_blank"
              rel="noreferrer"
            >
              <DiscordLogoIcon className="mr-2 h-5 w-5" />
              Join the Discord
            </a>
          </Button>

          <Button className="mt-4" size="lg" variant="outline" asChild>
            <a
              href="https://discord.com/users/476302464493158400"
              target="_blank"
              rel="noreferrer"
            >
              <Pencil2Icon className="mr-2 h-5 w-5" />
              Quick Feedback
            </a>
          </Button>
        </div>

        <div className="col-span-1 flex flex-col items-start space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">Leaderboards</h3>
          <FooterLink disabled>
            <Link
              href="/leaderboards/collection-log"
              target="_blank"
              rel="noreferrer"
            >
              <p>Collection Log</p>
            </Link>
          </FooterLink>
          <FooterLink disabled>
            <a href="#" target="_blank" rel="noreferrer">
              <p>Items</p>
            </a>
          </FooterLink>
        </div>

        <div className="col-span-1 flex flex-col items-start space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase">Information</h3>
          <FooterLink>
            <a
              href="https://github.com/ReinhardtR/runeprofile-plugin#guide"
              target="_blank"
              rel="noreferrer"
            >
              Guide
            </a>
          </FooterLink>

          <FooterLink>
            <Link href="/info/change-log">
              <div className="relative">
                {isChangeLogNew(CHANGE_LOG_CONFIG.lastDate) && (
                  <p className="absolute inset-0 left-[70px] top-[2px] rotate-12 text-xs font-semibold text-secondary">
                    NEW
                  </p>
                )}
                <p>Change Log</p>
              </div>
            </Link>
          </FooterLink>
        </div>

        <div className="col-span-1 flex flex-col items-start space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">Contribute</h3>
          <FooterLink>
            <a
              href="https://github.com/ReinhardtR/runeprofile"
              target="_blank"
              rel="noreferrer"
            >
              <p>GitHub - Web App</p>
            </a>
          </FooterLink>
          <FooterLink>
            <a
              href="https://github.com/Reinhardtr/runeprofile-plugin"
              target="_blank"
              rel="noreferrer"
            >
              <p>GitHub - Plugin</p>
            </a>
          </FooterLink>
        </div>

        <div className="col-span-1 flex flex-col items-start space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase">RuneScape</h3>
          <FooterLink>
            <a href="https://runelite.net/" target="_blank" rel="noreferrer">
              <p>RuneLite</p>
            </a>
          </FooterLink>
          <FooterLink>
            <a
              href="https://oldschool.runescape.com/"
              target="_blank"
              rel="noreferrer"
            >
              <p>Old School</p>
            </a>
          </FooterLink>
          <FooterLink>
            <a href="https://www.jagex.com/" target="_blank" rel="noreferrer">
              <p>Jagex Ltd.</p>
            </a>
          </FooterLink>
        </div>
      </div>

      <div className="col-span-6 mb-16 flex items-center space-x-1 px-8 text-sm lg:justify-center">
        <FooterLink>
          <a
            href="https://oldschool.runescape.com/"
            target="_blank"
            rel="noreferrer"
          >
            <p className="underline underline-offset-4">Old School RuneScape</p>
          </a>
        </FooterLink>

        <p>is a trademark of</p>
        <FooterLink>
          <a href="https://www.jagex.com/" target="_blank" rel="noreferrer">
            <p className="underline underline-offset-4">Jagex Ltd.</p>
          </a>
        </FooterLink>
      </div>
    </footer>
  );
};

const FooterLink: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  ...props
}) => {
  return (
    <Button
      variant="link"
      className={cn(
        buttonVariants({ variant: "link" }),
        "h-auto p-0 text-primary-foreground/80 hover:text-primary-foreground",
        className
      )}
      asChild
      {...props}
    />
  );
};
