import { MainLayout } from "@/components/MainLayout";
import { format } from "date-fns";
import type { NextPage } from "next";

export const ChangeLog: NextPage = () => {
  return (
    <MainLayout>
      <div className="flex justify-center p-4 min-h-screen py-16">
        <div className="p-8 py-6 container max-w-[800px] flex flex-col space-y-2">
          <Title dateString="2022-11-14" number={1} />
          <Content>Nothing here yet!</Content>
        </div>
      </div>
    </MainLayout>
  );
};

const Title = ({
  number,
  dateString,
}: {
  number: number;
  dateString: string;
}) => {
  const date = Date.parse(dateString);
  const formattedDate = format(date, "PPP");

  return (
    <div className="flex space-x-2 -ml-11">
      <p className="text-3xl text-primary font-bold">#{number}</p>
      <h1 className="text-3xl font-bold text-accent">{formattedDate}</h1>
    </div>
  );
};

const Content = ({ children }: { children: React.ReactNode }) => {
  return <p className="leading-loose text-light-gray text-lg">{children}</p>;
};

export default ChangeLog;
