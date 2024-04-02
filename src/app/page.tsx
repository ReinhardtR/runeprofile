import { getProfilFullWithHash } from "~/lib/data/get-profile";

export default async function Page() {
  const data = await getProfilFullWithHash({
    accountHash: "123",
  });

  return (
    <div className="text-white">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
