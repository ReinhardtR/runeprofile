import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import {
  HiscoreLeaderboardKey,
  MAX_COMBAT_LEVEL,
  MAX_SKILL_LEVEL,
  MAX_SKILL_XP,
  MAX_TOTAL_LEVEL,
  SKILLS,
  getCombatLevelFromSkills,
} from "@runeprofile/runescape";

import { getHiscoresData } from "~/core/api";
import ClueScrollIcons from "~/core/assets/clue-scroll-icons.json";
import HiscoreIcons from "~/core/assets/hiscore-icons.json";
import TotalLevelIcon from "~/core/assets/icons/skills.png";
import MiscIcons from "~/core/assets/misc-icons.json";
import QuestionMarkImage from "~/core/assets/misc/question-mark.png";
import { GameIcon } from "~/shared/components/icons";
import { Separator } from "~/shared/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/shared/components/ui/tooltip";
import { cn, numberWithDelimiter } from "~/shared/utils";

export function hiscoresQueryOptions(params: {
  leaderboard: HiscoreLeaderboardKey;
  username: string;
}) {
  return queryOptions({
    queryKey: ["hiscores", params],
    queryFn: () => getHiscoresData(params),
  });
}

export function Hiscores({
  username,
  className,
}: {
  username: string;
  className?: string;
}) {
  const hiscoresQuery = useSuspenseQuery(
    hiscoresQueryOptions({
      username,
      leaderboard: "normal",
    }),
  );

  const { skills, activities } = hiscoresQuery.data;

  // Skills laid out in the in-game skill-tab order (SKILLS), matching RuneLite's
  // 3-column grid. "Overall" is excluded here and shown in the summary row instead.
  const skillTiles = SKILLS.map((name) =>
    skills.find((skill) => skill.name === name),
  ).filter((skill): skill is (typeof skills)[number] => Boolean(skill));

  const overall = skills.find((skill) => skill.name === "Overall");
  const combatLevel = getCombatLevelFromSkills(skills);

  // Show every boss/activity/clue that has an icon (RuneLite-style). Restricting to
  // entries with an icon drops the non-gameplay noise the raw hiscore feed carries
  // (e.g. "Grid Points", "Deadman Points", legacy Bounty Hunter), leaving the curated
  // set RuneLite shows.
  const visibleActivities = activities
    .map((activity) => ({ ...activity, icon: activityIcon(activity.name) }))
    .filter((activity) => activity.icon !== null);

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={0}>
      <div className={cn("flex flex-col gap-y-2 p-1", className)}>
        <div className="grid grid-cols-3 gap-[1px]">
          {skillTiles.map((skill) => (
            <SkillTile
              key={skill.id}
              name={skill.name}
              level={skill.level}
              xp={skill.xp}
              rank={skill.rank}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-[1px]">
          <SummaryTile
            icon={MiscIcons["combat"]}
            label="Combat Level"
            value={combatLevel}
            isMax={combatLevel === MAX_COMBAT_LEVEL}
          />
          <SummaryTile
            icon={TotalLevelIcon}
            isBase64={false}
            label="Total Level"
            value={overall?.level ?? 0}
            isMax={(overall?.level ?? 0) === MAX_TOTAL_LEVEL}
            extra={
              overall ? (
                <>
                  <Separator className="my-1" />
                  <TooltipRow
                    label="Overall XP"
                    value={numberWithDelimiter(overall.xp)}
                  />
                </>
              ) : undefined
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-[1px]">
          {visibleActivities.map((activity) => (
            <ActivityTile
              key={activity.id}
              name={activity.name}
              icon={activity.icon!}
              score={activity.score}
              rank={activity.rank}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function SkillTile({
  name,
  level,
  xp,
  rank,
}: {
  name: string;
  level: number;
  xp: number;
  rank: number;
}) {
  const icon = hiscoreIcon(name);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="runescape-stats-tile flex h-full w-full items-center justify-between px-3">
          {icon ? (
            <GameIcon
              src={icon}
              alt={name}
              size={24}
              className="flex-1 drop-shadow-solid-sm"
            />
          ) : (
            <img
              src={QuestionMarkImage}
              alt={name}
              className="size-6 flex-1 object-contain"
            />
          )}
          <p
            className={cn(
              "ml-1 flex-1 select-none text-center font-runescape text-lg font-bold leading-none text-osrs-yellow solid-text-shadow",
              {
                "text-osrs-green": level === MAX_SKILL_LEVEL,
                "text-osrs-red":
                  level === 1 || (name === "Hitpoints" && level === 10),
                "shimmer-text": xp >= MAX_SKILL_XP,
              },
            )}
          >
            {level}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none flex w-[220px] flex-col p-2.5">
        <TooltipRow label={name} value={`Lvl ${level}`} />
        <Separator className="my-1" />
        <TooltipRow label="Rank" value={formatRank(rank)} />
        <TooltipRow label="XP" value={numberWithDelimiter(xp)} />
      </TooltipContent>
    </Tooltip>
  );
}

function ActivityTile({
  name,
  icon,
  score,
  rank,
}: {
  name: string;
  icon: string;
  score: number;
  rank: number;
}) {
  // Unranked entries come back with rank -1 (and score 0), so rank is the signal.
  // Some activities (LMS, PvP Arena) carry a real score but no rank, so the score
  // itself decides whether we show a value; rank is reported separately.
  const scoreLabel = score > 0 ? numberWithDelimiter(score) : "--";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="runescape-stats-tile flex h-full w-full items-center justify-between px-3">
          <GameIcon
            src={icon}
            alt={name}
            size={24}
            className="flex-1 drop-shadow-solid-sm"
          />
          <p
            className={cn(
              "ml-1 flex-1 select-none text-center font-runescape text-lg font-bold leading-none solid-text-shadow",
              score > 0 ? "text-osrs-yellow" : "text-muted-foreground",
            )}
          >
            {scoreLabel}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none flex w-[220px] flex-col p-2.5">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <Separator className="my-1" />
        <TooltipRow label="Rank" value={formatRank(rank)} />
        <TooltipRow label="Score" value={scoreLabel} />
      </TooltipContent>
    </Tooltip>
  );
}

function SummaryTile({
  icon,
  isBase64 = true,
  label,
  value,
  isMax,
  extra,
}: {
  icon: string;
  isBase64?: boolean;
  label: string;
  value: number;
  isMax: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="runescape-stats-tile flex w-full items-center justify-center gap-x-2 py-0.5">
          <GameIcon
            src={icon}
            alt={label}
            size={20}
            isBase64={isBase64}
            className="drop-shadow-solid-sm"
          />
          <p
            className={cn(
              "font-runescape text-lg font-bold text-osrs-yellow solid-text-shadow",
              { "text-osrs-green": isMax },
            )}
          >
            {value}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none flex w-[220px] flex-col p-2.5">
        <TooltipRow label={label} value={value} />
        {extra}
      </TooltipContent>
    </Tooltip>
  );
}

function TooltipRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-row items-center justify-between text-sm">
      <span className="font-semibold text-foreground">{label}</span>
      <span className="font-semibold text-secondary-foreground">{value}</span>
    </div>
  );
}

function formatRank(rank: number) {
  return rank >= 0 ? numberWithDelimiter(rank) : "--";
}

function activityIcon(name: string) {
  return name.startsWith("Clue Scrolls")
    ? clueScrollIcon(name)
    : hiscoreIcon(name);
}

function clueScrollIcon(name: string) {
  const tier = name.match(/\((.*?)\)/);
  if (!tier || tier.length < 2) return null;
  const tierName = tier[1].toLowerCase();
  return ClueScrollIcons[tierName as keyof typeof ClueScrollIcons] || null;
}

function hiscoreIcon(name: string) {
  return HiscoreIcons[name as keyof typeof HiscoreIcons] || null;
}
