import { createFileRoute } from "@tanstack/react-router";

import { DISCORD_INVITE_INK } from "~/core/constants";
import {
  GuideCallout,
  GuideLink,
  GuideList,
  GuideParagraph,
  type LegalSection,
  LegalPage,
} from "~/features/info";

const LAST_UPDATED = "2 August 2026";

export const Route = createFileRoute("/legal/terms")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Terms of Service - RuneProfile" },
      {
        name: "description",
        content:
          "The terms that apply to the RuneProfile website, public API, RuneLite plugin and Discord bot.",
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
          RuneProfile is a free, fan-made hobby project that lets Old School
          RuneScape players track and share their progress. These terms cover
          everything RuneProfile runs:
        </GuideParagraph>
        <GuideList>
          <li>the website at runeprofile.com,</li>
          <li>the public API at api.runeprofile.com,</li>
          <li>the RuneProfile RuneLite plugin, and</li>
          <li>the RuneProfile Discord bot.</li>
        </GuideList>
        <GuideParagraph>
          By using any of these you agree to these terms. If you do not agree,
          please stop using them - uninstall the plugin, remove the bot from
          your server, or simply stop visiting the site.
        </GuideParagraph>
        <GuideCallout variant="note" title="Not affiliated with Jagex">
          RuneProfile is an unofficial fan project. It is not affiliated with,
          endorsed by, or sponsored by Jagex Ltd., RuneLite, or Discord Inc.
          Old School RuneScape and its content are the property of Jagex Ltd.
        </GuideCallout>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who may use RuneProfile",
    content: (
      <>
        <GuideParagraph>
          You may use RuneProfile if you meet the minimum age required to use
          Discord in your country (13 in most places, higher in some). If you
          use the Discord bot, you must also follow Discord's{" "}
          <GuideLink href="https://discord.com/terms">Terms of Service</GuideLink>{" "}
          and{" "}
          <GuideLink href="https://discord.com/guidelines">
            Community Guidelines
          </GuideLink>
          .
        </GuideParagraph>
        <GuideParagraph>
          You may only upload data for Old School RuneScape accounts you play
          yourself. Uploading someone else's account data, or data you did not
          obtain by playing the game normally, is not allowed.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "profiles",
    title: "Your profile is public",
    content: (
      <>
        <GuideParagraph>
          When you upload a profile through the RuneLite plugin, that profile
          becomes publicly visible. Anyone can view it on the website and read
          it through the public API without logging in - there are no private
          profiles and no accounts or passwords.
        </GuideParagraph>
        <GuideParagraph>
          That includes your RuneScape username, account type, clan and group
          information, skills, quests, achievement diaries, combat achievements,
          collection log, tracked drops, and the activity history derived from
          those updates. Only upload what you are comfortable making public.
        </GuideParagraph>
        <GuideParagraph>
          You can remove your profile at any time using the{" "}
          <b className="text-secondary-foreground">Delete Profile</b> button in
          the plugin's Profile tab. See the{" "}
          <GuideLink to="/legal/privacy">Privacy Policy</GuideLink> for what
          happens to your data afterwards.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    content: (
      <>
        <GuideParagraph>When using RuneProfile, do not:</GuideParagraph>
        <GuideList>
          <li>
            upload falsified, tampered or otherwise fake game data, or use
            modified clients to do so;
          </li>
          <li>
            impersonate another player, or upload a profile for an account you
            do not play;
          </li>
          <li>
            use the site, API or bot to harass, spam, dox or abuse other people;
          </li>
          <li>
            attempt to bypass rate limits, scrape at a volume that degrades the
            service, or otherwise disrupt or overload the infrastructure;
          </li>
          <li>
            attempt to gain unauthorised access to the service, its data, or its
            hosting accounts; or
          </li>
          <li>
            use RuneProfile to break Jagex's or Discord's rules, or any law that
            applies to you.
          </li>
        </GuideList>
        <GuideParagraph>
          The public API is provided for community projects and is subject to
          rate limits. Please cache responses and be considerate - it is paid
          for out of pocket.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "discord-bot",
    title: "The Discord bot",
    content: (
      <>
        <GuideParagraph>
          The Discord bot posts RuneProfile activity - level ups, valuable
          drops, quest completions, collection log items and similar - into the
          channels a server configures with the{" "}
          <GuideLink to="/info/discord-bot">/watch commands</GuideLink>.
        </GuideParagraph>
        <GuideList>
          <li>
            Only someone with permission to manage the server can invite the
            bot, and the bot only posts where it has been given access.
          </li>
          <li>
            Server moderators are responsible for how the bot is configured in
            their server, including which players and clans are watched and
            which channels receive messages.
          </li>
          <li>
            The bot only relays information that is already public on
            RuneProfile. It does not reveal anything a visitor could not see on
            the website.
          </li>
          <li>
            Removing the bot from your server, or removing its watches, stops
            the messages immediately.
          </li>
        </GuideList>
        <GuideParagraph>
          If a player does not want their activity relayed, deleting their
          RuneProfile stops it - there is nothing left for the bot to report.
          You can also ask in the Discord server for help.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    content: (
      <>
        <GuideParagraph>
          RuneProfile is free and run as a hobby. It is provided on a best-effort
          basis: there is no uptime guarantee, no support commitment, and no
          promise that any given feature will keep working. Features may be
          added, changed or removed at any time, and the service may be taken
          offline permanently.
        </GuideParagraph>
        <GuideParagraph>
          Donations (for example through Ko-fi) are voluntary gifts towards
          hosting costs. They do not buy a service level, priority support, or
          any other entitlement, and they are not refundable by RuneProfile.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "termination",
    title: "Suspension and removal",
    content: (
      <GuideParagraph>
        Profiles, clans, servers and API keys that break these terms may be
        removed, banned or blocked, with or without notice. This is mostly aimed
        at fake data, abuse and attacks on the service. If you think something
        was removed by mistake, get in touch in the Discord server.
      </GuideParagraph>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party services",
    content: (
      <>
        <GuideParagraph>
          RuneProfile depends on services it does not control, and their own
          terms apply when you use them:
        </GuideParagraph>
        <GuideList>
          <li>
            <b className="text-secondary-foreground">Jagex / Old School
            RuneScape</b> - the game the data comes from.
          </li>
          <li>
            <b className="text-secondary-foreground">RuneLite</b> - the client
            the plugin runs in.
          </li>
          <li>
            <b className="text-secondary-foreground">Discord</b> - where the bot
            delivers its messages.
          </li>
          <li>
            <b className="text-secondary-foreground">Cloudflare, PlanetScale
            and Ko-fi</b> - hosting, database and donations.
          </li>
        </GuideList>
      </>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimer and liability",
    content: (
      <>
        <GuideParagraph>
          RuneProfile is provided "as is" and "as available", without warranties
          of any kind, whether express or implied, including fitness for a
          particular purpose and accuracy of the data shown. Game data can be
          incomplete, delayed or wrong, and should not be relied on for anything
          important.
        </GuideParagraph>
        <GuideParagraph>
          To the fullest extent permitted by law, RuneProfile and its maintainer
          are not liable for any loss or damage arising from your use of the
          website, API, plugin or Discord bot - including lost data, downtime,
          or anything that happens in a Discord server as a result of the bot's
          messages. Nothing in these terms limits rights you have under
          mandatory consumer law.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: (
      <GuideParagraph>
        These terms may be updated as RuneProfile changes. The date at the top
        of this page shows when they were last revised, and significant changes
        will be announced in the Discord server. Continuing to use RuneProfile
        after a change means you accept the updated terms.
      </GuideParagraph>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <GuideParagraph>
        Questions about these terms, the bot, or anything else are welcome in
        the RuneProfile Discord server:{" "}
        <GuideLink href={DISCORD_INVITE_INK}>{DISCORD_INVITE_INK}</GuideLink>.
      </GuideParagraph>
    ),
  },
];

function RouteComponent() {
  return (
    <LegalPage
      title="Terms of Service"
      description="The rules for using the RuneProfile website, public API, RuneLite plugin and Discord bot."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
