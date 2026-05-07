import { createFileRoute } from "@tanstack/react-router";

import { DISCORD_INVITE_INK } from "~/core/constants";
import { GuideHeading, GuideParagraph, GuideSection } from "~/features/info";
import { Footer, Header } from "~/layouts";
import { AddDiscordBotButton } from "~/shared/components/AddDiscordBotButton";
import { JoinDiscordButton } from "~/shared/components/JoinDiscordButton";

export const Route = createFileRoute("/info/discord-bot")({
  component: RouteComponent,
});

function RouteComponent() {
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
              your Discord server. For example, get notified when clan members
              or tracked players receive valuable drops or new collection logs.
            </GuideParagraph>
            <GuideParagraph className="italic">
              Note: The bot is currently under development with minimal
              features. It only sends messages for valuable drops and collection
              log items.
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
            </ul>
          </GuideSection>

          <GuideSection>
            <GuideHeading id="commands">Commands</GuideHeading>
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
        </article>
      </div>
      <Footer />
    </>
  );
}
