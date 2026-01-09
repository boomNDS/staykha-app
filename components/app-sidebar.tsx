import { Link } from "@tanstack/react-router";
import {
  Building2,
  ChevronRight,
  FileText,
  Gauge,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import * as React from "react";
import { StayKhaLogo } from "@/components/staykha-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { teamsApi } from "@/lib/api-client";
import { usePathname } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const navigation = [
  {
    name: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
    roles: ["owner", "admin"],
  },
  {
    name: "Buildings",
    href: "/overview/buildings",
    icon: Home,
    roles: ["owner"],
  },
  {
    name: "Rooms",
    href: "/overview/rooms",
    icon: Building2,
    roles: ["owner", "admin"],
  },
  {
    name: "Tenants",
    href: "/overview/tenants",
    icon: Users,
    roles: ["owner", "admin"],
  },
  {
    name: "Meter Readings",
    href: "/overview/readings",
    icon: Gauge,
    roles: ["owner", "admin"],
  },
  {
    name: "Billing",
    href: "/overview/billing",
    icon: FileText,
    roles: ["owner", "admin"],
  },
  {
    name: "Admin Management",
    href: "/overview/admins",
    icon: Users,
    roles: ["owner"],
  },
  {
    name: "Settings",
    href: "/overview/settings",
    icon: Settings,
    roles: ["owner", "admin"],
  },
];

interface AppSidebarProps {
  className?: string;
  onLogout?: () => void;
}

export function AppSidebar({ className, onLogout }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Fetch team data if user has teamId but no team object
  const teamQuery = useQuery({
    queryKey: ["team", user?.teamId],
    queryFn: () => {
      if (!user?.teamId) return null;
      return teamsApi.getById(user.teamId);
    },
    enabled: !!user?.teamId && !user?.team,
  });

  const team = user?.team || teamQuery.data?.team;
  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || "admin"),
  );

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <StayKhaLogo className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                StayKha
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                {team?.name || "Admin Portal"}
              </span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <StayKhaLogo className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {!isCollapsed && user && (
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={user.role === "owner" ? "default" : "secondary"}
                  className="text-xs capitalize"
                >
                  {user.role}
                </Badge>
                {team && (
                  <span className="text-xs text-sidebar-foreground/60 truncate">
                    {team.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Button
              key={item.name}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                !isActive &&
                  "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                isCollapsed && "justify-center",
              )}
            >
              <Link to={item.href}>
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            </Button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          onClick={onLogout}
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            isCollapsed && "justify-center",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar shadow-sm hover:bg-sidebar-accent"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 text-sidebar-foreground transition-transform",
            isCollapsed && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}
