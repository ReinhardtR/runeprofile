"use client";

import React from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { GAME_MODE_DISPLAY_TEXT } from "~/lib/constants/gamemodes";
import {
  HiscoresGameMode,
  type Hiscores as HiscoresType,
} from "~/lib/domain/profile-data-types";
import { cn } from "~/lib/utils/cn";
import {
  numberWithAbbreviation,
  numberWithDelimiter,
} from "~/lib/utils/numbers";
import { useSearchParamsUtils } from "~/lib/utils/use-search-params-utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Card } from "~/components/card";
import { ImageWithFallback } from "~/components/misc/image-with-fallback";

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
      className="flex w-[260px] flex-col p-4"
    >
      <Select value={gameMode} onValueChange={setGameMode}>
        <SelectTrigger className="runescape-corners-border flex w-full items-center justify-center gap-2 bg-osrs-tab/50 font-runescape text-xl text-osrs-orange solid-text-shadow hover:cursor-pointer hover:bg-osrs-tab-selected focus:ring-0">
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
        <SelectContent className="runescape-corners-border w-[225px] bg-osrs-tab font-runescape text-osrs-yellow">
          <SelectGroup>
            {hiscores.map((leaderboard) => (
              <SelectItem
                key={leaderboard.gameMode}
                value={leaderboard.gameMode}
                className="w-[200px] text-xl focus:bg-osrs-tab-selected focus:text-osrs-orange data-[state=checked]:text-osrs-orange"
              >
                <div className="flex h-6 w-full items-center justify-start space-x-3">
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
      <div className="mt-1 h-full overflow-y-scroll border-2 border-osrs-dark-border">
        <Table>
          <TableHeader className="font-runescape text-lg">
            <TableRow className="!border-0">
              <TableHead className="h-1 w-[16px] font-bold text-osrs-orange">
                Icon
              </TableHead>
              <TableHead className="h-1 font-bold text-osrs-orange">
                Score
              </TableHead>
              <TableHead className="h-1 text-right font-bold text-osrs-orange">
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
                  className="border-0 font-runescape text-lg font-bold text-osrs-yellow"
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
                      <TooltipContent className="text-lg text-osrs-orange">
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
