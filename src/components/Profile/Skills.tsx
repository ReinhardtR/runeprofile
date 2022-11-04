import {
  getLevelFromXP,
  getVirtualLevelFromXP,
  getXPUntilNextLevel,
} from "@/lib/xp-to-level";
import Image from "next/future/image";
import { useMemo } from "react";
import { Card } from "../Card";
import clsx from "clsx";
import { Tooltip } from "../Misc/Tooltip";
import { numberWithCommas } from "@/utils/number-with-commas";

const OVERALL_NAME = "Overall";
const MAX_SKILL_LEVEL = 99;
const MAX_TOTAL_LEVEL = 2277;

type Skill = {
  name: string;
  xp: number;
};

type SkillsCardProps = {
  skills: Skill[];
};

export const SkillsCard: React.FC<SkillsCardProps> = ({ skills }) => {
  const overallLevel = useMemo(
    () =>
      skills.reduce((totalXP, skill) => totalXP + getLevelFromXP(skill.xp), 0),
    [skills]
  );

  const overallXP = useMemo(
    () => skills.reduce((totalXP, skill) => totalXP + skill.xp, 0),
    [skills]
  );

  return (
    <Card iconPath="/assets/icons/skills.png" className="w-[260px]">
      <div className="grid-rows-8 grid grid-cols-3 p-1 mt-2">
        {skills.map(({ name, xp }) => (
          <SkillElement
            key={name}
            name={name}
            level={getLevelFromXP(xp)}
            xp={xp}
          />
        ))}
        <SkillElement
          key={OVERALL_NAME}
          name={OVERALL_NAME}
          level={overallLevel}
          xp={overallXP}
        />
      </div>
    </Card>
  );
};

type SkillElementProps = {
  name: string;
  level: number;
  xp: number;
};

export const SkillElement: React.FC<SkillElementProps> = ({
  name,
  level,
  xp,
}) => {
  const isOverall = name == OVERALL_NAME;

  return (
    <Tooltip
      key={name}
      transparent={false}
      placement="bottom"
      content={
        <div className="flex flex-col w-[260px]">
          <div className="uppercase font-runescape text-lg font-bold tracking-wide">
            <span className="text-osrs-orange inline">{`${name} XP `}</span>
            <span className="text-light-gray inline">
              {numberWithCommas(xp)}
            </span>
          </div>
          {!isOverall && (
            <>
              <div className="uppercase font-runescape text-lg font-bold tracking-wide">
                <span className="text-osrs-orange inline">VIRTUAL LEVEL </span>
                <span className="text-light-gray inline">
                  {getVirtualLevelFromXP(xp)}
                </span>
              </div>
              <div className="uppercase font-runescape text-lg font-bold tracking-wide">
                <span className="text-osrs-orange inline">
                  XP UNTIL NEXT LVL{" "}
                </span>
                <span className="text-light-gray inline">
                  {numberWithCommas(getXPUntilNextLevel(xp))}
                </span>
              </div>
            </>
          )}
        </div>
      }
    >
      <div className="runescape-stats-tile flex items-center justify-between px-3">
        {!isOverall && (
          <div className="relative h-full flex-1">
            <Image
              src={`/assets/skill-icons/${name.toLowerCase()}.png`}
              alt={name}
              className="drop-shadow object-contain"
              fill
            />
          </div>
        )}
        <p
          className={clsx(
            "text-shadow ml-1 flex-1 text-center font-runescape text-lg font-bold leading-none",
            level == MAX_SKILL_LEVEL || (isOverall && level == MAX_TOTAL_LEVEL)
              ? "text-osrs-green text-shadow"
              : "text-osrs-yellow"
          )}
        >
          {level}
        </p>
      </div>
    </Tooltip>
  );
};
