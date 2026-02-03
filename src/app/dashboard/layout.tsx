"use client";

import { Menu, X } from "lucide-react";
import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { LoadingState } from "@/components/loading-state";
import { StayKhaLogo } from "@/components/staykha-logo";
import { Button } from "@/components/ui/button";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const mobileSidebarRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    // Check if admin needs to join a team
    if (user && user.role === "admin" && !user.teamId) {
      router.push("/register/join-team");
      return;
    }

    // Check if owner needs to create a team
    if (user && user.role === "owner" && !user.teamId) {
      router.push("/register/create-team");
      return;
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingState fullScreen message="กำลังโหลด..." />;
  }

  if (!user) {
    return null;
  }

  React.useEffect(() => {
    if (!isMobileMenuOpen) return;
    const container = mobileSidebarRef.current;
    if (!container) return;

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])",
      ),
    );

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background screen-only">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block screen-only">
        <AppSidebar onLogout={logout} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden screen-only"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden screen-only ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="เมนูนำทาง"
        aria-hidden={!isMobileMenuOpen}
        tabIndex={-1}
        ref={mobileSidebarRef}
      >
        <AppSidebar onLogout={logout} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-0 screen-only">
        {/* Mobile Header */}
        <header className="flex h-16 items-center border-b border-border bg-background px-4 lg:hidden screen-only">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mr-2"
            aria-label="สลับเมนูด้านข้าง"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <StayKhaLogo className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">StayKha</h1>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 min-h-0 overflow-y-auto screen-only">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <Toaster className="screen-only" />
      <SonnerToaster className="screen-only" />
    </div>
  );
}
