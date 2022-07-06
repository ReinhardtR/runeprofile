import { Skill } from "@/lib/data-schema";
import { getLevelFromXP } from "@/lib/utils/level";
import { formatXP } from "@/lib/utils/xp-format";
import Image from "next/future/image";
import { useMemo } from "react";
import { Card } from "../Card";

type SkillsCardProps = {
  accountSkills: Record<Skill, number>;
  overallXP: number;
};

export const SkillsCard: React.FC<SkillsCardProps> = ({
  accountSkills,
  overallXP,
}) => {
  const overallLevel = useMemo(
    () =>
      Object.values(accountSkills).reduce(
        (acc, cur) => acc + getLevelFromXP(cur),
        0
      ),
    [accountSkills, overallXP]
  );

  return (
    <div className="min-h-full min-w-full">
      <Card>
        {/* <h3 className="mb-1 pt-2 text-center text-xl font-bold">
          <div className="flex items-center justify-center gap-x-2">
            <Image src={`/assets/skill-icons/overall.png`} className="w-8" />
            <span>Skills</span>
          </div>
        </h3> */}
        <div className="grid-rows-8 grid grid-cols-3">
          {Object.entries(accountSkills).map(([skill, xp]) => (
            <SkillElement
              key={skill}
              skill={skill}
              level={getLevelFromXP(xp)}
              xp={xp}
              iconPath={`/assets/skill-icons/${skill}.png`}
            />
          ))}
          <SkillElement skill={"Overall"} level={overallLevel} xp={overallXP} />
        </div>
      </Card>
    </div>
  );
};

type SkillElementProps = {
  skill: string;
  level: number;
  xp: number;
  iconPath?: string;
};

export const SkillElement: React.FC<SkillElementProps> = ({
  skill,
  level,
  xp,
  iconPath,
}) => {
  return (
    <div className="runescape-stats-tile flex items-center justify-between px-3 font-runescape">
      {!!iconPath && (
        <Image src={iconPath} className="w-[25px]" quality={100} />
      )}
      <div className="ml-1 flex grow flex-col items-center justify-center">
        <div className="text-center font-bold leading-none">
          <p className="text-lg text-yellow-osrs">{level}</p>
          {/* <p className="text-xs opacity-60">{formatXP(xp)}</p> */}
        </div>
      </div>
    </div>
  );
};
