import { createFileRoute } from "@tanstack/react-router";

import { DISCORD_INVITE_INK } from "~/core/constants";
import {
  GuideCallout,
  GuideCode,
  GuideLink,
  GuideList,
  GuideParagraph,
  GuideTable,
  type LegalSection,
  LegalPage,
} from "~/features/info";

const LAST_UPDATED = "2 August 2026";

export const Route = createFileRoute("/legal/privacy")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Privacy Policy - RuneProfile" },
      {
        name: "description",
        content:
          "What data the RuneProfile website, public API, RuneLite plugin and Discord bot collect, and how it is used.",
      },
      // Unlinked page - kept out of search results as well.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <GuideParagraph>
          RuneProfile is a free, fan-made hobby project for tracking and sharing
          Old School RuneScape progress. This policy explains what data is
          collected by the website (runeprofile.com), the public API
          (api.runeprofile.com), the RuneProfile RuneLite plugin and the
          RuneProfile Discord bot, and what happens to it.
        </GuideParagraph>
        <GuideCallout variant="note" title="The short version">
          RuneProfile stores the Old School RuneScape game data you choose to
          upload, plus the settings needed to run the Discord bot. There are no
          user accounts, no passwords, no email addresses, no advertising and no
          third-party tracking. Everything on a profile is public by design.
        </GuideCallout>
      </>
    ),
  },
  {
    id: "game-data",
    title: "Game data you upload",
    content: (
      <>
        <GuideParagraph>
          The RuneLite plugin sends your in-game data to RuneProfile when you
          update your profile (manually or through Auto Sync). This is the only
          data you actively provide, and it is stored so your profile can be
          displayed:
        </GuideParagraph>
        <GuideList>
          <li>
            your RuneScape username and account type (main, ironman, hardcore,
            and so on);
          </li>
          <li>your clan name, rank, title and icon, and your group name;</li>
          <li>skill experience, quest progress and achievement diary progress;</li>
          <li>combat achievement progress;</li>
          <li>collection log items and their quantities;</li>
          <li>valuable drops you record through the plugin; and</li>
          <li>
            an activity history derived from the changes between updates (level
            ups, new collection log items, completed quests and so on).
          </li>
        </GuideList>
        <GuideCallout variant="warning" title="This data is public">
          Profiles are public. Anyone can view them on the website and fetch
          them through the public API without logging in. Do not upload a
          profile if you do not want that information associated with your
          RuneScape username publicly.
        </GuideCallout>
        <GuideParagraph>
          RuneProfile never asks for and never receives your Jagex account
          credentials, your email address, your real name, or any payment
          details.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "discord-data",
    title: "Discord bot data",
    content: (
      <>
        <GuideParagraph>
          The Discord bot stores the minimum needed to know where to post and
          what to post. When someone with the right permissions runs a{" "}
          <GuideCode>/watch</GuideCode> command, the bot stores:
        </GuideParagraph>
        <GuideTable headers={["Data", "Why it is stored"]}>
          <tr>
            <td className="font-medium text-secondary-foreground">
              Discord channel ID
            </td>
            <td>To know which channel to send activity messages to.</td>
          </tr>
          <tr>
            <td className="font-medium text-secondary-foreground">
              Watched players and clans
            </td>
            <td>
              The RuneProfile accounts and clan names a channel has subscribed
              to.
            </td>
          </tr>
          <tr>
            <td className="font-medium text-secondary-foreground">
              Channel filter settings
            </td>
            <td>
              The allow/block lists and thresholds configured for that channel.
            </td>
          </tr>
        </GuideTable>
        <GuideParagraph>
          Just as importantly, here is what the bot does{" "}
          <b className="text-secondary-foreground">not</b> store:
        </GuideParagraph>
        <GuideList>
          <li>message content - the bot cannot and does not read your chat;</li>
          <li>
            member lists, roles, nicknames, avatars or any other profile
            information about the people in your server;
          </li>
          <li>voice data, attachments or direct messages; and</li>
          <li>
            analytics about who uses which command. Command interactions are
            processed to run the command and are not retained beyond ordinary
            request logs.
          </li>
        </GuideList>
        <GuideParagraph>
          The bot only posts information that is already public on RuneProfile.
          It does not expose anything a visitor could not already see on the
          website.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "technical-data",
    title: "Technical data",
    content: (
      <>
        <GuideParagraph>
          Like any website, RuneProfile's hosting provider processes standard
          request data - IP address, user agent, requested URL, timestamp and
          response status. This is used to keep the service running, diagnose
          errors, apply rate limits and block abuse. It is handled by Cloudflare
          as part of serving and protecting the site, and is kept only for a
          short period.
        </GuideParagraph>
        <GuideParagraph>
          RuneProfile does not use advertising, third-party analytics, tracking
          pixels or tracking cookies. The website stores one thing in your
          browser's local storage - which site-wide notices you have dismissed -
          which never leaves your device.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "how-data-is-used",
    title: "How the data is used",
    content: (
      <>
        <GuideParagraph>Collected data is used only to:</GuideParagraph>
        <GuideList>
          <li>display profiles, clans and groups on the website;</li>
          <li>serve the public API;</li>
          <li>generate activity messages for the Discord bot;</li>
          <li>build hiscores and similar aggregate views of public data; and</li>
          <li>keep the service secure, available and free of abuse.</li>
        </GuideList>
        <GuideParagraph>
          Data is never sold, rented, or handed over to advertisers or data
          brokers.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "processors",
    title: "Who processes the data",
    content: (
      <>
        <GuideParagraph>
          RuneProfile relies on a small number of infrastructure providers, who
          process data on its behalf:
        </GuideParagraph>
        <GuideList>
          <li>
            <b className="text-secondary-foreground">Cloudflare</b> - hosting,
            CDN, storage and DDoS protection.
          </li>
          <li>
            <b className="text-secondary-foreground">PlanetScale</b> - the
            database where profiles and bot settings are stored.
          </li>
          <li>
            <b className="text-secondary-foreground">Discord</b> - delivery of
            the bot's messages, governed by{" "}
            <GuideLink href="https://discord.com/privacy">
              Discord's privacy policy
            </GuideLink>
            .
          </li>
          <li>
            <b className="text-secondary-foreground">Ko-fi</b> - voluntary
            donations. Payments go to Ko-fi directly; RuneProfile never sees
            your payment details.
          </li>
        </GuideList>
        <GuideParagraph>
          Data may also be disclosed where legally required, or where necessary
          to investigate abuse of the service.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "retention",
    title: "Retention",
    content: (
      <GuideList>
        <li>
          <b className="text-secondary-foreground">Profile data</b> is kept until
          the profile is deleted. Each update overwrites the previous state.
        </li>
        <li>
          <b className="text-secondary-foreground">Activity history</b> is kept
          alongside the profile and is removed when the profile is deleted.
        </li>
        <li>
          <b className="text-secondary-foreground">Discord watches and
          settings</b> are kept until the watch is removed, the channel is
          deleted, or the bot is removed from the server.
        </li>
        <li>
          <b className="text-secondary-foreground">Request logs</b> are kept
          only briefly by the hosting provider for security and debugging.
        </li>
      </GuideList>
    ),
  },
  {
    id: "your-choices",
    title: "Your choices and rights",
    content: (
      <>
        <GuideParagraph>
          Uploading a profile is entirely voluntary, and you stay in control of
          it:
        </GuideParagraph>
        <GuideList>
          <li>
            <b className="text-secondary-foreground">Delete your profile</b> -
            use the <b className="text-secondary-foreground">Delete Profile</b>{" "}
            button in the plugin's Profile tab. This permanently removes your
            profile and its activity history. Once deleted, the Discord bot has
            nothing left to report about you.
          </li>
          <li>
            <b className="text-secondary-foreground">Delete individual drops</b>{" "}
            - manage them from the plugin's Drops tab.
          </li>
          <li>
            <b className="text-secondary-foreground">Stop uploading</b> - turn
            off Auto Sync or uninstall the plugin, and nothing further is sent.
          </li>
          <li>
            <b className="text-secondary-foreground">Stop the bot</b> - remove
            the watch with <GuideCode>/watch player remove</GuideCode> or{" "}
            <GuideCode>/watch clan remove</GuideCode>, or remove the bot from
            the server.
          </li>
        </GuideList>
        <GuideParagraph>
          Depending on where you live you may have rights to access, correct,
          export or erase data about you, and to object to its processing.
          Because RuneProfile holds no personal identifiers beyond your public
          RuneScape username, deleting your profile satisfies most of these
          directly. For anything else, ask in the Discord server and it will be
          handled manually.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    content: (
      <GuideParagraph>
        RuneProfile is not directed at children under the minimum age required
        to use Discord in their country (13 in most places, higher in some).
        RuneProfile does not knowingly collect data from anyone below that age.
        If you believe a profile belongs to a child below it, get in touch and
        it will be removed.
      </GuideParagraph>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <GuideParagraph>
        This policy may be updated as RuneProfile changes. The date at the top
        of this page shows when it was last revised, and significant changes
        will be announced in the Discord server.
      </GuideParagraph>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <GuideParagraph>
        For privacy questions, data removal requests, or anything else, reach
        out in the RuneProfile Discord server:{" "}
        <GuideLink href={DISCORD_INVITE_INK}>{DISCORD_INVITE_INK}</GuideLink>.
      </GuideParagraph>
    ),
  },
];

function RouteComponent() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="What the RuneProfile website, public API, RuneLite plugin and Discord bot collect - and what they don't."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
