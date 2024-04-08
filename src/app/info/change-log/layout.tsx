import { Layout } from "~/components/layout";

export default function ChangeLogLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <head>
        <title>Change Log | RuneProfile</title>
        <meta name="description" content="Change log for RuneProfile." />
      </head>
      <Layout>
        <div className="container prose pb-32 dark:prose-invert lg:prose-lg prose-headings:text-primary-foreground prose-h1:text-primary prose-em:text-muted-foreground prose-img:my-0">
          {props.children}
        </div>
      </Layout>
    </>
  );
}
