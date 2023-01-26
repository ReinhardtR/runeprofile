import { MainLayout } from "@/components/MainLayout";
import { format } from "date-fns";
import type { NextPage } from "next";

export const ChangeLog: NextPage = () => {
  return (
    <MainLayout>
      <div className="flex justify-center p-4 min-h-screen py-16">
        <div className="p-8 py-6 container max-w-[800px] flex flex-col space-y-2">
          <Title dateString="2023-01-26" number={1} />
          <Content>
            <>
              <p>
                The Wilderness Boss Reworked changed the names of the Collection
                Log entries of the wilderness bosses (Callisto, Venenatis and
                Vet &apos;ion). This required some manual work on the stored
                profile data.
              </p>

              <br />

              <p>
                The data from the old entries should now be moved to the new
                ones. This includes kill counts and the kill counts which the
                items were obtained at. The data should be moved automatically.
                If you dont see the entry on your profile, try opening the entry
                in-game and then updating your profile. If there is any issues
                you can send quick feedback or contact me on Discord through the
                footer.
              </p>
            </>
          </Content>
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
  return (
    <div className="leading-loose text-light-gray text-lg">{children}</div>
  );
};

export default ChangeLog;
