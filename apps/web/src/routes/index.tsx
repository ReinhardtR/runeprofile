import { createFileRoute } from "@tanstack/react-router";

import { api } from "~/lib/api";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  loader: async () => {
    const response = await api.profiles[":username"].$get({
      param: {
        username: "pgn",
      },
    });
    return await response.json();
  },
});

function HomeComponent() {
  const data = Route.useLoaderData();

  return (
    <div className="p-2">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
