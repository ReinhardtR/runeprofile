"use client";

import { OVERALL_NAME } from "~/app/[username]/(components)/Skills";
import { Tooltip } from "~/components/Misc/Tooltip";
import { getVirtualLevelFromXP, getXPUntilNextLevel } from "~/lib/xp-to-level";
import { numberWithCommas } from "~/utils/number-with-commas";
import Image from "next/image";
import clsx from "clsx";

const MAX_SKILL_LEVEL = 99;
const MAX_TOTAL_LEVEL = 2277;

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
          <Image
            src={`/assets/skill-icons/${name.toLowerCase()}.png`}
            alt={name}
            className="drop-shadow object-contain flex-1"
            width={24}
            height={38}
          />
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
