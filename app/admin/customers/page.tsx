"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { User, Mail, Phone, Calendar, Activity, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SimpleQueryControls } from "@/components/simple-query-controls";
import { ClientPagination } from "@/components/client-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CustomerRow = {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  isActive: boolean;
  role?: string;
  nicPassport?: string;
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
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Search and manage customer and staff accounts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {loading ? "Loading…" : `${total} user${total !== 1 ? "s" : ""}`}
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
              placeholder="Search users (name, email, phone)…"
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
                  <TableHead>User</TableHead>
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{c.name || "—"}</p>
                          {c.role === 'staff' && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-sm">Staff</Badge>
                          )}
                          {c.role === 'admin' && (
                            <Badge variant="default" className="text-[10px] h-4 px-1 rounded-sm">Admin</Badge>
                          )}
                        </div>
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View 
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                            <DialogDescription>
                              Detailed information for {c.name || "this user"}.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="flex items-center gap-4">
                              <div className="bg-primary/10 p-3 rounded-full text-primary">
                                <User className="h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg leading-none">{c.name || "Unknown"}</h4>
                                <p className="text-sm text-muted-foreground mt-1 capitalize">{c.role || "Customer"}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                              <div className="space-y-1">
                                <p className="text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" /> Email</p>
                                <p className="font-medium truncate" title={c.email}>{c.email}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3" /> Phone</p>
                                <p className="font-medium">{c.phone || "—"}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground flex items-center gap-2"><Calendar className="h-3 w-3" /> Joined</p>
                                <p className="font-medium">{format(new Date(c.createdAt), "MMM d, yyyy")}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground flex items-center gap-2"><CreditCard className="h-3 w-3" /> NIC / Passport</p>
                                <p className="font-medium">{c.nicPassport || "—"}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground flex items-center gap-2"><Activity className="h-3 w-3" /> Status</p>
                                <div>
                                  <Badge className={c.isActive ? "bg-success text-success-foreground hover:bg-success/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}>
                                    {c.isActive ? "Active" : "Disabled"}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-lg border bg-card p-4 flex justify-between mt-2 shadow-sm">
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Bookings</span>
                                <span className="font-bold text-xl">{c.totalBookings}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Spent</span>
                                <span className="font-bold text-xl text-primary">${Number(c.totalSpent || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}

                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      No users found.
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
