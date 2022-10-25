import { AccountType } from "@prisma/client";
import { Card } from "../Card";
import Image from "next/future/image";
import { PlayerModel } from "./PlayerModel";

type PlayerDisplayProps = {
  username: string;
  combatLevel: number;
  accountType: AccountType;
  description: string;
  modelUri: string | null;
};

export const PlayerDisplay: React.FC<PlayerDisplayProps> = ({
  username,
  combatLevel,
  accountType,
  description,
  modelUri,
}) => {
  return (
    <Card className="flex max-w-[260px] flex-col 1.5xl:min-w-[400px] 1.5xl:min-h-[730px]">
      {/* Name and Combat Level banner */}
      <div className="absolute inset-x-0 mx-auto flex flex-wrap justify-center items-center text-shadow font-runescape text-2xl font-bold leading-none space-x-4 p-2 z-20">
        <div className="flex items-center space-x-2">
          {accountType != AccountType.NORMAL && (
            <div className="relative aspect-[10/13] w-[16px]">
              <Image
                src={`/assets/account-type/${accountType.toLowerCase()}.png`}
                alt={accountType}
                quality={100}
                fill
                className="drop-shadow-solid"
              />
            </div>
          )}
          <span className="text-white">{username}</span>
        </div>

        <div className="flex space-x-1 justify-center items-center text-osrs-orange">
          <div className="relative w-5 h-5">
            <Image
              src="/assets/skill-icons/combat.png"
              alt="Combat Level"
              fill
              className="drop-shadow-xl"
            />
          </div>
          <span>{combatLevel}</span>
        </div>
      </div>

      {/* Model */}
      <div className="h-full p-1">
        {modelUri && <PlayerModel modelUri={modelUri} />}
      </div>

      {/* Description Container */}
      {!!description && (
        <div className="absolute bottom-4 left-0 w-full px-4">
          <p className="bg-black/50 text-xs text-light-gray p-2 rounded border border-osrs-border">
            {description}
          </p>
        </div>
      )}
    </Card>
  );
};