import { Discord, Github, Twitter } from "@icons-pack/react-simple-icons";
import Image from "next/future/image";

type FooterLinkProps = {
  children: React.ReactNode;
};

const FooterLink: React.FC<FooterLinkProps> = ({ children }) => (
  <div className="text-gray-300 hover:text-white text-sm transition-colors">
    {children}
  </div>
);

export const Footer: React.FC = () => {
  return (
    <footer className="z-50 w-full pt-3 border-t border-primary bg-background-dark">
      <div className="container grid grid-cols-2 gap-6 p-8 pt-10 pb-20 m-auto text-white min-h-64 sm:grid-cols-2 lg:grid-cols-6">
        <div className="col-span-2">
          <div className="relative w-10 h-10 mb-3">
            <Image src="/assets/misc/logo.png" fill />
          </div>

          <h3 className="mb-1 text-xl font-bold">RuneProfile</h3>
          <div className="text-sm text-gray-400">
            <FooterLink>
              <a href="/u/PGN" target="_blank" className="group">
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
                <a href="https://www.twitter.com/reinhardtdev" target="_blank">
                  <Twitter />
                </a>
              </FooterLink>
              <FooterLink>
                <a href="/" target="_blank">
                  <Discord />
                </a>
              </FooterLink>
              <FooterLink>
                <a href="https://github.com/ReinhardtR" target="_blank">
                  <Github />
                </a>
              </FooterLink>
            </div>
          </div>
        </div>

        <div className="flex flex-col col-span-1 space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">Leaderboards</h3>
          <FooterLink>
            <a href="/leaderboards/collection-log" target="_blank">
              <p>Collection Log</p>
            </a>
          </FooterLink>
          <FooterLink>
            <a href="/leaderboards/items" target="_blank">
              <p>Items</p>
            </a>
          </FooterLink>
          <FooterLink>
            <a href="/leaderboards/views" target="_blank">
              <p>Views</p>
            </a>
          </FooterLink>
        </div>
        <div className="flex flex-col col-span-1 space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase">Support</h3>
          <FooterLink>
            <a
              href="https://github.com/ReinhardtR/runeprofile/issues"
              target="_blank"
            >
              <p>Report Issue</p>
            </a>
          </FooterLink>
          <FooterLink>
            {/* TODO: add discord link */}
            <a href="/" target="_blank">
              <p>Discord</p>
            </a>
          </FooterLink>
          <div className="flex flex-col col-span-1 space-y-2 opacity-50"></div>
        </div>
        <div className="flex flex-col col-span-1 space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">Contribute</h3>
          <FooterLink>
            <a href="https://github.com/ReinhardtR/runeprofile" target="_blank">
              <p>GitHub - Website</p>
            </a>
          </FooterLink>
          <FooterLink>
            <a
              href="https://github.com/Reinhardtr/runeprofile-plugin"
              target="_blank"
            >
              <p>GitHub - Plugin</p>
            </a>
          </FooterLink>
          <FooterLink>
            <a href="/donate" target="_blank">
              <p>Donate</p>
            </a>
          </FooterLink>
        </div>
        <div className="flex flex-col col-span-1 space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">RuneScape</h3>
          <FooterLink>
            <a href="https://runelite.net/" target="_blank">
              <p>RuneLite</p>
            </a>
          </FooterLink>
          <FooterLink>
            <a href="https://oldschool.runescape.com/" target="_blank">
              <p>Old School</p>
            </a>
          </FooterLink>
          <FooterLink>
            <a href="https://www.jagex.com/" target="_blank">
              <p>Jagex Ltd.</p>
            </a>
          </FooterLink>
        </div>

        <div className="flex space-x-1 justify-center items-center col-span-6 text-sm">
          <FooterLink>
            <a href="https://oldschool.runescape.com/" target="_blank">
              <p className="underline underline-offset-4">
                Old School RuneScape
              </p>
            </a>
          </FooterLink>

          <p>is a trademark of</p>
          <FooterLink>
            <a href="https://www.jagex.com/" target="_blank">
              <p className="underline underline-offset-4">Jagex Ltd.</p>
            </a>
          </FooterLink>
        </div>
      </div>
    </footer>
  );
};
