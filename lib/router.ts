import {
  useNavigate,
  useRouterState,
  useParams as useTanstackParams,
} from "@tanstack/react-router";
import { useMemo } from "react";

export function useRouter() {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      push: (to: string) => navigate({ to }),
      back: () => window.history.back(),
    }),
    [navigate],
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
