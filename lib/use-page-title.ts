import * as React from "react";
import { useSEO } from "./seo";

const baseTitle = "StayKha";

export function usePageTitle(title?: string, description?: string) {
  const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;

  useSEO({
    title: fullTitle,
    description: description,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = fullTitle;
  }, [fullTitle]);
}
