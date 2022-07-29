import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { SearchModal } from "@/components/SearchModal";

const users = [
  {
    username: "johndoe",
    isPluginUser: true,
  },
  {
    username: "janedoe",
    isPluginUser: false,
  },
  {
    username: "janny",
    isPluginUser: false,
  },
  {
    username: "jane",
    isPluginUser: true,
  },
];

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="bg-stone-800 text-white">
      <Component {...pageProps} />
      <SearchModal users={users} />
    </div>
  );
}

export default MyApp;
