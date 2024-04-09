import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Layout } from "~/components/layout";
import { StatusLayout, StatusMessage, StatusTitle } from "~/components/status";

export default function NotFound() {
  return (
    <Layout>
      <StatusLayout>
        <StatusTitle>
          NOT <span className="text-secondary">FOUND</span>
        </StatusTitle>
        <StatusMessage>
          The page you were trying to access does not exist.
        </StatusMessage>
        <Button size="lg">
          <Link href="/">Home Teleport</Link>
        </Button>
      </StatusLayout>
    </Layout>
  );
}
