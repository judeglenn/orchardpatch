"use client";

import { useState, useMemo } from "react";
import { AppCard } from "@/components/AppCard";
import { SearchBar } from "@/components/SearchBar";
import { apps, stats } from "@/lib/mockData";
import {
  Package,
  Monitor,
  AlertTriangle,
  ChevronDown,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatRelativeDate } from "@/lib/utils";

type SortKey = "installs" | "name" | "lastSeen";

const SORT_LABELS: Record<SortKey, string> = {
  installs: "Most Installs",
  name: "Name A–Z",
  lastSeen: "Recently Seen",
};

const CATEGORY_ALL = "All Categories";

const lastSynced = apps.reduce(
  (latest, app) => (app.lastSeen > latest ? app.lastSeen : latest),
  ""
);

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_ALL);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(apps.map((a) => a.category))).sort();
    return [CATEGORY_ALL, ...cats];
  }, []);

  const filtered = useMemo(() => {
    let result = apps;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.bundleId.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }

    if (conflictsOnly) {
      result = result.filter((a) => a.hasVersionConflict);
    }

    if (selectedCategory !== CATEGORY_ALL) {
      result = result.filter((a) => a.category === selectedCategory);
    }

    switch (sortBy) {
      case "installs":
        result = [...result].sort((a, b) => b.totalInstalls - a.totalInstalls);
        break;
      case "name":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "lastSeen":
        result = [...result].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
        break;
    }

    return result;
  }, [search, sortBy, conflictsOnly, selectedCategory]);

  return (
    <div className="px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>
            App Catalog
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            Software inventory across your entire device fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search apps…"
            className="w-60"
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 text-sm bg-white"
              )}
            >
              {selectedCategory === CATEGORY_ALL ? "Category" : selectedCategory}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? "font-semibold" : ""}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 text-sm bg-white"
              )}
            >
              {SORT_LABELS[sortBy]}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={sortBy === key ? "font-semibold" : ""}
                >
                  {SORT_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant={conflictsOnly ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1.5 text-sm"
            style={
              conflictsOnly
                ? { background: "#2d5016", color: "white", borderColor: "#2d5016" }
                : { background: "white" }
            }
            onClick={() => setConflictsOnly((v) => !v)}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Conflicts</span>
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Package className="h-5 w-5" style={{ color: "#2d5016" }} />}
          label="Total Apps"
          value={stats.totalApps.toLocaleString()}
          iconBg="#f0f7e8"
        />
        <StatCard
          icon={<Monitor className="h-5 w-5" style={{ color: "#4caf50" }} />}
          label="Total Devices"
          value={stats.totalDevices.toLocaleString()}
          iconBg="#e8f5e9"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" style={{ color: "#ff9800" }} />}
          label="Version Conflicts"
          value={stats.appsWithVersionConflicts.toLocaleString()}
          iconBg="#fff3e0"
          onClick={() => setConflictsOnly((v) => !v)}
          active={conflictsOnly}
          activeColor="#ff9800"
        />
        <StatCard
          icon={<RefreshCw className="h-5 w-5" style={{ color: "#6b7280" }} />}
          label="Last Synced"
          value={formatRelativeDate(lastSynced)}
          iconBg="#eef0f2"
          isText
        />
      </div>

      {/* Section label + result count */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#6b7280" }}>
          Applications
          {filtered.length !== apps.length && (
            <span className="ml-2 normal-case tracking-normal font-normal">
              — {filtered.length} of {apps.length}
            </span>
          )}
          {filtered.length === apps.length && (
            <span className="ml-2 normal-case tracking-normal font-normal">
              — {apps.length}
            </span>
          )}
        </span>
        {(search || conflictsOnly || selectedCategory !== CATEGORY_ALL) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            style={{ color: "#6b7280" }}
            onClick={() => {
              setSearch("");
              setConflictsOnly(false);
              setSelectedCategory(CATEGORY_ALL);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* App list */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filtered.map((app) => (
            <AppCard key={app.id} app={app} totalDevices={stats.totalDevices} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border bg-white" style={{ borderColor: "#e2e4e7" }}>
          <Package className="h-12 w-12 mb-4" style={{ color: "#d1d5db" }} />
          <p className="text-base font-semibold" style={{ color: "#1a1a2e" }}>
            No apps found
          </p>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  isText?: boolean;
}

function StatCard({ icon, label, value, iconBg, onClick, active, activeColor, isText }: StatCardProps) {
  return (
    <div
      className="flex items-center gap-4 rounded-lg border bg-white px-4 py-4 transition-all"
      style={{
        borderColor: active ? activeColor : "#e2e4e7",
        boxShadow: active
          ? `0 0 0 1px ${activeColor}40, 0 1px 3px rgba(0,0,0,0.06)`
          : "0 1px 2px rgba(0,0,0,0.04)",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={`font-bold leading-tight ${isText ? "text-lg" : "text-2xl"}`}
          style={{ color: "#1a1a2e" }}
        >
          {value}
        </p>
        <p className="text-xs font-medium mt-0.5" style={{ color: "#6b7280" }}>
          {label}
        </p>
      </div>
    </div>
  );
}
