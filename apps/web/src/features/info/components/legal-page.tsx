import * as React from "react";

import { Footer, Header } from "~/layouts";

import {
  GuideHeading,
  GuideSection,
  GuideTableOfContents,
  useActiveSection,
} from "./guide-components";

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
}

/**
 * Shell for the legal pages. These are deliberately unlinked from the site
 * navigation - they exist so the Discord bot listing can point at them - so
 * they get no header/footer entry, only a direct URL.
 */
export const LegalPage: React.FC<LegalPageProps> = ({
  title,
  description,
  lastUpdated,
  sections,
}) => {
  const activeId = useActiveSection(sections.map((section) => section.id));
  const tocItems = sections.map(({ id, title: sectionTitle }) => ({
    id,
    title: sectionTitle,
  }));

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-10 lg:py-14">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-secondary-foreground">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {description}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* Mobile table of contents */}
        <details className="mb-10 rounded-lg border border-border bg-card px-4 lg:hidden">
          <summary className="cursor-pointer list-none py-3 font-semibold text-secondary-foreground [&::-webkit-details-marker]:hidden">
            Table of Contents
          </summary>
          <ul className="mb-3 space-y-2">
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-muted-foreground transition-colors hover:text-secondary-foreground"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </details>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
          <article className="min-w-0 max-w-3xl">
            {sections.map((section) => (
              <GuideSection key={section.id}>
                <GuideHeading id={section.id}>{section.title}</GuideHeading>
                {section.content}
              </GuideSection>
            ))}
          </article>

          <aside className="hidden lg:block">
            <GuideTableOfContents
              items={tocItems}
              activeId={activeId}
              className="sticky top-24"
            />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
};
