import { Link } from "@tanstack/react-router";
import { ChevronDown, Info, Lightbulb, TriangleAlert } from "lucide-react";
import * as React from "react";

import { cn } from "~/shared/utils";

/* -------------------------------------------------------------------------- */
/*  Layout primitives                                                         */
/* -------------------------------------------------------------------------- */

interface GuideSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const GuideSection: React.FC<GuideSectionProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <section className={cn("mb-14 scroll-mt-24", className)} {...props}>
      {children}
    </section>
  );
};

interface GuideHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  id: string; // Required for TOC linking
}

export const GuideHeading: React.FC<GuideHeadingProps> = ({
  children,
  id,
  className,
  ...props
}) => {
  return (
    <h2
      id={id}
      className={cn(
        "mb-4 mt-8 scroll-mt-24 border-b border-border pb-2 text-2xl font-bold tracking-tight text-primary first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
};

export const GuideSubheading: React.FC<
  React.HTMLAttributes<HTMLHeadingElement>
> = ({ children, className, ...props }) => {
  return (
    <h3
      className={cn(
        "mb-2 mt-8 text-lg font-semibold text-secondary-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

interface GuideParagraphProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const GuideParagraph: React.FC<GuideParagraphProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p
      className={cn(
        "leading-7 text-muted-foreground [&:not(:first-child)]:mt-4",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
};

/* -------------------------------------------------------------------------- */
/*  Lists                                                                     */
/* -------------------------------------------------------------------------- */

export const GuideSteps: React.FC<React.HTMLAttributes<HTMLOListElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <ol
      className={cn(
        "mt-4 ml-6 list-decimal space-y-2 leading-7 text-muted-foreground marker:font-semibold marker:text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </ol>
  );
};

export const GuideList: React.FC<React.HTMLAttributes<HTMLUListElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <ul
      className={cn(
        "mt-3 ml-6 list-disc space-y-1.5 leading-7 text-muted-foreground marker:text-muted-foreground/60",
        className,
      )}
      {...props}
    >
      {children}
    </ul>
  );
};

/* -------------------------------------------------------------------------- */
/*  Command reference                                                         */
/* -------------------------------------------------------------------------- */

export interface CommandItem {
  command: string;
  description: React.ReactNode;
}

/**
 * Scannable command reference: one bordered card per group, command syntax in
 * a fixed-width column with its description beside it (stacked on mobile).
 */
export const GuideCommandList: React.FC<{
  items: CommandItem[];
  className?: string;
}> = ({ items, className }) => {
  return (
    <div
      className={cn(
        "mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.command}
          className="gap-x-6 gap-y-1 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,20rem)_1fr] sm:items-baseline"
        >
          <code className="font-mono text-[0.85rem] font-medium text-secondary-foreground">
            {item.command}
          </code>
          <p className="mt-1 text-sm leading-6 text-muted-foreground sm:mt-0">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Table                                                                     */
/* -------------------------------------------------------------------------- */

interface GuideTableProps {
  headers: React.ReactNode[];
  children: React.ReactNode; // <tr> rows
  className?: string;
}

export const GuideTable: React.FC<GuideTableProps> = ({
  headers,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "mt-4 overflow-x-auto rounded-lg border border-border bg-card",
        className,
      )}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-2.5 text-left font-semibold text-secondary-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-muted-foreground [&_td]:px-4 [&_td]:py-2.5">
          {children}
        </tbody>
      </table>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Inline elements                                                           */
/* -------------------------------------------------------------------------- */

export const GuideCode: React.FC<React.HTMLAttributes<HTMLElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <code
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-secondary-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
};

interface GuideLinkProps {
  /** Internal route (rendered via the router's Link). */
  to?: string;
  /** Hash fragment for an internal route link. */
  hash?: string;
  /** External URL or same-page hash (rendered as a plain anchor). */
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export const GuideLink: React.FC<GuideLinkProps> = ({
  to,
  hash,
  href,
  children,
  className,
}) => {
  const classes = cn(
    "font-medium text-secondary-foreground underline underline-offset-4 transition-colors hover:text-primary",
    className,
  );

  if (to) {
    return (
      <Link to={to} hash={hash} className={classes}>
        {children}
      </Link>
    );
  }

  const isHash = href?.startsWith("#");
  return (
    <a
      href={href}
      className={classes}
      target={isHash ? undefined : "_blank"}
      rel={isHash ? undefined : "noreferrer"}
    >
      {children}
    </a>
  );
};

/* -------------------------------------------------------------------------- */
/*  Media                                                                     */
/* -------------------------------------------------------------------------- */

interface GuideImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  caption?: string;
}

export const GuideImage: React.FC<GuideImageProps> = ({
  src,
  alt,
  caption,
  className,
  ...props
}) => {
  return (
    <figure className="my-6 flex flex-col items-center">
      <img
        src={src}
        alt={alt}
        className={cn(
          "max-w-full rounded-lg border border-border bg-card/50 shadow-md",
          className,
        )}
        {...props}
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

/* -------------------------------------------------------------------------- */
/*  Callout                                                                   */
/* -------------------------------------------------------------------------- */

const CALLOUT_CONFIG = {
  note: { Icon: Info, iconClassName: "text-primary" },
  tip: { Icon: Lightbulb, iconClassName: "text-primary" },
  warning: { Icon: TriangleAlert, iconClassName: "text-destructive" },
} as const;

interface GuideCalloutProps {
  variant?: keyof typeof CALLOUT_CONFIG;
  title?: React.ReactNode;
  children: React.ReactNode;
}

export const GuideCallout: React.FC<GuideCalloutProps> = ({
  variant = "note",
  title,
  children,
}) => {
  const { Icon, iconClassName } = CALLOUT_CONFIG[variant];

  return (
    <div className="my-6 flex gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
      {/* Center the icon on the first line: the title line is ~24px
          (text-base), a title-less first line is 28px (leading-7). */}
      <Icon
        className={cn(
          "size-5 shrink-0",
          title ? "mt-0.5" : "mt-1",
          iconClassName,
        )}
      />
      <div className="min-w-0">
        {title && (
          <p className="font-semibold text-secondary-foreground">{title}</p>
        )}
        <div className={cn("leading-7 text-muted-foreground", title && "mt-1")}>
          {children}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  FAQ (native, accessible <details> accordion)                              */
/* -------------------------------------------------------------------------- */

export interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

export const GuideFaq: React.FC<{ items: FaqItem[] }> = ({ items }) => {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {items.map((item) => (
        <details key={item.question} className="group px-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-secondary-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="pb-4 leading-7 text-muted-foreground">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Table of contents + scroll spy                                            */
/* -------------------------------------------------------------------------- */

export interface TocItem {
  id: string;
  title: string;
}

/**
 * Tracks which section is currently in view. Pass a stable (module-scope)
 * array of ids so the observer isn't recreated on every render.
 */
export function useActiveSection(ids: string[]): string {
  const [activeId, setActiveId] = React.useState(ids[0] ?? "");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -66% 0px" },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

interface GuideTableOfContentsProps {
  items: TocItem[];
  activeId?: string;
  className?: string;
}

export const GuideTableOfContents: React.FC<GuideTableOfContentsProps> = ({
  items,
  activeId,
  className,
}) => {
  return (
    <nav className={className}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        On this page
      </p>
      <ul className="border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l py-1.5 pl-4 text-sm transition-colors",
                activeId === item.id
                  ? "border-primary font-medium text-secondary-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-secondary-foreground",
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
