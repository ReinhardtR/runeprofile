import { InferNextProps } from "@/lib/infer-next-props-type";
import { GetServerSidePropsContext, NextPage } from "next";
import { client } from "@/lib/edgedb-client";
import e from "@/edgeql";

const Testing: NextPage<InferNextProps<typeof getServerSideProps>> = ({
  result,
}) => {
  return <div>{JSON.stringify(result)}</div>;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const query = e.select(e.Person, () => ({
    name: true,
  }));

  const result = await query.run(client);

  return {
    props: {
      result,
    },
  };
};

export default Testing;
