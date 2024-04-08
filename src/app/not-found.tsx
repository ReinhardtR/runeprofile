import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Layout } from "~/components/layout";

export default function NotFound() {
  return (
    <Layout>
      <div className="container flex flex-col items-center justify-center space-y-2 pt-48">
        <p className="text-5xl font-bold text-primary">
          NOT <span className="text-secondary">FOUND</span>
        </p>
        <p className="pb-8 text-primary-foreground">
          The page you were trying to access does not exist.
        </p>
        <Button size="lg">
          <Link href="/">Home Teleport</Link>
        </Button>
      </div>
    </Layout>
  );
}
