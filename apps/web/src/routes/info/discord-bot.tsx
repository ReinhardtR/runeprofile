import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";

import {
  ACTIVITY_FILTER_META,
  type ActivityEventTypeValue,
  DEFAULT_CHANNEL_SETTINGS,
  THRESHOLD_ACTIVITY_TYPES,
  getActivityThresholdConfig,
  getActivityTypeLabel,
} from "@runeprofile/runescape";

import ACCOUNT_TYPE_ICONS from "~/core/assets/account-type-icons.json";
import ITEM_ICONS from "~/core/assets/item-icons.json";
import QuestIcon from "~/core/assets/icons/quest.png";
import Logo from "~/core/assets/misc/logo.png";
import SKILL_ICONS from "~/core/assets/skill-icons-large.json";
import {
  type CommandItem,
  type FaqItem,
  GuideCode,
  GuideCommandList,
  GuideFaq,
  GuideHeading,
  GuideLink,
  GuideList,
  GuideParagraph,
  GuideSection,
  GuideSubheading,
  GuideTable,
  GuideTableOfContents,
  useActiveSection,
} from "~/features/info";
import { Footer, Header } from "~/layouts";
import { AddDiscordBotButton } from "~/shared/components/AddDiscordBotButton";
import { GameIcon } from "~/shared/components/icons";
import { JoinDiscordButton } from "~/shared/components/JoinDiscordButton";
import { cn } from "~/shared/utils";

export const Route = createFileRoute("/info/discord-bot")({
  component: RouteComponent,
});

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/*  Discord message mock                                                      */
/* -------------------------------------------------------------------------- */

// Colors sampled from a real Discord screenshot of the bot's messages.
const DiscordMock: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="my-6 rounded-lg border border-border bg-[#1a1a1e] px-4 py-3.5 shadow-md">
      <div className="flex gap-3.5">
        <img
          src={Logo}
          alt="RuneProfile bot avatar"
          className="mt-0.5 size-10 shrink-0 rounded-full bg-[#242429] object-contain p-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium text-[#ad1457]">RuneProfile</span>
            <span className="rounded-sm bg-[#5865f2] px-1 py-px text-[10px] font-semibold text-white">
              APP
            </span>
            <span className="text-xs text-[#82838b]">12/07/2026, 18:24</span>
          </div>
          <div className="mt-1.5 space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

const DiscordEmbedMock: React.FC<{
  color: string;
  footer: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ color, footer, icon, children }) => {
  return (
    <div
      className="max-w-md rounded border-l-4 bg-[#242429] py-2.5 pl-3.5 pr-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 text-sm">
          <p className="flex items-center gap-1.5 font-semibold text-[#efeff1]">
            <GameIcon
              src={ACCOUNT_TYPE_ICONS.ironman}
              alt="Ironman"
              size={14}
            />
            pgn
          </p>
          <p className="mt-1.5 text-[#dbdee1]">{children}</p>
          <p className="mt-2 text-xs text-[#a1a1a4]">{footer}</p>
        </div>
        {icon && <div className="mt-1 shrink-0">{icon}</div>}
      </div>
    </div>
  );
};

// Colors and copy mirror the real activity embeds sent by the bot.
const DiscordPreview: React.FC = () => (
  <DiscordMock>
    <DiscordEmbedMock
      color="#00ff00"
      footer="Level Up"
      icon={<GameIcon src={SKILL_ICONS.slayer} alt="Slayer" size={36} />}
    >
      Reached level <b className="text-[#efeff1]">99</b> in{" "}
      <b className="text-[#efeff1]">Slayer</b>
    </DiscordEmbedMock>
    <DiscordEmbedMock
      color="#ff006e"
      footer="Valuable Drop"
      icon={
        <GameIcon
          src={ITEM_ICONS["20997" as keyof typeof ITEM_ICONS]}
          alt="Twisted bow"
          size={36}
        />
      }
    >
      <b className="text-[#efeff1]">1,412,006,319 gp</b>
    </DiscordEmbedMock>
    <DiscordEmbedMock
      color="#00ced1"
      footer="Quest"
      icon={
        <GameIcon src={QuestIcon} alt="Quest" size={32} isBase64={false} />
      }
    >
      Completed{" "}
      <b className="text-[#efeff1]">Desert Treasure II - The Fallen Empire</b>
    </DiscordEmbedMock>
  </DiscordMock>
);

/* -------------------------------------------------------------------------- */
/*  Worked filter example                                                     */
/* -------------------------------------------------------------------------- */

type FilterOutcome = {
  activity: React.ReactNode;
  sent: boolean;
  reason: string;
};

const FILTER_EXAMPLE_OUTCOMES: FilterOutcome[] = [
  {
    activity: "Level 92 in Slayer",
    sent: true,
    reason: "at or above the level 50 threshold",
  },
  {
    activity: "Level 47 in Fishing",
    sent: false,
    reason: "below the level 50 threshold",
  },
  {
    activity: "Completed Desert Treasure II (Grandmaster)",
    sent: true,
    reason: "at or above the Experienced threshold",
  },
  {
    activity: "Completed Cook's Assistant (Novice)",
    sent: false,
    reason: "below the Experienced threshold",
  },
  {
    activity: "New collection log item",
    sent: true,
    reason: "no filter set for this type",
  },
];

