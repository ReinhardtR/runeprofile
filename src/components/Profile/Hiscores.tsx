import { Account } from "@/edgeql";
import { entryNameToPath } from "@/utils/entryNameToPath";
import { numberWithCommas } from "@/utils/numberWithCommas";
import { Tab } from "@headlessui/react";
import clsx from "clsx";
import Image from "next/future/image";
import { Fragment } from "react";
import { Card } from "../Card";
import { Tooltip } from "../Misc/Tooltip";

type HiscoresProps = {
  hiscores: Account["hiscores"];
};

export const Hiscores: React.FC<HiscoresProps> = ({ hiscores }) => {
  return (
    <Card
      iconPath="/assets/hiscores/hiscore.png"
      className="w-[250px] flex flex-col p-4"
    >
      <Tab.Group as="div" className="flex flex-col space-y-2">
        <Tab.List className="flex space-x-2 justify-evenly">
          {Object.keys(hiscores).map((leaderboardType) => (
            <LeaderboardTypeTab
              key={leaderboardType}
              leaderboardType={leaderboardType}
            />
          ))}
        </Tab.List>
        <Tab.Panels>
          {Object.entries(hiscores).map(([leaderboardName, leaderboard]) => (
            <Tab.Panel key={leaderboardName}>
              <Tab.Group>
                <Tab.List className="flex space-x-2 justify-evenly">
                  {Object.keys(leaderboard).map((entryType) => (
                    <EntryTypeTab key={entryType} entryType={entryType} />
                  ))}
                </Tab.List>
                <Tab.Panels>
                  {Object.entries(leaderboard).map(([entryType, entry]) => {
                    if (entryType == "skills") {
                      // @ts-ignore
                      return <SkillsPanel skills={entry} />;
                    } else if (entryType == "activities") {
                      // @ts-ignore
                      return <ActivitiesPanel activities={entry} />;
                    } else if (entryType == "bosses") {
                      // @ts-ignore
                      return <BossesPanel bosses={entry} />;
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
  leaderboardType: string;
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
                src={`/assets/hiscores/account-types/${leaderboardType}.png`}
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
  skills: Account["hiscores"]["normal"]["skills"];
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
                  <div className="relative w-6 h-6 mx-auto drop-shadow-solid">
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
  activities: Account["hiscores"]["normal"]["activities"];
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
                  <div className="relative w-6 h-6 mx-auto drop-shadow-solid">
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
  bosses: Account["hiscores"]["normal"]["bosses"];
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
                  <div className="relative w-6 h-6 mx-auto drop-shadow-solid">
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
