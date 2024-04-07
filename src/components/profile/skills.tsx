import Image from "next/image";

import { type Skill as SkillType } from "~/lib/domain/profile-data-types";
import {
  getLevelFromXP,
  getVirtualLevelFromXP,
  getXPUntilNextLevel,
} from "~/lib/helpers/xp-and-levels";
import { cn } from "~/lib/utils/cn";
import { numberWithDelimiter } from "~/lib/utils/numbers";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Card } from "~/components/card";

const OVERALL_NAME = "Overall";
const MAX_SKILL_LEVEL = 99;
const MAX_TOTAL_LEVEL = 2277;

type SkillsProps = {
  skills: SkillType[];
};

export const Skills: React.FC<SkillsProps> = ({ skills }) => {
  const overallLevel = skills.reduce(
    (totalXP, skill) => totalXP + getLevelFromXP(skill.xp),
    0
  );

  const overallXP = skills.reduce((totalXP, skill) => totalXP + skill.xp, 0);

  return (
    <Card iconPath="/assets/icons/skills.png" className="w-[260px]">
      <div className="grid-rows-8 mt-2 grid grid-cols-3 p-1">
        {skills.map(({ name, xp }) => (
          <Skill key={name} name={name} level={getLevelFromXP(xp)} xp={xp} />
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
};

type SkillProps = {
  name: string;
  level: number;
  xp: number;
};

export const Skill: React.FC<SkillProps> = ({ name, level, xp }) => {
  const isOverall = name == OVERALL_NAME;
  return (
    <Tooltip key={name}>
      <TooltipTrigger asChild>
        <div className="runescape-stats-tile flex items-center justify-between px-3">
          {!isOverall && (
            <Image
              src={`/assets/skill-icons/${name.toLowerCase()}.png`}
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
              }
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
};
