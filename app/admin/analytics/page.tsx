"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsQueryControls } from "@/components/analytics-query-controls";
import { AdminAnalyticsDashboard, type AnalyticsPayload } from "@/components/admin-analytics-dashboard";
import { useToast } from "@/hooks/use-toast";

export default function AdminAnalyticsPage() {
  const sp = useSearchParams();
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Provide default months in the URL if missing (keeps it shareable)
  const months = sp.get("months") || "6";
  const hasDates = Boolean(sp.get("date_from") || sp.get("date_to"));

  const query = useMemo(() => {
    const p = new URLSearchParams(sp.toString());
    if (!p.get("months")) p.set("months", months);
    // keep date_from/date_to optional; API fills defaults
    return p.toString();
  }, [sp, months]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?${query}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load analytics");
        const data = await res.json();
        if (cancelled) return;
        setAnalytics(data);
      } catch (e: any) {
        if (!cancelled) toast({ title: "Error", description: e?.message || "Failed to load analytics" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [query, toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Shareable analytics range (URL-driven)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Changes are reflected in the URL and persist on reload.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsQueryControls />
        </CardContent>
      </Card>

      {loading || !analytics ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
            <CardDescription>Fetching analytics data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-24 flex items-center text-muted-foreground">Please wait…</div>
          </CardContent>
        </Card>
      ) : (
        <AdminAnalyticsDashboard analytics={analytics} />
      )}
    </div>
  );
}
