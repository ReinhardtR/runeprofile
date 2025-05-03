import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/clan/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  return (
    <div>
      <pre>{JSON.stringify(params, null, 2)}</pre>
    </div>
  );
}
