import { DiscordIcon } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { DISCORD_INVITE_INK } from "~/lib/constants";

export function JoinDiscordButton() {
  return (
    <Button className="mt-4 w-52" size="lg" asChild>
      <a
        href={DISCORD_INVITE_INK}
        target="_blank"
        rel="noreferrer"
        className="no-underline"
      >
        <DiscordIcon className="mr-2 h-5 w-5" />
        Join the Discord
      </a>
    </Button>
  );
}
