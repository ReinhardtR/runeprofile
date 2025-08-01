import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

import DefaultClogPage from "~/assets/guide/default-clog-page.png";
import InstallPluginImage from "~/assets/guide/install-plugin.png";
import LogCommandImage from "~/assets/guide/log-command.png";
import ProfileExampleImage from "~/assets/guide/profile-example.png";
import UpdateModelImage from "~/assets/guide/update-model.png";
import UpdateProfileImage from "~/assets/guide/update-profile.png";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { JoinDiscordButton } from "~/components/join-discord";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/info/guide")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Header />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-center text-4xl font-extrabold tracking-tight text-muted-foreground">
          Guide
        </h1>

        {/* Table of Contents */}
        <nav className="mb-12 rounded-md border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-secondary-foreground">
            Table of Contents
          </h3>
          <ul className="space-y-2">
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-muted-foreground transition-colors hover:text-secondary-foreground hover:underline"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Guide Content */}
        <article>
          <GuideSection>
            <GuideHeading id="introduction">Introduction</GuideHeading>
            <GuideParagraph>
              Welcome to the RuneProfile Plugin guide! This plugin allows you to
              send your in-game data (skills, quests, collection log, etc.) to
              RuneProfile. This guide will walk you through the installation and
              usage of the plugin.
            </GuideParagraph>

            <GuideParagraph>
              If you experience issues using the plugin or need help - please
              join the Discord.
            </GuideParagraph>
            <JoinDiscordButton />
          </GuideSection>

          <GuideSection>
            <GuideHeading id="installation">Installation</GuideHeading>
            <ol className="ml-6 list-decimal space-y-2 text-muted-foreground">
              <li>Open your RuneLite client.</li>
              <li>Navigate to the Plugin Hub.</li>
              <li>Search for "RuneProfile".</li>
              <li>Click the "Install" button.</li>
            </ol>
            <GuideParagraph className="italic">
              <span className="text-secondary-foreground">
                "This plugin submits your player data and IP address to a server
                not controlled or verified by the RuneLite developers."
              </span>
              <br />
              It's required by RuneLite that this warning is shown when
              installing the plugin, since it connects to the RuneProfile
              server. The server is only given the data needed to make your
              profile, and all the code for the server is open source{" "}
              <a
                href="https://github.com/ReinhardtR/runeprofile"
                target="_blank"
                className="text-secondary-foreground underline"
              >
                here.
              </a>
            </GuideParagraph>
            <GuideImage
              src={InstallPluginImage}
              alt="Plugin Hub Installation Screenshot"
            />
          </GuideSection>

          <GuideSection>
            <GuideHeading id="updating-profile">
              Creating and Updating your Profile
            </GuideHeading>
            <GuideParagraph>
              Creating and updating your profile is done in the same way. If you
              have Auto Sync enabled (enabled by default), the plugin will
              automatically create/update your profile every 15 minutes. Note,
              since the plugin can only read your Collection Log data when it is
              open, the Collection Log items will only be included if you have
              opened it before Auto Sync triggers.
            </GuideParagraph>

            <GuideParagraph>
              If you don't want to wait for Auto Sync, or have it disabled, you
              can manually update your profile by following these steps:
            </GuideParagraph>
            <ol className="ml-6 mt-3 list-decimal space-y-2 text-muted-foreground">
              <li>Open your Collection Log.</li>
              <li>Open the menu at the top left.</li>
              <li>Click the "RuneProfile"-button.</li>
            </ol>
            <GuideParagraph className="italic text-sm">
              The update button is inside the Collection Log window, to allow
              the plugin to read the Collection Log data.
            </GuideParagraph>
            <GuideImage
              src={UpdateProfileImage}
              alt="Updating Profile Screenshot"
            />
            <GuideParagraph>
              <b className="text-secondary-foreground">
                Auto Sync - New Collection Log Items
                <br />
              </b>
              When you obtain a new Collection Log item, the plugin will update
              automatically update your profile in that moment. This feature
              requires that you have either of these OSRS settings enabled:
              <ol className="list-disc ml-6">
                <li>
                  <code>Collection log - New addition notification</code>
                </li>
                <li>
                  <code>Collection log - New addition popup</code>
                </li>
              </ol>
            </GuideParagraph>
            <GuideParagraph>
              <b className="text-secondary-foreground">
                Auto Sync - Valuable Drops
                <br />
              </b>
              Your profile can display your valuable drops inside your "Latest
              Activities". This requires you to have the Loot Tracker plugin
              enabled (Installed by default in RuneLite). Then the RuneProfile
              plugin will automatically track any items over 1,000,000 gp.
            </GuideParagraph>
          </GuideSection>

          <GuideSection>
            <GuideHeading id="update-model">
              Updating your Player Model
            </GuideHeading>
            <ol className="ml-6 list-decimal space-y-2 text-muted-foreground">
              <li>Open the RuneProfile plugin panel.</li>
              <li>Click the "Update Player Model"-button.</li>
            </ol>
            <GuideParagraph>
              If a pet is following you, it will be shown on your profile.
            </GuideParagraph>
            <GuideImage
              src={UpdateModelImage}
              alt="Updating Player Model Screenshot"
            />
          </GuideSection>

          <GuideSection>
            <GuideHeading id="viewing-profile">
              Viewing your Profile
            </GuideHeading>
            <GuideParagraph>
              Your profile will be available at{" "}
              <span className="text-secondary-foreground">
                {`runeprofile.com/<your-username>`}
              </span>{" "}
              after updating your profile for the first time.
            </GuideParagraph>
            <GuideParagraph>
              You can quickly open your profile from the RuneProfile plugin
              panel, by clicking the "Open Profile"-button.
            </GuideParagraph>
            <GuideImage
              src={ProfileExampleImage}
              alt="Profile Example Screenshot"
            />
          </GuideSection>

          <GuideSection>
            <GuideHeading id="log-command">!log command</GuideHeading>
            <GuideParagraph>
              The plugin also adds a command to the game chat:{" "}
              <span className="text-secondary-foreground">
                !log {`<collection-log-page>`}
              </span>
              . This command will send your obtained items for the given page in
              the chat, and will be shown to anyone who also have the
              RuneProfile plugin installed.
            </GuideParagraph>
            <GuideParagraph className="italic text-sm">
              Common aliases of Collection Log pages are also supported, for
              example: !log cox.
              <br /> A list of all aliases can be found{" "}
              <a
                href="/info/alias"
                className="text-secondary-foreground underline"
              >
                here
              </a>
              .
            </GuideParagraph>
            <GuideImage src={LogCommandImage} alt="Log Command Screenshot" />
          </GuideSection>

          <GuideSection>
            <GuideHeading id="default-clog-page">
              Setting default Collection Log page
            </GuideHeading>

            <GuideParagraph>
              If you have a preferred Collection Log page that you want to be
              shown on your profile when initially opened, you can select it by
              right-clicking the page in the Collection Log.
            </GuideParagraph>

            <GuideImage
              src={DefaultClogPage}
              alt="Default Collection Log Page Screenshot"
            />
          </GuideSection>
        </article>
      </div>
      <Footer />
    </>
  );
}

