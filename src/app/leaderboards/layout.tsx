import { Layout } from "~/components/layout";

export default function LeaderboardsLayout(props: {
  children: React.ReactNode;
}) {
  return <Layout>{props.children}</Layout>;
}
