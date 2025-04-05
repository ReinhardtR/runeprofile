import {
  MAX_SKILL_LEVEL,
  MAX_TOTAL_LEVEL,
  SKILLS,
  getLevelFromXP,
  getVirtualLevelFromXP,
  getXPUntilNextLevel,
} from "@runeprofile/runescape";

import SkillsIcon from "~/assets/icons/skills.png";
import { Card } from "~/components/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Profile } from "~/lib/api";
import { cn, numberWithDelimiter } from "~/lib/utils";

const OVERALL_NAME = "Overall";

export function Skills({ data }: { data: Profile["skills"] }) {
  const skills: Array<{ name: string; xp: number; level: number }> = [];

  for (const skill of SKILLS) {
    const skillData = data.find((s) => s. === skill.id);
    const xp = skillData?.xp ?? 0;
    skills.push({
      name: skill.name,
      xp,
      level: getLevelFromXP(xp),
    });
  }

  const overallLevel = skills.reduce(
    (totalXP, skill) => totalXP + getLevelFromXP(skill.xp),
    0,
  );

  const overallXP = skills.reduce((totalXP, skill) => totalXP + skill.xp, 0);

  return (
    <Card icon={SkillsIcon} className="shrink-0">
      <div className="grid-rows-8 mt-2 grid grid-cols-3 p-1 gap-y-[1px]">
        {skills.map((skill) => (
          <Skill
            key={skill.name}
            name={skill.name}
            level={skill.level}
            xp={skill.xp}
          />
        ))}
        <Skill
          key={OVERALL_NAME}
          name={OVERALL_NAME}
          level={overallLevel}
          xp={overallXP}
        />
      </div>
    </Card>
  );
}

type SkillProps = {
  name: string;
  level: number;
  xp: number;
};

export function Skill({ name, level, xp }: SkillProps) {
  const isOverall = name == OVERALL_NAME;
  return (
    <Tooltip key={name}>
      <TooltipTrigger asChild>
        <div className="runescape-stats-tile flex items-center justify-between px-3">
          {!isOverall && (
            <img
              src={
                new URL(
                  `../../assets/skills/${name.toLowerCase()}.png`,
                  import.meta.url,
                ).href
              }
              alt={name}
              className="flex-1 object-contain drop-shadow"
              width={24}
              height={38}
            />
          )}
          <p
            className={cn(
              "ml-1 flex-1 text-center font-runescape text-lg font-bold leading-none text-osrs-yellow solid-text-shadow",
              {
                "text-osrs-green":
                  level === MAX_SKILL_LEVEL ||
                  (isOverall && level === MAX_TOTAL_LEVEL),
              },
              {
                "text-osrs-red":
                  level === 1 || //
                  (name === "Hitpoints" && level === 10),
              },
            )}
          >
            {level}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none">
        <div className="flex w-[260px] flex-col">
          <div className="font-runescape text-lg font-bold uppercase tracking-wide">
            <span className="inline text-osrs-orange">{`${name} XP `}</span>
            <span className="text-light-gray inline">
              {numberWithDelimiter(xp)}
            </span>
          </div>
          {!isOverall && (
            <>
              <div className="font-runescape text-lg font-bold uppercase tracking-wide">
                <span className="inline text-osrs-orange">VIRTUAL LEVEL </span>
                <span className="text-light-gray inline">
                  {getVirtualLevelFromXP(xp)}
                </span>
              </div>
              <div className="font-runescape text-lg font-bold uppercase tracking-wide">
                <span className="inline text-osrs-orange">
                  XP UNTIL NEXT LVL{" "}
                </span>
                <span className="text-light-gray inline">
                  {numberWithDelimiter(getXPUntilNextLevel(xp))}
                </span>
              </div>
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