interface GuideSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const GuideSection: React.FC<GuideSectionProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <section className={cn("mb-12", className)} {...props}>
      {children}
    </section>
  );
};

interface GuideHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  id: string; // Required for TOC linking
}

const GuideHeading: React.FC<GuideHeadingProps> = ({
  children,
  id,
  className,
  ...props
}) => {
  return (
    <h2
      id={id}
      className={cn(
        "mb-4 mt-8 scroll-mt-20 border-b border-border pb-2 text-2xl font-bold tracking-tight text-primary first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
};

interface GuideParagraphProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const GuideParagraph: React.FC<GuideParagraphProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p
      className={cn(
        "leading-7 text-muted-foreground [&:not(:first-child)]:mt-4",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
};

interface GuideImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  caption?: string;
}

const GuideImage: React.FC<GuideImageProps> = ({
  src,
  alt,
  caption,
  className,
  ...props
}) => {
  return (
    <figure className="my-6 flex flex-col items-center">
      <img
        src={src}
        alt={alt}
        className={cn("max-w-full rounded-md", className)}
        {...props}
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

const tocItems = [
  { id: "introduction", title: "Introduction" },
  { id: "installation", title: "Installation" },
  { id: "updating-profile", title: "Creating and Updating your Profile" },
  { id: "update-model", title: "Updating your Player Model" },
  { id: "viewing-profile", title: "Viewing your Profile" },
  { id: "log-command", title: "!log command" },
  { id: "default-clog-page", title: "Setting default Collection Log page" },
];
