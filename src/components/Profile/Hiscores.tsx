import { Account } from "@/edgeql";
import { Tab } from "@headlessui/react";
import clsx from "clsx";
import Image from "next/future/image";
import { Fragment } from "react";
import { Card } from "../Card";

type HiscoresProps = {
  hiscores: Account["hiscores"];
};

export const Hiscores: React.FC<HiscoresProps> = ({ hiscores }) => {
  return (
    <Card
      iconPath="/assets/hiscores/hiscore.png"
      className="w-[250px] flex flex-col p-4"
    >
      <Tab.Group as={Fragment}>
        <Tab.List className="flex space-x-2 justify-evenly">
          {Object.keys(hiscores).map((accountType) => (
            <Tab as={Fragment}>
              {({ selected }) => (
                <div
                  className={clsx(
                    "runescape-corners-border-small p-[2px] shadow-xl",
                    selected ? "bg-background" : "bg-transparent"
                  )}
                >
                  <div className="relative w-5 h-5 drop-shadow-solid">
                    <Image
                      src={`/assets/hiscores/account-types/${accountType}.png`}
                      fill
                    />
                  </div>
                </div>
              )}
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>
    </Card>
  );
};
