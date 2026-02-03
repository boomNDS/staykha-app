import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  ChevronRight,
  FileText,
  Gauge,
  Home,
  LayoutDashboard,
  MessageSquare,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import * as React from "react";
import { StayKhaLogo } from "@/components/staykha-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { teamsApi } from "@/lib/api-client";
import { getData } from "@/lib/api/response-helpers";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "@/lib/router";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "ภาพรวม",
    href: "/overview",
    icon: LayoutDashboard,
    roles: ["owner", "admin"],
  },
  {
    name: "อาคาร",
    href: "/overview/buildings",
    icon: Home,
    roles: ["owner"],
  },
  {
    name: "ห้องพัก",
    href: "/overview/rooms",
    icon: Building2,
    roles: ["owner", "admin"],
  },
  {
    name: "ผู้เช่า",
    href: "/overview/tenants",
    icon: Users,
    roles: ["owner", "admin"],
  },
  {
    name: "อ่านมิเตอร์",
    href: "/overview/readings",
    icon: Gauge,
    roles: ["owner", "admin"],
  },
  {
    name: "บิล/ใบแจ้งหนี้",
    href: "/overview/billing",
    icon: FileText,
    roles: ["owner", "admin"],
  },
  {
    name: "LINE OA",
    href: "/overview/settings",
    icon: MessageSquare,
    roles: ["owner"],
    badge: "Coming soon",
    disabled: true,
  },
  {
    name: "ผู้ดูแลระบบ",
    href: "/overview/admins",
    icon: Users,
    roles: ["owner"],
  },
  {
    name: "ตั้งค่า",
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
  const roleLabel = user?.role === "owner" ? "เจ้าของ" : "ผู้ดูแล";

  // Fetch team data if user has teamId but no team object
  // Note: Team info should be available from login response, so this is a fallback
  const teamQuery = useQuery({
    queryKey: ["team", user?.teamId],
    queryFn: () => {
      if (!user?.teamId) return undefined;
      return teamsApi.getById(user.teamId);
    },
    enabled: !!user?.teamId && !user?.team,
    retry: false, // Don't retry if API fails (team might not be accessible via this endpoint)
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Use team from user object first (from login response), fallback to query result
  const team = user?.team || getData(teamQuery.data ?? undefined);
  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || "admin"),
  );

  return (
    <div
      className={cn(
        "relative flex h-dvh flex-col border-r border-border bg-sidebar transition-[width] duration-300",
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
                {team?.name || "พอร์ทัลผู้ดูแล"}
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
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name || user.email || "User"}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={user.role === "owner" ? "default" : "secondary"}
                  className="text-xs capitalize"
                >
                  {roleLabel}
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
      <nav className="flex-1 space-y-1 p-3" aria-label="เมนูหลัก">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Button
              key={item.name}
              asChild={!item.disabled}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                !isActive &&
                  "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                item.disabled &&
                  "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-sidebar-foreground/80",
                isCollapsed && "justify-center",
              )}
            >
              {item.disabled ? (
                <div className="flex w-full items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.name}</span>
                      {item.badge && (
                        <Badge variant="outline" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <Link to={item.href} aria-current={isActive ? "page" : undefined}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.name}</span>
                      {item.badge && (
                        <Badge variant="outline" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              )}
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
          {!isCollapsed && <span>ออกจากระบบ</span>}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-20 flex h-9 w-9 items-center justify-center rounded-full border border-sidebar-border bg-sidebar shadow-sm hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        aria-label={isCollapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
        aria-pressed={isCollapsed}
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
