"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SimpleQueryControls } from "@/components/simple-query-controls";
import { ClientPagination } from "@/components/client-pagination";

type CustomerRow = {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  isActive: boolean;
  totalBookings: number;
  totalSpent: number;
};

export default function AdminCustomersPage() {
  const sp = useSearchParams();
  const { toast } = useToast();

  const [items, setItems] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = Math.max(1, Number(sp.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(5, Number(sp.get("page_size") || sp.get("limit") || "10")));
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers?${sp.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data = await res.json();
        if (cancelled) return;
        setItems(data?.items || []);
        setTotal(Number(data?.meta?.total || 0));
      } catch (e: any) {
        if (!cancelled) {
          toast({ title: "Error", description: e?.message || "Failed to load customers" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sp, toast]);

  const toggleCustomerStatus = async (userId: string, currentStatus: boolean) => {
    // Production note: implement a dedicated API update for users.is_active.
    toast({
      title: "Not implemented",
      description: "Customer enable/disable API is not wired yet. (DB column: users.is_active)",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <p className="text-muted-foreground">Search and manage customer accounts (shareable URL filters)</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>
                {loading ? "Loading…" : `${total} customer${total !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <a href={`/api/export/customers?${sp.toString()}&format=csv`}>Export CSV</a>
              </Button>
              <Button asChild variant="outline">
                <a href={`/api/export/customers?${sp.toString()}&format=xlsx`}>Export Excel</a>
              </Button>
            </div>
          </div>

          <div className="pt-3">
            <SimpleQueryControls
              resultsCount={total}
              placeholder="Search customers (name, email, phone)…"
              sortOptions={[
                { value: "created_at:desc", label: "Newest" },
                { value: "created_at:asc", label: "Oldest" },
                { value: "name:asc", label: "Name A → Z" },
                { value: "name:desc", label: "Name Z → A" },
              ]}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{c.name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{c.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{c.phone || "-"}</TableCell>
                    <TableCell>{format(new Date(c.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>{c.totalBookings}</TableCell>
                    <TableCell className="font-semibold">${Number(c.totalSpent || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          c.isActive
                            ? "bg-success text-success-foreground"
                            : "bg-destructive text-destructive-foreground"
                        }
                      >
                        {c.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCustomerStatus(c.userId, c.isActive)}
                      >
                        {c.isActive ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Disable
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Enable
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <ClientPagination page={page} totalPages={totalPages} />
        </CardContent>
      </Card>
    </div>
  );
}
