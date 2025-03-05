import { createFileRoute } from "@tanstack/react-router";

import { api } from "~/lib/api";

export const Route = createFileRoute("/$username")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const response = await api.profiles[":username"].$get({
      param: {
        username: params.username,
      },
    });
    return await response.json();
  },
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
