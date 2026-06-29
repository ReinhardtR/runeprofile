import { Link } from "@tanstack/react-router";
import { Bot } from "lucide-react";

import { DISCORD_BOT_INVITE_LINK } from "~/core/constants";
import { DiscordIcon } from "~/shared/components/icons";
import { Button } from "~/shared/components/ui/button";

export function AddDiscordBotButton() {
  return (
    <Button className="mt-4 w-52" size="lg" variant="outline" asChild>
      <a
        href={DISCORD_BOT_INVITE_LINK}
        target="_blank"
        rel="noreferrer"
        className="no-underline"
      >
        <DiscordIcon className="mr-2 h-5 w-5" />
        Add Discord Bot
      </a>
    </Button>
  );
}

export function DiscordBotButton() {
  return (
    <Button className="mt-4 w-52" size="lg" variant="outline" asChild>
      <Link to="/info/discord-bot" className="no-underline">
        <Bot className="mr-2 h-5 w-5" />
        Discord Bot
      </Link>
    </Button>
  );
}
