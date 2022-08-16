import { Skill } from "@/lib/data-schema";
import { getLevelFromXP } from "@/utils/level";
import { formatXP } from "@/utils/xp-format";
import Image from "next/future/image";
import { useMemo } from "react";
import { Card } from "../Card";
import e, { Account } from "@/edgeql";

const OVERALL_NAME = "Overall";

type SkillsCardProps = {
  skills: Account["skills"];
};

export const SkillsCard: React.FC<SkillsCardProps> = ({ skills }) => {
  const overallLevel = useMemo(
    () =>
      skills.reduce((totalXP, skill) => totalXP + getLevelFromXP(skill.xp), 0),
    [skills]
  );

  return (
    <Card>
      <div className="grid-rows-8 grid grid-cols-3 p-1">
        {skills.map(({ name, xp }) => {
          const isOverall = name === OVERALL_NAME;

          return isOverall ? (
            <SkillElement key={name} name={name} level={overallLevel} xp={xp} />
          ) : (
            <SkillElement
              key={name}
              name={name}
              level={getLevelFromXP(xp)}
              xp={xp}
            />
          );
        })}
      </div>
    </Card>
  );
};

type SkillElementProps = {
  name: string;
  level: number;
  xp: number;
  iconPath?: string;
};

export const SkillElement: React.FC<SkillElementProps> = ({
  name,
  level,
  xp,
}) => {
  const isOverall = name == OVERALL_NAME;

  return (
    <div className="runescape-stats-tile flex items-center justify-between px-3">
      {!isOverall && (
        <div className="relative h-full w-full flex-1">
          <Image
            src={`/assets/skill-icons/${name}.png`}
            alt={name}
            className="drop-shadow object-contain"
            fill
            quality={100}
          />
        </div>
      )}
      <p className="text-shadow ml-1 flex-1 text-center font-runescape text-lg font-bold leading-none text-osrs-yellow">
        {level}
      </p>
    </div>
  );
};
