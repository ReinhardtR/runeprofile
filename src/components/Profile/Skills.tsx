import { Skill } from "@/lib/data-schema";
import { getLevelFromXP } from "@/utils/level";
import { formatXP } from "@/utils/xp-format";
import Image from "next/future/image";
import { useMemo } from "react";
import { Card } from "../Card";
import { Account } from "@/edgeql";
import clsx from "clsx";

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

  const overallXP = useMemo(
    () => skills.reduce((totalXP, skill) => totalXP + skill.xp, 0),
    [skills]
  );

  return (
    <Card>
      <div className="grid-rows-8 grid grid-cols-3 p-1">
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
      <p
        className={clsx(
          "text-shadow ml-1 flex-1 text-center font-runescape text-lg font-bold leading-none",
          level == 99 || (isOverall && level == 2277)
            ? "text-osrs-green text-shadow"
            : "text-osrs-yellow"
        )}
      >
        {level}
      </p>
    </div>
  );
};
