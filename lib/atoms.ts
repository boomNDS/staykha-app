/**
 * Jotai atoms for shared state management
 * Following React best practices: use atoms for client-side state that needs to be shared
 */

import { atom } from "jotai";
import type { AdminSettings, Team, User } from "./types";

// User/Auth atoms
export const userAtom = atom<User | null>(null);
export const isLoadingAuthAtom = atom<boolean>(true);

// Settings atoms - derived from user's teamId
export const settingsAtom = atom<AdminSettings | null>(null);
export const settingsLoadingAtom = atom<boolean>(false);

// Team atoms
export const teamAtom = atom<Team | null>(null);
export const teamLoadingAtom = atom<boolean>(false);

// Helper atoms for computed values
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);
export const userTeamIdAtom = atom<string | null>((get) => {
  const user = get(userAtom);
  if (!user) return null;
  return user.teamId ?? null;
});
export const isOwnerAtom = atom((get) => get(userAtom)?.role === "owner");
export const isAdminAtom = atom((get) => get(userAtom)?.role === "admin");
