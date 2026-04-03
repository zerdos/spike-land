import { useEffect, useState } from "react";
import { cn } from "@spike-land-ai/shared";
import { buildPromptDrivenBlogImageSrc } from "../core-logic/blog-image-policy";

interface ImageLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  prompt?: string | null;
  wrapperClassName?: string;
}

export function ImageLoader({
  src,
  prompt,
  alt = "",
  className,
  wrapperClassName,
  onLoad,
  onError,
  ...imgProps
}: ImageLoaderProps) {
  const resolvedSrc = buildPromptDrivenBlogImageSrc(typeof src === "string" ? src : null, prompt);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [resolvedSrc]);

  if (!resolvedSrc) return null;

  return (
    <div className={cn("relative overflow-hidden bg-muted/30", wrapperClassName)}>
      {!loaded && !errored && (
        <div className="absolute inset-0 animate-pulse bg-muted/60" aria-hidden="true" />
      )}
      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/40 to-muted/60">
          <span className="text-3xl text-muted-foreground/40 select-none" aria-hidden="true">
            {alt?.[0]?.toUpperCase() || "S"}
          </span>
        </div>
      ) : (
        <img
          {...imgProps}
          src={resolvedSrc}
          alt={alt}
          className={cn(
            "transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
          onLoad={(event) => {
            setLoaded(true);
            onLoad?.(event);
          }}
          onError={(event) => {
            setErrored(true);
            onError?.(event);
          }}
        />
      )}
    </div>
  );
}
