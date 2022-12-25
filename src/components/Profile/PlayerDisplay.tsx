import { AccountType } from "@prisma/client";
import { Card } from "../Card";
import Image from "next/future/image";
import { PlayerModel } from "./PlayerModel";
import { InformationCircleIcon } from "@heroicons/react/outline";
import { Tooltip } from "../Misc/Tooltip";
import { Fragment } from "react";
import { format } from "date-fns";
import { UNIQUE_NAMES } from "@/lib/unique-names";

type PlayerDisplayProps = {
  username: string;
  combatLevel: number;
  accountType: AccountType;
  description: string;
  modelUri: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

const defaultModel =
  "https://storage.googleapis.com/runeprofile-models/models/_default.ply";

export const PlayerDisplay: React.FC<PlayerDisplayProps> = ({
  username,
  combatLevel,
  accountType,
  description,
  modelUri,
  createdAt,
  updatedAt,
}) => {
  const unqiueName = UNIQUE_NAMES[username];

  return (
    <Card className="flex max-w-[260px] flex-col 1.5xl:min-w-[400px] 1.5xl:min-h-[730px]">
      {/* Name and Combat Level banner */}
      <div className="absolute inset-x-0 mx-auto flex flex-wrap justify-center items-center text-shadow font-runescape text-2xl font-bold leading-none space-x-4 p-2 z-20">
        <div className="flex items-center space-x-2">
          {unqiueName && (
            <Tooltip
              placement="top"
              content={
                <p className="font-medium text-xl">{unqiueName.infoText}</p>
              }
              transparent={false}
            >
              <div>
                <Image
                  src={unqiueName.iconPath}
                  alt="A unique badge for this username"
                  quality={100}
                  width={16}
                  height={20}
                  className="drop-shadow-solid"
                />
              </div>
            </Tooltip>
          )}
          {accountType != AccountType.NORMAL && (
            <Image
              src={`/assets/account-type/${accountType.toLowerCase()}.png`}
              alt={accountType}
              quality={100}
              width={16}
              height={20}
              className="drop-shadow-solid"
            />
          )}
          <span className="text-white">{username}</span>
        </div>

        <div className="flex space-x-1 justify-center items-center text-osrs-orange">
          <Image
            src="/assets/skill-icons/combat.png"
            alt="Combat Level"
            width={20}
            height={20}
            className="drop-shadow-solid-sm"
          />
          <span>{combatLevel}</span>
        </div>
      </div>

      {/* Model */}
      <div className="h-full p-[1px]">
        <PlayerModel modelUri={modelUri ?? defaultModel} />
      </div>

      {/* Description Container */}
      <div className="absolute bottom-4 left-0 w-full px-4">
        <Tooltip
          content={
            <div className="flex flex-col space-y-1 w-60 text-lg font-runescape">
              <p>
                <span className="text-osrs-orange font-bold">CREATED AT </span>
                <span>{format(createdAt, "PPP")}</span>
              </p>
              <p>
                <span className="text-osrs-orange font-bold">UPDATED AT </span>
                <span>{updatedAt ? format(updatedAt, "PPP") : "Never"}</span>
              </p>
            </div>
          }
          transparent={false}
          placement="top"
        >
          <InformationCircleIcon className="ml-auto w-6 h-6 text-osrs-orange drop-shadow-solid m-1" />
        </Tooltip>

        {!!description && (
          <p className="bg-black/50 text-xs text-light-gray p-2 rounded border border-osrs-border">
            {description}
          </p>
        )}
      </div>
    </Card>
  );
};
