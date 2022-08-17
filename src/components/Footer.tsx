import Image from "next/future/image";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="z-50 w-full pt-3 border-t border-primary bg-background-dark">
      <div className="container grid grid-cols-2 gap-6 p-8 pt-10 pb-20 m-auto text-white min-h-64 sm:grid-cols-2 lg:grid-cols-6">
        <div className="col-span-2">
          <div className="relative w-10 h-10 mb-3">
            <Image src="/logo.png" fill />
          </div>

          <h3 className="mb-1 text-xl font-bold">RuneProfile</h3>
          <p className="text-sm text-gray-400">
            <a href="/u/PGN" target="_blank">
              Developed by PGN
            </a>
          </p>
          <div className="flex flex-row mt-6 mb-10 space-x-3"></div>
        </div>

        <div className="flex flex-col col-span-1 space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">Leaderboards</h3>
        </div>
        <div className="flex flex-col col-span-1 space-y-2 pointer-events-none">
          <h3 className="mb-1 text-xs font-bold uppercase">Support</h3>
          <div className="flex flex-col col-span-1 space-y-2 opacity-50"></div>
        </div>
        <div className="flex flex-col col-span-1 space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">Contribute</h3>
        </div>
        <div className="flex flex-col col-span-1 space-y-2">
          <h3 className="mb-1 text-xs font-bold uppercase ">Related</h3>
        </div>
      </div>
    </footer>
  );
};
