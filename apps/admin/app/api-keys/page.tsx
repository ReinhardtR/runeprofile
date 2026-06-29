import { Card } from "@/components/ui/card";

import { ApiKeysClient } from "./ApiKeysClient";
import { getApiKeys } from "./actions";

export default async function ApiKeysPage() {
  const keys = await getApiKeys();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
      <Card className="p-4">
        <ApiKeysClient keys={keys} />
      </Card>
    </div>
  );
}