const FilterExample: React.FC = () => (
  <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
    <p className="border-b border-border bg-muted/40 px-4 py-2.5 text-sm font-semibold text-secondary-foreground">
      Example — a channel with the default filters
    </p>
    <ul className="divide-y divide-border">
      {FILTER_EXAMPLE_OUTCOMES.map((outcome, index) => (
        <li
          key={index}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
        >
          <span
            className={cn(
              "inline-flex w-20 items-center gap-1 font-medium",
              outcome.sent ? "text-green-500" : "text-muted-foreground",
            )}
          >
            {outcome.sent ? (
              <Check className="size-3.5" />
            ) : (
              <X className="size-3.5" />
            )}
            {outcome.sent ? "Sent" : "Hidden"}
          </span>
          <span className="text-secondary-foreground">{outcome.activity}</span>
          <span className="text-muted-foreground">— {outcome.reason}</span>
        </li>
      ))}
    </ul>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Content                                                                   */
/* -------------------------------------------------------------------------- */

const COMMAND_GROUPS: { title: string; commands: CommandItem[] }[] = [
  {
    title: "Player watches",
    commands: [
      {
        command: "/watch player add [name]",
        description: "watch a player in the current channel.",
      },
      {
        command: "/watch player remove [name]",
        description: "stop watching a player.",
      },
      {
        command: "/watch player list",
        description: "list watched players in the current channel.",
      },
    ],
  },
  {
    title: "Clan watches",
    commands: [
      {
        command: "/watch clan add [name]",
        description: "watch a clan in the current channel.",
      },
      {
        command: "/watch clan remove [name]",
        description: "stop watching a clan.",
      },
      {
        command: "/watch clan list",
        description: "list watched clans in the current channel.",
      },
    ],
  },
  {
    title: "Activity filters",
    commands: [
      {
        command: "/watch filter allow [activity]",
        description:
          "add an activity type to the allow list — only allowed types are sent.",
      },
      {
        command: "/watch filter block [activity]",
        description:
          "add an activity type to the block list — everything except blocked types is sent.",
      },
      {
        command: "/watch filter threshold [activity] [value]",
        description:
          "only send an activity when it meets a minimum value (e.g. level 50+, or quest difficulty Experienced+). Values accept shorthand like 750k or 5m.",
      },
      {
        command: "/watch filter remove [activity] [filter]",
        description:
          "remove filters for an activity type — everything, or just its allow/block or threshold.",
      },
      {
        command: "/watch filter list",
        description: "list active filters for this channel.",
      },
      {
        command: "/watch filter reset",
        description: "reset to the default filters.",
      },
      {
        command: "/watch filter clear",
        description: "remove all filters.",
      },
    ],
  },
];

// Registry-driven: label, unit and example values come from the threshold
// configs, so this table stays correct as activity types evolve.
const THRESHOLD_ROWS = THRESHOLD_ACTIVITY_TYPES.flatMap((type) => {
  const config = ACTIVITY_FILTER_META[type].threshold;
  if (!config) return [];
  const { suggestions } = config;
  const samples = [
    suggestions[0],
    suggestions[Math.floor(suggestions.length / 2)],
    suggestions[suggestions.length - 1],
  ]
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .map((value) => config.format(value));
  return [
    {
      label: getActivityTypeLabel(type),
      unit: config.unit,
      examples: samples.join(", "),
    },
  ];
});

const DEFAULT_FILTER_ITEMS = Object.entries(
  DEFAULT_CHANNEL_SETTINGS.filters.thresholds,
).map(([type, threshold]) => {
  const activityType = type as ActivityEventTypeValue;
  const config = getActivityThresholdConfig(activityType);
  return {
    label: getActivityTypeLabel(activityType),
    detail: config ? `minimum ${config.format(threshold)}` : "",
  };
});

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Why is the bot not sending any messages?",
    answer: (
      <>Make sure the bot has permission to send messages in the channel.</>
    ),
  },
  {
    question:
      "I got a new collection log item, why is the bot not sending a message for it?",
    answer: (
      <>
        The bot works as a side effect of your profile updates, so it sends the
        message once the new item is on your profile. Auto Sync helps here, as
        new collection log items are updated to your profile instantly -
        assuming it's set up correctly. See the{" "}
        <GuideLink to="/info/guide" hash="updating-profile">
          guide
        </GuideLink>{" "}
        if you're running into this.
      </>
    ),
  },
  {
    question: "I did an activity and the bot is not sending a message for it?",
    answer: (
      <>
        The bot requires a profile update to detect the changes. If you're
        playing on mobile, these are sent when you log in to RuneLite and the
        profile is updated (manually or when Auto Sync triggers).
      </>
    ),
  },
];

