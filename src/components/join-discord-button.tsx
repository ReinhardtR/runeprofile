import { DiscordLogoIcon } from "@radix-ui/react-icons";

import { Button } from "~/components/ui/button";

export function JoinDiscordButton() {
  return (
    <Button className="mt-4" size="lg" asChild>
      <a
        href="https://discord.gg/jwx7uqnP"
        target="_blank"
        rel="noreferrer"
        className="no-underline"
      >
        <DiscordLogoIcon className="mr-2 h-5 w-5" />
        Join the Discord
      </a>
    </Button>
  );
}
