import { createFileRoute } from "@tanstack/react-router";

import DefaultClogPage from "~/core/assets/guide/default-clog-page.png";
import DropsTabImage from "~/core/assets/guide/drops-tab.png";
import InstallPluginImage from "~/core/assets/guide/install-plugin.png";
import LogCommandImage from "~/core/assets/guide/log-command.png";
import ProfileExampleImage from "~/core/assets/guide/profile-example.png";
import ProfileTabImage from "~/core/assets/guide/profile-tab.png";
import UpdateModelImage from "~/core/assets/guide/update-model.png";
import UpdateProfileImage from "~/core/assets/guide/update-profile.png";
import { DISCORD_INVITE_INK } from "~/core/constants";
import {
  type FaqItem,
  GuideCallout,
  GuideCode,
  GuideFaq,
  GuideHeading,
  GuideImage,
  GuideLink,
  GuideList,
  GuideParagraph,
  GuideSection,
  GuideSteps,
  GuideSubheading,
  GuideTableOfContents,
  useActiveSection,
} from "~/features/info";
import { Footer, Header } from "~/layouts";
import { JoinDiscordButton } from "~/shared/components/JoinDiscordButton";

export const Route = createFileRoute("/info/guide")({
  component: RouteComponent,
});

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Do I need to create my profile manually?",
    answer: (
      <>
        No. The first time you log in with the plugin installed, your profile is
        created automatically. To include your collection log data, open your
        Collection Log and sync - see{" "}
        <GuideLink href="#updating-profile">
          Creating &amp; Updating Your Profile
        </GuideLink>
        .
      </>
    ),
  },
  {
    question: "How do I change or hide the Collection Log sync button?",
    answer: (
      <>
        Use the <GuideCode>Sync button</GuideCode> setting (under the{" "}
        <i>Other</i> section of the plugin settings). See{" "}
        <GuideLink href="#settings">Settings</GuideLink> for the three modes.
      </>
    ),
  },
  {
    question: "A valuable drop is wrong or duplicated - how do I remove it?",
    answer: (
      <>
        Open the <b>Drops</b> tab in the plugin panel and delete it from the
        list. This is permanent and cannot be undone.
      </>
    ),
  },
  {
    question:
      "I swapped username with another account, and now updating my profile fails?",
    answer: (
      <>
        Update your profile on the account that originally had the username you
        swapped. If that isn't possible, ask for help on the{" "}
        <GuideLink href={DISCORD_INVITE_INK}>Discord</GuideLink>.
      </>
    ),
  },
  {
    question: "What is the command for a specific collection log page?",
    answer: (
      <>
        Every page name and alias is listed on the{" "}
        <GuideLink to="/info/alias">Aliases</GuideLink> page. You can use the
        full name or any listed alias.
      </>
    ),
  },
  {
    question: "Is there a public RuneProfile API?",
    answer: (
      <>
        Yes - see the{" "}
        <GuideLink href="https://api.runeprofile.com/v1/docs">
          API docs
        </GuideLink>
        .
      </>
    ),
  },
];

