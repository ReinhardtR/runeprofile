import { getLevelFromXP } from "~/utils/xp-and-levels";
import { Card } from "../../../components/Card";
import { SkillElement } from "~/app/[username]/(components)/SkillElement";

export const OVERALL_NAME = "Overall";

type Skill = {
  name: string;
  xp: number;
};

type SkillsCardProps = {
  skills: Skill[];
};

export function SkillsCard({ skills }: SkillsCardProps) {
  const overallLevel = skills.reduce(
    (totalXP, skill) => totalXP + getLevelFromXP(skill.xp),
    0
  );

  const overallXP = skills.reduce((totalXP, skill) => totalXP + skill.xp, 0);

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
}
