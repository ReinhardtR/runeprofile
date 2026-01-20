import { Link } from "@tanstack/react-router";
import React from "react";

import Logo from "~/core/assets/misc/logo.png";
import { DonateButton } from "~/shared/components/DonateButton";
import { JoinDiscordButton } from "~/shared/components/JoinDiscordButton";
import { Button, buttonVariants } from "~/shared/components/ui/button";
import { cn } from "~/shared/utils";

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-50 w-full border-t border-primary bg-background pt-3">
      <div className="min-h-64 container m-auto mx-auto grid grid-cols-2 gap-6 p-8 pb-8 pt-10 lg:grid-cols-6">
        <div className="col-span-2 flex flex-col items-start">
          <Link to="/">
            <img src={Logo} width={40} height={40} alt="RuneProfile Logo" />
            <p className="text-xl font-bold">RuneProfile</p>
          </Link>

          <FooterLink>
            <Link
              to="/$username"
              params={{ username: "pgn" }}
              target="_blank"
              className="group text-muted-foreground hover:text-secondary-foreground"
            >
              <p>
                Developed{" "}
                <span className="hidden group-hover:inline">
                  with ❤️ and xp waste{" "}
                </span>
                by pgn
              </p>
            </Link>
          </FooterLink>

          <JoinDiscordButton />
          <DonateButton />
        </div>

        <div className="hidden col-span-1 lg:flex flex-col items-start space-y-2"></div>

        <div className="col-span-1 flex flex-col items-start space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase">Information</h3>
          <FooterLink>
            <Link to="/info/guide">Guide</Link>
          </FooterLink>
          <FooterLink>
            <Link to="/info/alias">Aliases</Link>
          </FooterLink>
        </div>

        <div className="col-span-1 flex flex-col items-start space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">GITHUB</h3>
          <FooterLink>
            <a
              href="https://github.com/ReinhardtR/runeprofile"
              target="_blank"
              rel="noreferrer"
            >
              <p>Web App</p>
            </a>
          </FooterLink>
          <FooterLink>
            <a
              href="https://github.com/Reinhardtr/runeprofile-plugin"
              target="_blank"
              rel="noreferrer"
            >
              <p>Plugin</p>
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

      <p className="col-span-6 mb-16 px-8 text-sm text-center">
        <FooterLink>
          <a
            href="https://oldschool.runescape.com/"
            target="_blank"
            rel="noreferrer"
            className="inline"
          >
            <span className="underline underline-offset-4">
              Old School RuneScape
            </span>
          </a>
        </FooterLink>

        <span> is a trademark of </span>
        <FooterLink className="inline">
          <a href="https://www.jagex.com/" target="_blank" rel="noreferrer">
            <span className="underline underline-offset-4">Jagex Ltd.</span>
          </a>
        </FooterLink>
      </p>
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
        className,
      )}
      asChild
      {...props}
    />
  );
};
