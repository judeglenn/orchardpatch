"use client";

import { useState, useMemo } from "react";
import { AppCard } from "@/components/AppCard";
import { SearchBar } from "@/components/SearchBar";
import { apps, stats } from "@/lib/mockData";
import { Package, Monitor, AlertTriangle, ChevronDown, Filter } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SortKey = "installs" | "name" | "lastSeen";

const SORT_LABELS: Record<SortKey, string> = {
  installs: "Most Installs",
  name: "Name A–Z",
  lastSeen: "Recently Seen",
};

const CATEGORY_ALL = "All Categories";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("installs");
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_ALL);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(apps.map(a => a.category))).sort();
    return [CATEGORY_ALL, ...cats];
  }, []);

  const filtered = useMemo(() => {
    let result = apps;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          a.bundleId.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }

    if (conflictsOnly) {
      result = result.filter(a => a.hasVersionConflict);
    }

    if (selectedCategory !== CATEGORY_ALL) {
      result = result.filter(a => a.category === selectedCategory);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">App Catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Software inventory across your entire device fleet
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Package className="h-5 w-5" style={{ color: "#0071BC" }} />}
          label="Total Apps"
          value={stats.totalApps}
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          icon={<Monitor className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          label="Total Devices"
          value={stats.totalDevices}
          bg="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          label="Version Conflicts"
          value={stats.appsWithVersionConflicts}
          bg="bg-amber-50 dark:bg-amber-950/30"
          onClick={() => setConflictsOnly(v => !v)}
          active={conflictsOnly}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search apps by name, bundle ID or category…"
          className="flex-1"
        />

        <div className="flex items-center gap-2">
          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5 text-sm")}
            >
              {selectedCategory === CATEGORY_ALL ? "Category" : selectedCategory}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
              {categories.map(cat => (
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

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5 text-sm")}
            >
              {SORT_LABELS[sortBy]}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
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

          {/* Conflicts toggle */}
          <Button
            variant={conflictsOnly ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1.5 text-sm"
            style={conflictsOnly ? { background: "#0071BC", color: "white", borderColor: "#0071BC" } : {}}
            onClick={() => setConflictsOnly(v => !v)}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Conflicts</span>
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length === apps.length
            ? `${apps.length} apps`
            : `${filtered.length} of ${apps.length} apps`}
        </p>
        {(search || conflictsOnly || selectedCategory !== CATEGORY_ALL) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
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
          {filtered.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-base font-medium text-foreground">No apps found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  onClick?: () => void;
  active?: boolean;
}

function StatCard({ icon, label, value, bg, onClick, active }: StatCardProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      } ${
        active ? "border-amber-400 dark:border-amber-500 shadow-sm" : "border-border"
      } bg-card`}
      onClick={onClick}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}