const SECTIONS: Section[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <>
        <GuideParagraph>
          The RuneProfile plugin sends your in-game data - skills, quests,
          collection log and more - to{" "}
          <GuideLink href="https://runeprofile.com">RuneProfile</GuideLink>,
          giving you a shareable page for your account. This guide covers
          installing the plugin and everything it can do.
        </GuideParagraph>
        <GuideParagraph>
          Run into a problem or have a question? Come say hi on Discord.
        </GuideParagraph>
        <JoinDiscordButton />
      </>
    ),
  },
  {
    id: "installation",
    title: "Installation",
    content: (
      <>
        <GuideParagraph>
          Install RuneProfile straight from the RuneLite Plugin Hub:
        </GuideParagraph>
        <GuideSteps>
          <li>Open your RuneLite client.</li>
          <li>
            Open the <GuideCode>Plugin Hub</GuideCode> (bottom of the plugin
            list).
          </li>
          <li>
            Search for <GuideCode>RuneProfile</GuideCode>.
          </li>
          <li>
            Click <b>Install</b>.
          </li>
        </GuideSteps>
        <GuideCallout variant="note" title="Why the data warning?">
          RuneLite shows{" "}
          <i>
            "This plugin submits your player data and IP address to a server not
            controlled or verified by the RuneLite developers."
          </i>{" "}
          This is required because the plugin talks to the RuneProfile server.
          It only ever receives the data needed to build your profile, and the{" "}
          <GuideLink href="https://github.com/ReinhardtR/runeprofile">
            server code is fully open source
          </GuideLink>
          .
        </GuideCallout>
        <GuideImage
          src={InstallPluginImage}
          alt="Installing RuneProfile from the RuneLite Plugin Hub"
        />
      </>
    ),
  },
  {
    id: "plugin-panel",
    title: "The Plugin Panel",
    content: (
      <>
        <GuideParagraph>
          Open the panel from the RuneProfile icon in the RuneLite sidebar. It
          has two tabs: <b>Profile</b> and <b>Drops</b>.
        </GuideParagraph>
        <GuideSubheading>Profile tab</GuideSubheading>
        <GuideParagraph>
          Shows an account info card - username, account type, clan, and when
          your profile was created and last updated - with these actions below
          it:
        </GuideParagraph>
        <GuideList>
          <li>
            <b>Update Player Model</b> - uploads your current character model
            (see <GuideLink href="#update-model">Your Player Model</GuideLink>).
          </li>
          <li>
            <b>Open Profile</b> - opens your profile in your browser.
          </li>
          <li>
            <b>Delete Profile</b> - permanently removes your RuneProfile.
          </li>
        </GuideList>
        <GuideParagraph>
          Before your profile exists, this tab instead shows a short guide with
          a <b>Create Profile</b> button.
        </GuideParagraph>
        <GuideImage
          src={ProfileTabImage}
          alt="The Profile tab of the RuneProfile plugin panel"
        />
        <GuideSubheading>Drops tab</GuideSubheading>
        <GuideParagraph>
          Lists the valuable drops shown on your profile and lets you remove
          ones that were tracked incorrectly - see{" "}
          <GuideLink href="#valuable-drops">Valuable Drops</GuideLink>.
        </GuideParagraph>
      </>
    ),
  },
  {
    id: "updating-profile",
    title: "Creating & Updating Your Profile",
    content: (
      <>
        <GuideCallout
          variant="tip"
          title="Your profile is created automatically"
        >
          The first time you log in with the plugin installed, RuneProfile
          creates your profile for you - no buttons to press. A chat message
          confirms it and explains how to include your collection log data.
        </GuideCallout>
        <GuideParagraph>
          Creating and updating your profile work the same way. With{" "}
          <b>Auto Sync</b> enabled (the default), the plugin updates your
          profile every 60 minutes automatically.
        </GuideParagraph>
        <GuideCallout variant="note">
          The plugin can only read your collection log while it's open, so
          collection log items are only included if you've opened it since
          logging in.
        </GuideCallout>
        <GuideSubheading>Updating manually</GuideSubheading>
        <GuideParagraph>
          Don't want to wait for Auto Sync? Update on demand:
        </GuideParagraph>
        <GuideSteps>
          <li>Open your Collection Log.</li>
          <li>
            Click the <b>RuneProfile</b> button in the top-left of the window.
          </li>
        </GuideSteps>
        <GuideParagraph className="mt-3 text-sm italic">
          The button lives inside the Collection Log window so the plugin can
          read its data as you sync.
        </GuideParagraph>
        <GuideImage
          src={UpdateProfileImage}
          alt="The RuneProfile sync button in the Collection Log window"
        />
        <GuideSubheading>
          Instant sync on new collection log items
        </GuideSubheading>
        <GuideParagraph>
          When you obtain a new collection log item, the plugin updates your
          profile in that moment. This needs one of these OSRS settings enabled:
        </GuideParagraph>
        <GuideList>
          <li>
            <GuideCode>Collection log - New addition notification</GuideCode>
          </li>
          <li>
            <GuideCode>Collection log - New addition popup</GuideCode>
          </li>
        </GuideList>
      </>
    ),
  },
  {
    id: "update-model",
    title: "Your Player Model",
    content: (
      <>
        <GuideParagraph>
          Your profile shows a 3D model of your character. To set or refresh it:
        </GuideParagraph>
        <GuideSteps>
          <li>
            Open the RuneProfile panel's <b>Profile</b> tab.
          </li>
          <li>
            Click <b>Update Player Model</b>.
          </li>
        </GuideSteps>
        <GuideParagraph>
          If a pet is following you, it will appear alongside you on your
          profile.
        </GuideParagraph>
        <GuideImage
          src={UpdateModelImage}
          alt="Updating your player model from the plugin panel"
        />
      </>
    ),
  },
  {
    id: "viewing-profile",
    title: "Viewing Your Profile",
    content: (
      <>
        <GuideParagraph>
          Once you've synced for the first time, your profile is live at{" "}
          <GuideCode>{"runeprofile.com/<your-username>"}</GuideCode>.
        </GuideParagraph>
        <GuideParagraph>
          You can jump straight there with the <b>Open Profile</b> button on the
          panel's Profile tab.
        </GuideParagraph>
        <GuideImage
          src={ProfileExampleImage}
          alt="An example RuneProfile profile page"
        />
      </>
    ),
  },
  {
    id: "valuable-drops",
    title: "Valuable Drops",
    content: (
      <>
        <GuideParagraph>
          Your profile can showcase your valuable drops in the{" "}
          <b>Latest Activities</b> feed. This relies on the <b>Loot Tracker</b>{" "}
          plugin (installed by default in RuneLite): with it enabled,
          RuneProfile automatically records any drop worth over 1,000,000 gp.
        </GuideParagraph>
        <GuideSubheading>Managing your drops</GuideSubheading>
        <GuideParagraph>
          The <b>Drops</b> tab in the plugin panel lists your most recent
          valuable drops with the item icon, name, value and date. Use it to
          remove a drop that was tracked incorrectly or shows up as a duplicate.
        </GuideParagraph>
        <GuideCallout variant="warning">
          Deleting a drop is permanent and cannot be undone.
        </GuideCallout>
        <GuideImage
          src={DropsTabImage}
          alt="The Drops tab listing recent valuable drops"
        />
      </>
    ),
  },
  {
    id: "log-command",
    title: "!log command",
    content: (
      <>
        <GuideParagraph>
          The plugin adds a chat command:{" "}
          <GuideCode>{"!log <collection-log-page>"}</GuideCode>. It posts your
          obtained items for that page in chat, visible to anyone else running
          the RuneProfile plugin.
        </GuideParagraph>
        <GuideParagraph>
          Page aliases work too - e.g. <GuideCode>!log cox</GuideCode>. See the
          full list on the <GuideLink to="/info/alias">Aliases</GuideLink> page.
        </GuideParagraph>
        <GuideImage src={LogCommandImage} alt="Using the !log chat command" />
      </>
    ),
  },
  {
    id: "default-clog-page",
    title: "Default Collection Log Page",
    content: (
      <>
        <GuideParagraph>
          Want a specific collection log page shown first when someone opens
          your profile? Right-click that page in your Collection Log and set it
          as the default.
        </GuideParagraph>
        <GuideImage
          src={DefaultClogPage}
          alt="Setting a default collection log page"
        />
      </>
    ),
  },
  {
    id: "settings",
    title: "Settings",
    content: (
      <>
        <GuideParagraph>
          Configure the plugin from its settings panel in RuneLite. A few
          options worth knowing:
        </GuideParagraph>
        <GuideSubheading>Sync button</GuideSubheading>
        <GuideParagraph>
          Controls how the sync button appears in the Collection Log (under the{" "}
          <i>Other</i> section):
        </GuideParagraph>
        <GuideList>
          <li>
            <GuideCode>Left-click</GuideCode> (default) - replaces the Search
            button with the RuneProfile button; Search moves to a right-click
            option.
          </li>
          <li>
            <GuideCode>Right-click</GuideCode> - keeps the normal Search button
            and adds a <GuideCode>Sync RuneProfile</GuideCode> right-click
            option.
          </li>
          <li>
            <GuideCode>Disabled</GuideCode> - hides the sync button entirely.
          </li>
        </GuideList>
        <GuideSubheading>Auto Sync</GuideSubheading>
        <GuideParagraph>
          Enabled by default; keeps your profile updated every 60 minutes.
          Disable it if you'd rather update only manually.
        </GuideParagraph>
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
            Guide
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Install the RuneProfile plugin, share your account, and get the most
            out of every feature.
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
