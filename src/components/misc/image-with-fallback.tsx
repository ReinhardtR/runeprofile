import React from "react";
import Image, { ImageProps } from "next/image";

export interface ImageWithFallbackProps extends ImageProps {
  fallback?: string;
}

// Image component that will show a fallback image if the original image fails to load. If no fallback is provided or it fails, it will show a question mark.
export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  fallback,
  alt,
  src,
  ...props
}) => {
  const [hasOriginalFailed, setHasOriginalFailed] = React.useState(false);
  const [hasFallbackFailed, setHasFallbackFailed] = React.useState(false);

  React.useEffect(() => {
    setHasOriginalFailed(false);
    setHasFallbackFailed(false);
  }, [src]);

  if ((!fallback && hasOriginalFailed) || hasFallbackFailed) {
    return (
      <p
        className="pointer-events-none text-center font-runescape text-osrs-orange solid-text-shadow"
        style={{
          width: props.width,
          height: props.height,
        }}
      >
        ?
      </p>
    );
  }

  if (fallback && hasOriginalFailed) {
    return (
      <Image
        src={fallback}
        alt={alt}
        onError={() => setHasFallbackFailed(true)}
        {...props}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={() => setHasOriginalFailed(true)}
      {...props}
    />
  );
};
