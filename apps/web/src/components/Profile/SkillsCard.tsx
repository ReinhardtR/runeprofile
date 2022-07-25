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
    <Card>
      <div className="grid-rows-8 grid grid-cols-3 p-1">
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
    <div className="runescape-stats-tile flex items-center justify-between px-3">
      {!!iconPath && (
        <Image src={iconPath} className="w-[25px] drop-shadow" quality={100} />
      )}
      <p className="text-shadow ml-1 grow text-center font-runescape text-lg font-bold leading-none text-osrs-yellow">
        {level}
      </p>
    </div>
  );
};
