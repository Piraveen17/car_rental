"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { IUser } from "@/types";

type Props = {
  initialUsers: IUser[];
};

export function AdminUsersClient({ initialUsers }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<IUser[]>(initialUsers || []);

  // keep local table responsive; update when server data changes
  useEffect(() => {
    setUsers(initialUsers || []);
  }, [initialUsers]);

  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users]
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    const old = users;
    setUsers(users.map((u) => (u.userId === userId ? { ...u, role: newRole as any } : u)));

    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed");

      toast({ title: "Success", description: "User role updated" });
      // Reload-safe: server is source of truth, refresh with same URL params
      router.refresh();
    } catch {
      setUsers(old);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.userId}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.role === "admin"
                        ? "default"
                        : user.role === "staff"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.createdAt
                    ? format(new Date(user.createdAt), "MMM dd, yyyy")
                    : "-"}
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={user.role}
                    onValueChange={(val) => handleRoleChange(user.userId!, val)}
                    disabled={user.role === "admin" && adminCount <= 1}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {users.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No users found.</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
