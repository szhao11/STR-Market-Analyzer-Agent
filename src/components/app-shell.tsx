"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useRecentSnapshots } from "@/hooks/use-recent-snapshots";
import { BriefPanelProvider } from "@/components/brief-panel-context";
import { BriefSidePanel } from "@/components/brief-side-panel";
import { CompareRankPanelProvider } from "@/components/compare-rank-panel-context";
import { CompareRankSidePanel } from "@/components/compare-rank-side-panel";
import { DiscoveryPanelProvider } from "@/components/discovery-panel-context";
import { DiscoverySidePanel } from "@/components/discovery-side-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  Search,
  LayoutGrid,
  FileText,
  Sparkles,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const SIDEBAR_COLLAPSED_KEY = "str-analyzer-sidebar-collapsed";

const navLinks = [
  { href: "/", label: "Search", icon: Search, exact: true },
  { href: "/discover", label: "Discover", icon: Sparkles, exact: false },
  { href: "/compare", label: "Compare", icon: LayoutGrid, exact: false },
];

function toSlug(city: string, stateAbbr: string): string {
  return `${city.toLowerCase().replace(/\s+/g, "-")}-${stateAbbr.toLowerCase()}`;
}

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  exact,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact: boolean;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  if (!collapsed) {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
          active
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-70" />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            className={cn(
              "flex items-center justify-center rounded-sm px-2 py-1.5 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            aria-label={label}
          />
        }
      >
        <Icon className="h-4 w-4 shrink-0 opacity-70" />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { snapshots: recentSnapshots, dismiss } = useRecentSnapshots({ limit: 12 });
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <BriefPanelProvider>
      <CompareRankPanelProvider>
        <DiscoveryPanelProvider>
        <div className="flex h-screen overflow-hidden bg-background">
        <aside
          className={cn(
            "flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out",
            collapsed ? "w-14" : "w-[240px]"
          )}
        >
          <div
            className={cn(
              "flex border-b border-sidebar-border",
              collapsed
                ? "flex-col items-center gap-1 py-2"
                : "h-12 items-center gap-2 px-3"
            )}
          >
            <BarChart3 className="h-4 w-4 shrink-0 text-primary" />
            {!collapsed && (
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-foreground">
                STR Analyzer
              </span>
            )}
            {mounted && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-sidebar-foreground/70"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={toggleCollapsed}
              >
                {collapsed ? (
                  <PanelLeft className="h-3.5 w-3.5" />
                ) : (
                  <PanelLeftClose className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>

          <div className={cn("flex flex-col gap-0.5 p-2", collapsed && "items-center")}>
            {navLinks.map((link) => (
              <SidebarNavLink key={link.href} {...link} collapsed={collapsed} />
            ))}
          </div>

          {recentSnapshots.length > 0 && !collapsed && (
            <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-sidebar-border">
              <div className="px-3 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Recent
              </div>
              <ScrollArea className="flex-1 px-1 pb-2">
                <div className="flex flex-col gap-0.5">
                  {recentSnapshots.map((snapshot) => {
                    const slug = toSlug(
                      snapshot.identifiers.city,
                      snapshot.identifiers.stateAbbr
                    );
                    const href = `/market/${slug}`;
                    const active = pathname === href;

                    return (
                      <div
                        key={snapshot.id}
                        className="group flex items-center gap-0.5 rounded-sm hover:bg-sidebar-accent"
                      >
                        <Link
                          href={href}
                          className={cn(
                            "flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                            active
                              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          <span className="truncate">
                            {snapshot.identifiers.city},{" "}
                            {snapshot.identifiers.stateAbbr}
                          </span>
                        </Link>
                        {snapshot.id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="mr-1 shrink-0 text-sidebar-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-sidebar-foreground"
                            aria-label={`Remove ${snapshot.identifiers.city}, ${snapshot.identifiers.stateAbbr} from recent`}
                            onClick={() => dismiss(snapshot.id!)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 overflow-hidden">
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
          <BriefSidePanel />
          <CompareRankSidePanel />
          <DiscoverySidePanel />
        </div>
      </div>
        </DiscoveryPanelProvider>
      </CompareRankPanelProvider>
    </BriefPanelProvider>
  );
}
