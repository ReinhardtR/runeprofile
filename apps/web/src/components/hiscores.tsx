import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { HiscoreLeaderboardKey } from "@runeprofile/runescape";

import ClueScrollIcons from "~/assets/clue-scroll-icons.json";
import HiscoreIcons from "~/assets/hiscore-icons.json";
import QuestionMarkImage from "~/assets/misc/question-mark.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getHiscoresData } from "~/lib/api";
import {
  base64ImgSrc,
  cn,
  numberWithAbbreviation,
  numberWithDelimiter,
} from "~/lib/utils";

export function hiscoresQueryOptions(params: {
  leaderboard: HiscoreLeaderboardKey;
  username: string;
}) {
  return queryOptions({
    queryKey: ["hiscores", params],
    queryFn: () => getHiscoresData(params),
  });
}

export function Hiscores({ className }: { className?: string }) {
  const hiscoresQuery = useSuspenseQuery(
    hiscoresQueryOptions({
      username: "pgn",
      leaderboard: "normal",
    }),
  );

  const skills = hiscoresQuery.data.skills;

  const activities = hiscoresQuery.data.activities.filter(
    (activity) => activity.score > 0 && !activity.name.includes("legacy"),
  );

  const bossesStartIndex = activities.findIndex(
    (a) => a.name === "Abyssal Sire",
  );
  const bosses = activities.slice(bossesStartIndex, activities.length);

  const nonBossActivities = activities.slice(0, bossesStartIndex);

  const clues = nonBossActivities.filter((activity) =>
    activity.name.startsWith("Clue Scrolls"),
  );

  const misc = nonBossActivities.filter(
    (activity) => !activity.name.startsWith("Clue Scrolls"),
  );

  const iconSize = "size-[22px]";

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
                <img
                  src={hiscoreIconSrc(boss.name)}
                  className={cn("object-contain", iconSize)}
                />
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
                <img
                  src={clueScrollIconSrc(boss.name)}
                  className={cn("object-contain", iconSize)}
                />
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
                <img
                  src={hiscoreIconSrc(activity.name)}
                  className={cn("object-contain", iconSize)}
                />
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
                <img
                  src={hiscoreIconSrc(skill.name)}
                  className={cn("object-contain", iconSize)}
                />
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

function clueScrollIconSrc(name: string) {
  const tier = name.match(/\((.*?)\)/);
  if (!tier || tier.length < 2) return QuestionMarkImage;
  const tierName = tier[1].toLowerCase();
  const icon = ClueScrollIcons[tierName as keyof typeof ClueScrollIcons];
  const src = icon ? base64ImgSrc(icon) : QuestionMarkImage;
  return src;
}

function hiscoreIconSrc(name: string) {
  const icon = HiscoreIcons[name as keyof typeof HiscoreIcons];
  const src = icon ? base64ImgSrc(icon) : QuestionMarkImage;
  return src;
}
