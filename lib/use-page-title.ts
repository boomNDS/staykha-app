import * as React from "react";

const baseTitle = "StayKha";

export function usePageTitle(title?: string) {
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = title ? `${baseTitle} — ${title}` : baseTitle;
  }, [title]);
}
