"use client";

import Image from "next/image";
import { InfoCircledIcon } from "@radix-ui/react-icons";

import { UNIQUE_NAMES } from "~/lib/constants/unique-names";
import { AccountType } from "~/lib/domain/profile-data-types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

import { Card } from "../card";
import { PlayerModel } from "./player-model";

type PlayerDisplayProps = {
  username: string;
  combatLevel: number;
  accountType: AccountType;
  description: string;
  modelUri: string | null;
  createdAt: string; // can't pass dates from server to client components
  updatedAt: string; // can't pass dates from server to client components
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
    <Card className="flex max-w-[260px] flex-col 1.5xl:min-h-[730px] 1.5xl:min-w-[400px]">
      {/* Name and Combat Level banner */}
      <div className="absolute inset-x-0 z-20 mx-auto flex flex-wrap items-center justify-center space-x-4 p-2 font-runescape text-2xl font-bold leading-none solid-text-shadow">
        <div className="flex items-center space-x-2">
          {unqiueName && (
            <Tooltip>
              <TooltipTrigger>
                <Image
                  src={unqiueName.iconPath}
                  alt="A unique badge for this username"
                  quality={100}
                  width={16}
                  height={20}
                  className="drop-shadow-solid"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xl font-medium">{unqiueName.infoText}</p>
              </TooltipContent>
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
          <span className="text-osrs-white text-xl">{username}</span>
        </div>

        <div className="flex items-center justify-center space-x-1 text-osrs-orange">
          <Image
            src="/assets/skill-icons/combat.png"
            alt="Combat Level"
            width={20}
            height={20}
            className="drop-shadow-solid-sm"
          />
          <span className="text-xl">{combatLevel}</span>
        </div>
      </div>

      {/* Model */}
      <div className="h-full p-[1px]">
        <PlayerModel modelUri={modelUri ?? defaultModel} />
      </div>

      {/* Description Container */}
      <div className="absolute bottom-4 left-0 w-full px-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoCircledIcon className="m-1 ml-auto h-6 w-6 text-osrs-orange drop-shadow-solid" />
          </TooltipTrigger>
          <TooltipContent className="flex w-[230px] flex-col space-y-1 font-runescape text-lg">
            <p>
              <span className="font-bold text-osrs-orange">CREATED AT </span>
              <span className="text-light-gray">{createdAt}</span>
            </p>
            <p>
              <span className="font-bold text-osrs-orange">UPDATED AT </span>
              <span className="text-light-gray">{updatedAt}</span>
            </p>
          </TooltipContent>
        </Tooltip>
        {!!description && (
          <p className="text-light-gray rounded border border-osrs-border bg-black/50 p-2 text-xs">
            {description}
          </p>
        )}
      </div>
    </Card>
  );
};
