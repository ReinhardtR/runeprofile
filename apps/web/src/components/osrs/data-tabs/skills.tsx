import {
  MAX_SKILL_LEVEL,
  MAX_TOTAL_LEVEL,
  SKILLS,
  getCombatLevelFromSkills,
  getLevelFromXP,
  getVirtualLevelFromXP,
  getXPUntilNextLevel,
} from "@runeprofile/runescape";

import SkillIcons from "~/assets/skills-icons.json";
import { Separator } from "~/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Profile } from "~/lib/api";
import { base64ImgSrc, cn, numberWithDelimiter } from "~/lib/utils";

const OVERALL_NAME = "Overall";

export function Skills({ data }: { data: Profile["skills"] }) {
  const skills: Array<{ name: string; xp: number; level: number }> = [];

  for (const skillName of SKILLS) {
    const skillData = data.find((s) => s.name === skillName);
    const xp = skillData?.xp ?? 0;
    skills.push({
      name: skillName,
      xp,
      level: getLevelFromXP(xp),
    });
  }

  const combatLevel = getCombatLevelFromSkills(skills);

  const overallLevel = skills.reduce(
    (totalXP, skill) => totalXP + getLevelFromXP(skill.xp),
    0,
  );

  const overallXP = skills.reduce((totalXP, skill) => totalXP + skill.xp, 0);

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={0}>
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
          combatLevel={combatLevel}
        />
      </div>
    </TooltipProvider>
  );
}

type SkillProps = {
  name: string;
  level: number;
  xp: number;
  combatLevel?: number;
};

function Skill({ name, level, xp, combatLevel }: SkillProps) {
  const isOverall = name == OVERALL_NAME;
  const virtualLevel = getVirtualLevelFromXP(xp);

  const skillIcon = SkillIcons[name.toLowerCase() as keyof typeof SkillIcons];

  return (
    <Tooltip key={name}>
      <TooltipTrigger asChild>
        <div className="runescape-stats-tile flex items-center justify-between px-3">
          {!isOverall && (
            <img
              src={base64ImgSrc(skillIcon)}
              alt={name}
              className="flex-1 object-contain drop-shadow"
              width={24}
              height={38}
              draggable={false}
            />
          )}
          <p
            className={cn(
              "ml-1 flex-1 text-center font-runescape text-lg font-bold leading-none text-osrs-yellow solid-text-shadow select-none",
              {
                "text-osrs-green":
                  level === MAX_SKILL_LEVEL ||
                  (isOverall && level === MAX_TOTAL_LEVEL),
              },
              {
                "text-osrs-red":
                  level === 1 || (name === "Hitpoints" && level === 10),
              },
              {
                "skill-200m-text":
                  (xp >= 200_000_000 && name !== "Overall") ||
                  (xp >= 4_600_000_000 && isOverall),
              },
            )}
          >
            {level}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none p-2.5 flex flex-col w-[260px]">
        <SkillTooltipRow label={`${name} XP`} value={numberWithDelimiter(xp)} />
        {!isOverall && (
          <>
            <Separator className="my-1" />
            <SkillTooltipRow
              label="XP to next Level"
              value={numberWithDelimiter(getXPUntilNextLevel(xp))}
            />
            {virtualLevel >= MAX_SKILL_LEVEL && (
              <>
                <Separator className="my-1" />
                <SkillTooltipRow
                  label="Virtual Level"
                  value={getVirtualLevelFromXP(xp)}
                />
              </>
            )}
          </>
        )}
        {combatLevel !== undefined && (
          <>
            <Separator className="my-1" />
            <SkillTooltipRow label="Combat Level" value={combatLevel} />
          </>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function SkillTooltipRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-row items-center justify-between text-sm">
      <span className="font-semibold text-foreground">{label}</span>
      <span className="font-semibold text-secondary-foreground">{value}</span>
    </div>
  );
}
