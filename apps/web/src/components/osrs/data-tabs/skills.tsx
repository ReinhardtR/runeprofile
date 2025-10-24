import {
  MAX_COMBAT_LEVEL,
  MAX_SKILL_LEVEL,
  MAX_SKILL_XP,
  MAX_TOTAL_LEVEL,
  MAX_TOTAL_XP,
  SKILLS,
  getCombatLevelFromSkills,
  getLevelFromXP,
  getVirtualLevelFromXP,
  getXPUntilNextLevel,
} from "@runeprofile/runescape";

import TotalLevelIcon from "~/assets/icons/skills.png";
import MiscIcons from "~/assets/misc-icons.json";
import SkillIcons from "~/assets/skills-icons.json";
import { GameIcon } from "~/components/icons";
import { Separator } from "~/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Profile } from "~/lib/api";
import { cn, numberWithDelimiter } from "~/lib/utils";

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
      <div className="flex flex-col p-1 h-full gap-y-[1px] pt-2">
        <div className="grid-rows-8 grid grid-cols-3 gap-[1px] flex-1">
          {skills.map((skill) => (
            <Skill
              key={skill.name}
              name={skill.name}
              level={skill.level}
              xp={skill.xp}
            />
          ))}

          {/* TODO: inlcude sailing in skills array */}
          <Skill name={"Sailing"} level={1} xp={0} />
        </div>
        <OverallLevel
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
};

type OverallLevelProps = {
  level: number;
  xp: number;
  combatLevel: number;
};

function Skill({ name, level, xp }: SkillProps) {
  const virtualLevel = getVirtualLevelFromXP(xp);

  const skillIcon = SkillIcons[name.toLowerCase() as keyof typeof SkillIcons];

  return (
    <Tooltip key={name}>
      <TooltipTrigger asChild>
        <div className="runescape-stats-tile flex items-center justify-between px-3 h-full w-full">
          <GameIcon
            src={skillIcon}
            alt={name}
            size={24}
            className="flex-1 drop-shadow-solid-sm"
          />
          <p
            className={cn(
              "ml-1 flex-1 text-center font-runescape text-lg font-bold leading-none text-osrs-yellow solid-text-shadow select-none",
              {
                "text-osrs-green": level === MAX_SKILL_LEVEL,
                "text-osrs-red":
                  level === 1 || (name === "Hitpoints" && level === 10),
                "shimmer-text": xp >= MAX_SKILL_XP || name === "Sailing",
              },
            )}
          >
            {level}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none p-2.5 flex flex-col w-[260px]">
        <SkillTooltipRow label={`${name} XP`} value={numberWithDelimiter(xp)} />
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

function OverallLevel({ level, xp, combatLevel }: OverallLevelProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center justify-center gap-x-8 runescape-stats-tile w-full py-0.5">
          <div className="flex items-center gap-x-2">
            <GameIcon
              src={MiscIcons["combat"]}
              alt="Combat Level"
              size={20}
              className="drop-shadow-solid-sm"
            />
            <p
              className={cn(
                "font-runescape font-bold text-osrs-yellow text-lg solid-text-shadow",
                {
                  "text-osrs-green": combatLevel === MAX_COMBAT_LEVEL,
                },
              )}
            >
              {combatLevel}
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            <GameIcon
              src={TotalLevelIcon}
              alt="Combat Level"
              size={20}
              isBase64={false}
              className="drop-shadow-solid-sm -mt-0.5"
            />
            <p
              className={cn(
                "font-runescape font-bold text-osrs-yellow text-lg solid-text-shadow",
                {
                  "text-osrs-green": level === MAX_TOTAL_LEVEL,
                  "shimmer-text": xp >= MAX_TOTAL_XP,
                },
              )}
            >
              {level}
            </p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none p-2.5 flex flex-col w-[260px]">
        <SkillTooltipRow label="Overall XP" value={numberWithDelimiter(xp)} />
        <Separator className="my-1" />
        <SkillTooltipRow label="Combat Level" value={combatLevel} />
      </TooltipContent>
    </Tooltip>
  );
}
