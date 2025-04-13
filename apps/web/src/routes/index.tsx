import { createFileRoute } from "@tanstack/react-router";

import Logo from "~/assets/misc/logo.png";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-row items-center justify-center gap-4 p-16">
      <div className="bg-card rounded-lg border p-16 flex items-center justify-center flex-col gap-y-4">
        <img src={Logo} className="size-24" />
        <h1 className="font-bold text-card-foreground text-2xl text-center">
          RuneProfile is currently down <br /> due to maintenance.
        </h1>
        <p className="text-center text-muted-foreground">
          Join the{" "}
          <a
            href="https://discord.com/invite/6XgBcePAfj"
            className="text-primary font-bold hover:underline"
          >
            Discord
          </a>{" "}
          for more information and updates.
        </p>
      </div>
    </div>
  );
}
