/**
 * Jotai atoms for shared state management
 * Following React best practices: use atoms for client-side state that needs to be shared
 * 
 * Note: Server state (settings, team) is now managed by React Query only.
 * Jotai is used only for client-side state (auth, UI state).
 */

import { atom } from "jotai";
import type { User } from "./types";

// User/Auth atoms - client-side state only
export const userAtom = atom<User | null>(null);
export const isLoadingAuthAtom = atom<boolean>(true);

// Helper atoms for computed values
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);
export const userTeamIdAtom = atom<string | null>((get) => {
  const user = get(userAtom);
  if (!user) return null;
  return user.teamId ?? null;
});
export const isOwnerAtom = atom((get) => get(userAtom)?.role === "owner");
export const isAdminAtom = atom((get) => get(userAtom)?.role === "admin");
