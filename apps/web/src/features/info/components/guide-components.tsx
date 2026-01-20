import * as React from "react";

import { cn } from "~/shared/utils";

interface GuideSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const GuideSection: React.FC<GuideSectionProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <section className={cn("mb-12", className)} {...props}>
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
        "mb-4 mt-8 scroll-mt-20 border-b border-border pb-2 text-2xl font-bold tracking-tight text-primary first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
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
        className={cn("max-w-full rounded-md", className)}
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
