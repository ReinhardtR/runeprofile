import { ModelViewerClient } from "./ModelViewerClient";

export default function ModelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Models</h1>
        <p className="text-sm text-neutral-500">
          Renders a stored model, or any file off disk, with the website&apos;s
          own loader - so a model that looks wrong here looks wrong on the
          profile.
        </p>
      </div>
      <ModelViewerClient />
    </div>
  );
}
