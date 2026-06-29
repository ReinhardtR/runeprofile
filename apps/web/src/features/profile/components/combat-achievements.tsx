import {
  COMBAT_ACHIEVEMENT_TIERS,
  getCombatAchievementTierTaskCount,
} from "@runeprofile/runescape";

import { Profile } from "~/core/api";
import CombatAchievementTierIcons from "~/core/assets/combat-achievement-tier-icons.json";
import { GameIcon } from "~/shared/components/icons";
import { cn } from "~/shared/utils";

export function CombatAchievements({
  data,
  accountTypeId,
  selectedTierId,
  onTierClick,
}: {
  data: Profile["combatAchievementTiers"];
  accountTypeId: number;
  selectedTierId: number;
  onTierClick: (tierId: number) => void;
}) {
  const tiers: Array<{
    id: number;
    name: string;
    tasksCount: number;
    completedCount: number;
  }> = [];

  for (const tier of COMBAT_ACHIEVEMENT_TIERS) {
    const tierData = data.find((t) => t.id === tier.id);
    tiers.push({
      id: tier.id,
      name: tier.name,
      tasksCount:
        tierData?.tasksCount ??
        getCombatAchievementTierTaskCount(tier.id, accountTypeId) ??
        0,
      completedCount: tierData?.completedCount ?? 0,
    });
  }

  const allCompleted =
    tiers.length > 0 &&
    tiers.every((t) => t.tasksCount > 0 && t.completedCount >= t.tasksCount);

  return (
    <div className="grid h-full grid-cols-2 grid-rows-3 gap-1 p-1 shadow">
      {tiers.map((tier) => {
        const percentageCompleted = Math.floor(
          (tier.completedCount / tier.tasksCount) * 100,
        );

        let tierColor = "text-osrs-yellow";

        if (percentageCompleted == 0) {
          tierColor = "text-osrs-gray";
        } else if (percentageCompleted == 100) {
          tierColor = "text-osrs-green";
        }

        const tierIcon =
          CombatAchievementTierIcons[
            tier.id as unknown as keyof typeof CombatAchievementTierIcons
          ];

        const isSelected = selectedTierId === tier.id;

        return (
          <button
            key={tier.name}
            type="button"
            onClick={() => onTierClick(isSelected ? 0 : tier.id)}
            className={cn(
              "runescape-corners-border flex flex-col items-center justify-center font-runescape cursor-pointer transition-colors",
              isSelected ? "bg-white/15" : "bg-white/3 hover:bg-white/8",
            )}
          >
            <p
              className={cn(
                "text-lg leading-none text-osrs-orange solid-text-shadow",
                allCompleted && "shimmer-text",
              )}
            >
              {tier.name}
            </p>
            <div className="relative my-[1px]">
              <GameIcon
                src={tierIcon}
                alt={tier.name}
                size={38}
                className="drop-shadow-xl"
              />
            </div>
            <p
              className={cn(
                "text-sm leading-none solid-text-shadow",
                allCompleted ? "shimmer-text" : tierColor,
              )}
            >
              {tier.completedCount}/{tier.tasksCount}
            </p>
            <div className="relative z-20 h-[10px] w-full rounded-none border-2 border-black shadow">
              {/* Segment Lines */}
              <div className="absolute left-1/4 z-20 h-full border-l-2 border-black " />
              <div className="absolute left-1/2 z-20 h-full border-l-2 border-black" />
              <div className="absolute left-3/4 z-20 h-full border-l-2 border-black" />
              {/* Progress bar */}
              <div
                className={cn(
                  "z-10 h-full",
                  allCompleted
                    ? "shimmer-bar"
                    : percentageCompleted == 100
                      ? "bg-osrs-green"
                      : "bg-osrs-yellow",
                )}
                style={{
                  width: `${percentageCompleted}%`,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
