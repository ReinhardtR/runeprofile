import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { HiscoreLeaderboardKey } from "@runeprofile/runescape";

import { getHiscoresData } from "~/core/api";
import ClueScrollIcons from "~/core/assets/clue-scroll-icons.json";
import HiscoreIcons from "~/core/assets/hiscore-icons.json";
import QuestionMarkImage from "~/core/assets/misc/question-mark.png";
import { GameIcon } from "~/shared/components/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/shared/components/ui/table";
import {
  cn,
  numberWithAbbreviation,
  numberWithDelimiter,
} from "~/shared/utils";

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

  const skills = hiscoresQuery.data.skills;

  const showActivityFilter = (
    activity: (typeof hiscoresQuery.data.activities)[number],
  ) => {
    return activity.score > 0 && !activity.name.includes("legacy");
  };

  const activities = hiscoresQuery.data.activities;

  const bossesStartIndex = activities.findIndex(
    (a) => a.name === "Abyssal Sire",
  );
  const bosses = activities
    .slice(bossesStartIndex, activities.length)
    .filter(showActivityFilter);

  const nonBossActivities = activities.slice(0, bossesStartIndex);

  const clues = nonBossActivities
    .filter((activity) => activity.name.startsWith("Clue Scrolls"))
    .filter(showActivityFilter);

  const misc = nonBossActivities
    .filter((activity) => !activity.name.startsWith("Clue Scrolls"))
    .filter(showActivityFilter);

  const iconSize = "size-[22px]";
  const iconSizeNum = 22;

  return (
    <div className={cn("flex flex-col gap-y-4 font-medium", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Boss</TableHead>
            <TableHead className="text-right">Rank</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bosses.map((boss) => (
            <TableRow key={boss.id} className="border-b">
              <TableCell className="flex items-center gap-x-3">
                {hiscoreIcon(boss.name) ? (
                  <GameIcon
                    src={hiscoreIcon(boss.name)!}
                    alt={boss.name}
                    size={iconSizeNum}
                  />
                ) : (
                  <img
                    src={QuestionMarkImage}
                    alt={boss.name}
                    className={cn("object-contain", iconSize)}
                  />
                )}
                {boss.name}
              </TableCell>
              <TableCell className="text-right">
                {numberWithDelimiter(boss.rank)}
              </TableCell>
              <TableCell className="text-right">
                {numberWithDelimiter(boss.score)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Clue</TableHead>
            <TableHead className="text-right">Rank</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clues.map((boss) => (
            <TableRow key={boss.id} className="border-b">
              <TableCell className="flex items-center gap-x-3">
                {clueScrollIcon(boss.name) ? (
                  <GameIcon
                    src={clueScrollIcon(boss.name)!}
                    alt={boss.name}
                    size={iconSizeNum}
                  />
                ) : (
                  <img
                    src={QuestionMarkImage}
                    alt={boss.name}
                    className={cn("object-contain", iconSize)}
                  />
                )}
                {boss.name}
              </TableCell>
              <TableCell className="text-right">
                {numberWithDelimiter(boss.rank)}
              </TableCell>
              <TableCell className="text-right">
                {numberWithDelimiter(boss.score)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Activity</TableHead>
            <TableHead className="text-right">Rank</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {misc.map((activity) => (
            <TableRow key={activity.id} className="border-b">
              <TableCell className="flex items-center gap-x-3">
                {hiscoreIcon(activity.name) ? (
                  <GameIcon
                    src={hiscoreIcon(activity.name)!}
                    alt={activity.name}
                    size={iconSizeNum}
                  />
                ) : (
                  <img
                    src={QuestionMarkImage}
                    alt={activity.name}
                    className={cn("object-contain", iconSize)}
                  />
                )}
                {activity.name}
              </TableCell>
              <TableCell className="text-right">
                {numberWithDelimiter(activity.rank)}
              </TableCell>
              <TableCell className="text-right">
                {numberWithDelimiter(activity.score)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Table>
        <TableHeader>
          <TableRow className="border-b-border border-b">
            <TableHead className="text-left">Skill</TableHead>
            <TableHead className="text-right">Rank</TableHead>
            <TableHead className="text-right">Level</TableHead>
            <TableHead className="text-right">XP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skills.map((skill) => (
            <TableRow key={skill.id}>
              <TableCell className="flex items-center gap-x-3">
                {hiscoreIcon(skill.name) ? (
                  <GameIcon
                    src={hiscoreIcon(skill.name)!}
                    alt={skill.name}
                    size={iconSizeNum}
                  />
                ) : (
                  <img
                    src={QuestionMarkImage}
                    alt={skill.name}
                    className={cn("object-contain", iconSize)}
                  />
                )}
                {skill.name}
              </TableCell>
              <TableCell className="text-right">
                {numberWithDelimiter(skill.rank)}
              </TableCell>
              <TableCell className="text-right">
                {numberWithDelimiter(skill.level)}
              </TableCell>
              <TableCell className="text-right">
                {numberWithAbbreviation(skill.xp)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
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