const SECTIONS: Section[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <GuideParagraph>
          The RuneProfile Discord bot sends activity messages directly to your
          Discord server. Get notified when clan members or tracked players
          level up, receive valuable drops, complete quests, unlock collection
          log items, and more.
        </GuideParagraph>
        <DiscordPreview />
      </>
    ),
  },
  {
    id: "features",
    title: "Features",
    content: (
      <GuideList>
        <li>
          <b className="text-secondary-foreground">Watch players</b> - get
          notified about activity from specific players.
        </li>
        <li>
          <b className="text-secondary-foreground">Watch clans</b> - get
          notified about activity from an entire clan.
        </li>
        <li>
          <b className="text-secondary-foreground">Per-channel configuration</b>{" "}
          - set up different watches in different channels.
        </li>
        <li>
          <b className="text-secondary-foreground">Activity filters</b> - allow
          or block specific activity types per channel, or set minimum
          thresholds (e.g. only level-ups at 50+).
        </li>
      </GuideList>
    ),
  },
  {
    id: "commands",
    title: "Commands",
    content: (
      <>
        {COMMAND_GROUPS.map((group) => (
          <div key={group.title}>
            <GuideSubheading>{group.title}</GuideSubheading>
            <GuideCommandList items={group.commands} />
          </div>
        ))}
      </>
    ),
  },
  {
    id: "filters",
    title: "Activity filters",
    content: (
      <>
        <GuideParagraph>
          Each channel decides which activities it receives. There are two
          kinds of filter, and they work together:
        </GuideParagraph>
        <GuideList>
          <li>
            <b className="text-secondary-foreground">Allow / block</b> -
            control which activity types are sent. A channel is either a block
            list (every type is sent except the ones you block) or an allow
            list (only the types you allow are sent). Adding the other kind of
            filter switches the channel over and clears the old list.
          </li>
          <li>
            <b className="text-secondary-foreground">Thresholds</b> - for
            activity types with a meaningful value, set a minimum so only
            activities at or above it are sent. Thresholds apply on top of the
            allow/block filters.
          </li>
        </GuideList>

        <FilterExample />

        <GuideParagraph>
          Thresholds can be set on these activity types (other types, like new
          collection log items, support allow/block only):
        </GuideParagraph>
        <GuideTable headers={["Activity", "Threshold", "Example values"]}>
          {THRESHOLD_ROWS.map((row) => (
            <tr key={row.label}>
              <td className="font-medium text-secondary-foreground">
                {row.label}
              </td>
              <td>minimum {row.unit}</td>
              <td>{row.examples}</td>
            </tr>
          ))}
        </GuideTable>

        <GuideParagraph>
          Until you customize a channel's filters, these defaults apply:
        </GuideParagraph>
        <GuideList>
          {DEFAULT_FILTER_ITEMS.map((filter) => (
            <li key={filter.label}>
              <b className="text-secondary-foreground">{filter.label}</b>
              {filter.detail ? ` - ${filter.detail}` : null}
            </li>
          ))}
        </GuideList>
        <GuideParagraph>
          Run <GuideCode>/watch filter reset</GuideCode> at any time to return
          to these defaults, or <GuideCode>/watch filter clear</GuideCode> to
          remove all filters and receive everything.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "setup",
    title: "Setup",
    content: (
      <>
        <GuideParagraph>
          Add the bot to your Discord server, then use the{" "}
          <GuideCode>/watch</GuideCode> command in the channel where you want to
          receive messages.
        </GuideParagraph>
        <AddDiscordBotButton />
      </>
    ),
  },
  {
    id: "support",
    title: "Support",
    content: (
      <>
        <GuideParagraph>
          If you have questions, run into issues or wanna provide feedback, join
          the Discord server.
        </GuideParagraph>
        <JoinDiscordButton />
      </>
    ),
  },
  {
    id: "faq",
    title: "FAQ",
    content: <GuideFaq items={FAQ_ITEMS} />,
  },
];

const SECTION_IDS = SECTIONS.map((section) => section.id);
const TOC_ITEMS = SECTIONS.map(({ id, title }) => ({ id, title }));

function RouteComponent() {
  const activeId = useActiveSection(SECTION_IDS);

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-10 lg:py-14">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-secondary-foreground">
            Discord Bot
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Get RuneProfile activity - level ups, drops, quests and collection
            log unlocks - posted straight to your Discord server.
          </p>
        </header>

        {/* Mobile table of contents */}
        <details className="mb-10 rounded-lg border border-border bg-card px-4 lg:hidden">
          <summary className="cursor-pointer list-none py-3 font-semibold text-secondary-foreground [&::-webkit-details-marker]:hidden">
            Table of Contents
          </summary>
          <ul className="mb-3 space-y-2">
            {TOC_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-muted-foreground transition-colors hover:text-secondary-foreground"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </details>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
          <article className="min-w-0 max-w-3xl">
            {SECTIONS.map((section) => (
              <GuideSection key={section.id}>
                <GuideHeading id={section.id}>{section.title}</GuideHeading>
                {section.content}
              </GuideSection>
            ))}
          </article>

          <aside className="hidden lg:block">
            <GuideTableOfContents
              items={TOC_ITEMS}
              activeId={activeId}
              className="sticky top-24"
            />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
