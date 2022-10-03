import { LeaderboardType } from "@prisma/client";
import { entryNameToPath } from "@/utils/entry-name-to-path";
import { numberWithCommas } from "@/utils/number-with-commas";
import { Tab } from "@headlessui/react";
import clsx from "clsx";
import Image from "next/future/image";
import { Fragment } from "react";
import { Card } from "../Card";
import { Tooltip } from "../Misc/Tooltip";

type Skill = {
  name: string;
  rank: number;
  level: number;
  xp: number;
};

type Activity = {
  name: string;
  rank: number;
  score: number;
};

type Boss = {
  name: string;
  rank: number;
  kills: number;
};

type Leaderboard = {
  type: LeaderboardType;
  skills: Skill[];
  activities: Activity[];
  bosses: Boss[];
};

type HiscoresProps = {
  hiscores: Leaderboard[];
};

export const Hiscores: React.FC<HiscoresProps> = ({ hiscores }) => {
  return (
    <Card
      iconPath="/assets/hiscores/hiscore.png"
      className="w-[250px] flex flex-col p-4"
    >
      <Tab.Group as="div" className="flex flex-col space-y-2">
        <Tab.List className="flex space-x-2 justify-evenly">
          {hiscores.map((leaderboard) => (
            <LeaderboardTypeTab
              key={leaderboard.type}
              leaderboardType={leaderboard.type}
            />
          ))}
        </Tab.List>
        <Tab.Panels>
          {hiscores.map((leaderboard) => (
            <Tab.Panel key={leaderboard.type}>
              <Tab.Group>
                <Tab.List className="flex space-x-2 justify-evenly">
                  {["skills", "activities", "bosses"].map((entryType) => (
                    <EntryTypeTab key={entryType} entryType={entryType} />
                  ))}
                </Tab.List>
                <Tab.Panels>
                  {Object.entries(leaderboard).map(([entryType, entry]) => {
                    if (entryType == "skills") {
                      // @ts-ignore
                      return <SkillsPanel key={entry.name} skills={entry} />;
                    } else if (entryType == "activities") {
                      return (
                        // @ts-ignore
                        <ActivitiesPanel key={entry.name} activities={entry} />
                      );
                    } else if (entryType == "bosses") {
                      // @ts-ignore
                      return <BossesPanel key={entry.name} bosses={entry} />;
                    } else {
                      return null;
                    }
                  })}
                </Tab.Panels>
              </Tab.Group>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </Card>
  );
};

type LeaderboardTypeTabProps = {
  leaderboardType: LeaderboardType;
};

const LeaderboardTypeTab: React.FC<LeaderboardTypeTabProps> = ({
  leaderboardType,
}) => {
  return (
    <Tooltip
      content={
        <p className="uppercase font-runescape font-bold text-light-gray tracking-wide">
          {leaderboardType}
        </p>
      }
      delay={50}
      placement="bottom"
    >
      <Tab as={Fragment}>
        {({ selected }) => (
          <div
            className={clsx(
              "runescape-corners-border-small p-[2px] shadow-xl w-9 h-9 hover:cursor-pointer",
              selected ? "bg-background" : "bg-transparent"
            )}
          >
            <div className="relative w-4 h-5 drop-shadow-solid mx-auto">
              <Image
                src={`/assets/hiscores/account-types/${leaderboardType.toLowerCase()}.png`}
                alt={leaderboardType}
                quality={100}
                fill
              />
            </div>
          </div>
        )}
      </Tab>
    </Tooltip>
  );
};

type EntryTypeTabProps = {
  entryType: string;
};

const EntryTypeTab: React.FC<EntryTypeTabProps> = ({ entryType }) => {
  return (
    <Tooltip
      content={
        <p className="uppercase font-runescape font-bold text-light-gray tracking-wide">
          {entryType}
        </p>
      }
      delay={50}
      placement="bottom"
    >
      <Tab as={Fragment}>
        {({ selected }) => (
          <div
            className={clsx(
              "runescape-corners-border-small p-[2px] shadow-xl w-9 h-9 hover:cursor-pointer",
              selected ? "bg-background" : "bg-transparent"
            )}
          >
            <div className="relative w-5 h-5 drop-shadow-solid">
              <Image
                src={`/assets/hiscores/entry-types/${entryType}.png`}
                alt={entryType}
                quality={100}
                fill
              />
            </div>
          </div>
        )}
      </Tab>
    </Tooltip>
  );
};

type SkillsPanelProps = {
  skills: Skill[];
};

const SkillsPanel: React.FC<SkillsPanelProps> = ({ skills }) => {
  return (
    <Tab.Panel className="flex flex-col overflow-y-scroll h-[230px] mt-2 border-2 border-osrs-border font-runescape">
      <table>
        <thead>
          <tr className="text-osrs-orange font-bold text-xl text-shadow">
            <th>Skill</th>
            <th>Level</th>
            <th>Rank</th>
          </tr>
        </thead>

        <tbody className="text-osrs-yellow text-lg font-bold">
          {skills.map((skill) => (
            <Tooltip
              key={skill.name}
              content={
                <p className="uppercase font-runescape font-bold text-light-gray tracking-wide">
                  <span className="text-osrs-orange">{skill.name} XP </span>
                  {numberWithCommas(skill.xp)}
                </p>
              }
              transparent={false}
              placement="bottom"
            >
              <tr>
                <td>
                  <div className="relative w-6 h-6 mx-auto drop-shadow-solid-sm">
                    <Image
                      src={`/assets/hiscores/skills/${skill.name.toLowerCase()}.png`}
                      alt={skill.name}
                      fill
                    />
                  </div>
                </td>
                <td className="text-center text-shadow">{skill.level}</td>

                <td className="text-center text-shadow">
                  {numberWithCommas(skill.rank)}
                </td>
              </tr>
            </Tooltip>
          ))}
        </tbody>
      </table>
    </Tab.Panel>
  );
};

type ActivitiesPanelProps = {
  activities: Activity[];
};

const ActivitiesPanel: React.FC<ActivitiesPanelProps> = ({ activities }) => {
  return (
    <Tab.Panel className="flex flex-col overflow-y-scroll h-[230px] mt-2 border-2 border-osrs-border font-runescape">
      <table>
        <thead>
          <tr className="text-osrs-orange font-bold text-xl text-shadow">
            <th>Game</th>
            <th>Score</th>
            <th>Rank</th>
          </tr>
        </thead>

        <tbody className="text-osrs-yellow text-lg font-bold">
          {activities.map((activity) => (
            <Tooltip
              key={activity.name}
              content={
                <p className="uppercase font-runescape font-bold text-osrs-orange tracking-wide">
                  {activity.name}
                </p>
              }
              transparent={false}
              placement="bottom"
            >
              <tr key={activity.name}>
                <td>
                  <div className="relative w-6 h-6 mx-auto drop-shadow-solid-sm">
                    <Image
                      src={`/assets/hiscores/activities/${entryNameToPath(
                        activity.name
                      )}.png`}
                      alt={activity.name}
                      quality={100}
                      fill
                    />
                  </div>
                </td>
                <td className="text-center text-shadow">
                  {activity.score == -1
                    ? "X"
                    : numberWithCommas(activity.score)}
                </td>

                <td className="text-center text-shadow">
                  {activity.rank == -1 ? "X" : numberWithCommas(activity.rank)}
                </td>
              </tr>
            </Tooltip>
          ))}
        </tbody>
      </table>
    </Tab.Panel>
  );
};

type BossesPanelProps = {
  bosses: Boss[];
};

const BossesPanel: React.FC<BossesPanelProps> = ({ bosses }) => {
  return (
    <Tab.Panel className="flex flex-col overflow-y-scroll h-[230px] mt-2 border-2 border-osrs-border font-runescape">
      <table>
        <thead>
          <tr className="text-osrs-orange font-bold text-xl text-shadow">
            <th>Boss</th>
            <th>Kills</th>
            <th>Rank</th>
          </tr>
        </thead>

        <tbody className="text-osrs-yellow text-lg font-bold">
          {bosses.map((boss) => (
            <Tooltip
              key={boss.name}
              content={
                <p className="uppercase font-runescape font-bold text-osrs-orange tracking-wide">
                  {boss.name}
                </p>
              }
              transparent={false}
              placement="bottom"
            >
              <tr key={boss.name}>
                <td>
                  <div className="relative w-6 h-6 mx-auto drop-shadow-solid-sm">
                    <Image
                      src={`/assets/hiscores/bosses/${entryNameToPath(
                        boss.name
                      )}.png`}
                      alt={boss.name}
                      quality={100}
                      fill
                    />
                  </div>
                </td>
                <td className="text-center text-shadow">
                  {boss.kills == -1 ? "X" : numberWithCommas(boss.kills)}
                </td>

                <td className="text-center text-shadow">
                  {boss.rank == -1 ? "X" : numberWithCommas(boss.rank)}
                </td>
              </tr>
            </Tooltip>
          ))}
        </tbody>
      </table>
    </Tab.Panel>
  );
};
