import {
  useNavigate,
  useRouterState,
  useParams as useTanstackParams,
} from "@tanstack/react-router";
import { useMemo } from "react";

export function useRouter() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const defaultFallback = pathname.startsWith("/overview") ? "/overview" : "/";

  return useMemo(
    () => ({
      push: (to: string) => navigate({ to }),
      back: (fallback?: string) => {
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        navigate({ to: fallback ?? defaultFallback });
      },
    }),
    [navigate, defaultFallback],
  );
}

export function usePathname() {
  return useRouterState({ select: (state) => state.location.pathname });
}

export function useSearchParams() {
  const search = useRouterState({ select: (state) => state.location.search });
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams() {
  return useTanstackParams({ strict: false });
}
