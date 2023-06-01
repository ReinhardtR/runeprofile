import { getAccountDisplayData } from "~/lib/domain/account";

export const dynamic = "force-static";

export default async function Page() {
  const account = await getAccountDisplayData("PGN");

  return (
    <div className="text-white">
      <pre>{JSON.stringify(account, null, 2)}</pre>
    </div>
  );
}
