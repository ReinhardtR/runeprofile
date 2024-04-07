import { Layout } from "~/components/layout";

export default function ChangeLogLayout(props: { children: React.ReactNode }) {
  return (
    <Layout>
      <div className="container prose pb-32 dark:prose-invert lg:prose-xl prose-h1:text-primary">
        {props.children}
      </div>
    </Layout>
  );
}
