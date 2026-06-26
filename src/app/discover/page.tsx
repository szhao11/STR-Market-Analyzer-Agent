"use client";

import { useEffect, useState } from "react";
import { PageFrame } from "@/components/page-frame";
import { DiscoveryQueryForm } from "@/components/discovery-query-form";
import {
  InvestorProfileForm,
  useDiscoverProfileEnabled,
  useInvestorProfile,
} from "@/components/investor-profile-form";
import { useDiscoveryPanel } from "@/components/discovery-panel-context";
import { DiscoveryTrigger } from "@/components/discovery-trigger";
import { Loader2 } from "lucide-react";

export default function DiscoverPage() {
  const [profile, setProfile] = useInvestorProfile();
  const [profileEnabled, setProfileEnabled] = useDiscoverProfileEnabled();
  const [agentUnavailable, setAgentUnavailable] = useState(false);
  const {
    startDiscoverySession,
    setLoadingMessage,
    completeDiscoverySession,
    failDiscoverySession,
    clearSession,
    loading,
    hasSession,
  } = useDiscoveryPanel();

  useEffect(() => () => clearSession(), [clearSession]);

  const runDiscovery = async (query: string, refresh = false) => {
    startDiscoverySession();
    setAgentUnavailable(false);

    const progressTimer = window.setTimeout(() => {
      setLoadingMessage("Filtering and analyzing metros…");
    }, 3000);

    try {
      const res = await fetch("/api/agent/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          profile: profileEnabled ? profile : undefined,
          useProfile: profileEnabled,
          limit: 5,
          refresh,
        }),
      });

      const data = await res.json();

      if (res.status === 503) {
        setAgentUnavailable(true);
        clearSession();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Discovery failed");
      }

      completeDiscoverySession(data);
    } catch (err) {
      failDiscoverySession(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      window.clearTimeout(progressTimer);
    }
  };

  return (
    <PageFrame
      title="Discover markets"
      description="Describe your ideal STR market in plain English. The agent searches all supported metros and returns a ranked shortlist."
      width="document"
    >
      <div className="space-y-8">
        <DiscoveryQueryForm
          onSubmit={(q) => runDiscovery(q)}
          loading={loading}
          useProfile={profileEnabled}
        />

        <div className="flex flex-wrap items-center gap-3">
          <DiscoveryTrigger />
        </div>

        <InvestorProfileForm
          profile={profile}
          onChange={setProfile}
          enabled={profileEnabled}
          onEnabledChange={setProfileEnabled}
        />

        {agentUnavailable && (
          <div className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Market discovery requires <code className="text-xs">OPENAI_API_KEY</code> in{" "}
            <code className="text-xs">.env.local</code>.
          </div>
        )}

        {!hasSession && !agentUnavailable && (
          <div className="rounded-md border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-5 w-5 opacity-40" />
            Enter a query above to start discovery — results open in the side panel
          </div>
        )}
      </div>
    </PageFrame>
  );
}
