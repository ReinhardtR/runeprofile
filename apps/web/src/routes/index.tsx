import { createFileRoute } from "@tanstack/react-router";
import { api } from "../lib/api";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  loader: async () => {
    const response = await api.profiles.$get();
    const data = await response.json();
    return data;
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
