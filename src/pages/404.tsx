import { MainLayout } from "@/components/MainLayout";
import type { NextPage } from "next";

const NotFound: NextPage = () => {
  return (
    <MainLayout>
      <main className="flex flex-col justify-center items-center space-y-2 min-h-screen">
        <h1 className="flex flex-col sm:flex-row justify-center items-center space-x-2 text-2xl lg:text-4xl font-black tracking-wide drop-shadow-sm">
          <span className="text-primary">404</span>{" "}
          <span className="text-accent">PAGE NOT FOUND</span>
        </h1>
      </main>
    </MainLayout>
  );
};

export default NotFound;
