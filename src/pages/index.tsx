import { SearchModal } from "@/components/SearchModal";
import type { NextPage } from "next";

const Home: NextPage = () => {
  const testAPI = async () => {
    await fetch("/api/account/submit-data");
  };

  return (
    <div>
      <span>Home</span>
      <button onClick={testAPI}>Test</button>
    </div>
  );
};

export default Home;
