import { Footer } from "~/components/footer";
import { Header } from "~/components/header";

export const Layout: React.FC<{ children: React.ReactNode }> = (props) => {
  return (
    <>
      <Header />
      <main className="relative flex min-h-screen flex-col bg-background py-8">
        {props.children}
      </main>
      <Footer />
    </>
  );
};
