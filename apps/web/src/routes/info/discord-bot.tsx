import { Link, createFileRoute } from "@tanstack/react-router";

import {
  ACTIVITY_FILTER_META,
  DEFAULT_FILTERS,
  THRESHOLD_ACTIVITY_TYPES,
  getActivityThresholdConfig,
  getActivityTypeLabel,
} from "@runeprofile/runescape";

import { GuideHeading, GuideParagraph, GuideSection } from "~/features/info";
import { Footer, Header } from "~/layouts";
import { AddDiscordBotButton } from "~/shared/components/AddDiscordBotButton";
import { JoinDiscordButton } from "~/shared/components/JoinDiscordButton";

export const Route = createFileRoute("/info/discord-bot")({
  component: RouteComponent,
});

function RouteComponent() {
  const thresholdActivities = THRESHOLD_ACTIVITY_TYPES.map((type) => ({
    label: getActivityTypeLabel(type),
    unit: ACTIVITY_FILTER_META[type].threshold?.unit ?? "",
  }));

  const defaultFilters = DEFAULT_FILTERS.map((filter) => {
    const config = getActivityThresholdConfig(filter.activityType);
    const parts: string[] = [];
    if (filter.threshold !== undefined && config) {
      parts.push(`minimum ${config.format(filter.threshold)}`);
    }
    if (filter.mode) parts.push(filter.mode);
    return {
      label: getActivityTypeLabel(filter.activityType),
      detail: parts.join(", "),
    };
  });

  return (
    <>
      <Header />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-center text-4xl font-extrabold tracking-tight text-muted-foreground">
          Discord Bot
        </h1>

        <article>
          <GuideSection>
            <GuideHeading id="overview">Overview</GuideHeading>
            <GuideParagraph>
              The RuneProfile Discord bot sends activity messages directly to
              your Discord server. Get notified when clan members or tracked
              players level up, receive valuable drops, complete quests, unlock
              collection log items, and more.
            </GuideParagraph>
          </GuideSection>

          <GuideSection>
            <GuideHeading id="features">Features</GuideHeading>
            <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
              <li>
                <span className="text-secondary-foreground font-medium">
                  Watch players
                </span>{" "}
                — get notified about activity from specific players.
              </li>
              <li>
                <span className="text-secondary-foreground font-medium">
                  Watch clans
                </span>{" "}
                — get notified about activity from an entire clan.
              </li>
              <li>
                <span className="text-secondary-foreground font-medium">
                  Per-channel configuration
                </span>{" "}
                — set up different watches in different channels.
              </li>
              <li>
                <span className="text-secondary-foreground font-medium">
                  Activity filters
                </span>{" "}
                — allow or block specific activity types per channel, or set
                minimum thresholds (e.g. only level-ups at 50+).
              </li>
            </ul>
          </GuideSection>

          <GuideSection>
            <GuideHeading id="commands">Commands</GuideHeading>

            <div className="space-y-6">
              <div>
                <p className="font-medium text-secondary-foreground mb-2">
                  Player watches
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch player add [name]
                    </code>{" "}
                    — watch a player in the current channel.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch player remove [name]
                    </code>{" "}
                    — stop watching a player.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch player list
                    </code>{" "}
                    — list watched players in the current channel.
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-secondary-foreground mb-2">
                  Clan watches
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch clan add [name]
                    </code>{" "}
                    — watch a clan in the current channel.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch clan remove [name]
                    </code>{" "}
                    — stop watching a clan.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch clan list
                    </code>{" "}
                    — list watched clans in the current channel.
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-secondary-foreground mb-2">
                  Activity filters
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch filter allow [activity]
                    </code>{" "}
                    — only receive this activity type.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch filter block [activity]
                    </code>{" "}
                    — stop receiving this activity type.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch filter threshold [activity] [value]
                    </code>{" "}
                    — only send an activity when it meets a minimum value (e.g.
                    level 50+).
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch filter remove [activity]
                    </code>{" "}
                    — remove all filters for an activity type.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch filter list
                    </code>{" "}
                    — list active filters for this channel.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch filter reset
                    </code>{" "}
                    — reset to the default filters.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      /watch filter clear
                    </code>{" "}
                    — remove all filters.
                  </li>
                </ul>
              </div>
            </div>
          </GuideSection>

          <GuideSection>
            <GuideHeading id="filters">Activity filters</GuideHeading>
            <GuideParagraph>
              Each channel decides which activities it receives. There are two
              kinds of filter, and they work together:
            </GuideParagraph>
            <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
              <li>
                <span className="text-secondary-foreground font-medium">
                  Allow / block
                </span>{" "}
                — control which activity types are sent. If you add any{" "}
                <span className="text-secondary-foreground">allow</span> filter,
                only those types are sent. Otherwise every type is sent except
                the ones you{" "}
                <span className="text-secondary-foreground">block</span>.
              </li>
              <li>
                <span className="text-secondary-foreground font-medium">
                  Thresholds
                </span>{" "}
                — for activity types with a meaningful value, set a{" "}
                <span className="text-secondary-foreground">minimum</span> so
                only activities at or above it are sent. For example, a level-up
                threshold of 50 hides level-ups below level 50.
              </li>
            </ul>

            <GuideParagraph>
              Thresholds can be set on these activity types (other types, like
              new collection log items, support allow/block only):
            </GuideParagraph>
            <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
              {thresholdActivities.map((activity) => (
                <li key={activity.label}>
                  <span className="text-secondary-foreground font-medium">
                    {activity.label}
                  </span>{" "}
                  — minimum {activity.unit}.
                </li>
              ))}
            </ul>

            <GuideParagraph>
              When you add the first watch to a channel, these{" "}
              <span className="text-secondary-foreground">default filters</span>{" "}
              are applied automatically:
            </GuideParagraph>
            <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
              {defaultFilters.map((filter) => (
                <li key={filter.label}>
                  <span className="text-secondary-foreground font-medium">
                    {filter.label}
                  </span>
                  {filter.detail ? ` — ${filter.detail}` : null}
                </li>
              ))}
            </ul>
            <GuideParagraph>
              Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                /watch filter reset
              </code>{" "}
              at any time to return to these defaults, or{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                /watch filter clear
              </code>{" "}
              to remove all filters and receive everything.
            </GuideParagraph>
          </GuideSection>

          <GuideSection>
            <GuideHeading id="setup">Setup</GuideHeading>
            <GuideParagraph>
              Add the bot to your Discord server, then use the{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                /watch
              </code>{" "}
              command in the channel where you want to receive messages.
            </GuideParagraph>
            <AddDiscordBotButton />
          </GuideSection>

          <GuideSection>
            <GuideHeading id="support">Support</GuideHeading>
            <GuideParagraph>
              If you have questions, run into issues or wanna provide feedback,
              join the Discord server.
            </GuideParagraph>
            <JoinDiscordButton />
          </GuideSection>

          <GuideSection>
            <GuideHeading id="faq">FAQ</GuideHeading>
            <div className="space-y-6">
              <div>
                <p className="font-medium text-secondary-foreground">
                  Why is the bot not sending any messages?
                </p>
                <GuideParagraph>
                  Make sure the bot has permission to send messages in the
                  channel.
                </GuideParagraph>
              </div>
              <div>
                <p className="font-medium text-secondary-foreground">
                  I got a new collection log item, why is the bot not sending a
                  message for it?
                </p>
                <GuideParagraph>
                  The bot works as a side effect of your profile updates, so the
                  bot will send the message once the new item is on your
                  profile. Auto Sync helps with this, as new collection log
                  items are updated instantly to your profile, assuming you have
                  set it up correctly. Please read the{" "}
                  <Link
                    to="/info/guide"
                    hash="updating-profile"
                    className="underline underline-offset-4 text-secondary-foreground"
                  >
                    guide
                  </Link>{" "}
                  if you're experiencing this problem.
                </GuideParagraph>
              </div>
              <div>
                <p className="font-medium text-secondary-foreground">
                  I did an activity and the bot is not sending a message for it?
                </p>
                <GuideParagraph>
                  The bot requires a profile update to detect the changes. If
                  you're playing on mobile these will be sent when you log in to
                  RuneLite and the profile is updated (either manually or when
                  Auto Sync triggers).
                </GuideParagraph>
              </div>
            </div>
          </GuideSection>
        </article>
      </div>
      <Footer />
    </>
  );
}
