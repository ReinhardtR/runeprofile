import { DiscordSimulatorClient } from "./DiscordSimulatorClient";

export default function DiscordSimulatorPage() {
  const defaultChannelId = process.env.DISCORD_CHANNEL_ID ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Discord Simulator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send activity embed messages to a Discord channel for local
          development testing.
        </p>
      </div>
      <DiscordSimulatorClient defaultChannelId={defaultChannelId} />
    </div>
  );
}
