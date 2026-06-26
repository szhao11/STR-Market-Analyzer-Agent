"use client";

import { SearchBar } from "@/components/search-bar";
import { CityCard } from "@/components/city-card";
import { PageFrame } from "@/components/page-frame";
import { useRecentSnapshots } from "@/hooks/use-recent-snapshots";
import { Loader2, Search } from "lucide-react";

export default function HomePage() {
  const { snapshots: recentSnapshots, loading, dismiss } = useRecentSnapshots();

  return (
    <PageFrame
      title="Search"
      description="Type a city name to pull economic, demographic, housing, and STR data from government APIs and Airbnb."
      width="document"
    >
      <div className="mb-10">
        <SearchBar />
        <p className="mt-3 text-sm text-muted-foreground">
          Or{" "}
          <a href="/discover" className="font-medium text-primary hover:underline">
            discover markets for me
          </a>{" "}
          — describe your criteria and get a ranked shortlist.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : recentSnapshots.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Recently analyzed
          </h2>
          <div className="overflow-hidden rounded-md border border-border">
            {recentSnapshots.map((snapshot) => (
              <CityCard
                key={snapshot.id}
                snapshot={snapshot}
                variant="row"
                onDismiss={dismiss}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-md border border-dashed border-border px-6 py-12 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-medium text-foreground">
            No markets analyzed yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Search for a U.S. city above. Analyzed markets appear here and in the
            sidebar.
          </p>
        </div>
      )}
    </PageFrame>
  );
}
