import { useNavigate } from "@tanstack/react-router";

import { DISCORD_INVITE_INK } from "~/core/constants";
import { Button } from "~/shared/components/ui/button";

// Friendly fallback for unexpected errors, styled like the not-found pages.
// Raw error messages are intentionally not shown to the user.
export function UnexpectedErrorPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-y-4 items-center justify-center min-h-screen px-4">
      <p className="text-2xl text-primary-foreground">Something went wrong</p>
      <p className="text-muted-foreground text-center">
        An unexpected error occurred while loading this page.
        <br />
        Try again in a moment. If the problem persists, please report it on{" "}
        <a
          href={DISCORD_INVITE_INK}
          target="_blank"
          rel="noreferrer"
          className="text-secondary-foreground underline"
        >
          Discord
        </a>
        .
      </p>
      <Button onClick={() => navigate({ to: "/" })}>Home Teleport</Button>
      <Button variant="ghost" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  );
}
