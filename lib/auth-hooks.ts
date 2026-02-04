"use client";

import { useAtomValue, useSetAtom } from "jotai";
import * as React from "react";
import { AuthContext } from "./auth-context-base";
import { isLoadingAuthAtom, userAtom } from "./atoms";

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Direct Jotai hooks for components that want to use atoms directly
 * These can be used instead of useAuth() for better performance in some cases
 */
export function useUser() {
  return useAtomValue(userAtom);
}

export function useSetUser() {
  return useSetAtom(userAtom);
}

export function useIsLoadingAuth() {
  return useAtomValue(isLoadingAuthAtom);
}
