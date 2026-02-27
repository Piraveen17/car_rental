"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { IUser, UserRole } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin:    "default",
  staff:    "secondary",
  customer: "outline",
};

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "staff",    label: "Staff" },
  { value: "admin",    label: "Admin" },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { initialUsers: IUser[] };

export function AdminUsersClient({ initialUsers }: Props) {
  const router              = useRouter();
  const { toast }           = useToast();
  const [users, setUsers]   = useState<IUser[]>(initialUsers ?? []);

  useEffect(() => setUsers(initialUsers ?? []), [initialUsers]);

  const adminCount = useMemo(() => users.filter((u) => u.role === "admin").length, [users]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Optimistic update
    const previous = users;
    setUsers(users.map((u) => u.userId === userId ? { ...u, role: newRole } : u));

    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");

      toast({ title: "Role updated", description: `User is now ${newRole}.` });
      router.refresh();
    } catch (err: any) {
      setUsers(previous); // Rollback
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>{users.length} user{users.length !== 1 ? "s" : ""} registered</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Change Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.userId}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>{user.phone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={ROLE_BADGE[user.role as UserRole] ?? "outline"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Select
                    defaultValue={user.role}
                    onValueChange={(val) => handleRoleChange(user.userId!, val as UserRole)}
                    disabled={user.role === "admin" && adminCount <= 1}
                  >
                    <SelectTrigger className="w-[130px] ml-auto h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}

            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
