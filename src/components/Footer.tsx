import { Discord, Github, Twitter } from "@icons-pack/react-simple-icons";
import clsx from "clsx";
import Image from "next/future/image";

type FooterLinkProps = {
  disabled?: boolean;
  children: React.ReactNode;
};

const FooterLink: React.FC<FooterLinkProps> = ({
  disabled = false,
  children,
}) => (
  <div
    className={clsx(
      "text-gray-300 hover:text-white text-sm transition-colors",
      disabled && "opacity-50 pointer-events-none"
    )}
  >
    {children}
  </div>
);

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-50 w-full pt-3 border-t border-primary bg-background-dark">
      <div className="mx-auto grid grid-cols-2 gap-6 p-8 pt-10 pb-20 m-auto text-white min-h-64  lg:grid-cols-6 container">
        <div className="col-span-2">
          <div className="relative w-10 h-10 mb-3">
            <Image src="/assets/misc/logo.png" fill alt="Logo" />
          </div>

          <h3 className="mb-1 text-xl font-bold">RuneProfile</h3>
          <div className="text-sm text-gray-400">
            <FooterLink>
              <a href="/PGN" target="_blank" className="group">
                <div>
                  Developed{" "}
                  <span className="hidden group-hover:inline">
                    with ❤️ and xp waste
                  </span>{" "}
                  by PGN
                </div>
              </a>
            </FooterLink>
            <div className="flex mt-4 mb-10 space-x-3">
              <FooterLink>
                <a
                  href="https://www.twitter.com/reinhardtdev"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Twitter />
                </a>
              </FooterLink>
              <FooterLink>
                <a
                  href="https://discord.com/users/476302464493158400"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Discord />
                </a>
              </FooterLink>
              <FooterLink>
                <a
                  href="https://github.com/ReinhardtR"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github />
                </a>
              </FooterLink>
            </div>
          </div>
        </div>

        <div className="flex flex-col col-span-1 space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">Leaderboards</h3>
          <FooterLink disabled>
            <a href="#" target="_blank" rel="noreferrer">
              <p>Collection Log</p>
            </a>
          </FooterLink>
          <FooterLink disabled>
            <a href="#" target="_blank">
              <p>Items</p>
            </a>
          </FooterLink>
        </div>

        <div className="flex flex-col col-span-1 space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase">Contact</h3>
          <FooterLink>
            <a
              href="mailto:pgn@runeprofile.com"
              target="_blank"
              rel="noreferrer"
            >
              Email
            </a>
          </FooterLink>

          <FooterLink>
            <a
              href="https://github.com/ReinhardtR/runeprofile/issues"
              target="_blank"
              rel="noreferrer"
            >
              <p>Report Issue</p>
            </a>
          </FooterLink>
        </div>

        <div className="flex flex-col col-span-1 space-y-2">
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

        <div className="flex flex-col col-span-1 space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">RuneScape</h3>
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

      <div className="flex space-x-1 justify-center items-center col-span-6 text-sm mb-16">
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
