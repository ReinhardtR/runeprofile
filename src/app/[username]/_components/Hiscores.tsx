"use client";

import React from "react";
import { Card } from "~/components/Card";
import {
  HiscoresGameMode,
  type Hiscores as HiscoresType,
} from "~/lib/domain/profile-data-types";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GAME_MODE_DISPLAY_TEXT } from "~/lib/constants/gamemodes";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useSearchParamsUtils } from "~/lib/utils/use-search-params-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  numberWithAbbreviation,
  numberWithDelimiter,
} from "~/lib/utils/numbers";
import { cn } from "~/lib/utils/cn";
import { ImageWithFallback } from "~/components/misc/image-with-fallback";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/new-tooltip";

type HiscoresProps = {
  hiscores: HiscoresType;
};

const gameModeParamKey = "mode";

export const Hiscores: React.FC<HiscoresProps> = ({ hiscores }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createPathString } = useSearchParamsUtils();

  const gameModeParam = searchParams.get(gameModeParamKey)?.toUpperCase() as
    | HiscoresGameMode
    | undefined;
  const gameMode: HiscoresGameMode =
    gameModeParam && Object.values(HiscoresGameMode).includes(gameModeParam)
      ? gameModeParam
      : HiscoresGameMode.NORMAL;

  const setGameMode = (mode?: string) => {
    if (!mode) return;
    router.replace(
      createPathString({ [gameModeParamKey]: mode }), //
      { scroll: false }
    );
  };

  return (
    <Card
      iconPath="/assets/hiscores/hiscore.png"
      className="w-[260px] flex flex-col p-4"
    >
      <Select value={gameMode} onValueChange={setGameMode}>
        <SelectTrigger className="runescape-corners-border bg-osrs-tab/50 w-full flex justify-center items-center gap-2 hover:bg-osrs-tab-selected hover:cursor-pointer font-runescape text-osrs-orange solid-text-shadow text-xl focus:ring-0">
          <Image
            src={getAccountTypeAssetUrl(gameMode)}
            alt={gameMode}
            quality={100}
            width={14}
            height={14}
            className="drop-shadow-solid-sm"
          />
          <SelectValue>{GAME_MODE_DISPLAY_TEXT[gameMode]}</SelectValue>
        </SelectTrigger>
        <SelectContent className="w-[225px] runescape-corners-border bg-osrs-tab text-osrs-yellow font-runescape">
          <SelectGroup>
            {hiscores.map((leaderboard) => (
              <SelectItem
                key={leaderboard.gameMode}
                value={leaderboard.gameMode}
                className="focus:bg-osrs-tab-selected focus:text-osrs-orange text-xl data-[state=checked]:text-osrs-orange w-[200px]"
              >
                <div className="flex space-x-3 w-full justify-start items-center h-6">
                  <Image
                    src={getAccountTypeAssetUrl(leaderboard.gameMode)}
                    alt={leaderboard.gameMode}
                    quality={100}
                    width={14}
                    height={14}
                    style={{ objectFit: "contain" }}
                    className="drop-shadow-solid-sm"
                  />
                  <span>{GAME_MODE_DISPLAY_TEXT[leaderboard.gameMode]}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="h-full overflow-y-scroll border-2 border-osrs-dark-border mt-1">
        <Table>
          <TableHeader className="font-runescape text-lg">
            <TableRow className="!border-0">
              <TableHead className="w-[16px] text-osrs-orange font-bold h-1">
                Icon
              </TableHead>
              <TableHead className="text-osrs-orange font-bold h-1">
                Score
              </TableHead>
              <TableHead className="text-osrs-orange font-bold h-1 text-right">
                Rank
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-white">
            {hiscores
              .find((h) => h.gameMode === gameMode)
              ?.entries.map((entry) => (
                <TableRow
                  key={entry.activity}
                  className="text-osrs-yellow font-runescape font-bold text-lg border-0"
                >
                  <TableCell className="w-[16px] py-1">
                    <Tooltip>
                      <TooltipTrigger className="cursor-default">
                        <ImageWithFallback
                          src={getActivityAssetUrl(entry.activity)}
                          alt={entry.activity}
                          width={24}
                          height={24}
                          quality={100}
                          className="drop-shadow-solid-sm"
                        />
                      </TooltipTrigger>
                      <TooltipContent className="text-osrs-orange text-lg">
                        {entry.activity}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  <TableCell
                    className={cn("py-1", {
                      "text-osrs-green": entry.score === 200_000_000,
                      "text-osrs-red": entry.score === -1,
                    })}
                  >
                    {entry.score === -1
                      ? "---"
                      : entry.score > 10_000
                      ? numberWithAbbreviation(entry.score)
                      : numberWithDelimiter(entry.score)}
                  </TableCell>
                  <TableCell
                    className={cn("py-1 text-right", {
                      "text-osrs-green": entry.rank === 1,
                      "text-osrs-red": entry.rank === -1,
                    })}
                  >
                    {entry.rank === -1
                      ? "---"
                      : numberWithDelimiter(entry.rank)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

const getAccountTypeAssetUrl = (gameMode: string) => {
  return `/assets/hiscores/account-types/${gameMode}.png`;
};

const getActivityAssetUrl = (name: string) => {
  const activityName = name
    .replace(" - ", "_")
    .replace(/[\s-]/g, "_")
    .replace(/[':()]/g, "")
    .toLowerCase();

  return `/assets/hiscores/activity-icons/${activityName}.png`;
};
