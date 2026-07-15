import { createFileRoute } from "@tanstack/react-router";

import {
  ACTIVITY_FILTER_META,
  type ActivityEventTypeValue,
  DEFAULT_CHANNEL_SETTINGS,
  THRESHOLD_ACTIVITY_TYPES,
  getActivityThresholdConfig,
  getActivityTypeLabel,
} from "@runeprofile/runescape";

import {
  type FaqItem,
  GuideCode,
  GuideFaq,
  GuideHeading,
  GuideLink,
  GuideList,
  GuideParagraph,
  GuideSection,
  GuideSubheading,
  GuideTableOfContents,
  useActiveSection,
} from "~/features/info";
import { Footer, Header } from "~/layouts";
import { AddDiscordBotButton } from "~/shared/components/AddDiscordBotButton";
import { JoinDiscordButton } from "~/shared/components/JoinDiscordButton";

export const Route = createFileRoute("/info/discord-bot")({
  component: RouteComponent,
});

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const COMMAND_GROUPS = [
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
        description: "only receive this activity type.",
      },
      {
        command: "/watch filter block [activity]",
        description: "stop receiving this activity type.",
      },
      {
        command: "/watch filter threshold [activity] [value]",
        description:
          "only send an activity when it meets a minimum value (e.g. level 50+).",
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

const THRESHOLD_ACTIVITIES = THRESHOLD_ACTIVITY_TYPES.map((type) => ({
  label: getActivityTypeLabel(type),
  unit: ACTIVITY_FILTER_META[type].threshold?.unit ?? "",
}));

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
      <GuideParagraph>
        The RuneProfile Discord bot sends activity messages directly to your
        Discord server. Get notified when clan members or tracked players level
        up, receive valuable drops, complete quests, unlock collection log
        items, and more.
      </GuideParagraph>
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
            <GuideList>
              {group.commands.map((entry) => (
                <li key={entry.command}>
                  <GuideCode>{entry.command}</GuideCode> - {entry.description}
                </li>
              ))}
            </GuideList>
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
            activities at or above it are sent. For example, a level-up
            threshold of 50 hides level-ups below level 50.
          </li>
        </GuideList>

        <GuideParagraph>
          Thresholds can be set on these activity types (other types, like new
          collection log items, support allow/block only):
        </GuideParagraph>
        <GuideList>
          {THRESHOLD_ACTIVITIES.map((activity) => (
            <li key={activity.label}>
              <b className="text-secondary-foreground">{activity.label}</b> -
              minimum {activity.unit}.
            </li>
          ))}
        </GuideList>

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
